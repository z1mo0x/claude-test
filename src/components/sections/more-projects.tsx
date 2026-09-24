import { useState, type MouseEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'

import { moreProjects, shotUrl } from '@/data/site'
import { displayFont } from '@/lib/utils'

/** "More on GitHub" list: inline thumbnails on touch screens, a cursor-following preview on desktop. */
export function MoreProjects() {
  const [hovered, setHovered] = useState<string | null>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 })
  const springY = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 })

  const track = (e: MouseEvent) => {
    x.set(e.clientX)
    y.set(e.clientY)
  }

  const preview = moreProjects.find((p) => p.title === hovered)

  return (
    <div className="mt-28">
      <h3 className="text-3xl tracking-[-0.5px]" style={displayFont}>
        Ещё на GitHub
      </h3>
      <ul
        className="mt-6 divide-y divide-white/10 border-y border-white/10"
        onMouseMove={track}
        onMouseLeave={() => setHovered(null)}
      >
        {moreProjects.map((p) => (
          <li key={p.title} onMouseEnter={() => setHovered(p.title)}>
            <a
              href={p.repo}
              target="_blank"
              rel="noreferrer"
              className="group grid grid-cols-[4.5rem_1fr_auto] items-center gap-x-5 gap-y-1 py-5 md:grid-cols-[4rem_1fr_auto_auto] md:items-baseline"
            >
              <img
                src={shotUrl(p.image, 'sm')}
                alt=""
                loading="lazy"
                className="aspect-[16/10] w-full rounded-md object-cover object-top md:hidden"
              />
              <span className="hidden text-sm text-muted-foreground md:block">{p.year}</span>
              <span>
                <span className="text-lg text-foreground transition-colors group-hover:text-foreground">{p.title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{p.text}</span>
              </span>
              <span className="hidden text-xs text-muted-foreground md:block">{p.stack}</span>
              <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
            </a>
          </li>
        ))}
      </ul>

      <motion.div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-40 hidden md:block"
        style={{ x: springX, y: springY }}
      >
        <AnimatePresence>
          {preview && (
            <motion.img
              key={preview.title}
              src={shotUrl(preview.image, 'sm')}
              alt=""
              className="absolute top-0 left-0 w-80 max-w-none -translate-y-1/2 translate-x-10 rounded-xl object-cover shadow-2xl ring-1 ring-white/15"
              initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
