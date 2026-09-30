import 'server-only'
import { revalidatePath } from 'next/cache'
import {
  countNewReports,
  deleteGrave,
  forgetPost,
  markPost,
  newReports,
  postStatuses,
  reportById,
  setReportStatus,
  type ReportRow,
} from './db'
import { botEnv } from './env'
import { deliver, dueAt, moscow } from './publisher'
import { render } from './render'
import { POSTS } from './schedule'
import { collectFacts } from './stats'
import { answerCallback, editMessage, notifyOwner, sendMessage, type InlineButton, type Markup } from './telegram'

type Message = { message_id: number; chat: { id: number }; from?: { id: number }; text?: string }
type Callback = { id: string; from: { id: number }; data?: string; message?: Message }
export type Update = { message?: Message; callback_query?: Callback }

const BTN_REPORTS = '📋 Жалобы'
const BTN_NEXT = '🗓 Ближайшие посты'
const BTN_STATS = '📊 Статистика'

/** Постоянная клавиатура внизу чата. Видит её только владелец: бот отвечает только ему. */
const MENU: Markup = {
  keyboard: [[{ text: BTN_REPORTS }, { text: BTN_NEXT }], [{ text: BTN_STATS }]],
  resize_keyboard: true,
  is_persistent: true,
}

const HELP = [
  'Я бот Projectyard. Команды:',
  '📋 Жалобы — обращения «удалить или пожаловаться» с сайта',
  '🗓 Ближайшие посты — календарь продвижения',
  '📊 Статистика — счётчик, причины, состояние бота',
  '/post <id> — предпросмотр поста и кнопки «опубликовать сейчас» или «отметить сделанным»',
].join('\n')

const isOwner = (id: number | undefined) => Boolean(id) && String(id) === botEnv().ownerId

export async function handleUpdate(update: Update) {
  if (update.callback_query) return handleCallback(update.callback_query)
  const message = update.message
  if (!message?.text) return
  const text = message.text.trim()
  const chat = message.chat.id

  // Узнать свой id можно до настройки: он нужен, чтобы записать OWNER_TELEGRAM_ID.
  if (text === '/whoami' || (text === '/start' && !botEnv().ownerId)) {
    await sendMessage(chat, `Твой Telegram id: ${message.from?.id}\nВпиши его в Vercel как OWNER_TELEGRAM_ID и сделай Redeploy.`)
    return
  }
  if (!isOwner(message.from?.id)) {
    await sendMessage(chat, 'Это личный бот.')
    return
  }

  if (text === '/start' || text === '/help') return void (await sendMessage(chat, HELP, MENU))
  if (text === '/complaints' || text.includes('Жалобы')) return showReports(chat)
  if (text === '/next' || text.includes('Ближайшие')) return showNext(chat)
  if (text === '/stats' || text.includes('Статистика')) return showStats(chat)
  if (text.startsWith('/post')) return showPost(chat, text.replace('/post', '').trim())
  await sendMessage(chat, HELP, MENU)
}

// ── Жалобы ──────────────────────────────────────────────────────────────────

const KIND: Record<ReportRow['kind'], string> = { remove_own: 'Удалить (владелец)', complaint: 'Жалоба' }

function reportText(r: ReportRow) {
  return [
    `🪦 Обращение #${r.id} · ${KIND[r.kind]}`,
    `Могила: ${r.slug}`,
    `Причина: ${r.reason}`,
    `Контакт: ${r.contact ?? 'не указан'}`,
    `Пришло: ${moscow(Date.parse(r.created_at))} МСК`,
  ].join('\n')
}

function reportButtons(r: ReportRow): Markup {
  return {
    inline_keyboard: [
      [{ text: '🔗 Открыть могилу', url: `${botEnv().site}/r/${r.slug}` }],
      [
        { text: '✅ Готово', callback_data: `r:done:${r.id}` },
        { text: '🚫 Отклонить', callback_data: `r:rej:${r.id}` },
      ],
      [{ text: '🗑 Удалить могилу', callback_data: `r:del:${r.id}` }],
    ],
  }
}

async function showReports(chat: number) {
  const [reports, total] = await Promise.all([newReports(5), countNewReports()])
  if (!reports.length) return void (await sendMessage(chat, 'Новых обращений нет.', MENU))
  await sendMessage(chat, `Новых обращений: ${total}${total > reports.length ? `. Показываю ${reports.length} самых старых.` : ''}`, MENU)
  for (const report of reports) await sendMessage(chat, reportText(report), reportButtons(report))
}

async function handleReportAction(chat: number, messageId: number, action: string, id: number): Promise<string | undefined> {
  const report = await reportById(id)
  if (!report) return 'Обращение не найдено'
  if (report.status !== 'new') return 'Уже обработано'

  if (action === 'back') {
    await editMessage(chat, messageId, reportText(report), reportButtons(report))
    return
  }
  if (action === 'del') {
    await editMessage(chat, messageId, `${reportText(report)}\n\n⚠️ Удалить могилу ${report.slug} навсегда? Отменить это нельзя.`, {
      inline_keyboard: [
        [{ text: '🗑 Да, удалить навсегда', callback_data: `r:delok:${id}` }],
        [{ text: 'Отмена', callback_data: `r:back:${id}` }],
      ],
    })
    return
  }
  if (action === 'delok') {
    const removed = await deleteGrave(report.slug)
    await setReportStatus(id, 'done')
    revalidateSite()
    await editMessage(chat, messageId, `${reportText(report)}\n\n🗑 ${removed ? 'Могила удалена' : 'Могилы уже не было'}. Обращение закрыто.`)
    return
  }
  if (action === 'done' || action === 'rej') {
    await setReportStatus(id, action === 'done' ? 'done' : 'rejected')
    await editMessage(chat, messageId, `${reportText(report)}\n\n${action === 'done' ? '✅ Отмечено как обработанное' : '🚫 Отклонено'}`)
  }
  return undefined
}

