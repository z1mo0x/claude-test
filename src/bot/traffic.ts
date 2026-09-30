import 'server-only'
import { YANDEX_METRIKA_ID } from '@/lib/config'
import { botEnv } from './env'

/** Посещаемость из Reporting API Яндекс.Метрики. Нужен OAuth-токен с правом metrika:read (YANDEX_METRIKA_TOKEN). */
// YANDEX_METRIKA_API_URL нужен только для тестов с подменой Метрики.
const API = process.env.YANDEX_METRIKA_API_URL ?? 'https://api-metrika.yandex.net/stat/v1/data'

export type Totals = { visits: number; users: number; pageviews: number }
export type Traffic =
  | { ok: true; today: Totals; week: Totals; sources: { name: string; visits: number }[] }
  | { ok: false; reason: string }

/** Как в отчёте называется визит без utm_source: прямой заход, поиск, чужие ссылки. */
export const NO_UTM = 'без метки'

type Report = { totals?: unknown; data?: { dimensions: { name: string | null }[]; metrics: number[] }[] }

async function query(token: string, params: Record<string, string>): Promise<Report> {
  const url = `${API}?${new URLSearchParams({ ids: YANDEX_METRIKA_ID, ...params })}`
  const response = await fetch(url, {
    headers: { Authorization: `OAuth ${token}` },
    signal: AbortSignal.timeout(8000),
    // Метрика обновляется с задержкой в минуты: чаще спрашивать нет смысла.
    next: { revalidate: 300 },
  })
  if (response.status === 401 || response.status === 403) throw new Error('Метрика не приняла токен (нужно право metrika:read и доступ к этому счётчику)')
  if (!response.ok) throw new Error(`Метрика ответила ${response.status}`)
  return (await response.json()) as Report
}

/** totals в отчёте без разбивки: массив чисел по порядку metrics (иногда в ещё одном массиве). */
function totalsOf(report: Report): Totals {
  const raw = Array.isArray(report.totals) && Array.isArray(report.totals[0]) ? report.totals[0] : report.totals
  const [visits = 0, users = 0, pageviews = 0] = Array.isArray(raw) ? (raw as number[]) : []
  return { visits, users, pageviews }
}

/** Посетители за сегодня и 7 дней и источники по utm_source. Не бросает: без токена или при сбое возвращает причину. */
export async function trafficStats(): Promise<Traffic> {
  const { metrikaToken } = botEnv()
  if (!YANDEX_METRIKA_ID) return { ok: false, reason: 'счётчик выключен (NEXT_PUBLIC_YANDEX_METRIKA_ID пуст)' }
  if (!metrikaToken) return { ok: false, reason: 'не задан YANDEX_METRIKA_TOKEN' }

  const metrics = 'ym:s:visits,ym:s:users,ym:s:pageviews'
  try {
    const [today, week, sources] = await Promise.all([
      query(metrikaToken, { metrics, date1: 'today', date2: 'today' }),
      query(metrikaToken, { metrics, date1: '6daysAgo', date2: 'today' }),
      query(metrikaToken, { metrics: 'ym:s:visits', dimensions: 'ym:s:UTMSource', date1: '6daysAgo', date2: 'today', sort: '-ym:s:visits', limit: '10' }),
    ])
    return {
      ok: true,
      today: totalsOf(today),
      week: totalsOf(week),
      sources: (sources.data ?? []).map((row) => ({ name: row.dimensions[0]?.name || NO_UTM, visits: row.metrics[0] ?? 0 })),
    }
  } catch (error) {
    console.error('Не удалось получить данные Яндекс.Метрики', error)
    return { ok: false, reason: error instanceof Error ? error.message : String(error) }
  }
}
