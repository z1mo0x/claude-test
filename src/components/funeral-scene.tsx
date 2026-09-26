'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
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
  full: { prep: 700, coffin: 1300, lowering: 2200, burying: 3000 },
  reduced: { prep: 200, coffin: 300, lowering: 500, burying: 500 },
}

/** Пауза, в которой ничего не происходит. Не короче этого, даже если сервер ответил раньше. */
const SILENCE = 900

const order: BurialStep[] = ['prep', 'coffin', 'lowering', 'burying', 'silence']

/**
 * Сцена рисуется в кадре фиксированного размера и вписывается в экран целиком,
 * поэтому на телефоне надгробие такое же крупное, как на десктопе.
 */
const STAGE = { width: 440, height: 800 }
/** Линия земли внутри кадра. */
const GROUND = 520

/** Надгробие из основного Projectyard, обрезанное по камню (исходник 1536×1024). */
const STONE = { width: 400, crop: { x: 430, y: 50, width: 675, height: 880 } }
const stoneScale = STONE.width / STONE.crop.width
const stoneHeight = Math.round(STONE.crop.height * stoneScale)
/** Нижний край основания камня внутри обрезки. */
const stoneBase = Math.round((900 - STONE.crop.y) * stoneScale)

function coffinVariants(reduced: boolean): Variants {
  if (reduced) {
    return { hidden: { opacity: 0 }, shown: { opacity: 1 }, lowered: { opacity: 0 }, buried: { opacity: 0 } }
  }
  return {
    hidden: { y: -60, opacity: 0 },
    shown: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 80, damping: 14 } },
    lowered: {
      y: [0, 30, 110, 230],
      scale: [1, 0.98, 0.95, 0.9],
      opacity: [1, 1, 0.9, 0.7],
      transition: { duration: 2.2, ease: 'easeInOut' },
    },
    buried: { y: 230, scale: 0.9, opacity: 0 },
  }
}

// Раскладка частиц детерминирована, чтобы не было расхождений между рендерами.
const puffs = [-1, 1].flatMap((side) => [0, 1, 2].map((i) => ({ side, i })))
const risingDust = Array.from({ length: 14 }, (_, i) => ({
  x: 40 + ((i * 53) % 360),
  delay: (i % 7) * 0.22,
  size: 3 + (i % 3) * 2,
}))
const dirt = Array.from({ length: 26 }, (_, i) => ({
  x: 70 + ((i * 97) % 300),
  from: -40 - ((i * 37) % 160),
  delay: ((i * 13) % 26) * 0.035,
  size: 5 + (i % 4) * 3,
  spin: ((i % 5) - 2) * 40,
}))
const fireflies = Array.from({ length: 7 }, (_, i) => ({
  x: 30 + ((i * 71) % 380),
  y: 150 + ((i * 89) % 330),
  delay: 2.3 + i * 0.25,
  drift: ((i % 3) - 1) * 14,
}))

