export const causes = [
  { id: 'burnout', label: 'Выгорание' },
  { id: 'study', label: 'Учёба' },
  { id: 'job', label: 'Основная работа' },
  { id: 'interest', label: 'Пропал интерес' },
  { id: 'scope', label: 'Разросся скоуп' },
  { id: 'money', label: 'Нет денег' },
  { id: 'debt', label: 'Техдолг' },
  { id: 'better', label: 'Нашлась идея получше' },
  { id: 'time', label: 'Нет времени' },
  { id: 'experiment', label: 'Это был эксперимент' },
  { id: 'other', label: 'Другое' },
] as const

export type CauseId = (typeof causes)[number]['id']

export function isCause(id: string): id is CauseId {
  return causes.some((c) => c.id === id)
}

export function causeLabel(id: string) {
  return causes.find((c) => c.id === id)?.label ?? 'Другое'
}

export const epitaphs = [
  'Работал на моей машине.',
  'Ушёл на рефакторинг и не вернулся.',
  'Здесь покоится TODO. Его так и не сделали.',
  'Доделаю на выходных. Не доделал.',
  'Лендинг был готов. Продукт — нет.',
  'Последний деплой прошёл успешно.',
]
