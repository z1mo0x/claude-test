import { AbsoluteFill, random, useCurrentFrame } from 'remotion'
import { color } from '../theme'

const dust = Array.from({ length: 50 }, (_, i) => ({
  x: random(`x${i}`) * 1920,
  y: random(`y${i}`) * 1080,
  size: 1 + random(`s${i}`) * 2.5,
  speed: 0.15 + random(`v${i}`) * 0.5,
  opacity: 0.06 + random(`o${i}`) * 0.18,
  phase: random(`p${i}`) * Math.PI * 2,
}))

/** Общий фон всего ролика: дыхание тумана, пыль, зерно и виньетка. */
export function Background() {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ backgroundColor: color.ground, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(ellipse 55% 60% at ${35 + Math.sin(frame / 80) * 8}% ${45 + Math.cos(frame / 95) * 6}%, rgba(120,184,90,0.09), rgba(3,7,8,0) 70%), radial-gradient(ellipse 50% 50% at ${70 + Math.cos(frame / 70) * 6}% 75%, rgba(150,170,160,0.06), rgba(3,7,8,0) 70%)`,
        }}
      />
      {dust.map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: d.x + Math.sin(frame / 40 + d.phase) * 12,
            top: ((d.y + frame * d.speed) % 1100) - 10,
            width: d.size,
            height: d.size,
            borderRadius: '50%',
            background: color.ink,
            opacity: d.opacity,
          }}
        />
      ))}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: 0.08, mixBlendMode: 'overlay' }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 6} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)' }} />
    </AbsoluteFill>
  )
}
