'use client'

import { useRef } from 'react'
import { plural } from '@/lib/format'

export function GoalCounter({ count, goal }: { count: number; goal: number }) {
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
        className="flex min-h-11 flex-col items-end justify-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 font-mono text-[13px] transition-colors hover:border-moss/60"
      >
        <span>
          <b className="text-moss-light">{count}</b>
          <span className="text-muted">/{goal}</span> проектов
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
            {reached ? 'Сто проектов похоронено' : 'Что будет на сотом проекте'}
          </h2>
          <p className="leading-relaxed text-ink/85">
            Пока здесь можно только похоронить репозиторий и получить свидетельство о его смерти.
          </p>
          <p className="leading-relaxed text-ink/85">
            {reached
              ? 'Начинаем разработку основного Projectyard — кладбища, где у каждого проекта будет своя могила. Все, кого похоронили здесь, переедут туда первыми.'
              : `Когда здесь наберётся ${goal} проектов, начнём разработку основного Projectyard — кладбища, где у каждого проекта будет своя могила. Все, кого похоронили здесь, переедут туда первыми.`}
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between font-mono text-[13px]">
              <span>
                <b className="text-moss-light">{count}</b> из {goal}
              </span>
              {!reached && (
                <span className="text-muted">
                  {plural(left, ['остался', 'осталось', 'осталось'])} {left}
                </span>
              )}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-moss" style={{ width: progress }} />
            </div>
          </div>
          <form method="dialog" className="flex justify-end">
            <button className="min-h-11 rounded-lg border border-moss/70 bg-moss/10 px-5 font-bold text-moss-light transition-colors hover:bg-moss/20">
              Понятно
            </button>
          </form>
        </div>
      </dialog>
    </>
  )
}
