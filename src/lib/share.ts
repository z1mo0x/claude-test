import { dictionary, type Lang } from '@/i18n'
import { daysBetween } from './format'

/** Соцсети в попапе «Поделиться». Набор и порядок для каждого языка — в словаре. */
export type Network = 'telegram' | 'x' | 'vk' | 'reddit' | 'linkedin' | 'threads' | 'bluesky'

/** Готовый текст поста, без ссылки: ссылку каждая соцсеть добавляет сама. */
export function postText(grave: { name: string; bornAt: string; diedAt: string | null }, lang: Lang) {
  const t = dictionary(lang)
  const lived = grave.diedAt ? t.format.lifetime(daysBetween(grave.bornAt, grave.diedAt)) : null
  return t.share.post(grave.name, lived)
}
