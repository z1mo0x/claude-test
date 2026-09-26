'use client'

import { useEffect, useState } from 'react'
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
  /** Адрес свидетельства на этом сайте, вместе с ?d=, если база не подключена. */
  href: string
  url: string
  imagePath: string
  imageQuery: string
  post: string
  /** Пришли прямо со сцены похорон: показываем свидетельство с раскрытием. */
  fresh: boolean
}

type Phase = 'certificate' | 'share'

export function GraveView({ data, variant, href, url, imagePath, imageQuery, post, fresh }: Props) {
  const reduced = useReducedMotion() ?? false
  const [phase, setPhase] = useState<Phase>(fresh ? 'certificate' : 'share')
  const reveal = fresh && !reduced
  const { render } = getVariant(variant)

  useEffect(() => {
    if (!fresh) return
    // Чтобы ссылка из адресной строки не запускала раскрытие заново.
    window.history.replaceState(null, '', href)
    const timer = setTimeout(() => setPhase('share'), reduced ? 200 : 1400)
    return () => clearTimeout(timer)
  }, [fresh, href, reduced])

  return (
    <main className="relative mx-auto max-w-[1240px] px-4 pt-8 pb-24 md:px-8 md:pt-12">
      <GraveyardAir fixed />
      <div className="relative flex flex-col gap-8">
        <p className="glow font-mono text-[14px] font-bold text-moss">
          &gt; status: BURIED · участок № {data.plot}
        </p>

        <motion.figure
          initial={reveal ? { scale: 0.8, opacity: 0, rotate: -2 } : { opacity: 0 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={reveal ? { type: 'spring', stiffness: 120, damping: 16 } : { duration: 0.5 }}
          className="overflow-hidden rounded-[18px]"
          style={{ boxShadow: '0 0 40px rgba(242, 204, 96, 0.15)' }}
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

        <AnimatePresence>
          {phase === 'share' && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex flex-col gap-8"
            >
              <SharePanel
                url={url}
                post={post}
                imagePath={imagePath}
                imageQuery={imageQuery}
                fileName={`rip-${data.owner}-${data.name}`}
                breathe={fresh}
              />
              <Link
                href="/"
                className="flex min-h-11 items-center gap-2 self-start font-bold text-moss-light underline-offset-4 hover:underline"
              >
                {fresh ? 'Похоронить ещё один' : 'Похоронить свой репозиторий'}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
