import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { Reveal } from '../../parts/Reveal'
import { Caret, typed } from '../../parts/Typewriter'
import { color, font, glow } from '../../theme'

/** Коммит печатается в три строки: так он крупный и помещается в ширину телефона. */
const LINES = ['git commit -m', '"доделаю', 'на выходных"']
const COMMIT = LINES.join(' ')

export const hook = { type: 4, framesPerChar: 0.75, enter: 32, last: 35, familiar: 46 }

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

export function Hook() {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const text = typed(COMMIT, frame, hook.type, hook.framesPerChar)
  const last = spring({ frame: frame - hook.last, fps, config: { damping: 200 } })
  const push = interpolate(frame, [0, durationInFrames], [1, 1.06])
  // Когда появляется «Знакомо?», терминал отходит на второй план.
  const back = interpolate(frame, [hook.familiar - 2, hook.familiar + 12], [0, 1], clamp)

  let rest = text.length
  const lines = LINES.map((line) => {
    const shown = line.slice(0, Math.max(0, rest))
    rest -= line.length + 1
    return shown
  })
  const caretLine = Math.max(0, lines.findLastIndex((line) => line.length > 0))

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 800, transform: `translateY(-40px) scale(${push})`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
          <div style={{ opacity: 1 - back * 0.5, filter: `blur(${back * 2}px)`, fontFamily: font.mono, fontWeight: 700, fontSize: 76, lineHeight: 1.18, color: color.moss, textShadow: glow, whiteSpace: 'pre' }}>
            {lines.map((line, i) => (
              <div key={i} style={{ minHeight: '1.18em' }}>
                {i === 0 && <span style={{ color: color.muted }}>$ </span>}
                {i > 0 && <span style={{ visibility: 'hidden' }}>{'  '}</span>}
                {line}
                {i === caretLine && <Caret color={color.moss} />}
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              opacity: last,
              transform: `translateY(${(1 - last) * 18}px)`,
              fontFamily: font.mono,
              fontSize: 36,
              color: color.ink,
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color.moss} strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            последний коммит — 3 года назад
          </div>
        </div>
        <Reveal
          words={[{ text: 'Знакомо?', style: { textShadow: '0 0 40px rgba(166,212,122,0.25)' } }]}
          start={hook.familiar}
          style={{
            marginTop: 110,
            justifyContent: 'center',
            fontFamily: font.serif,
            fontWeight: 700,
            fontSize: 128,
            lineHeight: 1,
            textTransform: 'uppercase',
            color: color.bone,
          }}
        />
      </div>
    </AbsoluteFill>
  )
}
