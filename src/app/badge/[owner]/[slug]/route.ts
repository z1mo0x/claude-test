import type { NextRequest } from 'next/server'
import { dictionary, toLang } from '@/i18n'
import { daysBetween } from '@/lib/format'
import { slugOf } from '@/lib/repo-link'
import { findGrave } from '@/lib/store'

type Params = { params: Promise<{ owner: string; slug: string }> }

const HEIGHT = 20
const PAD = 8
const ICON = 14
const FONT = 11
/** Ширина буквы при размере 11: подпись растягивается на эту ширину через textLength, шрифт зрителя не важен. */
const CHAR = 6.7

const escapeXml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!)

/** Плашка «projectyard | прожил 11 месяцев» в духе shields.io: положить в README репозитория. */
function badge(label: string, text: string) {
  const labelWidth = Math.round(label.length * CHAR)
  const textWidth = Math.round(text.length * CHAR)
  const left = PAD + ICON + 5 + labelWidth + PAD
  const right = PAD + textWidth + PAD
  const width = left + right
  const y = 14
  const title = escapeXml(`${label}: ${text}`)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${HEIGHT}" viewBox="0 0 ${width} ${HEIGHT}" role="img" aria-label="${title}">
<title>${title}</title>
<clipPath id="r"><rect width="${width}" height="${HEIGHT}" rx="4"/></clipPath>
<g clip-path="url(#r)"><rect width="${left}" height="${HEIGHT}" fill="#0a1112"/><rect x="${left}" width="${right}" height="${HEIGHT}" fill="#78b85a"/></g>
<path transform="translate(${PAD} 3)" d="M2 14V6a5 5 0 0 1 10 0v8zM7 5v6M5 7.5h4" fill="#141c1a" stroke="#a6d47a" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<g font-family="Verdana,DejaVu Sans,Geneva,sans-serif" font-size="${FONT}" font-weight="700">
<text x="${PAD + ICON + 5}" y="${y}" fill="#d4d8cf" textLength="${labelWidth}" lengthAdjust="spacingAndGlyphs">${escapeXml(label)}</text>
<text x="${left + PAD}" y="${y}" fill="#07120a" textLength="${textWidth}" lengthAdjust="spacingAndGlyphs">${escapeXml(text)}</text>
</g>
</svg>
`
}

/**
 * GET /badge/owner/name.svg?lang=en|ru. Бейдж только для настоящих могил: по чужому
 * репозиторию, который не хоронили, его не получить.
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { owner, slug } = await params
  const repo = slug.replace(/\.svg$/i, '')
  const grave = await findGrave(slugOf(owner, repo))
  if (!grave) return new Response('Not found', { status: 404 })

  const t = dictionary(toLang(request.nextUrl.searchParams.get('lang')))
  const lived = grave.diedAt ? t.format.lifetime(daysBetween(grave.bornAt, grave.diedAt)) : null

  return new Response(badge(t.badge.label, t.badge.text(lived)), {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // README на GitHub подтягивает картинку через свой прокси, который и так кеширует; сутки нам хватит.
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
