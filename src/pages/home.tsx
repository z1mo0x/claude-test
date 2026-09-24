import { SiteFooter } from '@/components/site-footer'
import { About } from '@/components/sections/about'
import { Contact } from '@/components/sections/contact'
import { Hero } from '@/components/sections/hero'
import { Manifesto } from '@/components/sections/manifesto'
import { Projects } from '@/components/sections/projects'
import { Services } from '@/components/sections/services'
import { WorkStrip } from '@/components/sections/work-strip'

export function HomePage() {
  return (
    <>
      <Hero />
      <main>
        <Manifesto />
        <Projects />
        <About />
        <WorkStrip />
        <Services />
        <Contact />
      </main>
      <SiteFooter />
    </>
  )
}
