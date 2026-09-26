'use server'

import { revalidatePath } from 'next/cache'
import { defaultVariant, isVariant } from '@/certificate/variants'
import { isCause } from '@/lib/causes'
import { EPITAPH_MAX, NAME_MAX } from '@/lib/config'
import type { BuryError } from '@/lib/errors'
import { fetchRepo, type LookupError, type RepoFacts } from '@/lib/github'
import { gravePath, parseRepoLink, slugOf } from '@/lib/repo-link'
import { getStore } from '@/lib/store'

export type LookupResult =
  | { ok: true; repo: RepoFacts; buriedPath: string | null }
  | { ok: false; error: LookupError | 'storage' }

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

  const found = await findExisting(parsed.owner, parsed.name)
  if (!found.ok) return found
  const existing = found.grave
  if (existing) return { ok: true, repo: existing, buriedPath: gravePath(existing.owner, existing.name) }

  const result = await fetchRepo(parsed.owner, parsed.name)
  return result.ok ? { ok: true, repo: result.repo, buriedPath: null } : result
}

export type BuryInput = {
  link: string
  cause: string
  epitaph: string
  buriedBy: string
  adoptable: boolean
  variant: string
}

export type BuryResult = { ok: true; path: string } | { ok: false; error: BuryError }

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
  const existing = found.grave
  if (existing) return { ok: true, path: gravePath(existing.owner, existing.name) }

  // Данные репозитория берём у GitHub сами, а не из формы.
  const result = await fetchRepo(parsed.owner, parsed.name)
  if (!result.ok) return result
  const { repo } = result

  try {
    const grave = await getStore().create({
      ...repo,
      slug: slugOf(repo.owner, repo.name),
      cause,
      epitaph,
      buriedBy: clean(input.buriedBy, NAME_MAX) || null,
      adoptable: input.adoptable === true,
      variant: isVariant(String(input.variant)) ? String(input.variant) : defaultVariant.id,
    })
    // Счётчик в шапке живёт в общем layout, без этого он останется старым.
    revalidatePath('/', 'layout')
    return { ok: true, path: gravePath(grave.owner, grave.name) }
  } catch (error) {
    console.error('Не удалось сохранить могилу', error)
    return { ok: false, error: 'save_failed' }
  }
}
