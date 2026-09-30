import 'server-only'
import type { Facts } from './stats'

/**
 * Подставляет в текст {count}, {mine_name} и подобные значения, а {url:telegram} превращает
 * в ссылку на сайт с меткой utm_source. Что подставить нечем, остаётся в фигурных скобках,
 * и список таких мест возвращается отдельно.
 */
export function render(template: string, facts: Facts, site: string) {
  const missing = new Set<string>()
  const text = template.replace(/\{([a-z_]+)(?::([a-z0-9_-]+))?\}/g, (whole, key: string, arg?: string) => {
    if (key === 'url') return `${site}/?utm_source=${arg}`
    if (key === 'site') return site
    if (key in facts) return facts[key]
    missing.add(key)
    return whole
  })
  return { text, missing: [...missing] }
}
