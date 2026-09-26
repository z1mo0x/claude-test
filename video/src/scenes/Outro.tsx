import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { image } from '../copy'
import { Reveal } from '../parts/Reveal'
import { Caret, typed } from '../parts/Typewriter'
import { color, font, glow } from '../theme'

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const title = { fontFamily: font.serif, fontWeight: 700, fontSize: 118, lineHeight: 1, textTransform: 'uppercase' as const, color: color.bone }

export function Outro({ site }: { site: string }) {
  const frame = useCurrentFrame()
  const { durationInFrames, fps } = useVideoConfig()
  const zoom = interpolate(frame, [0, durationInFrames], [1.12, 1])
  const counter = spring({ frame: frame - 62, fps, config: { damping: 200 } })
  const cta = spring({ frame: frame - 80, fps, config: { damping: 15, stiffness: 120 } })
  const fadeOut = interpolate(frame, [durationInFrames - 16, durationInFrames], [1, 0], clamp)

  return (
    <AbsoluteFill style={{ opacity: fadeOut, overflow: 'hidden', backgroundColor: color.ground }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <Img src={image('banner.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '82% 50%', opacity: 0.95 }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(90deg, #030708 0%, rgba(3,7,8,0.9) 35%, rgba(3,7,8,0.2) 70%, rgba(3,7,8,0) 100%)' }} />

      <div style={{ position: 'absolute', left: 150, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
        <Reveal words={['Каждый', 'проект']} start={6} style={title} />
        <Reveal words={['заслуживает', { text: 'покоя.', style: { color: color.mossLight } }]} start={12} style={title} />

        <div style={{ marginTop: 34, display: 'flex', alignItems: 'center', gap: 18, opacity: interpolate(frame, [44, 54], [0, 1], clamp) }}>
          <Img src={image('logo.png')} style={{ width: 48, height: 57 }} />
          <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 44, color: color.moss, textShadow: glow, whiteSpace: 'pre' }}>
            {typed('projectyard>', frame, 46, 1.1)}
            <Caret color={color.moss} />
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 760, opacity: counter, transform: `translateY(${(1 - counter) * 16}px)` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: font.mono, fontSize: 24, color: color.ink }}>
            <span>
              <b style={{ color: color.mossLight }}>0</b> / 100 проектов
            </span>
            <span style={{ color: color.muted }}>на сотом — основной сайт</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }} />
        </div>

        <div
          style={{
            marginTop: 20,
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            height: 74,
            padding: '0 34px',
            borderRadius: 14,
            background: color.moss,
            color: '#07120a',
            fontFamily: font.sans,
            fontWeight: 800,
            fontSize: 30,
            boxShadow: '0 0 60px rgba(120,184,90,0.4)',
            opacity: cta,
            transform: `scale(${0.85 + cta * 0.15})`,
          }}
        >
          Похорони свой репозиторий →
        </div>
        {site && (
          <div style={{ fontFamily: font.mono, fontSize: 28, color: color.moss, opacity: cta }}>{site}</div>
        )}
      </div>
    </AbsoluteFill>
  )
}
