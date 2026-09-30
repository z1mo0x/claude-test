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
import { answerCallback, sendMessage, type InlineButton, type Markup } from './telegram'
import { back, clearKeyboard, present, type View } from './view'

export type UserMessage = { chat: number; text: string }
export type UserCallback = { id: string; chat: number; messageId: number; data: string; username?: string }

// Тексты постоянной клавиатуры прошлой версии бота: у кого она осталась, нажатия ещё понимаем.
const OLD_GRAVES = '🪦 Мои могилы'
const OLD_REPORTS = '📨 Мои обращения'
const OLD_LOGIN = '🔗 Сменить GitHub'

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

/**
 * Ник владельца сайта привязывается только к его чату: иначе любой мог бы выдать себя за него и
 * слать запросы на удаление его могил. Ник в остальном никто не проверяет.
 */
const isOwnersLogin = (chat: number, login: string) => {
  const { ownerLogin, ownerId } = botEnv()
  return Boolean(ownerLogin) && ownerLogin.toLowerCase() === login.toLowerCase() && String(chat) !== ownerId
}

const reservedView = (login: string): View => ({
  html: `🔒 Ник ${code(login)} закреплён за владельцем сайта, привязать его нельзя. Если это твой ник, напиши владельцу через форму «Удалить или пожаловаться» на сайте.`,
  markup: { inline_keyboard: [back('u:home', '← В меню')] },
})

const HOME = 'u:home'
const toReports: Markup = { inline_keyboard: [[{ text: '📨 Мои обращения', callback_data: 'u:reports' }]] }

// ── Экраны ──────────────────────────────────────────────────────────────────

async function homeView(chat: number): Promise<View> {
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
  return {
    html: lines.join('\n'),
    markup: {
      inline_keyboard: [
        [
          { text: '🪦 Мои могилы', callback_data: 'u:graves' },
          { text: '📨 Мои обращения', callback_data: 'u:reports' },
        ],
        [{ text: login ? '🔗 Сменить GitHub' : '🔗 Указать GitHub', callback_data: 'u:login' }],
      ],
    },
  }
}

const loginView = (): View => ({
  html: '🔗 <b>Пришли свой ник на GitHub</b>\n<i>Например: torvalds. Покажу твои могилы и помогу убрать лишнюю.</i>',
  markup: { inline_keyboard: [back(HOME)] },
})

function graveButtons(graves: { id: number; repo_name: string }[]): InlineButton[][] {
  const rows = graves.slice(0, 10).map((g): InlineButton[] => [{ text: `🗑 Убрать: ${g.repo_name}`.slice(0, 40), callback_data: `u:rm:${g.id}` }])
  return [...rows, back(HOME)]
}

async function gravesView(chat: number, intro = ''): Promise<View> {
  const login = await linkedLogin(chat)
  if (!login) {
    return {
      html: '🔗 <b>Сначала пришли свой ник на GitHub</b>\n<i>Например: torvalds</i>',
      markup: { inline_keyboard: [back(HOME)] },
    }
  }
  // Ник мог быть привязан раньше, чем стал закреплённым за владельцем: показывать его могилы уже нельзя.
  if (isOwnersLogin(chat, login)) return reservedView(login)
  const graves = await gravesOfLogin(login)
  if (!graves.length) {
    return {
      html: `${intro}🪦 У ${code(login)} пока нет могил. Похорони проект на ${esc(botEnv().site)}.`,
      markup: { inline_keyboard: [back(HOME)] },
    }
  }
  const { site } = botEnv()
  const lines = graves.map((g) => {
    const lived = g.died_at ? ` — прожил ${esc(lifetime(daysBetween(g.born_at, g.died_at)))}` : ''
    return `▸ <a href="${site}/r/${g.repo_owner}/${g.repo_name}">${esc(g.repo_name)}</a>${lived}`
  })
  return {
    html: `${intro}🪦 <b>Могилы ${code(login)}</b> · ${graves.length}\n\n${lines.join('\n')}`,
    markup: { inline_keyboard: graveButtons(graves) },
  }
}

async function reportsView(chat: number): Promise<View> {
  const reports = await reportsOfChat(chat)
  if (!reports.length) {
    return {
      html: '📨 <b>Обращений пока нет</b>\n<i>Убрать могилу можно кнопкой в «Мои могилы». Обращение с сайта попадёт сюда, если после отправки нажать «Получить ответ в Telegram».</i>',
      markup: { inline_keyboard: [back(HOME)] },
    }
  }
  const lines = reports.map((r) => `${STATUS[r.status].icon} <b>#${r.id}</b> ${code(r.slug)}\n${i(STATUS[r.status].label)}`)
  return { html: `📨 <b>Мои обращения</b>\n\n${lines.join('\n\n')}`, markup: { inline_keyboard: [back(HOME)] } }
}

// ── Сообщения ───────────────────────────────────────────────────────────────

