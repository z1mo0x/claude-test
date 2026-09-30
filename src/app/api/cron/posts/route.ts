import { timingSafeEqual } from 'node:crypto'
import { botEnv } from '@/bot/env'
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
  const given = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!cronSecret || !same(given, cronSecret)) return new Response('forbidden', { status: 403 })

  try {
    return Response.json({ ok: true, ...(await runDue()) })
  } catch (error) {
    console.error('Cron постов упал', error)
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
