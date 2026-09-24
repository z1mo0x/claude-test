import { createContext, useContext, type ReactNode } from 'react'

export type TransitionApi = {
  /** Navigate behind a curtain that shows `label` while the next page mounts. */
  go: (to: string, label?: ReactNode) => void
}

export const TransitionContext = createContext<TransitionApi | null>(null)

export function usePageTransition() {
  const ctx = useContext(TransitionContext)
  if (!ctx) throw new Error('usePageTransition must be used inside PageTransitionProvider')
  return ctx
}
