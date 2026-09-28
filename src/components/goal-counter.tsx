'use client'

import { useRef } from 'react'
import { useI18n } from '@/i18n/client'

export function GoalCounter({ count, goal }: { count: number; goal: number }) {
  const { t } = useI18n()
  const dialog = useRef<HTMLDialogElement>(null)
  const reached = count >= goal
  const left = Math.max(0, goal - count)
  const progress = `${Math.min(100, (count / goal) * 100)}%`

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
        className="flex min-h-11 flex-col items-end justify-center gap-1.5 rounded-lg border border-white/12 px-2.5 py-1.5 font-mono text-[12px] whitespace-nowrap transition-colors hover:border-moss/60 sm:px-3 sm:text-[13px]"
      >
        <span>
          <b className="text-moss-light">{count}</b>
          <span className="text-muted">/{goal}</span> {t.goal.unit}
        </span>
        <span className="block h-1 w-full overflow-hidden rounded-full bg-white/8">
          <span className="block h-full rounded-full bg-moss" style={{ width: progress }} />
        </span>
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="goal-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
        className="m-auto w-[min(520px,calc(100vw-32px))] rounded-2xl border border-white/10 bg-panel p-0 text-ink backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div className="flex flex-col gap-5 p-6 md:p-8">
          <p className="font-mono text-[13px] font-bold text-moss">projectyard&gt; roadmap</p>
          <h2 id="goal-title" className="font-serif text-[32px] leading-none font-bold text-bone">
            {reached ? t.goal.titleReached : t.goal.title}
          </h2>
          <p className="leading-relaxed text-ink/85">{t.goal.now}</p>
          <p className="leading-relaxed text-ink/85">{reached ? t.goal.planReached : t.goal.plan(goal)}</p>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between font-mono text-[13px]">
              <span>
                <b className="text-moss-light">{count}</b> {t.goal.of} {goal}
              </span>
              {!reached && (
                <span className="text-muted">{t.goal.left(left)}</span>
              )}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-moss" style={{ width: progress }} />
            </div>
          </div>
          <form method="dialog" className="flex justify-end">
            <button className="min-h-11 rounded-lg border border-moss/70 bg-moss/10 px-5 font-bold text-moss-light transition-colors hover:bg-moss/20">
              {t.goal.close}
            </button>
          </form>
        </div>
      </dialog>
    </>
  )
}
