import { Easing, interpolate, useCurrentFrame } from 'remotion'

export type CursorKey = { f: number; x: number; y: number }

/** Курсор, который сам ходит по интерфейсу и кликает с кольцом. */
export function Cursor({ path, clicks, appear = 0 }: { path: CursorKey[]; clicks: number[]; appear?: number }) {
  const frame = useCurrentFrame()
  const frames = path.map((k) => k.f)
  const options = {
    easing: Easing.bezier(0.65, 0, 0.35, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  } as const
  const x = interpolate(frame, frames, path.map((k) => k.x), options)
  const y = interpolate(frame, frames, path.map((k) => k.y), options)
  const pressed = clicks.some((c) => frame >= c && frame < c + 5)
  const opacity = interpolate(frame, [appear, appear + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ position: 'absolute', left: x, top: y, zIndex: 50, opacity }}>
      {clicks.map((c) => {
        const t = frame - c
        if (t < 0 || t > 20) return null
        const r = 8 + t * 2.6
        return (
          <div
            key={c}
            style={{
              position: 'absolute',
              left: -r,
              top: -r,
              width: r * 2,
              height: r * 2,
              borderRadius: '50%',
              border: '2px solid rgba(166,212,122,0.9)',
              opacity: 1 - t / 20,
            }}
          />
        )
      })}
      <svg
        width="28"
        height="34"
        viewBox="0 0 28 34"
        style={{ transform: `scale(${pressed ? 0.85 : 1})`, transformOrigin: '2px 2px', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))' }}
      >
        <path d="M2 2 L2 27 L8.5 21 L13 31 L17.5 29 L13 19.5 L22 19.5 Z" fill="#fff" stroke="#111" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
