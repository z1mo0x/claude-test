'use client'

import { useI18n } from '@/i18n/client'

export default function Error({ reset }: { reset: () => void }) {
  const { t } = useI18n()
  return (
    <main className="mx-auto flex max-w-page flex-col items-start gap-5 px-4 pt-16 pb-24 md:px-8">
      <p className="glow font-mono text-[14px] font-bold text-moss">&gt; {t.error.status}</p>
      <h1 className="font-serif text-[40px] leading-none font-bold text-bone uppercase md:text-[56px]">{t.error.title}</h1>
      <p className="max-w-md leading-relaxed text-ink/75">{t.error.text}</p>
      <button
        type="button"
        onClick={reset}
        className="flex min-h-12 items-center rounded-[10px] bg-moss px-6 font-extrabold text-[#07120a]"
      >
        {t.error.action}
      </button>
    </main>
  )
}
