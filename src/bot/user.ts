import 'server-only'
import { ipHash } from '@/lib/client-ip'
import { daysBetween, lifetime } from '@/lib/format'
import {
  bindReport,
  countReportsSince,
  createBotReport,
  graveOfLogin,
  gravesOfLogin,
  hasOpenReport,
  linkedLogin,
  linkLogin,
  reportsOfChat,
  unlinkLogin,
  type ReportRow,
} from './db'
import { botEnv } from './env'
import { code, esc, i } from './html'
import { answerCallback, editMessage, sendMessage, type InlineButton, type Markup } from './telegram'

export type UserMessage = { chat: number; text: string }
export type UserCallback = { id: string; chat: number; messageId: number; data: string; username?: string }

const BTN_GRAVES = '🪦 Мои могилы'
const BTN_REPORTS = '📨 Мои обращения'
const BTN_LOGIN = '🔗 Сменить GitHub'

/** Клавиатура обычного человека. Владелец видит свою, с жалобами и календарём. */
export const USER_MENU: Markup = {
  keyboard: [[{ text: BTN_GRAVES }, { text: BTN_REPORTS }], [{ text: BTN_LOGIN }]],
  resize_keyboard: true,
  is_persistent: true,
}

/** Меню команд для всех, кроме владельца (у него своё, в его чате). */
export const USER_COMMANDS = [
  { command: 'graves', description: 'Мои могилы' },
  { command: 'reports', description: 'Мои обращения' },
  { command: 'github', description: 'Указать ник на GitHub' },
  { command: 'help', description: 'Помощь' },
]

/** Не больше стольких запросов на удаление из бота в сутки с одного чата: защита от заваливания владельца. */
const DAILY_LIMIT = 3

/** Ник GitHub: буквы, цифры и дефис, до 39 символов. Принимается и ссылка github.com/ник. */
const LOGIN = /^(?:https?:\/\/)?(?:www\.)?(?:github\.com\/)?@?([A-Za-z0-9-]{1,39})\/?$/

const STATUS: Record<ReportRow['status'], { icon: string; label: string }> = {
  new: { icon: '⏳', label: 'на рассмотрении' },
  done: { icon: '✅', label: 'рассмотрено' },
  rejected: { icon: '🚫', label: 'отклонено' },
}

const contactOf = (chat: number, username?: string) => (username ? `Telegram: @${username}` : `Telegram id ${chat}`)

// ── Сообщения ───────────────────────────────────────────────────────────────

export async function handleUserMessage({ chat, text }: UserMessage) {
  const start = /^\/start\s+r_([A-Za-z0-9_-]{8,64})$/.exec(text)
  if (start) return bindFromSite(chat, start[1])

  if (text === '/start' || text === '/help') return welcome(chat)
  if (text === '/graves' || text === BTN_GRAVES) return showGraves(chat)
  if (text === '/reports' || text === BTN_REPORTS) return showReports(chat)
  if (text === '/unlink') {
    await unlinkLogin(chat)
    return void (await sendMessage(chat, '🔓 Отвязал GitHub. Пришли ник, когда захочешь привязать снова.', USER_MENU))
  }
  if (text === BTN_LOGIN || text === '/github') {
    return void (await sendMessage(chat, '🔗 <b>Пришли свой ник на GitHub</b>\n<i>Например: torvalds. Покажу твои могилы и помогу убрать лишнюю.</i>', USER_MENU))
  }

  // Ник можно прислать просто текстом или после /github. Другие команды сюда не попадают.
  const given = text.startsWith('/github ') ? text.slice(8).trim() : text.startsWith('/') ? '' : text
  const login = given ? LOGIN.exec(given)?.[1] : undefined
  if (login) return linkFlow(chat, login)
  await welcome(chat)
}

