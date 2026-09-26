import { daysBetween, lifetime } from './format'

/** Готовый текст поста, без ссылки: ссылку каждая соцсеть добавляет сама. */
export function postText(grave: { name: string; bornAt: string; diedAt: string | null }) {
  const days = grave.diedAt ? daysBetween(grave.bornAt, grave.diedAt) : null
  const lived = days === null ? '' : `${lifetime(days)} разработки. `
  const intro = lived.charAt(0).toUpperCase() + lived.slice(1)
  return `${intro}Сегодня ${grave.name} официально похоронен.\nRIP ${grave.name} ⚰️`
}
