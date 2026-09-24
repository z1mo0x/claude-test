import { motion } from 'motion/react'
import {
  SiFramer,
  SiGit,
  SiHtml5,
  SiJavascript,
  SiNextdotjs,
  SiPrisma,
  SiReact,
  SiReactquery,
  SiRedux,
  SiSass,
  SiShadcnui,
  SiSupabase,
  SiTailwindcss,
  SiThreedotjs,
  SiTypescript,
  SiVite,
} from 'react-icons/si'

import LogoLoop, { type LogoItem } from '@/components/reactbits/LogoLoop'
import { about } from '@/data/site'
import { displayFont } from '@/lib/utils'
import { SectionHeading } from './section-heading'

const stack: LogoItem[] = [
  { node: <SiReact />, title: 'React' },
  { node: <SiNextdotjs />, title: 'Next.js' },
  { node: <SiTypescript />, title: 'TypeScript' },
  { node: <SiJavascript />, title: 'JavaScript' },
  { node: <SiTailwindcss />, title: 'Tailwind CSS' },
  { node: <SiShadcnui />, title: 'shadcn/ui' },
  { node: <SiFramer />, title: 'Framer Motion' },
  { node: <SiThreedotjs />, title: 'Three.js' },
  { node: <SiSupabase />, title: 'Supabase' },
  { node: <SiPrisma />, title: 'Prisma' },
  { node: <SiReactquery />, title: 'TanStack Query' },
  { node: <SiRedux />, title: 'Redux' },
  { node: <SiVite />, title: 'Vite' },
  { node: <SiSass />, title: 'Sass' },
  { node: <SiHtml5 />, title: 'HTML' },
  { node: <SiGit />, title: 'Git' },
]

export function About() {
  return (
    <section id="about" className="scroll-mt-8 py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <SectionHeading
          eyebrow="Обо мне"
          title={
            <>
              С 2020 года <em className="text-muted-foreground not-italic">превращаю макеты в работающие сайты.</em>
            </>
          }
        />

        <div className="mt-20 grid gap-16 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
            {about.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <ul className="grid gap-x-8 gap-y-6 pt-6 sm:grid-cols-2">
              {about.principles.map((item) => (
                <li key={item.title}>
                  <p className="text-2xl text-foreground" style={displayFont}>
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>

          <ol className="relative border-l border-white/15">
            {about.timeline.map((item, i) => (
              <motion.li
                key={item.year}
                className="relative pb-12 pl-10 last:pb-0"
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
              >
                <span className="absolute top-3 -left-[5px] size-[9px] rounded-full bg-foreground" />
                <p className="text-5xl leading-none text-foreground/90" style={displayFont}>
                  {item.year}
                </p>
                <p className="mt-3 text-lg text-foreground">{item.title}</p>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-28 text-muted-foreground">
        <LogoLoop
          logos={stack}
          speed={60}
          gap={56}
          logoHeight={36}
          pauseOnHover
          scaleOnHover
          fadeOut
          fadeOutColor="hsl(201 100% 13%)"
          ariaLabel="Технологии, с которыми я работаю"
        />
      </div>
    </section>
  )
}