async function welcome(chat: number) {
  const login = await linkedLogin(chat)
  const lines = [
    '🪦 <b>Projectyard</b>',
    '<i>Кладбище заброшенных пет-проектов</i>',
    '',
    login ? `🔗 GitHub: ${code(login)}` : 'Пришли свой ник на GitHub, и я покажу твои могилы.',
    '',
    '🪦 <b>Мои могилы</b> — что ты похоронил, и запрос убрать лишнюю',
    '📨 <b>Мои обращения</b> — что с ними, ответы приходят сюда',
    '',
    i(`Сайт: ${botEnv().site}`),
  ]
  await sendMessage(chat, lines.join('\n'), USER_MENU)
}

async function linkFlow(chat: number, login: string) {
  const graves = await gravesOfLogin(login)
  if (!graves.length) {
    return void (await sendMessage(
      chat,
      `🤷 Не нашёл могил у ${code(login)}. Проверь ник: он должен совпадать с владельцем репозитория или с тем, кого ты указал при захоронении.`,
      USER_MENU,
    ))
  }
  await linkLogin(chat, login)
  await showGraves(chat, `✅ GitHub ${code(login)} привязан.\n\n`)
}

async function showGraves(chat: number, intro = '') {
  const login = await linkedLogin(chat)
  if (!login) {
    return void (await sendMessage(chat, '🔗 <b>Сначала пришли свой ник на GitHub</b>\n<i>Например: torvalds</i>', USER_MENU))
  }
  const graves = await gravesOfLogin(login)
  if (!graves.length) {
    return void (await sendMessage(chat, `${intro}🪦 У ${code(login)} пока нет могил. Похорони проект на ${esc(botEnv().site)}.`, USER_MENU))
  }
  const { site } = botEnv()
  const lines = graves.map((g) => {
    const lived = g.died_at ? ` — прожил ${esc(lifetime(daysBetween(g.born_at, g.died_at)))}` : ''
    return `▸ <a href="${site}/r/${g.repo_owner}/${g.repo_name}">${esc(g.repo_name)}</a>${lived}`
  })
  const buttons: InlineButton[][] = graves.slice(0, 10).map((g) => [{ text: `🗑 Убрать: ${g.repo_name}`.slice(0, 40), callback_data: `u:rm:${g.id}` }])
  await sendMessage(chat, `${intro}🪦 <b>Могилы ${code(login)}</b> · ${graves.length}\n\n${lines.join('\n')}`, { inline_keyboard: buttons })
}

async function showReports(chat: number) {
  const reports = await reportsOfChat(chat)
  if (!reports.length) {
    return void (await sendMessage(
      chat,
      '📨 <b>Обращений пока нет</b>\n<i>Убрать могилу можно кнопкой в «Мои могилы». Обращение с сайта попадёт сюда, если после отправки нажать «Получить ответ в Telegram».</i>',
      USER_MENU,
    ))
  }
  const lines = reports.map((r) => `${STATUS[r.status].icon} <b>#${r.id}</b> ${code(r.slug)}\n${i(STATUS[r.status].label)}`)
  await sendMessage(chat, `📨 <b>Мои обращения</b>\n\n${lines.join('\n\n')}`, USER_MENU)
}

/** Человек нажал Start по ссылке со страницы сайта после отправки формы. */
async function bindFromSite(chat: number, token: string) {
  const result = await bindReport(token, chat)
  if (result.status !== 'ok') {
    const text =
      result.status === 'taken' ? '🔒 Эта ссылка уже привязана к другому чату.' : '⌛ Ссылка не подходит: обращения с таким кодом нет. Отправь форму на сайте ещё раз.'
    return void (await sendMessage(chat, text, USER_MENU))
  }
  const { report } = result
  await sendMessage(
    chat,
    `📨 <b>Обращение #${report.id} принято</b>\n${code(report.slug)}\n\nНапишу сюда, когда рассмотрю. Все свои обращения можно посмотреть в «${BTN_REPORTS}».`,
    USER_MENU,
  )
}

// ── Кнопки ──────────────────────────────────────────────────────────────────

