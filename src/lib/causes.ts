/** В базе хранится id причины, подписи на каждом языке — в словарях (src/i18n). */
export const causeIds = [
  'burnout',
  'study',
  'job',
  'interest',
  'scope',
  'money',
  'debt',
  'better',
  'time',
  'experiment',
  'other',
] as const

export type CauseId = (typeof causeIds)[number]

export function isCause(id: string): id is CauseId {
  return (causeIds as readonly string[]).includes(id)
}
