const DAY = 86_400_000

export function plural(n: number, forms: [one: string, few: string, many: string]) {
  const n10 = n % 10
  const n100 = n % 100
  if (n10 === 1 && n100 !== 11) return forms[0]
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1]
  return forms[2]
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function daysBetween(from: string, to: string) {
  return Math.max(0, Math.floor((Date.parse(to) - Date.parse(from)) / DAY))
}

/** Меньше дня, 25 дней, 8 месяцев, 3 года. */
export function lifetime(days: number) {
  if (days < 1) return 'меньше дня'
  if (days < 60) return `${days} ${plural(days, ['день', 'дня', 'дней'])}`
  const months = Math.floor(days / 30.44)
  if (months < 24) return `${months} ${plural(months, ['месяц', 'месяца', 'месяцев'])}`
  const years = Math.floor(days / 365.25)
  return `${years} ${plural(years, ['год', 'года', 'лет'])}`
}

export function commitsLabel(n: number) {
  return `${n} ${plural(n, ['коммит', 'коммита', 'коммитов'])}`
}

export function plotNumber(id: number | null) {
  return id === null ? '----' : String(id).padStart(4, '0')
}
