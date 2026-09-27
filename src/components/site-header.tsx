import Image from 'next/image'
import Link from 'next/link'
import { connection } from 'next/server'
import { GOAL } from '@/lib/config'
import { countGraves } from '@/lib/store'
import { GoalCounter } from './goal-counter'

export async function SiteHeader() {
  await connection()
  // null — база не подключена, тогда счётчик считает похороны в этом браузере.
  let count: number | null = null
  let failed = false
  try {
    count = await countGraves()
  } catch (error) {
    failed = true
    console.error('Не удалось посчитать могилы', error)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-ground/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" className="flex items-center gap-3 text-moss">
          <Image src="/images/logo.png" alt="" width={24} height={28} priority />
          <span className="glow font-mono text-[15px] font-bold">
            projectyard&gt;<span className="cursor">_</span>
          </span>
        </Link>
        {!failed && <GoalCounter count={count} goal={GOAL} />}
      </div>
    </header>
  )
}
