import { Scissors } from 'lucide-react'

import TearTicket from '@/components/reactbits/TearTicket'
import { usePageTransition } from '@/components/transition/context'
import { projects, shotUrl, type Project } from '@/data/site'
import { useMediaQuery } from '@/hooks/use-media-query'
import { displayFont } from '@/lib/utils'
import { MoreProjects } from './more-projects'
import { SectionHeading } from './section-heading'

const PAPER = '#efe9dc'
const STUB = '#e4dccb'
const INK = '#0b2536'

// Horizontal on wide screens, vertical below sm so the text keeps a readable size.
const WIDE = { width: 540, height: 340, stubSize: 150 }
const TALL = { width: 330, height: 580, stubSize: 130 }

// The cover screenshot fills the top of the ticket and fades into the paper; the text sits on the faded part.
function TicketBody({ project }: { project: Project }) {
  return (
    <div className="flex h-full flex-col justify-end p-6">
      <p className="mb-1.5 text-[11px] tracking-[0.2em] uppercase opacity-60">{project.kind}</p>
      <h3 className="text-[40px] leading-[0.95] tracking-[-1px]" style={displayFont}>
        {project.title}
      </h3>
      <p className="mt-1.5 text-sm leading-snug opacity-75">{project.tagline}</p>
    </div>
  )
}

function TicketStub({ project, vertical }: { project: Project; vertical: boolean }) {
  if (vertical) {
    return (
      <div className="flex h-full items-center justify-between px-7">
        <div className="flex flex-col gap-2 text-[11px] tracking-[0.2em] uppercase opacity-60">
          <span>Вход · {project.year}</span>
          <span className="flex items-center gap-2">
            <Scissors className="size-3.5" />
            Оторвите
          </span>
        </div>
        <span className="text-5xl leading-none" style={displayFont}>
          {project.no}
        </span>
      </div>
    )
  }
  return (
    <div className="flex h-full flex-col items-center justify-between py-7">
      <span className="flex flex-col items-center gap-1 text-[10px] tracking-[0.25em] uppercase opacity-60">
        <span>Вход</span>
        <span>{project.year}</span>
      </span>
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
        image={shotUrl(project.shots[0], 'sm')}
        imageAlt={project.shots[0].alt}
        imageRadius={12}
        ariaLabel={`Оторвать билет и открыть проект ${project.title}`}
        stub={<TicketStub project={project} vertical={vertical} />}
      >
        <TicketBody project={project} />
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

      <MoreProjects />
    </section>
  )
}
