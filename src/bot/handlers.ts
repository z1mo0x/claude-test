import 'server-only'
import { revalidatePath } from 'next/cache'
import { GOAL } from '@/lib/config'
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
import { code, esc, i, pack, postBlocks, postToHtml, bar } from './html'
import { calendarDay, dayLabel, deliver, dueAt, linkButton, moscow, moscowTime } from './publisher'
import { render } from './render'
import { POSTS } from './schedule'
import { collectFacts } from './stats'
import { answerCallback, editMessage, notifyOwner, sendMessage, sendMessages, tg, type InlineButton, type Markup } from './telegram'

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

/** Меню команд рядом с полем ввода (кнопка «/»). Только в личном чате владельца. */
const COMMANDS = [
  { command: 'complaints', description: 'Жалобы и обращения с сайта' },
  { command: 'next', description: 'Ближайшие посты' },
  { command: 'stats', description: 'Статистика и состояние бота' },
  { command: 'post', description: 'Предпросмотр поста: /post id' },
  { command: 'testchannel', description: 'Проверить публикацию в канал' },
  { command: 'help', description: 'Помощь' },
]

async function registerMenu(chat: number) {
  await tg('setMyCommands', { commands: COMMANDS, scope: { type: 'chat', chat_id: chat } }).catch((error) =>
    console.error('Не удалось записать меню команд', error),
  )
}

const HELP = [
  '🪦 <b>Projectyard</b>',
  '<i>Кладбище заброшенных пет-проектов</i>',
  '',
  'Слежу за сайтом и помогаю его продвигать.',
  '',
  '📋 <b>Жалобы</b> — обращения «удалить или пожаловаться»',
  '🗓 <b>Ближайшие посты</b> — календарь продвижения',
  '📊 <b>Статистика</b> — счётчик и состояние бота',
  '',
  '<b>Команды</b>',
  '/post <code>id</code> — предпросмотр поста и кнопки',
  '/testchannel — пробное сообщение в канал',
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
    await sendMessage(chat, `Твой Telegram id: ${code(String(message.from?.id))}\nВпиши его в Vercel как <code>OWNER_TELEGRAM_ID</code> и сделай Redeploy.`)
    return
  }
  if (!isOwner(message.from?.id)) {
    await sendMessage(chat, '🔒 Это личный бот.')
    return
  }

  if (text === '/start' || text === '/help') {
    await registerMenu(chat)
    return void (await sendMessage(chat, HELP, MENU))
  }
  if (text === '/testchannel') return testChannel(chat)
  if (text === '/complaints' || text.includes('Жалобы')) return showReports(chat)
  if (text === '/next' || text.includes('Ближайшие')) return showNext(chat)
  if (text === '/stats' || text.includes('Статистика')) return showStats(chat)
  if (text.startsWith('/post')) return showPost(chat, text.replace('/post', '').trim())
  await sendMessage(chat, HELP, MENU)
}

// ── Жалобы ──────────────────────────────────────────────────────────────────

const KIND: Record<ReportRow['kind'], string> = { remove_own: '🗑 Запрос на удаление', complaint: '🚩 Жалоба' }

