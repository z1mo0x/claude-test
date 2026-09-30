import 'server-only'
import { botEnv } from './env'

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

const LIMIT = 4000

/** Режет длинный текст по абзацам: в одном сообщении Telegram принимает до 4096 символов. */
export function splitText(text: string) {
  const parts: string[] = []
  let current = ''
  for (const paragraph of text.split('\n\n')) {
    if (current && current.length + paragraph.length + 2 > LIMIT) {
      parts.push(current)
      current = ''
    }
    current = current ? `${current}\n\n${paragraph}` : paragraph
    while (current.length > LIMIT) {
      parts.push(current.slice(0, LIMIT))
      current = current.slice(LIMIT)
    }
  }
  if (current) parts.push(current)
  return parts
}

export async function sendMessage(chatId: string | number, text: string, markup?: Markup) {
  const parts = splitText(text)
  let last: { message_id: number } | undefined
  for (const [index, part] of parts.entries()) {
    last = await tg<{ message_id: number }>('sendMessage', {
      chat_id: chatId,
      text: part,
      link_preview_options: { is_disabled: true },
      // Кнопки только под последней частью.
      ...(markup && index === parts.length - 1 ? { reply_markup: markup } : {}),
    })
  }
  return last
}

/** Подпись к фото не длиннее 1024 символов: длинный текст уходит следующим сообщением. */
export async function sendPhoto(chatId: string | number, photo: string, caption: string) {
  if (caption.length <= 1000) {
    return tg<{ message_id: number }>('sendPhoto', { chat_id: chatId, photo, caption })
  }
  const message = await tg<{ message_id: number }>('sendPhoto', { chat_id: chatId, photo })
  await sendMessage(chatId, caption)
  return message
}

export async function editMessage(chatId: string | number, messageId: number, text: string, markup?: Markup) {
  await tg('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    link_preview_options: { is_disabled: true },
    ...(markup ? { reply_markup: markup } : {}),
  })
}

export const answerCallback = (id: string, text?: string) =>
  tg('answerCallbackQuery', { callback_query_id: id, ...(text ? { text } : {}) })

/** Личное сообщение владельцу. Не бросает: уведомление не должно ломать то, из чего его отправили. */
export async function notifyOwner(text: string, markup?: Markup) {
  const { token, ownerId } = botEnv()
  if (!token || !ownerId) return
  try {
    await sendMessage(ownerId, text, markup)
  } catch (error) {
    console.error('Не удалось написать владельцу в Telegram', error)
  }
}
