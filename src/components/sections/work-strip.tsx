import LogoLoop, { type LogoItem } from '@/components/reactbits/LogoLoop'
import { moreProjects, projects, shotUrl } from '@/data/site'

const covers = [
  ...projects.map((p) => ({ src: shotUrl(p.shots[0], 'sm'), title: p.title })),
  ...moreProjects.map((p) => ({ src: shotUrl(p.image, 'sm'), title: p.title })),
]

const items: LogoItem[] = covers.map((c) => ({
  title: c.title,
  node: (
    <img
      src={c.src}
      alt={c.title}
      loading="lazy"
      className="block aspect-[16/10] h-40 w-auto rounded-xl object-cover object-top shadow-xl ring-1 ring-white/10 sm:h-52"
    />
  ),
}))

/** A slightly tilted, endless band of project covers between the text-heavy sections. */
export function WorkStrip() {
  return (
    <section aria-label="Работы" className="overflow-hidden py-16">
      <div className="-mx-8 -rotate-2">
        <LogoLoop logos={items} speed={45} gap={24} logoHeight={208} pauseOnHover ariaLabel="Скриншоты проектов" />
      </div>
    </section>
  )
}
