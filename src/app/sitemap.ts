import type { MetadataRoute } from 'next'
import { gravePath } from '@/lib/repo-link'
import { siteUrl } from '@/lib/site-url'
import { getStore } from '@/lib/store'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await siteUrl()
  const graves = await getStore()
    .list()
    .catch(() => [])
  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    ...graves.map((g) => ({ url: `${base}${gravePath(g.owner, g.name)}`, lastModified: g.createdAt, priority: 0.6 })),
  ]
}
