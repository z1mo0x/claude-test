import Image from 'next/image'
import Link from 'next/link'
import { connection } from 'next/server'
import { localePath, type Lang } from '@/i18n'
import { GOAL } from '@/lib/config'
import { countGraves } from '@/lib/store'
import { GoalCounter } from './goal-counter'
import { LangSwitch } from './lang-switch'

export async function SiteHeader({ lang }: { lang: Lang }) {
  await connection()
  let count = 0
  let failed = false
  try {
    count = await countGraves()
  } catch (error) {
    failed = true
    console.error('Не удалось посчитать могилы', error)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-ground/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-2 px-4 md:px-8">
        <Link href={localePath(lang, '/')} className="flex items-center gap-2 text-moss sm:gap-3">
          <Image src="/images/logo.png" alt="" width={24} height={28} priority />
          <span className="glow font-mono text-[14px] font-bold sm:text-[15px]">
            projectyard&gt;<span className="cursor">_</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LangSwitch />
          {!failed && <GoalCounter count={count} goal={GOAL} />}
        </div>
      </div>
    </header>
  )
}
