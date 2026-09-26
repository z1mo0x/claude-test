import type { LookupError } from './github'

export type BuryError = LookupError | 'bad_input' | 'save_failed'

export const errorMessages: Record<BuryError, string> = {
  invalid: 'Это не похоже на ссылку на репозиторий GitHub',
  not_found: 'Репозиторий не найден. Он точно публичный?',
  rate_limited: 'GitHub просит подождать. Попробуй через минуту',
  unavailable: 'GitHub не отвечает. Попробуй ещё раз',
  bad_input: 'Выбери причину смерти и напиши эпитафию',
  save_failed: 'Не получилось сохранить. Попробуй ещё раз',
}
