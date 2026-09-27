const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/
const NAME = /^[A-Za-z0-9_.-]{1,100}$/

/**
 * Достаёт owner/name из того, что человек вставил в поле:
 * https://github.com/owner/name, github.com/owner/name/tree/main, owner/name.
 */
export function parseRepoLink(input: string): { owner: string; name: string } | null {
  let path = input.trim()
  if (/^[a-z]+:\/\//i.test(path) || /^(www\.)?github\.com\//i.test(path)) {
    const match = path.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/(.+)$/i)
    if (!match) return null
    path = match[1]
  }
  const [owner, rawName] = path.split(/[/?#]/)
  const name = rawName?.replace(/\.git$/, '')
  if (!owner || !name || !OWNER.test(owner) || !NAME.test(name) || name === '.' || name === '..') {
    return null
  }
  return { owner, name }
}

/** Логин на GitHub: латиница, цифры и дефис, до 39 символов. */
export function isLogin(value: string) {
  return OWNER.test(value)
}

/** «@ник», «github.com/ник» и «https://github.com/ник/» превращает в «ник». */
export function normalizeLogin(input: string) {
  return input
    .trim()
    .replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/+$/, '')
}

/** Заготовка в поле ссылки: https://github.com/ или https://github.com/ник/. */
export function linkPrefix(login: string | null) {
  return `https://github.com/${login ? `${login}/` : ''}`
}

/** В поле пока только заготовка, имени репозитория ещё нет. */
export function isLinkPrefix(input: string) {
  return /^(?:https?:\/\/)?(?:www\.)?github\.com\/(?:[A-Za-z0-9-]+\/?)?$/i.test(input.trim())
}

export function slugOf(owner: string, name: string) {
  return `${owner}/${name}`.toLowerCase()
}

export function gravePath(owner: string, name: string) {
  return `/r/${owner}/${name}`
}
