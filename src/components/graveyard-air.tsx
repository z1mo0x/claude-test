'use client'

import type { CSSProperties } from 'react'
import { motion, useReducedMotion } from 'motion/react'

const particles = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 61 + 7) % 100}%`,
  size: 1.5 + (i % 3) * 0.75,
  opacity: 0.1 + (i % 4) * 0.05,
  duration: `${16 + ((i * 7) % 11)}s`,
  // Отрицательная задержка — чтобы частицы с первого кадра были рассыпаны по высоте.
  delay: `-${(i * 3.7) % 16}s`,
  drift: `${((i % 5) - 2) * 14}px`,
}))

/** Туман и редкие частицы. Фон сцены похорон и страницы свидетельства. */
export function GraveyardAir({ fixed = false }: { fixed?: boolean }) {
  const reduced = useReducedMotion()
  return (
    <div aria-hidden="true" className={`pointer-events-none inset-0 overflow-hidden ${fixed ? 'fixed' : 'absolute'}`}>
      <motion.div
        className="absolute -inset-1/4 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 30% 40%, rgba(170,190,180,0.5), rgba(3,7,8,0) 55%), radial-gradient(ellipse at 70% 65%, rgba(140,160,150,0.4), rgba(3,7,8,0) 50%)',
          backgroundSize: '200% 200%',
        }}
        animate={reduced ? undefined : { backgroundPosition: ['0% 0%', '100% 100%'] }}
        transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
      />
      {particles.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={
            {
              left: p.left,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              animationDuration: p.duration,
              animationDelay: p.delay,
              '--drift': p.drift,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
