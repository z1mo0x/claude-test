'use client'

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-[1240px] flex-col items-start gap-5 px-4 pt-16 pb-24 md:px-8">
      <p className="glow font-mono text-[14px] font-bold text-moss">&gt; 500: кладбище закрыто</p>
      <h1 className="font-serif text-[40px] leading-none font-bold text-bone uppercase md:text-[56px]">Что-то сломалось</h1>
      <p className="max-w-md leading-relaxed text-ink/75">Похоже, база не отвечает. Попробуй обновить страницу через минуту.</p>
      <button
        type="button"
        onClick={reset}
        className="flex min-h-12 items-center rounded-[10px] bg-moss px-6 font-extrabold text-[#07120a]"
      >
        Попробовать ещё раз
      </button>
    </main>
  )
}