/** Счётчик в шапке и sitemap после удаления могилы: без этого они какое-то время показывали бы старое. */
function revalidateSite() {
  try {
    revalidatePath('/', 'layout')
  } catch (error) {
    console.error('Не удалось сбросить кеш сайта', error)
  }
}

// ── Посты ───────────────────────────────────────────────────────────────────

async function showNext(chat: number) {
  const env = botEnv()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(env.startDate)) {
    return void (await sendMessage(chat, 'Календарь не запущен: задай PROMO_START_DATE (ГГГГ-ММ-ДД, день 0) в Vercel и сделай Redeploy.', MENU))
  }
  const statuses = await postStatuses()
  const now = Date.now()
  const lines = POSTS.map((post) => ({ post, at: dueAt(post, env.startDate), status: statuses.get(post.id) }))
    .filter(({ at, status }) => status?.status === 'failed' || (!status && at > now - 36 * 3_600_000))
    .slice(0, 10)
    .map(({ post, at, status }) => {
      const icon = status?.status === 'failed' ? '⚠️' : at > now ? '⏳' : '❗'
      const who = post.mode === 'channel' ? 'бот публикует' : 'напомню'
      return `${icon} ${moscow(at)} · ${who} · ${post.id}\n    ${post.title}`
    })
  await sendMessage(chat, lines.length ? `Ближайшее:\n\n${lines.join('\n')}\n\nПредпросмотр: /post <id>` : 'Всё отправлено или в календаре пусто.', MENU)
}

async function showPost(chat: number, id: string) {
  const post = POSTS.find((p) => p.id === id)
  if (!post) return void (await sendMessage(chat, `Такого поста нет. Список: ${POSTS.map((p) => p.id).join(', ')}`))
  const { facts } = await collectFacts()
  const body = render(post.text, facts, botEnv().site)
  const missing = body.missing.length ? `\n\n⚠️ Не хватает данных: ${body.missing.map((key) => `{${key}}`).join(', ')}` : ''
  const action: InlineButton =
    post.mode === 'channel'
      ? { text: '📣 Опубликовать в канал сейчас', callback_data: `p:pub:${id}` }
      : { text: '✅ Отметить сделанным', callback_data: `p:done:${id}` }
  await sendMessage(chat, `${post.mode === 'channel' ? '📣 В канал' : '🗓 Напоминание'} · ${post.title}${missing}\n\n${body.text}`, {
    inline_keyboard: [[action], [{ text: '↩️ Сбросить статус', callback_data: `p:reset:${id}` }]],
  })
}

async function handlePostAction(chat: number, action: string, id: string): Promise<string | undefined> {
  const post = POSTS.find((p) => p.id === id)
  if (!post) return 'Поста нет'
  if (action === 'reset') {
    await forgetPost(id)
    return 'Статус сброшен: cron отправит пост снова, если он в пределах 12 часов'
  }
  if (action === 'done') {
    await markPost(id, 'sent', 'отмечен вручную')
    return 'Отмечено'
  }
  if (action === 'pub') {
    const { facts } = await collectFacts()
    const outcome = await deliver(post, facts)
    if (outcome.ok) {
      await markPost(id, 'sent', `вручную: ${outcome.note}`)
      await notifyOwner(`✅ ${post.mode === 'channel' ? 'Опубликовано' : 'Отправлено'}: ${post.title}`)
      return 'Готово'
    }
    await markPost(id, 'failed', outcome.reason)
    await sendMessage(chat, `⚠️ Не вышло: ${outcome.reason}`)
    return 'Не вышло'
  }
  return undefined
}

// ── Статистика ─────────────────────────────────────────────────────────────

async function showStats(chat: number) {
  const env = botEnv()
  const [{ facts, total, mine }, reports] = await Promise.all([collectFacts(), countNewReports()])
  await sendMessage(
    chat,
    [
      `Могил: ${total} из 100 (осталось ${facts.left})`,
      facts.top_cause ? `Частая причина: ${facts.top_cause}` : null,
      facts.longest_name ? `Долгожитель: ${facts.longest_name}, ${facts.longest_lived}` : null,
      `Твоих могил (по OWNER_GITHUB_LOGIN): ${env.ownerLogin ? mine : 'логин не задан'}`,
      `Новых обращений: ${reports}`,
      '',
      `Канал: ${env.channel || 'не задан (посты «в канал» придут сюда предпросмотром)'}`,
      `Календарь: ${env.startDate ? `день 0 = ${env.startDate}` : 'не запущен (нет PROMO_START_DATE)'}`,
      `Режим: ${env.dryRun ? 'BOT_DRY_RUN, в канал не публикую' : 'боевой'}`,
    ]
      .filter((line) => line !== null)
      .join('\n'),
    MENU,
  )
}

// ── Кнопки под сообщениями ─────────────────────────────────────────────────

async function handleCallback(query: Callback) {
  if (!isOwner(query.from.id) || !query.message) return void (await answerCallback(query.id))
  const chat = query.message.chat.id
  const [kind, action, id] = (query.data ?? '').split(':')
  let answer: string | undefined
  if (kind === 'r') answer = await handleReportAction(chat, query.message.message_id, action, Number(id))
  else if (kind === 'p') answer = await handlePostAction(chat, action, id)
  await answerCallback(query.id, answer || undefined)
}
