import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { certificateFromGrave } from '@/certificate/data'
import { GraveView } from '@/components/grave-view'
import { dictionary, languageAlternates, localePath, toLang } from '@/i18n'
import { gravePath, slugOf } from '@/lib/repo-link'
import { postText } from '@/lib/share'
import { siteUrl } from '@/lib/site-url'
import { findGrave } from '@/lib/store'

type Props = {
  params: Promise<{ lang: string; owner: string; repo: string }>
  searchParams: Promise<{ buried?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang: code, owner, repo } = await params
  const lang = toLang(code)
  const t = dictionary(lang)
  const grave = await findGrave(slugOf(owner, repo))
  if (!grave) return { title: t.meta.graveMissing }

  const path = gravePath(grave.owner, grave.name)
  const href = localePath(lang, path)
  const data = certificateFromGrave(grave, '', lang)
  const title = t.meta.graveTitle(grave.name)
  const description = t.meta.graveDescription(grave.epitaph, data.cause)
  const image = {
    url: `${href}/certificate.png`,
    width: 1200,
    height: 630,
    alt: t.meta.graveImageAlt(`${grave.owner}/${grave.name}`),
  }

  return {
    title,
    description,
    alternates: { canonical: href, languages: languageAlternates(path) },
    openGraph: { title, description, url: href, type: 'article', siteName: 'Projectyard', locale: t.ogLocale, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default async function GravePage({ params, searchParams }: Props) {
  const { lang: code, owner, repo } = await params
  const lang = toLang(code)
  const { buried } = await searchParams
  const grave = await findGrave(slugOf(owner, repo))
  if (!grave) notFound()

  const base = await siteUrl()
  const href = localePath(lang, gravePath(grave.owner, grave.name))
  const badgePath = `/badge/${grave.owner}/${grave.name}.svg?lang=${lang}`
  // Метка utm_source: в Vercel Analytics видно, сколько людей пришло с README.
  const badgeMarkdown = `[![${dictionary(lang).badge.alt}](${base}${badgePath})](${base}${href}?utm_source=badge)`

  return (
    <GraveView
      data={certificateFromGrave(grave, new URL(base).host, lang)}
      variant={grave.variant}
      href={href}
      url={`${base}${href}`}
      imagePath={`${href}/certificate.png`}
      post={postText(grave, lang)}
      badge={{ src: badgePath, markdown: badgeMarkdown }}
      fresh={buried === '1'}
    />
  )
}
