import { ArrowUpRight, Scissors } from 'lucide-react'

import TearTicket from '@/components/reactbits/TearTicket'
import { usePageTransition } from '@/components/transition/context'
import { moreProjects, projects, type Project } from '@/data/site'
import { useMediaQuery } from '@/hooks/use-media-query'
import { displayFont } from '@/lib/utils'
import { SectionHeading } from './section-heading'

const PAPER = '#efe9dc'
const STUB = '#e4dccb'
const INK = '#0b2536'

// Horizontal on wide screens, vertical below sm so the text keeps a readable size.
const WIDE = { width: 540, height: 250, stubSize: 150 }
const TALL = { width: 330, height: 470, stubSize: 130 }

function TicketBody({ project, vertical }: { project: Project; vertical: boolean }) {
  return (
    <div className="flex h-full flex-col justify-between p-7">
      <div className="flex items-center justify-between text-[11px] tracking-[0.2em] uppercase opacity-60">
        <span>Проект № {project.no}</span>
        <span>{project.year}</span>
      </div>
      <div>
        <p className="mb-2 text-[11px] tracking-[0.2em] uppercase opacity-50">{project.kind}</p>
        <h3 className="text-[44px] leading-[0.95] tracking-[-1px]" style={displayFont}>
          {project.title}
        </h3>
        <p className="mt-2 text-sm leading-snug opacity-70">{project.tagline}</p>
      </div>
      <ul className={`flex flex-wrap gap-1.5 ${vertical ? '' : 'max-w-[330px]'}`}>
        {project.stack.slice(0, vertical ? 5 : 3).map((tech) => (
          <li key={tech} className="rounded-full border border-current/15 px-2.5 py-0.5 text-[11px] opacity-70">
            {tech}
          </li>
        ))}
      </ul>
    </div>
  )
}

function TicketStub({ project, vertical }: { project: Project; vertical: boolean }) {
  if (vertical) {
    return (
      <div className="flex h-full items-center justify-between px-7">
        <div className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase opacity-60">
          <Scissors className="size-3.5" />
          Оторвите
        </div>
        <span className="text-5xl leading-none" style={displayFont}>
          {project.no}
        </span>
      </div>
    )
  }
  return (
    <div className="flex h-full flex-col items-center justify-between py-7">
      <span className="text-[10px] tracking-[0.25em] uppercase opacity-60">Вход</span>
      <span
        className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase opacity-60 [writing-mode:vertical-rl]"
        aria-hidden
      >
        <Scissors className="size-3.5 rotate-90" />
        Оторвите
      </span>
      <span className="text-5xl leading-none" style={displayFont}>
        {project.no}
      </span>
    </div>
  )
}

function ProjectTicket({ project }: { project: Project }) {
  const { go } = usePageTransition()
  const vertical = useMediaQuery('(max-width: 639px)')
  const size = vertical ? TALL : WIDE

  return (
    <div className="w-full" style={{ maxWidth: size.width }}>
      <TearTicket
        {...size}
        orientation={vertical ? 'vertical' : 'horizontal'}
        onTear={() => go(`/projects/${project.id}`, project.title)}
        background={PAPER}
        stubBackground={STUB}
        color={INK}
        radius={18}
        holes={vertical ? 11 : 9}
        roughness={1.2}
        rotate={0}
        ariaLabel={`Оторвать билет и открыть проект ${project.title}`}
        stub={<TicketStub project={project} vertical={vertical} />}
      >
        <TicketBody project={project} vertical={vertical} />
      </TearTicket>
    </div>
  )
}

export function Projects() {
  return (
    <section id="projects" className="mx-auto max-w-7xl scroll-mt-8 px-6 py-32 md:px-8">
      <SectionHeading
        eyebrow="Проекты"
        title={
          <>
            Оторвите билет, <em className="text-muted-foreground not-italic">чтобы посмотреть проект.</em>
          </>
        }
        text="Потяните корешок в сторону, пока он не оторвётся. С клавиатуры — Tab до корешка и Enter."
      />

      <div className="mt-20 grid grid-cols-1 justify-items-center gap-x-10 gap-y-14 lg:grid-cols-2">
        {projects.map((project) => (
          <ProjectTicket key={project.id} project={project} />
        ))}
      </div>

      <div className="mt-28">
        <h3 className="text-3xl tracking-[-0.5px]" style={displayFont}>
          Ещё на GitHub
        </h3>
        <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
          {moreProjects.map((p) => (
            <li key={p.title}>
              <a
                href={p.repo}
                target="_blank"
                rel="noreferrer"
                className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 py-5 transition-colors sm:grid-cols-[4rem_1fr_auto_auto]"
              >
                <span className="hidden text-sm text-muted-foreground sm:block">{p.year}</span>
                <span>
                  <span className="text-lg text-foreground">{p.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{p.text}</span>
                </span>
                <span className="hidden text-xs text-muted-foreground sm:block">{p.stack}</span>
                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
              </a>
            </li>
          ))}
        </ul>
      </div>

    </section>
  )
}
