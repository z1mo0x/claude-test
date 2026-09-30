// Здесь читается секретный ключ Supabase. server-only ломает сборку, если файл когда-нибудь
// попадёт в код для браузера.
import 'server-only'
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

export type ReportKind = 'remove_own' | 'complaint'

export type NewReport = {
  slug: string
  kind: ReportKind
  reason: string
  contact: string | null
  ipHash: string
}

export interface GraveStore {
  count(): Promise<number>
  find(slug: string): Promise<Grave | null>
  /** Если репозиторий уже похоронен, возвращает существующую могилу. */
  create(grave: NewGrave): Promise<Grave>
  /** Для /api/health: база отвечает, ключ подходит, колонки и таблицы из миграций на месте. */
  check(): Promise<void>
  /** Сколько похорон было с этого IP (по хешу) после since. */
  recentBurials(ipHash: string, since: Date): Promise<number>
  logBurial(ipHash: string): Promise<void>
  /** Обращение «удалить или пожаловаться». Читает и разбирает их бот владельца, сайт только пишет. */
  createReport(report: NewReport): Promise<void>
  /** Сколько обращений было с этого IP (по хешу) после since. */
  recentReports(ipHash: string, since: Date): Promise<number>
  /** Все могилы с этого сайта, новые первыми. Для sitemap.xml и llms.txt. */
  list(): Promise<{ owner: string; name: string; createdAt: string }[]>
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
    async check() {
      const projects = await db.from('projects').select('id, slug, repo_id, topics, license').limit(1)
      if (projects.error) throw projects.error
      const log = await db.from('bury_log').select('id').limit(1)
      if (log.error) throw log.error
      const reports = await db.from('reports').select('id').limit(1)
      if (reports.error) throw reports.error
    },
    async createReport(report) {
      const { error } = await db.from('reports').insert({
        slug: report.slug,
        kind: report.kind,
        reason: report.reason,
        contact: report.contact,
        ip_hash: report.ipHash,
      })
      if (error) throw error
    },
    async recentReports(ipHash, since) {
      const { count, error } = await db
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('ip_hash', ipHash)
        .gte('created_at', since.toISOString())
      if (error) throw error
      return count ?? 0
    },
    async recentBurials(ipHash, since) {
      const { count, error } = await db
        .from('bury_log')
        .select('id', { count: 'exact', head: true })
        .eq('ip_hash', ipHash)
        .gte('created_at', since.toISOString())
      if (error) throw error
      return count ?? 0
    },
    async list() {
      const { data, error } = await db
        .from('projects')
        .select('repo_owner, repo_name, created_at')
        .eq('source', SOURCE)
        .order('created_at', { ascending: false })
        .limit(5000)
      if (error) throw error
      return (data as Pick<Row, 'repo_owner' | 'repo_name' | 'created_at'>[]).map((r) => ({
        owner: r.repo_owner,
        name: r.repo_name,
        createdAt: r.created_at,
      }))
    },
    async logBurial(ipHash) {
      const { error } = await db.from('bury_log').insert({ ip_hash: ipHash })
      if (error) throw error
    },
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

let store: GraveStore | undefined

/** Без ключей Supabase сайт не работает: свидетельства живут только в базе. */
export function getStore(): GraveStore {
  if (store) return store
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Нет SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY: задай их для этого окружения и пересобери деплой')
  }
  store = supabaseStore(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  return store
}

export const countGraves = cache(async () => getStore().count())
export const findGrave = cache(async (slug: string) => getStore().find(slug))
