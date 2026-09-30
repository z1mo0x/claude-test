import 'server-only'
import { claimPost, markPost, postStatuses } from './db'
import { botEnv } from './env'
import { render } from './render'
import { POSTS, type Post } from './schedule'
import { collectFacts, type Facts } from './stats'
import { notifyOwner, sendMessage, sendPhoto } from './telegram'

/** Пост, время которого прошло больше чем полдня назад, сам не уходит: пусть решает владелец. */
const WINDOW_MS = 12 * 60 * 60_000
const MSK_OFFSET_HOURS = 3

/** Когда пост должен уйти, в миллисекундах UTC. Москва — UTC+3 без перехода на летнее время. */
export function dueAt(post: Post, startDate: string) {
  const [year, month, day] = startDate.split('-').map(Number)
  const [hours, minutes] = post.time.split(':').map(Number)
  return Date.UTC(year, month - 1, day + post.day, hours - MSK_OFFSET_HOURS, minutes)
}

/** «03.10 19:00» по Москве. */
export function moscow(ms: number) {
  const d = new Date(ms + MSK_OFFSET_HOURS * 3_600_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

export type Outcome = { ok: true; note: string } | { ok: false; reason: string }

/** Отправляет один пост: в канал или владельцу напоминанием. Ни о чём не спрашивает, решает вызывающий. */
export async function deliver(post: Post, facts: Facts): Promise<Outcome> {
  const env = botEnv()
  const body = render(post.text, facts, env.site)
  const photo = post.photo ? render(post.photo, facts, env.site) : null
  const missing = [...body.missing, ...(photo?.missing ?? [])]

  if (post.mode === 'channel') {
    if (missing.length) {
      return { ok: false, reason: `не хватает данных для подстановок: ${missing.map((key) => `{${key}}`).join(', ')}` }
    }
    if (env.dryRun || !env.channel) {
      const why = env.dryRun ? 'включён BOT_DRY_RUN' : 'не задан TELEGRAM_CHANNEL_ID'
      await sendMessage(env.ownerId, `👀 Предпросмотр «${post.title}». В канал не отправлено: ${why}.\n\n${body.text}`)
      return { ok: true, note: `предпросмотр (${why})` }
    }
    const message = photo ? await sendPhoto(env.channel, photo.text, body.text) : await sendMessage(env.channel, body.text)
    return { ok: true, note: `канал, сообщение ${message?.message_id ?? '?'}` }
  }

  const header = `🗓 Пора: ${post.title}${post.todo ? `\n${post.todo}` : ''}`
  const warning = missing.length ? `\n\n⚠️ Не хватает данных для подстановок: ${missing.map((key) => `{${key}}`).join(', ')}` : ''
  await sendMessage(env.ownerId, `${header}${warning}\n\n${body.text}`)
  return { ok: true, note: 'напоминание владельцу' }
}

/** Запуск по расписанию: отправляет то, что уже пора и ещё не отправлялось. */
export async function runDue(now = Date.now()) {
  const env = botEnv()
  if (!env.token || !env.ownerId) return { skipped: 'бот не настроен (TELEGRAM_BOT_TOKEN, OWNER_TELEGRAM_ID)' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(env.startDate)) return { skipped: 'не задан PROMO_START_DATE (ГГГГ-ММ-ДД)' }

  const statuses = await postStatuses()
  const due = POSTS.filter((post) => {
    const at = dueAt(post, env.startDate)
    return at <= now && now - at <= WINDOW_MS && !statuses.has(post.id)
  })
  if (!due.length) return { sent: [] as string[] }

  const { facts } = await collectFacts()
  const sent: string[] = []
  for (const post of due) {
    if (!(await claimPost(post.id))) continue
    try {
      const outcome = await deliver(post, facts)
      if (outcome.ok) {
        await markPost(post.id, 'sent', outcome.note)
        sent.push(post.id)
        if (post.mode === 'channel' && !outcome.note.startsWith('предпросмотр')) {
          await notifyOwner(`✅ Опубликовано в канале: ${post.title}`)
        }
      } else {
        await markPost(post.id, 'failed', outcome.reason)
        await notifyOwner(`⚠️ «${post.title}» не опубликован: ${outcome.reason}.\nПосле исправления: /post ${post.id}`)
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      console.error(`Пост ${post.id} не отправлен`, error)
      await markPost(post.id, 'failed', reason).catch(() => {})
      await notifyOwner(`⚠️ «${post.title}» не отправлен: ${reason}.\nПовтори: /post ${post.id}`)
    }
  }
  return { sent }
}
