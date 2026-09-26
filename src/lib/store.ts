import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
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
  slug: string
  repo_owner: string
  repo_name: string
  repo_url: string
  description: string | null
  language: string | null
  stars: number
  born_at: string
  died_at: string | null
  commits: number
  first_words: string | null
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
    owner: r.repo_owner,
    name: r.repo_name,
    url: r.repo_url,
    description: r.description,
    language: r.language,
    stars: r.stars,
    bornAt: r.born_at,
    diedAt: r.died_at,
    commits: r.commits,
    firstWords: r.first_words,
    lastWords: r.last_words,
    cause: r.cause,
    epitaph: r.epitaph,
    buriedBy: r.buried_by,
    adoptable: r.adoptable,
    variant: r.variant,
  }
}

function toRow(g: NewGrave): Omit<Row, 'id' | 'created_at'> & { source: string } {
  return {
    slug: g.slug,
    repo_owner: g.owner,
    repo_name: g.name,
    repo_url: g.url,
    description: g.description,
    language: g.language,
    stars: g.stars,
    born_at: g.bornAt,
    died_at: g.diedAt,
    commits: g.commits,
    first_words: g.firstWords,
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

  async function find(slug: string) {
    const { data, error } = await db.from('projects').select('*').eq('slug', slug).maybeSingle()
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
    find,
    async create(grave) {
      const { data, error } = await db.from('projects').insert(toRow(grave)).select('*').single()
      if (error?.code === '23505') {
        const existing = await find(grave.slug)
        if (existing) return existing
      }
      if (error) throw error
      return fromRow(data as Row)
    },
  }
}

/** Для локальной разработки без Supabase. */
function fileStore(path: string): GraveStore {
  async function all(): Promise<Grave[]> {
    try {
      return JSON.parse(await readFile(path, 'utf8'))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
      throw error
    }
  }

  return {
    async count() {
      return (await all()).length
    },
    async find(slug) {
      return (await all()).find((g) => g.slug === slug) ?? null
    },
    async create(input) {
      const graves = await all()
      const existing = graves.find((g) => g.slug === input.slug)
      if (existing) return existing
      const grave: Grave = { ...input, id: graves.length + 1, createdAt: new Date().toISOString() }
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, JSON.stringify([...graves, grave], null, 2))
      return grave
    },
  }
}

let store: GraveStore | undefined

export function getStore(): GraveStore {
  if (store) return store
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GRAVES_FILE, NODE_ENV } = process.env
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    store = supabaseStore(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  } else if (GRAVES_FILE || NODE_ENV === 'development') {
    store = fileStore(GRAVES_FILE || '.data/graves.json')
  } else {
    throw new Error('Не заданы SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY')
  }
  return store
}

export const countGraves = cache(() => getStore().count())
export const findGrave = cache((slug: string) => getStore().find(slug))
