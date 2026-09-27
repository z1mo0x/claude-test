import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { deadRepos } from '../copy'
import { RepoCard } from '../parts/RepoCard'
import { Reveal } from '../parts/Reveal'
import { color, font } from '../theme'

const COLS = 6
const ROWS = 6
const BURY = 112

const statement = { fontFamily: font.sans, fontWeight: 800, fontSize: 112, lineHeight: 1.04, letterSpacing: '-0.035em', color: color.bone }
const accent = { fontFamily: font.serif, fontStyle: 'italic', fontWeight: 500, fontSize: 134, letterSpacing: 0, color: color.mossLight }

/** Стена мёртвых проектов. На «похоронить» карточки проваливаются вниз. */
export function Wall() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const drift = interpolate(frame, [0, 165], [60, -140])

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 300px)`,
          gap: 30,
          transform: `translate(-50%, -50%) perspective(1600px) rotateX(34deg) rotateZ(-9deg) translateY(${drift}px)`,
        }}
      >
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const [name, language, days] = deadRepos[i % deadRepos.length]
          const row = Math.floor(i / COLS)
          const col = i % COLS
          const appear = spring({ frame: frame - (row + col) * 2, fps, config: { damping: 200 } })
          const delay = random(`bury${i}`) * 18
          const drop = interpolate(frame, [BURY + delay, BURY + delay + 30], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.in(Easing.cubic),
          })
          const tilt = (random(`tilt${i}`) - 0.5) * 16
          return (
            <div
              key={i}
              style={{
                opacity: appear * 0.55 * (1 - drop),
                transform: `translateY(${drop * 520 + (1 - appear) * 40}px) rotate(${drop * tilt}deg)`,
              }}
            >
              <RepoCard name={name} language={language} days={days + Math.floor(frame / 6)} />
            </div>
          )
        })}
      </div>

      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 58% 46% at 50% 50%, rgba(3,7,8,0.9), rgba(3,7,8,0.25) 100%)' }} />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <Reveal words={['У', 'каждого', 'разработчика']} start={8} exit={94} style={{ ...statement, justifyContent: 'center' }} />
        <Reveal
          words={['есть', 'своё', { text: 'кладбище.', style: accent }]}
          start={16}
          exit={96}
          style={{ ...statement, justifyContent: 'center', alignItems: 'baseline' }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <Reveal words={['Пора', 'их']} start={106} style={{ ...statement, justifyContent: 'center' }} />
        <Reveal words={[{ text: 'похоронить.', style: accent }]} start={112} style={{ ...statement, justifyContent: 'center' }} />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
