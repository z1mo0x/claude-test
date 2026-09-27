import 'server-only'
import { createHmac } from 'node:crypto'
import { headers } from 'next/headers'

/** IP посетителя. На Vercel x-forwarded-for выставляет сам Vercel, первым идёт адрес клиента. */
export async function clientIp() {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}

/** Сам IP нигде не храним, только HMAC-хеш: без секретного ключа по нему IP не восстановить. */
export function ipHash(ip: string) {
  return createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '')
    .update(ip)
    .digest('hex')
    .slice(0, 32)
}
