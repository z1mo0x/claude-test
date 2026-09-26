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

export function slugOf(owner: string, name: string) {
  return `${owner}/${name}`.toLowerCase()
}

export function gravePath(owner: string, name: string) {
  return `/r/${owner}/${name}`
}
