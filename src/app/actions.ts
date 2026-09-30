'use server'

import { revalidatePath } from 'next/cache'
import { defaultVariant, isVariant } from '@/certificate/variants'
import { isCause } from '@/lib/causes'
import { clean } from '@/lib/clean'
import { clientIp, ipHash } from '@/lib/client-ip'
import { BURY_LIMITS, EPITAPH_MAX, FAMOUS_STARS, LOOKUPS_PER_MINUTE } from '@/lib/config'
import type { BuryError } from '@/lib/errors'
import { fetchRepo, type LookupError, type RepoFacts } from '@/lib/github'
import { gravePath, isLogin, normalizeLogin, parseRepoLink, slugOf } from '@/lib/repo-link'
import { allow } from '@/lib/rate-limit'
import { getStore } from '@/lib/store'
import { verifyHuman } from '@/lib/turnstile'

export type LookupResult =
  | { ok: true; repo: RepoFacts; buriedHref: string | null }
  | { ok: false; error: LookupError | 'storage' | 'too_many' | 'too_famous' }

async function findExisting(owner: string, name: string) {
  try {
    return { ok: true as const, grave: await getStore().find(slugOf(owner, name)) }
  } catch (error) {
    console.error('Хранилище недоступно', error)
    return { ok: false as const, error: 'storage' as const }
  }
}

export async function lookup(link: string): Promise<LookupResult> {
  const parsed = parseRepoLink(String(link))
  if (!parsed) return { ok: false, error: 'invalid' }
  // Каждая проверка стоит запросов к GitHub с нашим токеном, спамом его можно выжечь.
  if (!allow(`lookup:${ipHash(await clientIp())}`, LOOKUPS_PER_MINUTE, 60_000)) return { ok: false, error: 'too_many' }

  const found = await findExisting(parsed.owner, parsed.name)
  if (!found.ok) return found
  if (found.grave) return { ok: true, repo: found.grave, buriedHref: gravePath(found.grave.owner, found.grave.name) }

  const result = await fetchRepo(parsed.owner, parsed.name)
  if (!result.ok) return result
  if (result.repo.stars > FAMOUS_STARS) return { ok: false, error: 'too_famous' }
  return { ok: true, repo: result.repo, buriedHref: null }
}

/** Не больше BURY_LIMITS похорон с одного IP. Уже похороненные сюда не доходят и лимит не тратят. */
async function withinLimits(hash: string) {
  const now = Date.now()
  for (const { limit, windowMs } of BURY_LIMITS) {
    if ((await getStore().recentBurials(hash, new Date(now - windowMs))) >= limit) return false
  }
  return true
}

export type BuryInput = {
  link: string
  cause: string
  epitaph: string
  buriedBy: string
  adoptable: boolean
  variant: string
  /** Токен Cloudflare Turnstile из формы. Пустой, если проверка на бота выключена. */
  human: string
}

export type BuryResult = { ok: true; slug: string; href: string } | { ok: false; error: BuryError }

export async function bury(input: BuryInput): Promise<BuryResult> {
  const parsed = parseRepoLink(String(input?.link))
  if (!parsed) return { ok: false, error: 'invalid' }

  const cause = String(input.cause)
  const epitaph = clean(input.epitaph, EPITAPH_MAX)
  // Ник обязателен и проверяется здесь же: форму можно обойти.
  const buriedBy = normalizeLogin(String(input.buriedBy ?? ''))
  if (!epitaph || !isCause(cause) || !isLogin(buriedBy)) return { ok: false, error: 'bad_input' }

  const ip = await clientIp()
  if (!(await verifyHuman(String(input.human ?? ''), ip))) return { ok: false, error: 'bot' }

  const found = await findExisting(parsed.owner, parsed.name)
  if (!found.ok) return found
  if (found.grave) return { ok: true, slug: found.grave.slug, href: gravePath(found.grave.owner, found.grave.name) }

  const hash = ipHash(ip)
  try {
    if (!(await withinLimits(hash))) return { ok: false, error: 'too_many' }
  } catch (error) {
    console.error('Не удалось проверить лимит похорон', error)
    return { ok: false, error: 'storage' }
  }

  // Данные репозитория берём у GitHub сами, а не из формы.
  const result = await fetchRepo(parsed.owner, parsed.name)
  if (!result.ok) return result
  const { repo } = result
  if (repo.stars > FAMOUS_STARS) return { ok: false, error: 'too_famous' }

  const grave = {
    ...repo,
    slug: slugOf(repo.owner, repo.name),
    cause,
    epitaph,
    buriedBy,
    adoptable: input.adoptable === true,
    variant: isVariant(String(input.variant)) ? String(input.variant) : defaultVariant.id,
  }

  try {
    const saved = await getStore().create(grave)
    // Могила уже записана: если не записался лог, похороны всё равно состоялись.
    await getStore()
      .logBurial(hash)
      .catch((error) => console.error('Не удалось записать похороны в bury_log', error))
    // Счётчик в шапке живёт в общем layout, без этого он останется старым.
    revalidatePath('/', 'layout')
    return { ok: true, slug: saved.slug, href: gravePath(saved.owner, saved.name) }
  } catch (error) {
    console.error('Не удалось сохранить могилу', error)
    return { ok: false, error: 'save_failed' }
  }
}
