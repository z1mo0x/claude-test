import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { certificateFromGrave } from '@/certificate/data'
import { GraveView } from '@/components/grave-view'
import { causeLabel } from '@/lib/causes'
import { graveHref, resolveGrave } from '@/lib/grave-token'
import { gravePath } from '@/lib/repo-link'
import { postText } from '@/lib/share'
import { siteUrl } from '@/lib/site-url'

type Props = {
  params: Promise<{ owner: string; repo: string }>
  searchParams: Promise<{ buried?: string; d?: string }>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { owner, repo } = await params
  const { d } = await searchParams
  const grave = await resolveGrave(owner, repo, d)
  if (!grave) return { title: 'Могила не найдена' }

  const href = graveHref(grave, d)
  const title = `${grave.name} — свидетельство о смерти`
  const description = `«${grave.epitaph}» Причина смерти: ${causeLabel(grave.cause).toLowerCase()}.`
  const image = {
    url: `${gravePath(grave.owner, grave.name)}/certificate.png${d ? `?d=${d}` : ''}`,
    width: 1200,
    height: 630,
    alt: `Свидетельство о смерти ${grave.owner}/${grave.name}`,
  }

  return {
    title,
    description,
    alternates: { canonical: href },
    openGraph: { title, description, url: href, type: 'article', images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default async function GravePage({ params, searchParams }: Props) {
  const { owner, repo } = await params
  const { buried, d } = await searchParams
  const grave = await resolveGrave(owner, repo, d)
  if (!grave) notFound()

  const base = await siteUrl()
  const href = graveHref(grave, d)

  return (
    <GraveView
      data={certificateFromGrave(grave, new URL(base).host)}
      variant={grave.variant}
      href={href}
      url={`${base}${href}`}
      imagePath={`${gravePath(grave.owner, grave.name)}/certificate.png`}
      imageQuery={d ? `d=${d}` : ''}
      post={postText(grave)}
      fresh={buried === '1'}
    />
  )
}
