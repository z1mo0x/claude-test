/**
 * Оформление сообщений бота: Telegram принимает небольшой набор HTML-тегов
 * (b, i, code, pre, blockquote, a). Всё, что пришло извне (тексты обращений, названия
 * репозиториев), нужно пропускать через esc, иначе «<» в чужом тексте сломает сообщение.
 */
export const esc = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const b = (text: string) => `<b>${esc(text)}</b>`
export const i = (text: string) => `<i>${esc(text)}</i>`
export const code = (text: string) => `<code>${esc(text)}</code>`

/** Шкала прогресса из 10 делений: ▰▰▰▱▱▱▱▱▱▱ */
export function bar(value: number, total: number, cells = 10) {
  const filled = total > 0 ? Math.min(cells, Math.max(0, Math.round((value / total) * cells))) : 0
  return '▰'.repeat(filled) + '▱'.repeat(cells - filled)
}

/** Текст без тегов: запасной вариант, если Telegram не разобрал разметку. */
export function strip(html: string) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** Текст поста для канала: **жирный** превращается в <b>, остальное экранируется. */
export function postToHtml(text: string) {
  return esc(text).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
}

/** Заголовок раздела в тексте: строка целиком из заглавных букв («ПИСЬМО АДМИНУ», «ФИНАЛ СТАТЬИ»). */
const HEADING = /^[А-ЯЁA-Z0-9][А-ЯЁA-Z0-9 ,.:;«»()\-—/№]{2,60}$/

/**
 * Готовый текст поста для публикации вручную. Разделы с заголовками превращаются в жирный
 * заголовок и блок кода: по нажатию на блок Telegram копирует весь текст разом.
 */
export function postBlocks(text: string, plain = false) {
  if (plain) return [esc(text)]
  const blocks: string[] = []
  let body: string[] = []
  const flush = () => {
    if (body.length) blocks.push(`<pre>${esc(body.join('\n\n'))}</pre>`)
    body = []
  }
  for (const paragraph of text.split('\n\n')) {
    if (HEADING.test(paragraph.trim())) {
      flush()
      blocks.push(`▸ <b>${esc(paragraph.trim())}</b>`)
    } else {
      body.push(paragraph)
    }
  }
  flush()
  return blocks
}

const LIMIT = 3800

/** Складывает блоки в сообщения не длиннее лимита Telegram, не разрывая теги внутри блока. */
export function pack(head: string, blocks: string[]) {
  const messages: string[] = []
  let current = head
  for (const block of blocks) {
    if (current && current.length + block.length + 2 > LIMIT) {
      messages.push(current)
      current = ''
    }
    current = current ? `${current}\n\n${block}` : block
  }
  if (current) messages.push(current)
  return messages
}