export async function handleUserCallback(query: UserCallback, announce: (id: number) => Promise<void>) {
  const [, action, raw] = query.data.split(':')
  const { chat, messageId } = query
  const id = Number(raw)
  let answer: string | undefined

  const login = await linkedLogin(chat)
  const grave = login && Number.isFinite(id) ? await graveOfLogin(login, id) : null

  if ((action === 'rm' || action === 'rmok') && !grave) {
    answer = 'Могила не найдена. Обнови список'
  } else if (action === 'rm' && grave) {
    await editMessage(
      chat,
      messageId,
      `🗑 <b>Попросить убрать ${code(grave.slug)}?</b>\n\nПередам запрос владельцу сайта. Он рассмотрит его вручную и ответит сюда.`,
      {
        inline_keyboard: [
          [{ text: '✅ Отправить запрос', callback_data: `u:rmok:${grave.id}` }],
          [{ text: '← Отмена', callback_data: 'u:back' }],
        ],
      },
    )
  } else if (action === 'rmok' && grave && login) {
    if (await hasOpenReport(chat, grave.slug)) {
      answer = 'Запрос по этой могиле уже отправлен'
    } else if ((await countReportsSince(chat, new Date(Date.now() - 24 * 3_600_000))) >= DAILY_LIMIT) {
      answer = 'На сегодня хватит запросов, попробуй завтра'
    } else {
      const reportId = await createBotReport({
        slug: grave.slug,
        // Ник в боте никто не проверяет, поэтому владельцу сайта явно видно, совпадает ли он с владельцем репозитория.
        reason: `Запрос из бота убрать могилу. GitHub, указанный в боте: ${login} (${
          grave.repo_owner.toLowerCase() === login.toLowerCase() ? 'совпадает с владельцем репозитория' : `не владелец репозитория (${grave.repo_owner}), а похоронил могилу`
        }).`,
        contact: contactOf(chat, query.username),
        chat,
        ipHash: ipHash(`tg:${chat}`),
      })
      await editMessage(chat, messageId, `📨 <b>Запрос #${reportId} отправлен</b>\n${code(grave.slug)}\n\nНапишу сюда, когда рассмотрю.`)
      await announce(reportId)
    }
  } else if (action === 'back') {
    await showGravesInPlace(chat, messageId, login)
  }
  await answerCallback(query.id, answer)
}

/** «Отмена»: возвращает на месте список могил. */
async function showGravesInPlace(chat: number, messageId: number, login: string | null) {
  if (!login) return
  const graves = await gravesOfLogin(login)
  const { site } = botEnv()
  const lines = graves.map((g) => `▸ <a href="${site}/r/${g.repo_owner}/${g.repo_name}">${esc(g.repo_name)}</a>`)
  const buttons: InlineButton[][] = graves.slice(0, 10).map((g) => [{ text: `🗑 Убрать: ${g.repo_name}`.slice(0, 40), callback_data: `u:rm:${g.id}` }])
  await editMessage(chat, messageId, `🪦 <b>Могилы ${code(login)}</b> · ${graves.length}\n\n${lines.join('\n')}`, { inline_keyboard: buttons })
}

// ── Ответы человеку ─────────────────────────────────────────────────────────

/** Пишет человеку по обращению. false, если он не привязал Telegram или закрыл бота: владельцу об этом скажут. */
export async function tellReporter(report: ReportRow, html: string) {
  if (!report.tg_chat_id) return false
  try {
    await sendMessage(report.tg_chat_id, html, USER_MENU)
    return true
  } catch (error) {
    console.error('Не удалось написать человеку по обращению', report.id, error)
    return false
  }
}

export const verdictText = {
  done: (r: ReportRow) => `✅ <b>Обращение #${r.id} рассмотрено</b>\n${code(r.slug)}\n\nСпасибо, что написал.`,
  removed: (r: ReportRow) => `🗑 <b>Могила убрана</b>\n${code(r.slug)}\n\nОбращение #${r.id} закрыто. Спасибо, что написал.`,
  rejected: (r: ReportRow) =>
    `🚫 <b>Обращение #${r.id} отклонено</b>\n${code(r.slug)}\n\nЕсли это ошибка, отправь обращение ещё раз и опиши подробнее.`,
  reply: (r: ReportRow, text: string) => `💬 <b>Ответ по обращению #${r.id}</b>\n${code(r.slug)}\n\n<blockquote>${esc(text)}</blockquote>`,
}
