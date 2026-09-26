import { ImageResponse } from 'next/og'
import { certificateFonts } from '@/certificate/fonts'
import { Mark } from '@/certificate/mark'
import { typeface } from '@/certificate/typography'

export const alt = 'Projectyard — проводи репозиторий в последний путь'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: 1200,
        height: 630,
        padding: '0 96px',
        backgroundColor: '#030708',
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(120,184,90,0.14), rgba(3,7,8,0) 45%)',
        color: '#d4d8cf',
      }}
    >
      <Mark size={170} />
      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 72 }}>
        <div style={{ display: 'flex', fontFamily: typeface.mono, fontWeight: 700, fontSize: 24, color: '#78b85a' }}>
          projectyard&gt; bury --repo_
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 20,
            fontFamily: typeface.serif,
            fontWeight: 700,
            fontSize: 72,
            lineHeight: 1,
            textTransform: 'uppercase',
            color: '#ece9df',
          }}
        >
          <div style={{ display: 'flex' }}>Проводи репозиторий</div>
          <div style={{ display: 'flex', color: '#a6d47a' }}>в последний путь</div>
        </div>
        <div style={{ display: 'flex', marginTop: 28, fontFamily: typeface.sans, fontWeight: 500, fontSize: 26, color: '#8a928c' }}>
          Свидетельство о смерти для заброшенного проекта
        </div>
      </div>
    </div>,
    { ...size, fonts: await certificateFonts() },
  )
}
