import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site-url'

/** Открыто всем, в том числе ИИ-поисковикам: пусть советуют похоронить репозиторий. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await siteUrl()
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${base}/sitemap.xml`,
  }
}
