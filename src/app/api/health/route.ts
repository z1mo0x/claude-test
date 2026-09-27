import { connection } from 'next/server'
import { getStore } from '@/lib/store'

/**
 * Проверка подключения к базе: открыть /api/health на нужном деплое.
 * Секретов не отдаёт, только видит ли деплой ключи и что ответила база.
 */
export async function GET() {
  await connection()
  const store = getStore()
  if (!store) {
    return Response.json({
      database: 'off',
      hint: 'Этот деплой не видит SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY. Проверь, для какого окружения они заданы, и сделай Redeploy.',
    })
  }
  try {
    await store.check()
    return Response.json({ database: 'ok', graves: await store.count() })
  } catch (error) {
    const { code, message } = (error ?? {}) as { code?: string; message?: string }
    return Response.json({ database: 'error', code: code ?? null, message: message ?? String(error) }, { status: 503 })
  }
}
