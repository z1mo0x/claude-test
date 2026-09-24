import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useLocation, useNavigate, useNavigationType } from 'react-router'

import { displayFont } from '@/lib/utils'
import { TransitionContext, usePageTransition } from './context'

type Phase = 'idle' | 'cover' | 'reveal'


const COLUMNS = 5
const EASE = [0.76, 0, 0.24, 1] as const
const COLUMN_DURATION = 0.55
const STAGGER = 0.06
// How long the covered screen holds on the destination title before lifting.
const HOLD_MS = 380

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const [phase, setPhase] = useState<Phase>('idle')
  const [label, setLabel] = useState<ReactNode>(null)
  const pending = useRef<string | null>(null)

  const go = useCallback(
    (to: string, nextLabel?: ReactNode) => {
      if (phase !== 'idle') return
      if (reduceMotion) {
        navigate(to)
        return
      }
      pending.current = to
      setLabel(nextLabel ?? null)
      setPhase('cover')
    },
    [phase, reduceMotion, navigate],
  )

  const onCovered = () => {
    const to = pending.current
    pending.current = null
    if (to) {
      // Leaving the home page for a project: park history on #projects so Back returns to the tickets.
      if (location.pathname === '/' && !to.startsWith('/#')) navigate('/#projects', { replace: true })
      navigate(to)
    }
    window.setTimeout(() => setPhase('reveal'), HOLD_MS)
  }

  return (
    <TransitionContext.Provider value={{ go }}>
      {children}
      <Curtain phase={phase} label={label} onCovered={onCovered} onRevealed={() => setPhase('idle')} />
    </TransitionContext.Provider>
  )
}

function Curtain({
  phase,
  label,
  onCovered,
  onRevealed,
}: {
  phase: Phase
  label: ReactNode
  onCovered: () => void
  onRevealed: () => void
}) {
  const covering = phase === 'cover'

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] flex"
      style={{ pointerEvents: phase === 'idle' ? 'none' : 'auto' }}
    >
      {Array.from({ length: COLUMNS }, (_, i) => {
        const last = i === COLUMNS - 1
        return (
          <motion.div
            key={i}
            className="h-full flex-1 bg-[#efe9dc]"
            // Grow up from the bottom, then leave through the top.
            style={{ transformOrigin: covering ? '50% 100%' : '50% 0%', marginLeft: i ? -1 : 0 }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: covering ? 1 : 0 }}
            transition={
              phase === 'idle'
                ? { duration: 0 }
                : { duration: COLUMN_DURATION, ease: EASE, delay: (covering ? i : COLUMNS - 1 - i) * STAGGER }
            }
            onAnimationComplete={() => {
              if (!last && covering) return
              if (covering) onCovered()
              else if (phase === 'reveal' && i === 0) onRevealed()
            }}
          />
        )
      })}
      <motion.div
        className="absolute inset-0 flex items-center justify-center px-6 text-center text-5xl leading-[0.95] tracking-[-1.5px] text-[#0b2536] sm:text-7xl md:text-8xl"
        style={displayFont}
        initial={{ opacity: 0, y: 24 }}
        animate={covering ? { opacity: 1, y: 0 } : { opacity: 0, y: -24 }}
        transition={covering ? { duration: 0.5, delay: 0.55, ease: 'easeOut' } : { duration: 0.3, ease: 'easeIn' }}
      >
        {label}
      </motion.div>
    </div>
  )
}

type TransitionLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string
  label?: ReactNode
}

/** A link that plays the curtain transition; modified clicks (new tab etc.) behave like a normal link. */
export function TransitionLink({ to, label, onClick, children, ...props }: TransitionLinkProps) {
  const { go } = usePageTransition()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    go(to, label)
  }

  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}

/** Scrolls to the #hash target (or the top) after every navigation, once the new page has rendered. */
export function ScrollManager() {
  const { pathname, hash, key } = useLocation()
  const navigationType = useNavigationType()
  const prevPathname = useRef<string | null>(null)

  useEffect(() => {
    const samePage = prevPathname.current === pathname
    prevPathname.current = pathname
    // In-page anchor clicks arrive as POP on the same page; leave those to the browser's smooth scroll.
    if (samePage && navigationType === 'POP') return

    const id = decodeURIComponent(hash.slice(1))
    const target = id ? document.getElementById(id) : null
    if (target) target.scrollIntoView({ behavior: 'instant' })
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash, key, navigationType])

  return null
}
