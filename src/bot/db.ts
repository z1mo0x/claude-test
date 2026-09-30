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
  /** Чат, которому бот отвечает по этому обращению. Пусто, если человек не привязал Telegram. */
  tg_chat_id: number | null
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

// ── Обычные люди: ник GitHub, могилы, обращения ─────────────────────────────

export async function linkedLogin(chat: number) {
  const { data, error } = await client().from('bot_users').select('github_login').eq('tg_chat_id', chat).maybeSingle()
  if (error) throw error
  return (data as { github_login: string } | null)?.github_login ?? null
}

export async function linkLogin(chat: number, login: string) {
  const { error } = await client().from('bot_users').upsert({ tg_chat_id: chat, github_login: login })
  if (error) throw error
}

export async function unlinkLogin(chat: number) {
  const { error } = await client().from('bot_users').delete().eq('tg_chat_id', chat)
  if (error) throw error
}

export type UserGrave = { id: number; slug: string; repo_owner: string; repo_name: string; born_at: string; died_at: string | null }

/**
 * Могилы человека: где он владелец репозитория или указал себя при захоронении.
 * Ник проверен регуляркой (только буквы, цифры и дефис), поэтому в фильтр он попадает как есть; ilike без масок — сравнение без учёта регистра.
 */
export async function gravesOfLogin(login: string) {
  const { data, error } = await client()
    .from('projects')
    .select('id, slug, repo_owner, repo_name, born_at, died_at')
    .eq('source', 'bury')
    .or(`repo_owner.ilike.${login},buried_by.ilike.${login}`)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data as UserGrave[]
}

export async function graveOfLogin(login: string, id: number) {
  return (await gravesOfLogin(login)).find((grave) => grave.id === id) ?? null
}

export async function reportsOfChat(chat: number, limit = 10) {
  const { data, error } = await client().from('reports').select('*').eq('tg_chat_id', chat).order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return data as ReportRow[]
}

/** Привязывает чат к обращению по токену из ссылки. 'taken' — токен уже использован другим чатом, 'unknown' — такого токена нет. */
export async function bindReport(token: string, chat: number): Promise<{ status: 'ok'; report: ReportRow } | { status: 'taken' | 'unknown' }> {
  const { data, error } = await client().from('reports').select('*').eq('reply_token', token).maybeSingle()
  if (error) throw error
  const report = data as ReportRow | null
  if (!report) return { status: 'unknown' }
  if (report.tg_chat_id !== null && report.tg_chat_id !== chat) return { status: 'taken' }
  if (report.tg_chat_id === null) {
    const { error: updateError } = await client().from('reports').update({ tg_chat_id: chat }).eq('id', report.id)
    if (updateError) throw updateError
  }
  return { status: 'ok', report: { ...report, tg_chat_id: chat } }
}

export async function createBotReport(report: { slug: string; reason: string; contact: string | null; chat: number; ipHash: string }) {
  const { data, error } = await client()
    .from('reports')
    .insert({ slug: report.slug, kind: 'remove_own', reason: report.reason, contact: report.contact, ip_hash: report.ipHash, tg_chat_id: report.chat })
    .select('id')
    .single()
  if (error) throw error
  return (data as { id: number }).id
}

export async function countReportsSince(chat: number, since: Date) {
  const { count, error } = await client()
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('tg_chat_id', chat)
    .gte('created_at', since.toISOString())
  if (error) throw error
  return count ?? 0
}

export async function hasOpenReport(chat: number, slug: string) {
  const { count, error } = await client()
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('tg_chat_id', chat)
    .eq('slug', slug)
    .eq('status', 'new')
  if (error) throw error
  return (count ?? 0) > 0
}

export type PostStatus ={ status: 'sent' | 'failed'; note: string | null }

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
  created_at: string
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
    .select('created_at, repo_owner, repo_name, born_at, died_at, commits, last_words, cause, buried_by')
    .eq('source', 'bury')
    .limit(5000)
  if (error) throw error
  return data as GraveRow[]
}

/** Сколько обращений в каждом статусе. */
export async function reportTotals() {
  const { data, error } = await client().from('reports').select('status').limit(5000)
  if (error) throw error
  const totals = { new: 0, done: 0, rejected: 0 }
  for (const row of data as { status: keyof typeof totals }[]) totals[row.status] += 1
  return totals
}

/** Записывает число подписчиков канала за день (по Москве, YYYY-MM-DD). */
export async function saveSubscribers(day: string, subscribers: number) {
  const { error } = await client().from('channel_stats').upsert({ day, subscribers })
  if (error) throw error
}

export async function hasSubscribers(day: string) {
  const { count, error } = await client().from('channel_stats').select('day', { count: 'exact', head: true }).eq('day', day)
  if (error) throw error
  return (count ?? 0) > 0
}

/** Самая ранняя запись начиная с дня from: с чем сравнивать сегодняшнее число подписчиков. */
export async function subscribersFrom(from: string) {
  const { data, error } = await client().from('channel_stats').select('day, subscribers').gte('day', from).order('day').limit(1)
  if (error) throw error
  return (data as { day: string; subscribers: number }[])[0] ?? null
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
