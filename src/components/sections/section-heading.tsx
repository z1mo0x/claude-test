import type { ReactNode } from 'react'
import { motion } from 'motion/react'

import { cn, displayFont } from '@/lib/utils'

type Props = {
  eyebrow?: string
  title: ReactNode
  text?: string
  className?: string
}

export function SectionHeading({ eyebrow, title, text, className }: Props) {
  return (
    <motion.div
      className={cn('max-w-4xl', className)}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {eyebrow && <p className="mb-4 text-sm text-muted-foreground">{eyebrow}</p>}
      <h2 className="text-4xl leading-[0.95] tracking-[-1.5px] sm:text-6xl md:text-7xl" style={displayFont}>
        {title}
      </h2>
      {text && <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">{text}</p>}
    </motion.div>
  )
}
