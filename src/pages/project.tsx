import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useParams } from 'react-router'

import { SiteFooter } from '@/components/site-footer'
import { SiteNav } from '@/components/site-nav'
import { TransitionLink } from '@/components/transition/page-transition'
import { Button } from '@/components/ui/button'
import { projects } from '@/data/site'
import { displayFont } from '@/lib/utils'
import { NotFoundPage } from './not-found'

// Content starts moving once the curtain has mostly lifted.
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: 'easeOut' as const, delay: 0.45 + delay },
})

export function ProjectPage() {
  const { id } = useParams()
  const index = projects.findIndex((p) => p.id === id)
  if (index === -1) return <NotFoundPage />

  const project = projects[index]
  const next = projects[(index + 1) % projects.length]

  return (
    <>
      <SiteNav activeHref="#projects" />
      <main className="mx-auto max-w-7xl px-6 pt-16 pb-32 md:px-8">
        <TransitionLink
          to="/#projects"
          label="Проекты"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Все проекты
        </TransitionLink>

        <motion.p className="mt-20 text-xs tracking-[0.2em] text-muted-foreground uppercase" {...rise(0)}>
          Проект № {project.no} · {project.kind} · {project.year}
        </motion.p>
        <motion.h1
          className="mt-6 text-6xl leading-[0.9] tracking-[-2.46px] sm:text-8xl md:text-9xl"
          style={displayFont}
          {...rise(0.08)}
        >
          {project.title}
        </motion.h1>
        <motion.p className="mt-6 text-xl text-muted-foreground sm:text-2xl" {...rise(0.16)}>
          {project.tagline}
        </motion.p>

        <motion.div className="mt-24 grid gap-16 border-t border-white/10 pt-16 lg:grid-cols-[1.5fr_1fr]" {...rise(0.24)}>
          <div>
            <p className="text-2xl leading-snug text-foreground/90 sm:text-3xl" style={displayFont}>
              {project.description}
            </p>
            <ul className="mt-10 grid gap-3 text-muted-foreground">
              {project.features.map((f) => (
                <li key={f} className="flex gap-3">
                  <span className="mt-2.5 size-1 shrink-0 rounded-full bg-foreground/60" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <aside className="space-y-10">
            <div>
              <h2 className="text-sm text-muted-foreground">Стек</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {project.stack.map((tech) => (
                  <li key={tech} className="rounded-full border px-3 py-1 text-sm text-foreground/80">
                    {tech}
                  </li>
                ))}
              </ul>
            </div>
            <dl className="grid grid-cols-2 gap-6">
              <div>
                <dt className="text-sm text-muted-foreground">Год</dt>
                <dd className="mt-1 text-3xl" style={displayFont}>
                  {project.year}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Тип</dt>
                <dd className="mt-2 text-foreground/90">{project.kind}</dd>
              </div>
            </dl>
            <Button asChild variant="glass" size="none" className="px-8 py-4 text-base">
              <a href={project.repo} target="_blank" rel="noreferrer">
                Код на GitHub <ArrowUpRight />
              </a>
            </Button>
          </aside>
        </motion.div>

        <TransitionLink
          to={`/projects/${next.id}`}
          label={next.title}
          className="group mt-40 block border-t border-white/10 pt-10"
        >
          <span className="text-sm text-muted-foreground">Следующий проект · № {next.no}</span>
          <span className="mt-4 flex items-end justify-between gap-6">
            <span
              className="text-5xl leading-[0.9] tracking-[-2px] text-muted-foreground transition-colors duration-500 group-hover:text-foreground sm:text-7xl md:text-8xl"
              style={displayFont}
            >
              {next.title}
            </span>
            <ArrowUpRight className="size-10 shrink-0 text-muted-foreground transition-all duration-500 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-foreground" />
          </span>
        </TransitionLink>
      </main>
      <SiteFooter />
    </>
  )
}
