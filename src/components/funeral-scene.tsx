'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react'
import type { BuryResult } from '@/app/actions'
import { errorMessages } from '@/lib/errors'
import type { RepoFacts } from '@/lib/github'
import { commitsLabel, daysBetween, lifetime } from '@/lib/format'
import { GraveyardAir } from './graveyard-air'

/**
 * Сцена идёт по шагам: prep → coffin → lowering → burying → silence.
 * До silence похороны можно отменить, в базе ещё ничего нет. На silence
 * записываем могилу и уходим на страницу свидетельства: там шаги
 * certificate и share (см. grave-view.tsx).
 */
export type BurialStep = 'prep' | 'coffin' | 'lowering' | 'burying' | 'silence' | 'failed'

type TimedStep = 'prep' | 'coffin' | 'lowering' | 'burying'

const nextStep: Record<TimedStep, BurialStep> = {
  prep: 'coffin',
  coffin: 'lowering',
  lowering: 'burying',
  burying: 'silence',
}

const duration: Record<'full' | 'reduced', Record<TimedStep, number>> = {
  full: { prep: 600, coffin: 1100, lowering: 2200, burying: 1600 },
  reduced: { prep: 200, coffin: 300, lowering: 500, burying: 400 },
}

/** Пауза, в которой ничего не происходит. Не короче этого, даже если сервер ответил раньше. */
const SILENCE = 800

const order: BurialStep[] = ['prep', 'coffin', 'lowering', 'burying', 'silence']

function coffinVariants(reduced: boolean): Variants {
  if (reduced) {
    return { hidden: { opacity: 0 }, shown: { opacity: 1 }, lowered: { opacity: 0.4 }, buried: { opacity: 0.4 } }
  }
  return {
    hidden: { y: 40, opacity: 0 },
    shown: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 80, damping: 14 } },
    lowered: {
      y: [0, 20, 60, 120],
      scale: [1, 0.98, 0.95, 0.9],
      opacity: [1, 1, 0.9, 0.7],
      transition: { duration: 2.2, ease: 'easeInOut' },
    },
    buried: { y: 120, scale: 0.9, opacity: 0.7 },
  }
}

type Props = {
  repo: RepoFacts
  epitaph: string
  commit: () => Promise<BuryResult>
  onAbort: () => void
}

