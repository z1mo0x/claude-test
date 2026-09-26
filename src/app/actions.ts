'use server'

import { revalidatePath } from 'next/cache'
import { defaultVariant, isVariant } from '@/certificate/variants'
import { isCause } from '@/lib/causes'
import { EPITAPH_MAX, NAME_MAX } from '@/lib/config'
import type { BuryError } from '@/lib/errors'
import { fetchRepo, type LookupError, type RepoFacts } from '@/lib/github'
import { encodeGrave, graveHref } from '@/lib/grave-token'
import { parseRepoLink, slugOf } from '@/lib/repo-link'
import { getStore } from '@/lib/store'

export type LookupResult =
  | { ok: true; repo: RepoFacts; buriedHref: string | null }
  | { ok: false; error: LookupError | 'storage' }

async function findExisting(owner: string, name: string) {
  const store = getStore()
  if (!store) return { ok: true as const, grave: null }
  try {
    return { ok: true as const, grave: await store.find(slugOf(owner, name)) }
  } catch (error) {
    console.error('Хранилище недоступно', error)
    return { ok: false as const, error: 'storage' as const }
  }
}

export async function lookup(link: string): Promise<LookupResult> {
  const parsed = parseRepoLink(String(link))
  if (!parsed) return { ok: false, error: 'invalid' }

  const found = await findExisting(parsed.owner, parsed.name)
  if (!found.ok) return found
  if (found.grave) return { ok: true, repo: found.grave, buriedHref: graveHref(found.grave) }

  const result = await fetchRepo(parsed.owner, parsed.name)
  return result.ok ? { ok: true, repo: result.repo, buriedHref: null } : result
}

export type BuryInput = {
  link: string
  cause: string
  epitaph: string
  buriedBy: string
  adoptable: boolean
  variant: string
  /** Номер участка. Нужен только без базы: тогда его знает лишь браузер. */
  plot: number
}

export type BuryResult = { ok: true; slug: string; href: string } | { ok: false; error: BuryError }

function clean(value: unknown, max: number) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/\p{Cc}+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

export async function bury(input: BuryInput): Promise<BuryResult> {
  const parsed = parseRepoLink(String(input?.link))
  if (!parsed) return { ok: false, error: 'invalid' }

  const cause = String(input.cause)
  const epitaph = clean(input.epitaph, EPITAPH_MAX)
  if (!epitaph || !isCause(cause)) return { ok: false, error: 'bad_input' }

  const found = await findExisting(parsed.owner, parsed.name)
  if (!found.ok) return found
  if (found.grave) return { ok: true, slug: found.grave.slug, href: graveHref(found.grave) }

  // Данные репозитория берём у GitHub сами, а не из формы.
  const result = await fetchRepo(parsed.owner, parsed.name)
  if (!result.ok) return result
  const { repo } = result

  const grave = {
    ...repo,
    slug: slugOf(repo.owner, repo.name),
    cause,
    epitaph,
    buriedBy: clean(input.buriedBy, NAME_MAX) || null,
    adoptable: input.adoptable === true,
    variant: isVariant(String(input.variant)) ? String(input.variant) : defaultVariant.id,
  }

  const store = getStore()
  if (!store) {
    const plot = Number.isInteger(input.plot) && input.plot > 0 ? input.plot : 1
    const token = encodeGrave({ ...grave, id: plot, createdAt: new Date().toISOString() })
    return { ok: true, slug: grave.slug, href: graveHref(grave, token) }
  }

  try {
    const saved = await store.create(grave)
    // Счётчик в шапке живёт в общем layout, без этого он останется старым.
    revalidatePath('/', 'layout')
    return { ok: true, slug: saved.slug, href: graveHref(saved) }
  } catch (error) {
    console.error('Не удалось сохранить могилу', error)
    return { ok: false, error: 'save_failed' }
  }
}
