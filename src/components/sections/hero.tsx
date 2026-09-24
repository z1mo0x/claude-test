import { useState } from 'react'

import { SiteNav } from '@/components/site-nav'
import { Button } from '@/components/ui/button'
import { media, profile } from '@/data/site'
import { cn, displayFont } from '@/lib/utils'

export function Hero() {
  const [usingFallback, setUsingFallback] = useState(false)

  return (
    <header id="top" className="relative flex min-h-svh flex-col overflow-hidden">
      <video
        className={cn(
          'absolute inset-0 z-0 h-full w-full object-cover transition-[filter] duration-700',
          // The showreel is busier than the ambient clip, so dim it to keep the headline legible.
          usingFallback && 'brightness-[0.35] saturate-[0.8]',
        )}
        autoPlay
        loop
        muted
        playsInline
        poster={media.heroPoster}
        onLoadedData={(e) => setUsingFallback(e.currentTarget.currentSrc.includes(media.showreel))}
      >
        {/* If the hero clip can't play, the browser moves on to the showreel. */}
        <source src={media.heroVideo} type="video/mp4" />
        <source src={media.showreel} type="video/webm" />
      </video>
      <SiteNav />
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-32 pb-40 py-[90px] text-center">
        <h1
          className="animate-fade-rise max-w-7xl text-5xl leading-[0.95] font-normal tracking-[-2.46px] sm:text-7xl md:text-8xl"
          style={displayFont}
        >
          Где <em className="text-muted-foreground not-italic">идеи</em> становятся{' '}
          <em className="text-muted-foreground not-italic">живыми интерфейсами.</em>
        </h1>
        <p className="animate-fade-rise-delay mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Я {profile.name}, фронтенд-разработчик. Делаю быстрые сайты и веб-приложения на React и Next.js: от
          лендингов до личных кабинетов. Меньше шума, больше смысла в каждом экране.
        </p>
        <Button
          asChild
          variant="glass"
          size="none"
          className="animate-fade-rise-delay-2 mt-12 px-14 py-5 text-base"
        >
          <a href="#projects">Смотреть проекты</a>
        </Button>
      </section>
    </header>
  )
}