export function FuneralScene({ repo, epitaph, commit, onAbort }: Props) {
  const router = useRouter()
  const reduced = useReducedMotion() ?? false
  const [step, setStep] = useState<BurialStep>('prep')
  const [error, setError] = useState<string | null>(null)
  const [slow, setSlow] = useState(false)
  const pending = useRef<Promise<BuryResult> | null>(null)
  const commitRef = useRef(commit)
  const abortRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    commitRef.current = commit
  }, [commit])

  const reached = (target: BurialStep) => order.indexOf(step === 'failed' ? 'silence' : step) >= order.indexOf(target)
  const abortable = !reached('silence')

  useEffect(() => {
    if (step === 'silence' || step === 'failed') return
    const timer = setTimeout(() => setStep(nextStep[step]), duration[reduced ? 'reduced' : 'full'][step])
    return () => clearTimeout(timer)
  }, [step, reduced])

  useEffect(() => {
    if (step !== 'silence') return
    let active = true
    // Один запрос на всю сцену, даже если эффект перезапустится.
    pending.current ??= commitRef.current()
    const pause = new Promise((resolve) => setTimeout(resolve, SILENCE))
    const slowTimer = setTimeout(() => setSlow(true), SILENCE + 2500)

    Promise.all([pending.current, pause])
      .then(([result]) => {
        if (!active) return
        if (result.ok) {
          router.push(`${result.path}?buried=1`)
        } else {
          setError(errorMessages[result.error])
          setStep('failed')
        }
      })
      .catch(() => {
        if (!active) return
        setError(errorMessages.save_failed)
        setStep('failed')
      })

    return () => {
      active = false
      clearTimeout(slowTimer)
    }
  }, [step, router])

  useEffect(() => {
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    abortRef.current?.focus()
    return () => {
      document.body.style.overflow = overflow
    }
  }, [])

  useEffect(() => {
    if (!abortable) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onAbort()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [abortable, onAbort])

  const lived = repo.diedAt ? lifetime(daysBetween(repo.bornAt, repo.diedAt)) : null
  const years = `${new Date(repo.bornAt).getUTCFullYear()} — ${new Date(repo.diedAt ?? repo.bornAt).getUTCFullYear()}`
  const coffinState = step === 'prep' ? 'hidden' : step === 'coffin' ? 'shown' : step === 'lowering' ? 'lowered' : 'buried'
  const captions: Partial<Record<BurialStep, string>> = {
    coffin: `Прощание с ${repo.name}`,
    lowering: [lived && `${lived} разработки`, commitsLabel(repo.commits)].filter(Boolean).join(' · '),
    burying: `«${epitaph}»`,
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Похороны ${repo.owner}/${repo.name}`}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-ground px-4"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(120,184,90,0.07),rgba(3,7,8,0)_60%)]" />
      <GraveyardAir />

      <p className="absolute top-8 font-mono text-[13px] text-muted">
        $ projectyard bury {repo.owner}/{repo.name}
      </p>

      <div className="relative h-[330px] w-full max-w-[440px]">
        <div className="absolute top-[70px] left-1/2 w-[300px] -translate-x-1/2">
          <motion.div variants={coffinVariants(reduced)} initial="hidden" animate={coffinState}>
            <motion.div
              animate={step === 'lowering' && !reduced ? { x: [0, -1.2, 1, -0.8, 0.6, 0] } : { x: 0 }}
              transition={step === 'lowering' ? { duration: 0.35, repeat: Infinity } : { duration: 0.2 }}
              className="flex flex-col gap-2 rounded-xl border border-white/14 bg-[linear-gradient(180deg,#1b2224,#0f1517)] px-6 py-5 shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
            >
              <span className="font-mono text-[12px] text-muted">{repo.owner} /</span>
              <span className="font-serif text-[30px] leading-none font-bold break-all text-bone">{repo.name}</span>
              <span className="flex justify-between font-mono text-[12px] text-muted">
                <span>{repo.language ?? 'без языка'}</span>
                <span>{years}</span>
              </span>
            </motion.div>
          </motion.div>
        </div>

        <div className="soil absolute -inset-x-1/3 top-[200px] bottom-0" />
      </div>

      {/* Всё глохнет: размываем фон, в фокусе остаётся только надгробие. */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-20 bg-ground/55 backdrop-blur-[6px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: reached('burying') ? 1 : 0 }}
        transition={{ duration: 1 }}
      />

      <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center">
        <div className="relative h-[330px] w-full max-w-[440px]">
          <motion.div
            className="absolute top-[170px] left-1/2 h-[56px] w-[340px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_50%_35%,#232a25,#0d110f_70%)]"
            style={{ originY: 1 }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={reached('burying') ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0.2 : 1, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute top-[-34px] left-1/2 flex w-[210px] -translate-x-1/2 flex-col items-center"
            initial={{ opacity: 0, y: reduced ? 0 : 24 }}
            animate={reached('burying') ? { opacity: 1, y: 0 } : { opacity: 0, y: reduced ? 0 : 24 }}
            transition={{ duration: reduced ? 0.3 : 1.2, delay: reduced ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex h-[210px] w-full flex-col items-center justify-center gap-2 rounded-t-[105px] rounded-b-md border border-white/12 bg-[linear-gradient(180deg,#2a302f,#171c1c_60%,#111515)] px-5 pt-6 text-center shadow-[0_24px_50px_rgba(0,0,0,0.6)]">
              <span className="glow font-mono text-[18px] font-bold text-moss">{'{ }'}</span>
              <span className="font-serif text-[13px] font-bold tracking-[0.3em] text-muted">R.I.P.</span>
              <span className="font-serif text-[24px] leading-none font-bold break-all text-bone">{repo.name}</span>
              <span className="font-serif text-[17px] font-semibold text-ink">{years}</span>
            </div>
            <div className="h-3 w-[240px] rounded-sm bg-[#1d2322]" />
          </motion.div>
        </div>
        {/* Та же высота, что у подписи ниже: так сцена и надгробие совпадают по вертикали. */}
        <div className="mt-10 h-[104px]" />
      </div>

      <div className="relative z-40 mt-10 flex h-[104px] w-full max-w-[560px] items-start justify-center text-center" aria-live="polite">
        <AnimatePresence mode="wait">
          {captions[step] && (
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className={step === 'burying' ? 'font-serif text-[24px] italic text-ink/90' : 'text-[17px] text-ink/80'}
            >
              {captions[step]}
            </motion.p>
          )}
          {step === 'silence' && slow && (
            <motion.p key="slow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-[13px] text-muted">
              оформляем свидетельство…
            </motion.p>
          )}
          {step === 'failed' && (
            <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
              <p className="text-ember">{error}</p>
              <button
                type="button"
                onClick={onAbort}
                className="min-h-11 rounded-lg border border-white/16 px-5 font-semibold transition-colors hover:border-white/30"
              >
                Вернуться к форме
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {abortable && (
          <motion.button
            ref={abortRef}
            type="button"
            onClick={onAbort}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-8 z-40 min-h-11 rounded-lg border border-white/12 px-5 font-mono text-[13px] text-muted transition-colors hover:border-white/30 hover:text-ink"
          >
            Отменить похороны
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
