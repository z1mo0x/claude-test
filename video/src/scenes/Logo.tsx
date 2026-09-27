import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { image } from '../copy'
import { Reveal } from '../parts/Reveal'
import { Caret, typed } from '../parts/Typewriter'
import { color, font, glow } from '../theme'

export function Logo() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 120 } })
  const bloom = interpolate(frame, [0, 12, 40], [0, 1, 0.45], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 44 }}>
        <div style={{ position: 'relative', width: 150, height: 178 }}>
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
          <Img
            src={image('logo.png')}
            style={{ position: 'relative', width: 150, height: 178, transform: `scale(${0.5 + pop * 0.5})`, opacity: Math.min(1, pop * 1.5) }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 88, color: color.moss, textShadow: glow, whiteSpace: 'pre' }}>
            {typed('projectyard>', frame, 12, 1.2)}
            <Caret color={color.moss} />
          </div>
          <Reveal
            words={['Кладбище', 'для', 'незаконченных', 'проектов']}
            start={36}
            stagger={2}
            style={{ fontFamily: font.sans, fontWeight: 500, fontSize: 38, color: color.muted }}
          />
        </div>
      </div>
    </AbsoluteFill>
  )
}
