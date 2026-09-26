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

  const path = gravePath(grave.owner, grave.name)
  const title = `${grave.name} — свидетельство о смерти`
  const description = `«${grave.epitaph}» Причина смерти: ${causeLabel(grave.cause).toLowerCase()}.`
  const image = {
    url: `${path}/certificate.png`,
    width: 1200,
    height: 630,
    alt: `Свидетельство о смерти ${grave.owner}/${grave.name}`,
  }

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: 'article', images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default async function GravePage({ params, searchParams }: Props) {
  const { owner, repo } = await params
  const grave = await findGrave(slugOf(owner, repo))
  if (!grave) notFound()

  const base = await siteUrl()
  const path = gravePath(grave.owner, grave.name)
  const { buried } = await searchParams

  return (
    <GraveView
      data={certificateFromGrave(grave, new URL(base).host)}
      variant={grave.variant}
      path={path}
      url={`${base}${path}`}
      post={postText(grave)}
      fresh={buried === '1'}
    />
  )
}
