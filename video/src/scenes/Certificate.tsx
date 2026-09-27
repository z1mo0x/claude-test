import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { classic } from '@/certificate/variants/classic'
import { assets, sample } from '../copy'
import { Reveal } from '../parts/Reveal'
import { color, font, goldGlow } from '../theme'

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ease = { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) }

const shares = ['Поделиться', 'Telegram', 'ВКонтакте', 'X', 'Скачать PNG']

/** Раскрытие свидетельства, как на сайте, потом телефон со сторис и кнопки «поделиться». */
export function Certificate() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const reveal = spring({ frame: frame - 4, fps, config: { stiffness: 120, damping: 16 } })
  const split = interpolate(frame, [70, 104], [0, 1], ease)
  const phone = spring({ frame: frame - 78, fps, config: { damping: 18, stiffness: 80 } })

  const cardScale = interpolate(reveal, [0, 1], [0.8, 1]) * interpolate(split, [0, 1], [0.86, 0.64])
  const cardX = interpolate(split, [0, 1], [0, -250])
  const floatY = Math.sin(frame / 30) * 6
  const tiltY = Math.sin(frame / 45) * 3 + interpolate(split, [0, 1], [0, 8])

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 2200 }}>
      <div style={{ position: 'absolute', top: 70, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <Reveal words={['Свидетельство', 'о', 'смерти.']} start={10} style={{ fontFamily: font.sans, fontWeight: 800, fontSize: 64, letterSpacing: '-0.03em', color: color.bone }} />
        <div style={{ fontFamily: font.mono, fontSize: 22, color: color.moss, opacity: interpolate(frame, [30, 44], [0, 1], clamp) }}>
          &gt; ссылка сразу с картинкой, PNG для сторис
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          width: 1200,
          height: 630,
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: goldGlow,
          opacity: Math.min(1, reveal * 1.4),
          transform: `translateX(${cardX}px) translateY(${40 + floatY}px) rotateY(${tiltY}deg) rotate(${interpolate(reveal, [0, 1], [-2, 0])}deg) scale(${cardScale})`,
        }}
      >
        {classic.render(sample, 'card', assets)}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 1250,
          top: 190,
          width: 360,
          height: 740,
          boxSizing: 'border-box',
          padding: 10,
          borderRadius: 54,
          background: '#0b0f10',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 50px 110px rgba(0,0,0,0.7)',
          opacity: phone,
          transform: `translateX(${(1 - phone) * 500}px) rotate(${(1 - phone) * 8}deg) rotateY(-8deg)`,
        }}
      >
        <div style={{ position: 'relative', width: 340, height: 720, borderRadius: 44, overflow: 'hidden', background: color.ground, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 1080, height: 1920, transformOrigin: '0 0', transform: `scale(${340 / 1080})`, position: 'absolute', top: (720 - 1920 * (340 / 1080)) / 2, left: 0 }}>
            {classic.render(sample, 'story', assets)}
          </div>
          <div style={{ position: 'absolute', top: 12, left: 130, width: 80, height: 22, borderRadius: 11, background: '#000' }} />
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 70, display: 'flex', gap: 14 }}>
        {shares.map((label, i) => {
          const p = spring({ frame: frame - 110 - i * 4, fps, config: { damping: 14, stiffness: 140 } })
          const primary = i === 0
          const breathe = primary ? Math.sin(Math.max(0, frame - 130) / 9.5) * 5 : 0
          return (
            <div
              key={label}
              style={{
                height: 58,
                padding: '0 26px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: 12,
                fontFamily: font.sans,
                fontWeight: primary ? 800 : 600,
                fontSize: 22,
                color: primary ? '#07120a' : color.ink,
                background: primary ? color.moss : 'rgba(10,17,18,0.9)',
                border: primary ? 'none' : '1px solid rgba(255,255,255,0.16)',
                boxShadow: primary ? '0 0 40px rgba(120,184,90,0.35)' : 'none',
                opacity: p,
                transform: `translateY(${(1 - p) * 40 + breathe}px) scale(${0.8 + p * 0.2})`,
              }}
            >
              {label}
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}
