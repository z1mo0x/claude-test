import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { Caret, typed } from '../parts/Typewriter'
import { color, font, glow } from '../theme'

export function ColdOpen() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const stamp = spring({ frame: frame - 58, fps, config: { damping: 200 } })
  const push = interpolate(frame, [0, 90], [1, 1.08])

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ transform: `scale(${push})`, display: 'flex', flexDirection: 'column', gap: 30 }}>
        <div style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 56, color: color.moss, textShadow: glow, whiteSpace: 'pre' }}>
          <span style={{ color: color.muted }}>$ </span>
          {typed('git commit -m "доделаю на выходных"', frame, 10)}
          <Caret color={color.moss} />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            opacity: stamp,
            transform: `translateY(${(1 - stamp) * 18}px)`,
            fontFamily: font.mono,
            fontSize: 30,
            color: color.muted,
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color.muted} strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          последний коммит — 3 года назад
        </div>
      </div>
    </AbsoluteFill>
  )
}
