/** Текст из формы: без управляющих символов и лишних пробелов, не длиннее max. */
export function clean(value: unknown, max: number) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/\p{Cc}+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}
