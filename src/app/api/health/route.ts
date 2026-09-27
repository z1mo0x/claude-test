import { connection } from 'next/server'
import { getStore } from '@/lib/store'
import { botCheckEnabled } from '@/lib/turnstile'

/**
 * Проверка подключения к базе: открыть /api/health на нужном деплое.
 * Секретов не отдаёт: только текст ошибки, если деплой не видит ключей или база не отвечает.
 */
export async function GET() {
  await connection()
  try {
    const store = getStore()
    await store.check()
    return Response.json({ database: 'ok', graves: await store.count(), botCheck: botCheckEnabled() ? 'on' : 'off' })
  } catch (error) {
    const { code, message } = (error ?? {}) as { code?: string; message?: string }
    return Response.json({ database: 'error', code: code ?? null, message: message ?? String(error) }, { status: 503 })
  }
}