function useStageScale() {
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const update = () => setScale(Math.min(window.innerWidth / STAGE.width, window.innerHeight / STAGE.height, 1.25))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return scale
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
  const scale = useStageScale()
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
          router.push(`${result.href}${result.href.includes('?') ? '&' : '?'}buried=1`)
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
  const burying = step === 'burying'
  const captions: Partial<Record<BurialStep, string>> = {
    coffin: `Прощание с ${repo.name}`,
    lowering: [lived && `${lived} разработки`, commitsLabel(repo.commits)].filter(Boolean).join(' · '),
    burying: `«${epitaph}»`,
  }
  // Камера вздрагивает, когда гроб уходит в землю и когда из неё поднимается камень.
  const shake = !reduced && (step === 'lowering' || burying)
  // Нижний слой трясётся через motion, поэтому масштаб ему передаём как motion-значение, а не CSS transform.
  const size = { width: STAGE.width, height: STAGE.height }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Похороны ${repo.owner}/${repo.name}`}
      className="fixed inset-0 z-50 overflow-hidden bg-ground"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Медленный наезд камеры на всю сцену. */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1 }}
        animate={{ scale: reduced ? 1 : 1.1 }}
        transition={{ duration: 9, ease: 'linear' }}
      >
        <Image src="/images/graveyard.png" alt="" fill sizes="100vw" className="object-cover opacity-55" />
      </motion.div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(120,184,90,0.08),rgba(3,7,8,0.55)_55%,rgba(0,0,0,0.9)_100%)]" />
      <GraveyardAir />

      {/* Земля и гроб. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative shrink-0"
          style={{ ...size, scale }}
          animate={shake ? { x: [0, -2, 2, -1.5, 1.5, 0], y: [0, 1, -1, 1, 0] } : { x: 0, y: 0 }}
          transition={shake ? { duration: 0.3, repeat: Infinity } : { duration: 0.2 }}
        >
          <p className="absolute top-4 w-full text-center font-mono text-[13px] text-muted">
            $ projectyard bury {repo.owner}/{repo.name}
          </p>

          {/* Яма под гробом. */}
          <div
            className="absolute left-1/2 h-10 w-[380px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse,#000_40%,rgba(0,0,0,0)_75%)]"
            style={{ top: GROUND - 20 }}
          />

          <motion.div
            className="absolute left-[40px] w-[360px]"
            style={{ top: GROUND - 140 }}
            variants={coffinVariants(reduced)}
            initial="hidden"
            animate={coffinState}
          >
            <div
              className="flex h-[150px] flex-col justify-between rounded-xl border border-white/14 bg-cover px-6 py-5 shadow-[0_24px_50px_rgba(0,0,0,0.6)]"
              style={{ backgroundImage: 'linear-gradient(180deg, rgba(27,34,36,0.45), rgba(10,14,15,0.88)), url(/images/stone.webp)' }}
            >
              <span className="font-mono text-[12px] text-muted">{repo.owner} /</span>
              <span className="font-serif text-[34px] leading-none font-bold break-all text-bone">{repo.name}</span>
              <span className="flex justify-between font-mono text-[12px] text-muted">
                <span>{repo.language ?? 'без языка'}</span>
                <span>{years}</span>
              </span>
            </div>
          </motion.div>

          {/* Пыль, когда гроб встаёт на землю. */}
          {!reduced && step === 'coffin' &&
            puffs.map(({ side, i }) => (
              <motion.span
                key={`${side}-${i}`}
                className="absolute block rounded-full bg-[radial-gradient(circle,rgba(170,180,170,0.35),rgba(170,180,170,0)_70%)]"
                style={{ top: GROUND - 20, left: 220 + side * 170, width: 60, height: 60, marginLeft: -30 }}
                initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
                animate={{ opacity: [0, 0.9, 0], scale: [0.3, 1.4 + i * 0.3], x: side * (20 + i * 22), y: -10 - i * 8 }}
                transition={{ duration: 1, delay: 0.35 + i * 0.05, ease: 'easeOut' }}
              />
            ))}

          {/* Пыль поднимается из ямы, пока гроб опускают. */}
          {!reduced && step === 'lowering' &&
            risingDust.map((p, i) => (
              <motion.span
                key={i}
                className="absolute block rounded-full bg-[#9aa29b]"
                style={{ top: GROUND - 6, left: p.x, width: p.size, height: p.size }}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 0.5, 0], y: -70 - (i % 4) * 20 }}
                transition={{ duration: 1.4, delay: p.delay, ease: 'easeOut' }}
              />
            ))}

          <div className="soil absolute -right-[200px] -bottom-[200px] -left-[200px]" style={{ top: GROUND }} />
          {/* Кромка земли, чтобы линия могилы читалась на тёмном фоне. */}
          <div
            className="absolute -right-[100px] -left-[100px] h-px bg-[linear-gradient(90deg,rgba(160,175,160,0),rgba(160,175,160,0.35),rgba(160,175,160,0))]"
            style={{ top: GROUND + 3 }}
          />

          {/* Земля сыплется в могилу. */}
          {!reduced && burying &&
            dirt.map((d, i) => (
              <motion.span
                key={i}
                className="absolute block rounded-[35%] bg-[#56604f] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_4px_rgba(0,0,0,0.6)]"
                style={{ left: d.x, top: 0, width: d.size, height: d.size * 0.8 }}
                initial={{ y: d.from, opacity: 0, rotate: 0 }}
                animate={{ y: [d.from, GROUND + 4], opacity: [0, 1, 1, 0], rotate: d.spin }}
                transition={{ duration: 0.7, delay: d.delay, ease: 'easeIn', times: [0, 0.1, 0.85, 1] }}
              />
            ))}

          <motion.div
            className="absolute left-1/2 h-[64px] w-[380px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_50%_25%,#48533f,#1b221a_55%,#0d110f_80%)]"
            style={{ top: GROUND - 34, originY: 1 }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={reached('burying') ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0.2 : 0.9, delay: reduced ? 0 : 0.5, ease: 'easeOut' }}
          />
        </motion.div>
      </div>

      {/* Всё глохнет: размываем фон, в фокусе остаётся только надгробие. */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-20 bg-ground/45 backdrop-blur-[6px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: reached('burying') ? 1 : 0 }}
        transition={{ duration: 1, delay: reduced ? 0 : 0.6 }}
      />

      {/* Надгробие, подписи и кнопки — поверх размытия. */}
      <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
        <div className="relative shrink-0" style={{ ...size, transform: `scale(${scale})` }}>
          {/* Камень поднимается из земли: всё, что ниже линии земли, обрезано. */}
          <div className="absolute left-[20px] w-[400px] overflow-hidden" style={{ top: 0, height: GROUND + 30 }}>
            <motion.div
              className="absolute left-0 w-[400px] [mask-image:radial-gradient(ellipse_62%_58%_at_50%_45%,#000_75%,transparent_100%)]"
              style={{ top: GROUND + 24 - stoneBase, height: stoneHeight }}
              initial={{ y: reduced ? 0 : stoneHeight, opacity: reduced ? 0 : 1 }}
              animate={reached('burying') ? { y: 0, opacity: 1 } : { y: reduced ? 0 : stoneHeight, opacity: reduced ? 0 : 1 }}
              transition={{ duration: reduced ? 0.3 : 1.4, delay: reduced ? 0 : 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src="/images/tombstone.png"
                alt=""
                width={Math.round(1536 * stoneScale)}
                height={Math.round(1024 * stoneScale)}
                className="absolute max-w-none"
                style={{ left: -STONE.crop.x * stoneScale, top: -STONE.crop.y * stoneScale }}
                priority
              />
              {/* Свечение знака </> на камне. */}
              <motion.div
                className="absolute left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(120,184,90,0.45),rgba(120,184,90,0)_65%)]"
                style={{ top: (195 - STONE.crop.y) * stoneScale - 48 }}
                initial={{ opacity: 0 }}
                animate={reached('burying') && !reduced ? { opacity: [0, 1, 0.55, 0.9] } : { opacity: 0 }}
                transition={{ duration: 1.6, delay: 2.2 }}
              />
              <div className="absolute top-[140px] left-[52px] flex h-[270px] w-[296px] flex-col items-center justify-center gap-3 text-center">
                <motion.span
                  className="font-serif text-[15px] font-bold tracking-[0.35em] text-muted"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: reached('burying') ? 1 : 0 }}
                  transition={{ duration: 0.6, delay: reduced ? 0 : 2.1 }}
                >
                  R.I.P.
                </motion.span>
                <span className="font-serif text-[40px] leading-none font-bold break-all text-bone" aria-label={repo.name}>
                  {Array.from(repo.name).map((char, i) => (
                    <motion.span
                      key={i}
                      aria-hidden="true"
                      initial={{ opacity: 0, textShadow: '0 0 0 rgba(120,184,90,0)' }}
                      animate={
                        reached('burying')
                          ? {
                              opacity: 1,
                              textShadow: reduced
                                ? '0 0 0 rgba(120,184,90,0)'
                                : ['0 0 18px rgba(166,212,122,0.9)', '0 3px 8px rgba(0,0,0,0.6)'],
                            }
                          : { opacity: 0 }
                      }
                      transition={{ duration: 0.5, delay: reduced ? 0 : 2.2 + i * 0.045 }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </span>
                <motion.span
                  className="font-serif text-[22px] font-semibold text-ink"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: reached('burying') ? 1 : 0 }}
                  transition={{ duration: 0.6, delay: reduced ? 0 : 2.5 + repo.name.length * 0.045 }}
                >
                  {years}
                </motion.span>
              </div>
            </motion.div>
          </div>

          {/* Светлячки у свежей могилы. */}
          {!reduced &&
            reached('burying') &&
            fireflies.map((f, i) => (
              <motion.span
                key={i}
                className="absolute block h-1.5 w-1.5 rounded-full bg-moss-light shadow-[0_0_10px_3px_rgba(166,212,122,0.6)]"
                style={{ left: f.x, top: f.y }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.9, 0.2, 0.8, 0], y: [0, -18, -6, -24], x: [0, f.drift, -f.drift, 0] }}
                transition={{ duration: 3.2, delay: f.delay, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}

          <div className="absolute top-[600px] flex h-[104px] w-full items-start justify-center px-4 text-center" aria-live="polite">
            <AnimatePresence mode="wait">
              {captions[step] && (
                <motion.p
                  key={step}
                  initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(4px)' }}
                  transition={{ duration: 0.7 }}
                  className={burying ? 'font-serif text-[26px] leading-snug text-ink/90 italic' : 'text-[18px] text-ink/85'}
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
                    className="pointer-events-auto min-h-11 rounded-lg border border-white/16 px-5 font-semibold transition-colors hover:border-white/30"
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
                className="pointer-events-auto absolute top-[730px] left-1/2 min-h-11 -translate-x-1/2 rounded-lg border border-white/12 bg-ground/60 px-5 font-mono text-[13px] whitespace-nowrap text-muted transition-colors hover:border-white/30 hover:text-ink"
              >
                Отменить похороны
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
