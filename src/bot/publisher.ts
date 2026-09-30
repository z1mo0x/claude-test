import 'server-only'
import { claimPost, markPost, postStatuses } from './db'
import { botEnv } from './env'
import { esc, i, pack, postBlocks, postToHtml } from './html'
import { render } from './render'
import { POSTS, type Post } from './schedule'
import { collectFacts, type Facts } from './stats'
import { notifyOwner, sendMessage, sendMessages, sendPhoto, type InlineButton } from './telegram'

/** Пост, время которого прошло больше чем полдня назад, сам не уходит: пусть решает владелец. */
const WINDOW_MS = 12 * 60 * 60_000
const MSK_OFFSET_HOURS = 3
const DAY_MS = 86_400_000
const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

/** Когда пост должен уйти, в миллисекундах UTC. Москва — UTC+3 без перехода на летнее время. */
export function dueAt(post: Post, startDate: string) {
  const [year, month, day] = startDate.split('-').map(Number)
  const [hours, minutes] = post.time.split(':').map(Number)
  return Date.UTC(year, month - 1, day + post.day, hours - MSK_OFFSET_HOURS, minutes)
}

const pad = (n: number) => String(n).padStart(2, '0')

function mskDate(ms: number) {
  return new Date(ms + MSK_OFFSET_HOURS * 3_600_000)
}

/** «03.10 19:00» по Москве. */
export function moscow(ms: number) {
  const d = mskDate(ms)
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

/** «19:00» по Москве. */
export const moscowTime = (ms: number) => moscow(ms).slice(6)

/** Ключ дня по Москве, YYYY-MM-DD: по нему посты группируются по дням. */
export function dayKey(ms: number) {
  const d = mskDate(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** «Сегодня · 30.09», «Завтра · 01.10», «Вчера · 29.09», иначе «пт · 03.10». */
export function dayLabel(ms: number, now = Date.now()) {
  const d = mskDate(ms)
  const short = `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}`
  const diff = Math.round((Date.parse(dayKey(ms)) - Date.parse(dayKey(now))) / DAY_MS)
  const name = diff === 0 ? 'Сегодня' : diff === 1 ? 'Завтра' : diff === -1 ? 'Вчера' : WEEKDAYS[d.getUTCDay()]
  return `${name} · ${short}`
}

/** Номер дня календаря: день 0 — PROMO_START_DATE. */
export function calendarDay(startDate: string, now = Date.now()) {
  return Math.round((Date.parse(dayKey(now)) - Date.parse(startDate)) / DAY_MS)
}

/** Ссылка на сообщение в канале: по @username или по числовому id вида -100… */
function channelLink(channel: string, messageId: number | undefined) {
  if (!messageId) return undefined
  if (channel.startsWith('@')) return `https://t.me/${channel.slice(1)}/${messageId}`
  if (channel.startsWith('-100')) return `https://t.me/c/${channel.slice(4)}/${messageId}`
  return undefined
}

export type Outcome = { ok: true; note: string; link?: string } | { ok: false; reason: string }

const missingLine = (keys: string[]) => `⚠️ <b>Не хватает данных</b> для подстановок: ${keys.map((key) => `<code>{${esc(key)}}</code>`).join(', ')}`

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
      await sendMessages(
        env.ownerId,
        pack(`👀 <b>Предпросмотр:</b> ${esc(post.title)}\n<i>В канал не отправлено: ${esc(why)}.</i>`, [`<blockquote>${postToHtml(body.text)}</blockquote>`]),
      )
      return { ok: true, note: `предпросмотр (${why})` }
    }
    const html = postToHtml(body.text)
    const message = photo ? await sendPhoto(env.channel, photo.text, html) : await sendMessage(env.channel, html)
    return { ok: true, note: `канал, сообщение ${message?.message_id ?? '?'}`, link: channelLink(env.channel, message?.message_id) }
  }

  const head = [`🔔 <b>Пора: ${esc(post.title)}</b>`, post.todo ? `<i>${esc(post.todo)}</i>` : '', missing.length ? missingLine(missing) : '']
    .filter(Boolean)
    .join('\n')
  await sendMessages(env.ownerId, pack(head, postBlocks(body.text, post.plain)))
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
          await notifyOwner(`✅ <b>Опубликовано в канале</b>\n${esc(post.title)}`, outcome.link ? linkButton(outcome.link) : undefined)
        }
      } else {
        await markPost(post.id, 'failed', outcome.reason)
        await notifyOwner(
          `⚠️ <b>Не опубликован:</b> ${esc(post.title)}\n${esc(outcome.reason)}\n\n${i('После исправления: ')}<code>/post ${esc(post.id)}</code>`,
        )
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      console.error(`Пост ${post.id} не отправлен`, error)
      await markPost(post.id, 'failed', reason).catch(() => {})
      await notifyOwner(`⚠️ <b>Не отправлен:</b> ${esc(post.title)}\n${esc(reason)}\n\nПовтори: <code>/post ${esc(post.id)}</code>`)
    }
  }
  return { sent }
}

/** Кнопка со ссылкой под сообщением. */
export function linkButton(url: string, text = '🔗 Открыть пост') {
  const button: InlineButton = { text, url }
  return { inline_keyboard: [[button]] }
}

