import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { CauseId } from './causes'
import type { RepoFacts } from './github'

export type Grave = RepoFacts & {
  id: number
  slug: string
  cause: CauseId
  epitaph: string
  buriedBy: string | null
  adoptable: boolean
  variant: string
  createdAt: string
}

export type NewGrave = Omit<Grave, 'id' | 'createdAt'>

/** Всё, что нужно свидетельству. Без базы именно это едет в ссылке (см. grave-token.ts). */
export type CertificateSource = Pick<
  Grave,
  'id' | 'owner' | 'name' | 'language' | 'bornAt' | 'diedAt' | 'commits' | 'lastWords' | 'cause' | 'epitaph' | 'buriedBy' | 'variant' | 'createdAt'
>

export interface GraveStore {
  count(): Promise<number>
  find(slug: string): Promise<Grave | null>
  /** Если репозиторий уже похоронен, возвращает существующую могилу. */
  create(grave: NewGrave): Promise<Grave>
}

/** Метка строк в таблице projects, которые пришли с этой страницы. */
const SOURCE = 'bury'

type Row = {
  id: number
  created_at: string
  /** Считает база: lower(repo_owner || '/' || repo_name). */
  slug: string
  repo_id: number
  repo_owner: string
  repo_name: string
  description: string | null
  language: string | null
  topics: string[]
  license: string | null
  stars: number
  born_at: string
  died_at: string | null
  commits: number
  last_words: string | null
  cause: CauseId
  epitaph: string
  buried_by: string | null
  adoptable: boolean
  variant: string
}

function fromRow(r: Row): Grave {
  return {
    id: r.id,
    createdAt: r.created_at,
    slug: r.slug,
    repoId: r.repo_id,
    owner: r.repo_owner,
    name: r.repo_name,
    description: r.description,
    language: r.language,
    topics: r.topics,
    license: r.license,
    stars: r.stars,
    bornAt: r.born_at,
    diedAt: r.died_at,
    commits: r.commits,
    lastWords: r.last_words,
    cause: r.cause,
    epitaph: r.epitaph,
    buriedBy: r.buried_by,
    adoptable: r.adoptable,
    variant: r.variant,
  }
}

function toRow(g: NewGrave): Omit<Row, 'id' | 'created_at' | 'slug'> & { source: string } {
  return {
    repo_id: g.repoId,
    repo_owner: g.owner,
    repo_name: g.name,
    description: g.description,
    language: g.language,
    topics: g.topics,
    license: g.license,
    stars: g.stars,
    born_at: g.bornAt,
    died_at: g.diedAt,
    commits: g.commits,
    last_words: g.lastWords,
    cause: g.cause,
    epitaph: g.epitaph,
    buried_by: g.buriedBy,
    adoptable: g.adoptable,
    variant: g.variant,
    source: SOURCE,
  }
}

function supabaseStore(url: string, key: string): GraveStore {
  const db = createClient(url, key, { auth: { persistSession: false } })

  async function findBy(column: 'slug' | 'repo_id', value: string | number) {
    const { data, error } = await db.from('projects').select('*').eq(column, value).maybeSingle()
    if (error) throw error
    return data ? fromRow(data as Row) : null
  }

  return {
    async count() {
      const { count, error } = await db
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('source', SOURCE)
      if (error) throw error
      return count ?? 0
    },
    find: (slug) => findBy('slug', slug),
    async create(grave) {
      const { data, error } = await db.from('projects').insert(toRow(grave)).select('*').single()
      // 23505 — такой репозиторий уже лежит. Ищем по id с GitHub: после переименования
      // owner/name другие, а могила та же.
      if (error?.code === '23505') {
        const existing = (await findBy('repo_id', grave.repoId)) ?? (await findBy('slug', grave.slug))
        if (existing) return existing
      }
      if (error) throw error
      return fromRow(data as Row)
    },
  }
}

let store: GraveStore | null | undefined

/**
 * Supabase, если заданы ключи. Без них база не нужна: свидетельство живёт
 * в самой ссылке, а счётчик считает похороны в браузере.
 */
export function getStore(): GraveStore | null {
  if (store !== undefined) return store
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  store = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? supabaseStore(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null
  return store
}

/** null — база не подключена. */
export const countGraves = cache(async () => getStore()?.count() ?? null)
export const findGrave = cache(async (slug: string) => (await getStore()?.find(slug)) ?? null)
