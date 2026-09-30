import 'server-only'
import { botEnv } from './env'
import { strip } from './html'

type Json = Record<string, unknown>

export type InlineButton = { text: string; callback_data?: string; url?: string }
export type Markup =
  | { inline_keyboard: InlineButton[][] }
  | { keyboard: { text: string }[][]; resize_keyboard: true; is_persistent: true }

/** Вызов метода Telegram Bot API. Ошибку бросает с описанием от Telegram. TELEGRAM_API_URL нужен только для тестов с подменой Telegram. */
export async function tg<T = unknown>(method: string, body: Json): Promise<T> {
  const { token } = botEnv()
  if (!token) throw new Error('Не задан TELEGRAM_BOT_TOKEN')
  const response = await fetch(`${process.env.TELEGRAM_API_URL ?? 'https://api.telegram.org'}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  })
  const result = (await response.json()) as { ok: boolean; result?: T; description?: string }
  if (!result.ok) throw new Error(`Telegram ${method}: ${result.description ?? response.status}`)
  return result.result as T
}

/**
 * Отправка с разметкой HTML. Если Telegram не смог разобрать теги, то же сообщение уходит
 * простым текстом: лучше некрасивое сообщение, чем никакого.
 */
async function withHtml<T>(send: (fields: Json) => Promise<T>, field: 'text' | 'caption', html: string) {
  try {
    return await send({ [field]: html, parse_mode: 'HTML' })
  } catch (error) {
    if (!/can't parse entities|unsupported start tag|unexpected end tag/i.test(String(error))) throw error
    console.error('Telegram не разобрал HTML, отправляю простым текстом', error)
    return send({ [field]: strip(html) })
  }
}

/** Одно сообщение. Текст в HTML: всё чужое в нём должно быть пропущено через esc. */
export async function sendMessage(chatId: string | number, html: string, markup?: Markup) {
  return withHtml(
    (fields) =>
      tg<{ message_id: number }>('sendMessage', {
        chat_id: chatId,
        link_preview_options: { is_disabled: true },
        ...fields,
        ...(markup ? { reply_markup: markup } : {}),
      }),
    'text',
    html,
  )
}

/** Несколько сообщений подряд, кнопки только под последним. */
export async function sendMessages(chatId: string | number, messages: string[], markup?: Markup) {
  let last: { message_id: number } | undefined
  for (const [index, html] of messages.entries()) {
    last = await sendMessage(chatId, html, index === messages.length - 1 ? markup : undefined)
  }
  return last
}

/** Подпись к фото не длиннее 1024 символов: длинный текст уходит следующим сообщением. */
export async function sendPhoto(chatId: string | number, photo: string, captionHtml: string) {
  if (captionHtml.length <= 1000) {
    return withHtml((fields) => tg<{ message_id: number }>('sendPhoto', { chat_id: chatId, photo, ...fields }), 'caption', captionHtml)
  }
  const message = await tg<{ message_id: number }>('sendPhoto', { chat_id: chatId, photo })
  await sendMessage(chatId, captionHtml)
  return message
}

export async function editMessage(chatId: string | number, messageId: number, html: string, markup?: Markup) {
  await withHtml(
    (fields) =>
      tg('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        link_preview_options: { is_disabled: true },
        ...fields,
        ...(markup ? { reply_markup: markup } : {}),
      }),
    'text',
    html,
  )
}

let username: string | undefined

/** Ник бота для ссылок t.me/…: спрашивается у Telegram один раз на экземпляр. null, если бот не настроен или Telegram не ответил. */
export async function botUsername() {
  if (username) return username
  if (!botEnv().token) return null
  try {
    username = (await tg<{ username?: string }>('getMe', {})).username
  } catch (error) {
    console.error('Не удалось узнать ник бота', error)
  }
  return username ?? null
}

export const answerCallback =(id: string, text?: string) =>
  tg('answerCallbackQuery', { callback_query_id: id, ...(text ? { text } : {}) })

/** Личное сообщение владельцу (HTML). Не бросает: уведомление не должно ломать то, из чего его отправили. */
export async function notifyOwner(html: string, markup?: Markup) {
  const { token, ownerId } = botEnv()
  if (!token || !ownerId) return
  try {
    await sendMessage(ownerId, html, markup)
  } catch (error) {
    console.error('Не удалось написать владельцу в Telegram', error)
  }
}
