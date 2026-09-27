/**
 * Окно в памяти процесса. На Vercel процессов несколько, поэтому это заслон от грубого
 * спама, а не точный лимит. Точный лимит похорон — в базе (bury_log).
 */
const hits = new Map<string, number[]>()

export function allow(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs)
  const allowed = recent.length < limit
  if (allowed) recent.push(now)
  // Не даём карте расти бесконечно: лишний сброс только обнулит окна.
  if (hits.size > 10_000) hits.clear()
  hits.set(key, recent)
  return allowed
}