function reportText(r: ReportRow) {
  return [
    `${KIND[r.kind]} <b>#${r.id}</b>`,
    `${code(r.slug)} · ${esc(moscow(Date.parse(r.created_at)))} МСК`,
    '',
    `<blockquote>${esc(r.reason)}</blockquote>`,
    r.contact ? `👤 ${esc(r.contact)}` : i('контакт не указан'),
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

/** Новое обращение владельцу сразу карточкой с кнопками. Не бросает: вызывается после ответа сайта. */
export async function announceReport(id: number) {
  const { token, ownerId } = botEnv()
  if (!token || !ownerId) return
  try {
    const report = await reportById(id)
    if (report) await sendMessage(ownerId, `🆕 ${reportText(report)}`, reportButtons(report))
  } catch (error) {
    console.error('Не удалось сообщить об обращении', error)
  }
}

async function showReports(chat: number) {
  const [reports, total] = await Promise.all([newReports(5), countNewReports()])
  if (!reports.length) {
    return void (await sendMessage(
      chat,
      '✨ <b>Новых обращений нет</b>\n<i>Когда кто-то заполнит форму на сайте, пришлю карточку сразу.</i>',
      MENU,
    ))
  }
  const more = total > reports.length ? ` · показываю ${reports.length} самых старых` : ''
  await sendMessage(chat, `📋 <b>Обращения</b> · новых: <b>${total}</b>${more}`, MENU)
  for (const report of reports) await sendMessage(chat, reportText(report), reportButtons(report))
}

async function handleReportAction(chat: number, messageId: number, action: string, id: number): Promise<string | undefined> {
  const report = await reportById(id)
  if (!report) return 'Обращение не найдено'
  if (report.status !== 'new') return 'Уже обработано'

  if (action === 'back') {
    await editMessage(chat, messageId, reportText(report), reportButtons(report))
    return undefined
  }
  if (action === 'del') {
    await editMessage(chat, messageId, `${reportText(report)}\n\n⚠️ <b>Удалить могилу ${esc(report.slug)} навсегда?</b>\nОтменить это нельзя.`, {
      inline_keyboard: [
        [{ text: '🗑 Да, удалить навсегда', callback_data: `r:delok:${id}` }],
        [{ text: '← Отмена', callback_data: `r:back:${id}` }],
      ],
    })
    return undefined
  }
  if (action === 'delok') {
    const removed = await deleteGrave(report.slug)
    await setReportStatus(id, 'done')
    revalidateSite()
    await editMessage(chat, messageId, `${reportText(report)}\n\n🗑 <b>${removed ? 'Могила удалена' : 'Могилы уже не было'}.</b> Обращение закрыто.`)
    return undefined
  }
  if (action === 'done' || action === 'rej') {
    await setReportStatus(id, action === 'done' ? 'done' : 'rejected')
    await editMessage(chat, messageId, `${reportText(report)}\n\n${action === 'done' ? '✅ <b>Готово</b>' : '🚫 <b>Отклонено</b>'}`)
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

const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)

async function showNext(chat: number) {
  const env = botEnv()
  if (!validDate(env.startDate)) {
    return void (await sendMessage(
      chat,
      '🗓 <b>Календарь не запущен</b>\nЗадай <code>PROMO_START_DATE</code> (ГГГГ-ММ-ДД, день 0) в Vercel и сделай Redeploy.',
      MENU,
    ))
  }
  const statuses = await postStatuses()
  const now = Date.now()
  const items = POSTS.map((post) => ({ post, at: dueAt(post, env.startDate), status: statuses.get(post.id) }))
    .sort((a, b) => a.at - b.at)
    .filter(({ at, status }) => status?.status === 'failed' || (!status && at > now - 36 * 3_600_000))
    .slice(0, 12)

  if (!items.length) {
    return void (await sendMessage(chat, '🎉 <b>Всё отправлено</b>\nВ календаре больше ничего нет.', MENU))
  }

  const start = env.startDate.split('-').reverse().slice(0, 2).join('.')
  const lines: string[] = ['🗓 <b>Календарь продвижения</b>', i(`день 0 = ${start} · сейчас день ${calendarDay(env.startDate)}`)]
  let lastDay = ''
  for (const { post, at, status } of items) {
    const label = dayLabel(at, now)
    if (label !== lastDay) {
      lines.push('', `<b>${esc(label)}</b>`)
      lastDay = label
    }
    const state = status?.status === 'failed' ? '⚠️' : at > now ? '⏳' : '❗'
    const who = post.mode === 'channel' ? '📣' : '🔔'
    lines.push(`${state} ${code(moscowTime(at))}  ${who} ${esc(post.title)}`)
  }
  lines.push('', i('📣 публикую сам · 🔔 напомню и пришлю текст · ❗ пропущено · ⚠️ ошибка'))

  const buttons: InlineButton[][] = items
    .slice(0, 5)
    .map(({ post, at }) => [{ text: `👁 ${moscowTime(at)} · ${post.title}`.slice(0, 48), callback_data: `p:view:${post.id}` }])
  await sendMessage(chat, lines.join('\n'), { inline_keyboard: buttons })
}

async function showPost(chat: number, id: string) {
  const post = POSTS.find((p) => p.id === id)
  if (!post) {
    return void (await sendMessage(chat, `Такого поста нет. Список: ${POSTS.map((p) => code(p.id)).join(', ')}`))
  }
  const env = botEnv()
  const { facts } = await collectFacts()
  const body = render(post.text, facts, env.site)
  const photo = post.photo ? render(post.photo, facts, env.site) : null
  const missing = [...body.missing, ...(photo?.missing ?? [])]
  const when = validDate(env.startDate) ? ` · ${code(moscow(dueAt(post, env.startDate)))} МСК` : ''
  const head = [
    `${post.mode === 'channel' ? '📣' : '🔔'} <b>${esc(post.title)}</b>`,
    `${post.mode === 'channel' ? 'Публикует бот в канал' : 'Напомню и пришлю текст'}${when}`,
    post.mode === 'channel' && photo ? `🖼 С картинкой: ${code(photo.text)}` : '',
    post.todo ? i(post.todo) : '',
    missing.length ? `⚠️ <b>Не хватает данных:</b> ${missing.map((key) => code(`{${key}}`)).join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const blocks = post.mode === 'channel' ? [`<blockquote>${postToHtml(body.text)}</blockquote>`] : postBlocks(body.text, post.plain)
  const action: InlineButton =
    post.mode === 'channel'
      ? { text: '📣 Опубликовать в канал сейчас', callback_data: `p:pub:${id}` }
      : { text: '✅ Отметить сделанным', callback_data: `p:done:${id}` }
  await sendMessages(chat, pack(head, blocks), { inline_keyboard: [[action], [{ text: '↩️ Сбросить статус', callback_data: `p:reset:${id}` }]] })
}

async function handlePostAction(chat: number, action: string, id: string): Promise<string | undefined> {
  const post = POSTS.find((p) => p.id === id)
  if (!post) return 'Поста нет'
  if (action === 'view') {
    await showPost(chat, id)
    return undefined
  }
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
      await notifyOwner(
        `✅ <b>${post.mode === 'channel' ? 'Опубликовано' : 'Отправлено'}:</b> ${esc(post.title)}`,
        outcome.link ? linkButton(outcome.link) : undefined,
      )
      return 'Готово'
    }
    await markPost(id, 'failed', outcome.reason)
    await sendMessage(chat, `⚠️ <b>Не вышло:</b> ${esc(outcome.reason)}`)
    return 'Не вышло'
  }
  return undefined
}

// ── Проверка канала ─────────────────────────────────────────────────────────

async function testChannel(chat: number) {
  const { channel } = botEnv()
  if (!channel) {
    return void (await sendMessage(chat, '⚙️ <code>TELEGRAM_CHANNEL_ID</code> не задан: посты «в канал» приходят сюда предпросмотром.'))
  }
  try {
    await sendMessage(channel, '🔧 <b>Проверка бота Projectyard</b>\nПубликация в канал работает. Это сообщение можно удалить.')
    await sendMessage(chat, `✅ Отправил пробное сообщение в ${code(channel)}. Оно должно появиться в канале.`)
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    await sendMessage(
      chat,
      `⚠️ <b>В канал не отправилось</b>\n${esc(reason)}\n\nПроверь, что бот администратор канала с правом публиковать и что <code>TELEGRAM_CHANNEL_ID</code> верный.`,
    )
  }
}

// ── Статистика ─────────────────────────────────────────────────────────────

async function showStats(chat: number) {
  const env = botEnv()
  const [{ facts, total, mine }, reports] = await Promise.all([collectFacts(), countNewReports()])
  const calendar = validDate(env.startDate) ? `день ${calendarDay(env.startDate)} · старт ${env.startDate.split('-').reverse().join('.')}` : 'не запущен'
  const lines: (string | null)[] = [
    '📊 <b>Статистика</b>',
    '',
    `⚰️ <b>Могил</b>  ${bar(total, GOAL)}  <b>${total}</b> / ${GOAL}`,
    i(`до старта основного проекта осталось ${facts.left}`),
    '',
    facts.top_cause ? `☠️ Частая причина: <b>${esc(facts.top_cause)}</b>` : null,
    facts.longest_name ? `🕰 Долгожитель: <b>${esc(facts.longest_name)}</b> · ${esc(facts.longest_lived)}` : null,
    env.ownerLogin ? `👤 Твоих могил: <b>${mine}</b>` : `👤 Твои могилы: ${i('задай OWNER_GITHUB_LOGIN')}`,
    `📋 Новых обращений: <b>${reports}</b>`,
    '',
    '⚙️ <b>Бот</b>',
    `📣 Канал: ${env.channel ? code(env.channel) : i('не задан')}`,
    `🗓 Календарь: ${esc(calendar)}`,
    env.dryRun ? '🟡 Режим: <b>пробный</b>, в канал не публикую' : '🟢 Режим: <b>боевой</b>',
  ]
  await sendMessage(chat, lines.filter((line) => line !== null).join('\n'), MENU)
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
