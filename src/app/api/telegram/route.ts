import { timingSafeEqual } from 'node:crypto'
import { handleUpdate, type Update } from '@/bot/handlers'
import { botEnv } from '@/bot/env'
import { notifyOwner } from '@/bot/telegram'

function same(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/**
 * Webhook бота. Telegram присылает сюда каждое сообщение с секретом в заголовке
 * (тот же, что в TELEGRAM_WEBHOOK_SECRET), поэтому посторонние запросы отбрасываются.
 * Всегда отвечаем 200, иначе Telegram повторяет неудачный запрос без конца.
 */
export async function POST(request: Request) {
  const { webhookSecret } = botEnv()
  const given = request.headers.get('x-telegram-bot-api-secret-token') ?? ''
  if (!webhookSecret || !same(given, webhookSecret)) return new Response('forbidden', { status: 403 })

  try {
    await handleUpdate((await request.json()) as Update)
  } catch (error) {
    console.error('Бот не обработал обновление', error)
    await notifyOwner(`⚠️ Ошибка бота: ${error instanceof Error ? error.message : String(error)}`)
  }
  return Response.json({ ok: true })
}
