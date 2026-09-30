import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { CauseId } from '@/lib/causes'

/** Доступ бота к базе тем же серверным ключом, что и у сайта. Ключ наружу не уходит. */
function client() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Нет SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY')
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
}

export type ReportRow = {
  id: number
  created_at: string
  slug: string
  kind: 'remove_own' | 'complaint'
  reason: string
  contact: string | null
  status: 'new' | 'done' | 'rejected'
}

export async function newReports(limit = 5) {
  const { data, error } = await client().from('reports').select('*').eq('status', 'new').order('created_at').limit(limit)
  if (error) throw error
  return data as ReportRow[]
}

export async function countNewReports() {
  const { count, error } = await client().from('reports').select('id', { count: 'exact', head: true }).eq('status', 'new')
  if (error) throw error
  return count ?? 0
}

export async function reportById(id: number) {
  const { data, error } = await client().from('reports').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as ReportRow | null
}

export async function setReportStatus(id: number, status: 'done' | 'rejected') {
  const { error } = await client().from('reports').update({ status, handled_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

/** Удаляет могилу с этого сайта. Возвращает, сколько строк удалено. */
export async function deleteGrave(slug: string) {
  const { data, error } = await client().from('projects').delete().eq('slug', slug).eq('source', 'bury').select('id')
  if (error) throw error
  return data.length
}

export type PostStatus = { status: 'sent' | 'failed'; note: string | null }

export async function postStatuses() {
  const { data, error } = await client().from('bot_posts').select('post_id, status, note')
  if (error) throw error
  const rows = data as { post_id: string; status: PostStatus['status']; note: string | null }[]
  return new Map<string, PostStatus>(rows.map((row) => [row.post_id, { status: row.status, note: row.note }]))
}

export async function markPost(id: string, status: PostStatus['status'], note: string | null = null) {
  const { error } = await client().from('bot_posts').upsert({ post_id: id, status, note, sent_at: new Date().toISOString() })
  if (error) throw error
}

export type GraveRow = {
  repo_owner: string
  repo_name: string
  born_at: string
  died_at: string | null
  commits: number
  last_words: string | null
  cause: CauseId
  buried_by: string | null
}

export async function allGraves() {
  const { data, error } = await client()
    .from('projects')
    .select('repo_owner, repo_name, born_at, died_at, commits, last_words, cause, buried_by')
    .eq('source', 'bury')
    .limit(5000)
  if (error) throw error
  return data as GraveRow[]
}

/**
 * Занимает пост перед отправкой: два одновременных запуска cron не опубликуют его дважды.
 * false, если пост уже занят или отправлен.
 */
export async function claimPost(id: string) {
  const { error } = await client().from('bot_posts').insert({ post_id: id, status: 'sent', note: 'отправляется' })
  if (!error) return true
  if (error.code === '23505') return false
  throw error
}

export async function forgetPost(id: string) {
  const { error } = await client().from('bot_posts').delete().eq('post_id', id)
  if (error) throw error
}