export async function handleUserMessage({ chat, text }: UserMessage) {
  const start = /^\/start\s+r_([A-Za-z0-9_-]{8,64})$/.exec(text)
  if (start) return bindFromSite(chat, start[1])

  if (text === '/start' || text === '/help') {
    await clearKeyboard(chat)
    return present(chat, undefined, await homeView(chat))
  }
  if (text === '/graves' || text === OLD_GRAVES) return present(chat, undefined, await gravesView(chat))
  if (text === '/reports' || text === OLD_REPORTS) return present(chat, undefined, await reportsView(chat))
  if (text === '/unlink') {
    await unlinkLogin(chat)
    return present(chat, undefined, {
      html: '🔓 Отвязал GitHub. Пришли ник, когда захочешь привязать снова.',
      markup: { inline_keyboard: [back(HOME, '← В меню')] },
    })
  }
  if (text === OLD_LOGIN || text === '/github') return present(chat, undefined, loginView())

  // Ник можно прислать просто текстом или после /github. Другие команды сюда не попадают.
  const given = text.startsWith('/github ') ? text.slice(8).trim() : text.startsWith('/') ? '' : text
  const login = given ? LOGIN.exec(given)?.[1] : undefined
  if (login) return linkFlow(chat, login)
  await present(chat, undefined, await homeView(chat))
}

async function linkFlow(chat: number, login: string) {
  if (isOwnersLogin(chat, login)) return present(chat, undefined, reservedView(login))
  const graves = await gravesOfLogin(login)
  if (!graves.length) {
    return present(chat, undefined, {
      html: `🤷 Не нашёл могил у ${code(login)}. Проверь ник: он должен совпадать с владельцем репозитория или с тем, кого ты указал при захоронении.`,
      markup: { inline_keyboard: [back(HOME, '← В меню')] },
    })
  }
  await linkLogin(chat, login)
  await present(chat, undefined, await gravesView(chat, `✅ GitHub ${code(login)} привязан.\n\n`))
}

/** Человек нажал Start по ссылке со страницы сайта после отправки формы. */
async function bindFromSite(chat: number, token: string) {
  const result = await bindReport(token, chat)
  if (result.status !== 'ok') {
    const html =
      result.status === 'taken' ? '🔒 Эта ссылка уже привязана к другому чату.' : '⌛ Ссылка не подходит: обращения с таким кодом нет. Отправь форму на сайте ещё раз.'
    return present(chat, undefined, { html, markup: { inline_keyboard: [back(HOME, '← В меню')] } })
  }
  const { report } = result
  await present(chat, undefined, {
    html: `📨 <b>Обращение #${report.id} принято</b>\n${code(report.slug)}\n\nНапишу сюда, когда рассмотрю.`,
    markup: toReports,
  })
}

// ── Кнопки ──────────────────────────────────────────────────────────────────

export async function handleUserCallback(query: UserCallback, announce: (id: number) => Promise<void>) {
  const [, action, raw] = query.data.split(':')
  const { chat, messageId } = query
  const show = (view: View) => present(chat, messageId, view)
  const id = Number(raw)
  let answer: string | undefined

  if (action === 'home') await show(await homeView(chat))
  else if (action === 'graves') await show(await gravesView(chat))
  else if (action === 'reports') await show(await reportsView(chat))
  else if (action === 'login') await show(loginView())
  else if (action === 'rm' || action === 'rmok') {
    const login = await linkedLogin(chat)
    const grave = login && Number.isFinite(id) ? await graveOfLogin(login, id) : null
    if (!grave || !login || isOwnersLogin(chat, login)) {
      answer = 'Могила не найдена. Обнови список'
    } else if (action === 'rm') {
      await show({
        html: `🗑 <b>Попросить убрать ${code(grave.slug)}?</b>\n\nПередам запрос владельцу сайта. Он рассмотрит его вручную и ответит сюда.`,
        markup: {
          inline_keyboard: [[{ text: '✅ Отправить запрос', callback_data: `u:rmok:${grave.id}` }], back('u:graves', '← Отмена')],
        },
      })
    } else if (await hasOpenReport(chat, grave.slug)) {
      answer = 'Запрос по этой могиле уже отправлен'
    } else if ((await countReportsSince(chat, new Date(Date.now() - 24 * 3_600_000))) >= DAILY_LIMIT) {
      answer = 'На сегодня хватит запросов, попробуй завтра'
    } else {
      const reportId = await createBotReport({
        slug: grave.slug,
        // Ник в боте никто не проверяет, поэтому владельцу сайта явно видно, совпадает ли он с владельцем репозитория.
        reason: `Запрос из бота убрать могилу. GitHub, указанный в боте: ${login} (${
          grave.repo_owner.toLowerCase() === login.toLowerCase() ? 'ник совпадает с владельцем репозитория' : `ник не совпадает с владельцем репозитория (${grave.repo_owner}), человек его похоронил`
        }). Ник не проверен: перед удалением убедись, что пишет действительно владелец.`,
        contact: contactOf(chat, query.username),
        chat,
        ipHash: ipHash(`tg:${chat}`),
      })
      await show({
        html: `📨 <b>Запрос #${reportId} отправлен</b>\n${code(grave.slug)}\n\nНапишу сюда, когда рассмотрю.`,
        markup: { inline_keyboard: [[{ text: '📨 Мои обращения', callback_data: 'u:reports' }], back('u:graves', '← К могилам')] },
      })
      await announce(reportId)
    }
  }
  await answerCallback(query.id, answer)
}

// ── Ответы человеку ─────────────────────────────────────────────────────────

/** Пишет человеку по обращению. false, если он не привязал Telegram или закрыл бота: владельцу об этом скажут. */
export async function tellReporter(report: ReportRow, html: string) {
  if (!report.tg_chat_id) return false
  try {
    await sendMessage(report.tg_chat_id, html, toReports)
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
