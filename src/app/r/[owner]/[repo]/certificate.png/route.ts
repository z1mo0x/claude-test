import type { NextRequest } from 'next/server'
import { certificateFromGrave } from '@/certificate/data'
import { certificateImage } from '@/certificate/image'
import { slugOf } from '@/lib/repo-link'
import { siteUrl } from '@/lib/site-url'
import { findGrave } from '@/lib/store'

export async function GET(request: NextRequest, { params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params
  const grave = await findGrave(slugOf(owner, repo))
  if (!grave) return new Response('Not found', { status: 404 })

  const search = request.nextUrl.searchParams
  const format = search.get('format') === 'story' ? 'story' : 'card'
  const data = certificateFromGrave(grave, new URL(await siteUrl()).host)
  // ?variant= позволяет посмотреть новый вариант на настоящих данных до того, как он появится в форме.
  const variant = search.get('variant') ?? grave.variant
  const download = search.has('download') ? `rip-${grave.owner}-${grave.name}${format === 'story' ? '-story' : ''}.png` : undefined

  return certificateImage(data, format, variant, download)
}
