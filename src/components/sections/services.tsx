import { motion } from 'motion/react'

import SpotlightCard from '@/components/reactbits/SpotlightCard'
import { services } from '@/data/site'
import { displayFont } from '@/lib/utils'
import { SectionHeading } from './section-heading'

const rub = new Intl.NumberFormat('ru-RU')

export function Services() {
  return (
    <section id="services" className="mx-auto max-w-7xl scroll-mt-8 px-6 py-32 md:px-8">
      <SectionHeading
        eyebrow="Услуги"
        title={
          <>
            Что я могу <em className="text-muted-foreground not-italic">сделать для вас.</em>
          </>
        }
        text="Берусь за проект целиком: структура, вёрстка, анимации, интеграции и запуск."
      />

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
          >
            <SpotlightCard
              className="liquid-glass flex h-full flex-col rounded-3xl border-0 bg-white/[0.02] p-7"
              spotlightColor="rgba(255, 255, 255, 0.08)"
            >
              <h3 className="text-3xl leading-none tracking-[-0.5px]" style={displayFont}>
                {s.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              <ul className="mt-6 space-y-2 text-sm text-foreground/80">
                {s.points.map((p) => (
                  <li key={p} className="flex gap-3">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground/60" />
                    {p}
                  </li>
                ))}
              </ul>
              <p className="mt-auto pt-8 text-3xl" style={displayFont}>
                {rub.format(s.price)} ₽
              </p>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
