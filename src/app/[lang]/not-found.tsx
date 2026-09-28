'use client'

import Link from 'next/link'
import { useI18n } from '@/i18n/client'

export default function NotFound() {
  const { t, path } = useI18n()
  return (
    <main className="mx-auto flex max-w-page flex-col items-start gap-5 px-4 pt-16 pb-24 md:px-8">
      <p className="glow font-mono text-[14px] font-bold text-moss">&gt; {t.notFound.status}</p>
      <h1 className="font-serif text-[40px] leading-none font-bold text-bone uppercase md:text-[56px]">{t.notFound.title}</h1>
      <p className="max-w-md leading-relaxed text-ink/75">{t.notFound.text}</p>
      <Link
        href={path('/')}
        className="flex min-h-12 items-center rounded-[10px] bg-moss px-6 font-extrabold text-[#07120a]"
      >
        {t.notFound.action}
      </Link>
    </main>
  )
}
