'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { formatSize, type CertificateData } from '@/certificate/types'
import { getVariant } from '@/certificate/variants'
import { webAssets } from '@/certificate/web-assets'
import { CertificateFrame } from './certificate-frame'
import { GraveyardAir } from './graveyard-air'
import { SharePanel } from './share-panel'

type Props = {
  data: CertificateData
  variant: string
  /** Адрес свидетельства на этом сайте. */
  href: string
  url: string
  imagePath: string
  post: string
  /** Пришли прямо со сцены похорон: показываем свидетельство с раскрытием. */
  fresh: boolean
}

export function GraveView({ data, variant, href, url, imagePath, post, fresh }: Props) {
  const reduced = useReducedMotion() ?? false
  // «Печать» играет всем: и после похорон, и тем, кто пришёл по ссылке. Сама анимация
  // в globals.css, при prefers-reduced-motion её выключает там же медиазапрос.
  const reveal = !reduced
  // После похорон ждём, пока погаснет тёмная шторка.
  const start = fresh ? 0.35 : 0
  const settled = start + 2.3
  const figure = useRef<HTMLElement>(null)
  const [stamped, setStamped] = useState(false)
  // Сцена похорон ушла в темноту, отсюда начинаем с той же темноты и проявляемся.
  const [curtain, setCurtain] = useState(fresh)
  const { render } = getVariant(variant)

  useEffect(() => {
    // Чтобы ссылка из адресной строки не запускала раскрытие заново.
    if (fresh) window.history.replaceState(null, '', href)
  }, [fresh, href])

  // Печать падает после блоков, но только когда её видно: на телефоне сторис длинная,
  // и печать внизу. Нижний отступ — под прилипшие кнопки.
  useEffect(() => {
    const seals = figure.current?.querySelectorAll('[data-reveal=seal]')
    if (!seals?.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setStamped(true)
        observer.disconnect()
      },
      { threshold: 0.6, rootMargin: '0px 0px -90px 0px' },
    )
    const timer = setTimeout(() => seals.forEach((seal) => observer.observe(seal)), (start + 1.65) * 1000)
    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [start])

  return (
    <main className="relative mx-auto max-w-page px-4 pt-8 pb-10 md:px-8 md:pt-12 md:pb-24">
      <GraveyardAir fixed />
      {/* Свидетельство вписано и по ширине, и по высоте экрана: кнопки под ним видны без прокрутки. */}
      <div className="relative mx-auto flex w-full flex-col gap-6 md:max-w-[max(720px,calc((100dvh-280px)*1200/630))]">
        <p className="glow font-mono text-[14px] font-bold text-moss">
          &gt; status: BURIED · участок № {data.plot}
        </p>

        <motion.figure
          ref={figure}
          initial={reveal ? { scale: 0.97, opacity: 0 } : { opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: reveal ? 0.6 : 0.5, ease: 'easeOut', delay: reveal ? start : 0 }}
          className={`certificate-reveal overflow-hidden rounded-[18px] ${stamped ? 'stamped' : ''}`}
          style={{ boxShadow: '0 0 40px rgba(242, 204, 96, 0.15)', '--t': `${start}s` } as CSSProperties}
        >
          {/* На узком экране карточка 1200×630 нечитаема, там показываем вертикальное свидетельство. */}
          <div className="hidden md:block">
            <CertificateFrame {...formatSize.card}>{render(data, 'card', webAssets)}</CertificateFrame>
          </div>
          <div className="md:hidden">
            <CertificateFrame {...formatSize.story}>{render(data, 'story', webAssets)}</CertificateFrame>
          </div>
          <figcaption className="sr-only">
            Свидетельство о смерти репозитория {data.owner}/{data.name}. Причина: {data.cause}. Эпитафия: {data.epitaph}
          </figcaption>
        </motion.figure>

        {/* Ряд занимает место с самого начала и только проявляется, поэтому страница не прыгает.
            На телефоне он прилипает к низу экрана: свидетельство высокое, а кнопка нужна сразу. */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: reveal ? settled : 0.2 }}
          className="sticky bottom-0 z-10 -mx-4 bg-[linear-gradient(0deg,var(--color-ground)_65%,rgba(3,7,8,0))] px-4 pt-6 pb-[max(16px,env(safe-area-inset-bottom))] md:static md:m-0 md:bg-none md:p-0"
        >
          <SharePanel url={url} post={post} imagePath={imagePath} fileName={`rip-${data.owner}-${data.name}`} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: reveal ? settled + 0.2 : 0.3 }}
          className="self-start"
        >
          <Link href="/" className="flex min-h-11 items-center gap-2 font-bold text-moss-light underline-offset-4 hover:underline">
            {fresh ? 'Похоронить ещё один' : 'Похоронить свой репозиторий'}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </motion.div>
      </div>

      <AnimatePresence>
        {curtain && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-50 bg-ground"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.2 : 0.9, ease: 'easeOut', delay: 0.1 }}
            onAnimationComplete={() => setCurtain(false)}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
