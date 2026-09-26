import { ImageResponse } from 'next/og'
import { certificateFonts } from './fonts'
import { formatSize, type CertificateData, type CertificateFormat } from './types'
import { getVariant } from './variants'

export async function certificateImage(
  data: CertificateData,
  format: CertificateFormat,
  variantId: string,
  download?: string,
) {
  return new ImageResponse(getVariant(variantId).render(data, format), {
    ...formatSize[format],
    fonts: await certificateFonts(),
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      ...(download ? { 'Content-Disposition': `attachment; filename="${download}"` } : {}),
    },
  })
}
