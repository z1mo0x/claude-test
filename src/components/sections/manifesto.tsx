import { useState } from 'react'

import CountUp from '@/components/reactbits/CountUp'
import ScrollExpand from '@/components/reactbits/ScrollExpand'
import { about, media, stats } from '@/data/site'
import { displayFont } from '@/lib/utils'

/** Scroll-driven bridge between the hero and the projects: the clip grows to full screen and reveals the manifesto. */
export function Manifesto() {
  // CountUp would otherwise finish while the overlay is still invisible.
  const [revealed, setRevealed] = useState(false)

  return (
    <section aria-label="Коротко обо мне">
      <ScrollExpand
        useWindowScroll
        src={media.aboutMedia.src}
        mediaType={media.aboutMedia.type}
        title={
          <span>
            Код <em className="text-white/60 not-italic">с характером</em>
          </span>
        }
        titleClassName="font-display"
        scrollHint="Листайте вниз"
        startWidth={46}
        startHeight={52}
        startRadius={32}
        overlayScrim={0.6}
        scrollDistance={1.1}
        holdDistance={0.5}
        onProgress={(p) => {
          if (p > 0.8 && !revealed) setRevealed(true)
        }}
      >
        <div className="flex max-w-4xl flex-col items-center">
          <p
            className="text-4xl leading-[1.02] tracking-[-1px] text-white sm:text-5xl md:text-6xl"
            style={displayFont}
          >
            {about.lead}
          </p>
          <dl className="mt-12 grid w-full grid-cols-1 gap-8 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center">
                <dt className="order-2 mt-2 text-sm text-white/70">{s.label}</dt>
                <dd className="order-1 text-6xl leading-none text-white" style={displayFont}>
                  <CountUp to={s.value} duration={1.6} startWhen={revealed} />
                  {s.suffix}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </ScrollExpand>
    </section>
  )
}
