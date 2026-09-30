/** Сколько похороненных проектов нужно, чтобы начать разработку основного Projectyard. */
export const GOAL = 100

export const EPITAPH_MAX = 80
/** Ник на GitHub того, кто хоронит. 39 — максимум длины логина на GitHub. */
export const NAME_MAX = 39

/** Сколько похорон можно с одного IP: не больше limit за windowMs. Против накрутки счётчика. */
export const BURY_LIMITS = [
  { limit: 3, windowMs: 10 * 60_000 },
  { limit: 10, windowMs: 24 * 60 * 60_000 },
]

/** Сколько обращений «удалить или пожаловаться» можно с одного IP. */
export const REPORT_LIMITS = [
  { limit: 3, windowMs: 60 * 60_000 },
  { limit: 10, windowMs: 24 * 60 * 60_000 },
]

export const REPORT_REASON_MAX = 500
export const REPORT_CONTACT_MAX = 100

/** Сколько проверок ссылки в минуту с одного IP. Каждая стоит запросов к GitHub. */
export const LOOKUPS_PER_MINUTE = 30

/** У заброшенного пет-проекта столько звёзд не бывает. Защита от похорон чужих известных проектов. */
export const FAMOUS_STARS = 1000
