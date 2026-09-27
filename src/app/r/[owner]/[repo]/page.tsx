import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { certificateFromGrave } from '@/certificate/data'
import { GraveView } from '@/components/grave-view'
import { causeLabel } from '@/lib/causes'
import { gravePath, slugOf } from '@/lib/repo-link'
import { postText } from '@/lib/share'
import { siteUrl } from '@/lib/site-url'
import { findGrave } from '@/lib/store'

type Props = {
  params: Promise<{ owner: string; repo: string }>
  searchParams: Promise<{ buried?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { owner, repo } = await params
  const grave = await findGrave(slugOf(owner, repo))
  if (!grave) return { title: 'Могила не найдена' }

  const href = gravePath(grave.owner, grave.name)
  const title = `${grave.name} — свидетельство о смерти`
  const description = `«${grave.epitaph}» Причина смерти: ${causeLabel(grave.cause).toLowerCase()}.`
  const image = {
    url: `${href}/certificate.png`,
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
  const { buried } = await searchParams
  const grave = await findGrave(slugOf(owner, repo))
  if (!grave) notFound()

  const base = await siteUrl()
  const href = gravePath(grave.owner, grave.name)

  return (
    <GraveView
      data={certificateFromGrave(grave, new URL(base).host)}
      variant={grave.variant}
      href={href}
      url={`${base}${href}`}
      imagePath={`${href}/certificate.png`}
      post={postText(grave)}
      fresh={buried === '1'}
    />
  )
}
