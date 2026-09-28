import type { MetadataRoute } from 'next'
import { langs, localePath } from '@/i18n'
import { gravePath } from '@/lib/repo-link'
import { siteUrl } from '@/lib/site-url'
import { getStore } from '@/lib/store'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await siteUrl()
  const graves = await getStore()
    .list()
    .catch(() => [])
  const url = (lang: (typeof langs)[number], path: string) => {
    const href = localePath(lang, path)
    return href === '/' ? base : `${base}${href}`
  }
  // Каждая страница на всех языках, со ссылками друг на друга (hreflang).
  const page = (path: string, extra: Omit<MetadataRoute.Sitemap[number], 'url'>) =>
    langs.map((lang) => ({
      url: url(lang, path),
      alternates: { languages: Object.fromEntries(langs.map((other) => [other, url(other, path)])) },
      ...extra,
    }))

  return [
    ...page('/', { changeFrequency: 'daily', priority: 1 }),
    ...graves.flatMap((g) => page(gravePath(g.owner, g.name), { lastModified: g.createdAt, priority: 0.6 })),
  ]
}
