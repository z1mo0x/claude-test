import { timingSafeEqual } from 'node:crypto'
import { botEnv } from '@/bot/env'
import { recordSnapshot } from '@/bot/metrics'
import { runDue } from '@/bot/publisher'

function same(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/**
 * Запуск по расписанию: GitHub Actions дёргает этот адрес каждые 15 минут (см.
 * .github/workflows/promo-cron.yml) с заголовком Authorization: Bearer <CRON_SECRET>.
 */
export async function POST(request: Request) {
  const { cronSecret } = botEnv()
  const given = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  // Причина в теле ответа: GitHub Actions печатает его в лог, по нему видно, что чинить. Сам секрет не раскрывается.
  if (!cronSecret) return new Response('forbidden: на сайте не задан CRON_SECRET (или нет Redeploy после его добавления)', { status: 403 })
  if (!given) return new Response('forbidden: в запросе нет секрета', { status: 403 })
  if (!same(given, cronSecret)) return new Response('forbidden: секрет в запросе не совпадает с CRON_SECRET на сайте', { status: 403 })

  try {
    const result = await runDue()
    // Число подписчиков для «Метрик»: один раз в сутки, ошибки внутри не бросаются.
    await recordSnapshot()
    return Response.json({ ok: true, ...result })
  } catch (error) {
    console.error('Cron постов упал', error)
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
