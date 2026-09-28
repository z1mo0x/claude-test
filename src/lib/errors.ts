/** Коды ошибок. Тексты на каждом языке — в словарях (src/i18n, errors). */
export type LookupError = 'invalid' | 'not_found' | 'rate_limited' | 'unavailable'

export type BuryError = LookupError | 'storage' | 'bad_input' | 'save_failed' | 'too_many' | 'too_famous' | 'bot'
