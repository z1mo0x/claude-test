import type { CSSProperties } from 'react'
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

export type Word = string | { text: string; style: CSSProperties }

/** Слова выезжают снизу из-под маски и уходят вверх. Главный приём типографики в ролике. */
export function Reveal({
  words,
  start,
  stagger = 3,
  exit,
  style,
}: {
  words: Word[]
  start: number
  stagger?: number
  exit?: number
  style?: CSSProperties
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: '0.26em', ...style }}>
      {words.map((word, i) => {
        const text = typeof word === 'string' ? word : word.text
        const own = typeof word === 'string' ? undefined : word.style
        const inP = spring({ frame: frame - start - i * stagger, fps, config: { damping: 200 }, durationInFrames: 26 })
        const outP =
          exit === undefined
            ? 0
            : interpolate(frame, [exit + i * 2, exit + i * 2 + 14], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.in(Easing.cubic),
              })
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', padding: '0.06em 0 0.16em', margin: '-0.06em 0 -0.16em' }}>
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${(1 - inP) * 105 - outP * 105}%)`,
                filter: `blur(${(1 - inP) * 10 + outP * 8}px)`,
                opacity: Math.min(inP * 1.4, 1 - outP),
                ...own,
              }}
            >
              {text}
            </span>
          </span>
        )
      })}
    </div>
  )
}
