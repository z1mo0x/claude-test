import { ArrowUpRight } from 'lucide-react'
import { SiGithub, SiTelegram } from 'react-icons/si'

import Magnet from '@/components/reactbits/Magnet'
import { Button } from '@/components/ui/button'
import { profile } from '@/data/site'
import { SectionHeading } from './section-heading'

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-8 px-6 pt-32 pb-40 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center text-center">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          {profile.availability}
        </p>
        <SectionHeading
          className="mx-auto mt-6 flex flex-col items-center"
          title={
            <>
              Есть идея? <em className="text-muted-foreground not-italic">Давайте соберём её вместе.</em>
            </>
          }
          text="Расскажите о задаче в Telegram — отвечу, задам пару вопросов и предложу, как сделать лучше."
        />

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
          <Magnet padding={60} magnetStrength={4}>
            <Button asChild variant="glass" size="none" className="px-10 py-5 text-base">
              <a href={profile.telegramUrl} target="_blank" rel="noreferrer">
                <SiTelegram /> {profile.telegram}
              </a>
            </Button>
          </Magnet>
          <Magnet padding={60} magnetStrength={4}>
            <Button asChild variant="glass" size="none" className="px-10 py-5 text-base text-muted-foreground hover:text-foreground">
              <a href={profile.githubUrl} target="_blank" rel="noreferrer">
                <SiGithub /> GitHub <ArrowUpRight />
              </a>
            </Button>
          </Magnet>
        </div>
      </div>
    </section>
  )
}
