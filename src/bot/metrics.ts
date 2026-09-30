import 'server-only'
import { ru } from '@/i18n/ru'
import { GOAL } from '@/lib/config'
import { plural } from '@/lib/format'
import { allGraves, hasSubscribers, postStatuses, reportTotals, saveSubscribers, subscribersFrom } from './db'
import { botEnv } from './env'
import { bar, code, esc, i } from './html'
import { dayKey, moscow } from './publisher'
import { POSTS } from './schedule'
import { tg, type InlineButton } from './telegram'
import { back, type View } from './view'

const DAY = 86_400_000
const BLOCKS = '▁▂▃▄▅▆▇█'

/** «12.06» из ключа дня 2026-06-12. */
const short = (key: string) => `${key.slice(8)}.${key.slice(5, 7)}`

/** Столбики по дням: высота — доля от самого «урожайного» дня, пустой день — самый низкий. */
function spark(series: number[]) {
  const max = Math.max(...series)
  return series.map((value) => (max === 0 ? BLOCKS[0] : BLOCKS[Math.round((value / max) * (BLOCKS.length - 1))])).join('')
}

/** Число подписчиков канала сейчас. null, если канал не задан или Telegram не ответил. */
async function subscribersNow() {
  const { channel } = botEnv()
  if (!channel) return null
  try {
    return await tg<number>('getChatMemberCount', { chat_id: channel })
  } catch (error) {
    console.error('Не удалось узнать число подписчиков', error)
    return null
  }
}

/**
 * Записывает число подписчиков за сегодня, если ещё не записано. Вызывается из cron раз в 15 минут,
 * а к Telegram и в базу ходит один раз в сутки. Не бросает: сбой метрик не должен ломать публикации.
 */
export async function recordSnapshot(now = Date.now()) {
  try {
    const day = dayKey(now)
    if (await hasSubscribers(day)) return
    const count = await subscribersNow()
    if (count !== null) await saveSubscribers(day, count)
  } catch (error) {
    console.error('Не удалось записать число подписчиков', error)
  }
}

async function channelBlock(now: number) {
  const { channel } = botEnv()
  if (!channel) return [`👥 <b>Канал</b>: ${i('TELEGRAM_CHANNEL_ID не задан')}`]
  const count = await subscribersNow()
  if (count === null) return [`👥 <b>Канал</b> ${code(channel)}`, i('число подписчиков получить не удалось')]

  const lines = [`👥 <b>Канал</b> ${code(channel)}`, `Подписчиков: <b>${count}</b>`]
  const base = await subscribersFrom(dayKey(now - 7 * DAY)).catch(() => null)
  if (base && base.day !== dayKey(now)) {
    const delta = count - base.subscribers
    lines[1] += ` · ${delta >= 0 ? '+' : ''}${delta} с ${short(base.day)}`
  } else {
    lines.push(i('рост покажу, когда накопится история (нужна миграция 0007 и день-два работы cron)'))
  }
  return lines
}

/** Экран «Метрики»: могилы, причины, обращения, посты и канал. Данные сайта считаются на лету по базе. */
export async function metricsView(now = Date.now()): Promise<View> {
  const [graves, reports, statuses, channel] = await Promise.all([allGraves(), reportTotals(), postStatuses(), channelBlock(now)])

  const perDay = new Map<string, number>()
  for (const grave of graves) {
    const key = dayKey(Date.parse(grave.created_at))
    perDay.set(key, (perDay.get(key) ?? 0) + 1)
  }
  const series = Array.from({ length: 14 }, (_, index) => perDay.get(dayKey(now - (13 - index) * DAY)) ?? 0)
  const today = series[13]
  const week = series.slice(7).reduce((sum, value) => sum + value, 0)
  const total = graves.length

  let pace: string
  if (total >= GOAL) pace = '🎉 Цель достигнута'
  else if (week === 0) pace = i('за неделю новых могил нет, прогноз не считаю')
  else {
    const days = Math.ceil((GOAL - total) / (week / 7))
    const eta = dayKey(now + days * DAY)
    // Год добавляем, если дата уже в следующем году: иначе «29.08» выглядит как прошедшая.
    const when = eta.slice(0, 4) === dayKey(now).slice(0, 4) ? short(eta) : `${short(eta)}.${eta.slice(0, 4)}`
    pace = days > 730 ? i('при таком темпе больше двух лет') : `при таком темпе ${GOAL} могил около <b>${when}</b>`
  }

  const byCause = new Map<string, number>()
  for (const grave of graves) byCause.set(grave.cause, (byCause.get(grave.cause) ?? 0) + 1)
  const causes = [...byCause.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => `${esc(ru.causes[id as keyof typeof ru.causes] ?? id)} — <b>${count}</b>`)

  const known = POSTS.filter((post) => statuses.has(post.id))
  const sent = known.filter((post) => statuses.get(post.id)?.status === 'sent').length
  const failed = known.length - sent

  const lines = [
    '📈 <b>Метрики</b>',
    i(`на ${moscow(now)} МСК`),
    '',
    `⚰️ <b>Могилы</b>  ${bar(total, GOAL)}  <b>${total}</b> / ${GOAL}`,
    `+<b>${today}</b> сегодня · +<b>${week}</b> за 7 дней`,
    `<code>${spark(series)}</code> ${i('14 дней')}`,
    pace,
    '',
    causes.length ? `☠️ <b>Причины</b>\n${causes.join('\n')}` : `☠️ ${i('причин пока нет')}`,
    '',
    ...channel,
    '',
    `📋 <b>Обращения</b>: новых <b>${reports.new}</b> · рассмотрено ${reports.done} · отклонено ${reports.rejected}`,
    `🗓 <b>Посты</b>: отправлено <b>${sent}</b> из ${POSTS.length}${failed ? ` · ⚠️ ошибок ${failed} ${plural(failed, ['пост', 'поста', 'постов'])}` : ''}`,
    '',
    `🌐 ${i('Посетителей и источники смотри в Vercel Analytics: у него нет API, бот их не видит.')}`,
  ]

  const { analyticsUrl } = botEnv()
  const rows: InlineButton[][] = [[{ text: '🔄 Обновить', callback_data: 'o:metrics' }]]
  if (analyticsUrl.startsWith('https://')) rows.push([{ text: '🌐 Трафик · Vercel Analytics', url: analyticsUrl }])
  rows.push(back('o:home'))
  return { html: lines.join('\n'), markup: { inline_keyboard: rows } }
}
