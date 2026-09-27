import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { image } from '../../copy'
import { Reveal } from '../../parts/Reveal'
import { Caret, typed } from '../../parts/Typewriter'
import { color, font, glow } from '../../theme'

export const outro = { cta: 12, type: 20, framesPerChar: 0.8, motto: 46 }

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const motto = { fontFamily: font.serif, fontWeight: 700, fontSize: 76, lineHeight: 1.02, textTransform: 'uppercase' as const, color: color.bone, justifyContent: 'center' }

export function Outro({ site = 'projectyard-bury.vercel.app' }: { site?: string }) {
  const frame = useCurrentFrame()
  const { durationInFrames, fps } = useVideoConfig()
  const zoom = interpolate(frame, [0, durationInFrames], [1.1, 1])
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 120 } })
  const bloom = interpolate(frame, [0, 12, 40], [0, 1, 0.45], clamp)
  const cta = spring({ frame: frame - outro.cta, fps, config: { damping: 15, stiffness: 120 } })
  const address = typed(site, frame, outro.type, outro.framesPerChar)
  const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], clamp)
  // Адрес до 27 знаков встаёт крупно в ширину 800, длиннее — мельче.
  const siteSize = Math.min(50, Math.floor(800 / (site.length * 0.6)))

  return (
    <AbsoluteFill style={{ opacity: fadeOut, overflow: 'hidden', backgroundColor: color.ground }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        {/* Размыто: надписи на надгробии баннера не должны спорить с адресом сайта. */}
        <Img src={image('banner.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '80% 50%', opacity: 0.8, filter: 'blur(6px)' }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(3,7,8,0.35) 0%, rgba(3,7,8,0.8) 30%, rgba(3,7,8,0.92) 60%, #030708 100%)' }} />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 800, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateY(-30px)' }}>
          <div style={{ position: 'relative', width: 140, height: 166 }}>
            <div
              style={{
                position: 'absolute',
                inset: -120,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(120,184,90,0.35), rgba(120,184,90,0) 60%)',
                opacity: bloom,
                transform: `scale(${0.6 + bloom * 0.6})`,
              }}
            />
            <Img src={image('logo.png')} style={{ position: 'relative', width: 140, height: 166, transform: `scale(${0.5 + pop * 0.5})`, opacity: Math.min(1, pop * 1.5) }} />
          </div>

          <div
            style={{
              marginTop: 64,
              display: 'flex',
              alignItems: 'center',
              height: 104,
              padding: '0 44px',
              borderRadius: 18,
              background: color.moss,
              color: '#07120a',
              fontFamily: font.sans,
              fontWeight: 800,
              fontSize: 40,
              boxShadow: '0 0 60px rgba(120,184,90,0.4)',
              opacity: cta,
              transform: `scale(${0.85 + cta * 0.15})`,
            }}
          >
            Похорони свой репозиторий
          </div>

          <div style={{ marginTop: 44, height: siteSize * 1.3, fontFamily: font.mono, fontWeight: 700, fontSize: siteSize, color: color.moss, textShadow: glow, whiteSpace: 'pre' }}>
            {address}
            {frame >= outro.type && <Caret color={color.moss} />}
          </div>

          <div style={{ marginTop: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <Reveal words={['Каждый', 'проект']} start={outro.motto} style={motto} />
            <Reveal words={['заслуживает', { text: 'покоя.', style: { color: color.mossLight } }]} start={outro.motto + 5} style={motto} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
