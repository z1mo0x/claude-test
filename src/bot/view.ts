import 'server-only'
import { editMessage, sendMessage, tg, type InlineButton, type Markup } from './telegram'

/**
 * Экран бота: текст и кнопки. Переходы между экранами (список, карточка, назад) правят одно и то же
 * сообщение, а не шлют новое на каждое нажатие: чат не забивается.
 */
export type View = { html: string; markup?: Markup }

/** Строка кнопок «назад». to — callback_data экрана, на который вернуться. */
export const back = (to: string, text = '← Назад'): InlineButton[] => [{ text, callback_data: to }]

/**
 * Показывает экран. Если известно сообщение (нажали кнопку), правит его на месте, иначе (команда,
 * ссылка, старое сообщение, которое Telegram уже не даёт править) присылает новое.
 */
export async function present(chat: number, messageId: number | undefined, view: View) {
  if (messageId) {
    try {
      await editMessage(chat, messageId, view.html, view.markup)
      return
    } catch (error) {
      // Тот же текст и кнопки: Telegram отвечает ошибкой, но менять нечего.
      if (/message is not modified/i.test(String(error))) return
      console.error('Не удалось поправить сообщение, присылаю новое', error)
    }
  }
  await sendMessage(chat, view.html, view.markup)
}

/**
 * Убирает у человека постоянную клавиатуру внизу чата, если она осталась от прошлой версии бота:
 * каждое её нажатие добавляло в чат ещё и сообщение самого человека.
 */
export async function clearKeyboard(chat: number) {
  try {
    const { message_id } = await sendMessage(chat, '🪦', { remove_keyboard: true })
    await tg('deleteMessage', { chat_id: chat, message_id })
  } catch (error) {
    console.error('Не удалось убрать клавиатуру', error)
  }
}
