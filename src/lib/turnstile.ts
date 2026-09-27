import 'server-only'

const VERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/** Проверка Cloudflare Turnstile включена, только если задан секретный ключ. */
export function botCheckEnabled() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY)
}

/**
 * Токен из виджета в форме подтверждает, что похороны пришли из настоящего браузера.
 * Если Cloudflare не ответил, пропускаем: его сбой не должен закрывать кладбище,
 * а от накрутки всё равно защищает лимит по IP.
 */
export async function verifyHuman(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false

  try {
    const response = await fetch(VERIFY, {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5000),
    })
    const result = (await response.json()) as { success?: boolean; 'error-codes'?: string[] }
    if (!result.success) console.warn('Turnstile отклонил токен', result['error-codes'])
    return result.success === true
  } catch (error) {
    console.error('Turnstile не ответил, пропускаю проверку', error)
    return true
  }
}
