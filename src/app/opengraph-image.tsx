import { ImageResponse } from 'next/og'
import { certificateFonts } from '@/certificate/fonts'
import { imageDataUri } from '@/certificate/server-assets'
import { typeface } from '@/certificate/typography'

export const alt = 'Projectyard — проводи репозиторий в последний путь'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const [fonts, banner, logo] = await Promise.all([certificateFonts(), imageDataUri('banner.png'), imageDataUri('logo.png')])

  return new ImageResponse(
    <div style={{ position: 'relative', display: 'flex', width: 1200, height: 630, backgroundColor: '#030708', color: '#d4d8cf' }}>
      {/* Луна, ворон и надгробие REST IN CODE справа, как на главной основного Projectyard. */}
      <img src={banner} alt="" width={1890} height={630} style={{ position: 'absolute', left: -560, top: 0, width: 1890, height: 630 }} />
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          left: 0,
          top: 0,
          width: 1200,
          height: 630,
          backgroundImage: 'linear-gradient(90deg, #030708 0%, rgba(3,7,8,0.9) 40%, rgba(3,7,8,0) 75%)',
        }}
      />
      <div style={{ position: 'absolute', left: 80, top: 0, height: 630, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="" width={44} height={52} />
          <div style={{ display: 'flex', marginLeft: 16, fontFamily: typeface.mono, fontWeight: 700, fontSize: 26, color: '#78b85a' }}>
            projectyard&gt; bury --repo_
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 28,
            fontFamily: typeface.serif,
            fontWeight: 700,
            fontSize: 68,
            lineHeight: 1,
            textTransform: 'uppercase',
            color: '#ece9df',
          }}
        >
          <div style={{ display: 'flex' }}>Проводи</div>
          <div style={{ display: 'flex' }}>репозиторий</div>
          <div style={{ display: 'flex', color: '#a6d47a' }}>в последний путь</div>
        </div>
        <div style={{ display: 'flex', marginTop: 28, fontFamily: typeface.sans, fontWeight: 500, fontSize: 26, color: '#8a928c' }}>
          Свидетельство о смерти для заброшенного проекта
        </div>
      </div>
    </div>,
    { ...size, fonts },
  )
}
