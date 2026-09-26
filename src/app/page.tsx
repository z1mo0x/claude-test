import { connection } from 'next/server'
import { BuryForm } from '@/components/bury-form'
import { countGraves } from '@/lib/store'

export default async function Home() {
  await connection()
  const count = await countGraves().catch(() => 0)

  return (
    <main className="mx-auto max-w-[1240px] px-4 pt-10 pb-24 md:px-8 md:pt-16">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="flex flex-col gap-3">
          <p className="glow font-mono text-[14px] font-bold text-moss">projectyard&gt; bury --repo</p>
          <h1 className="flex flex-col font-serif text-[40px] leading-[1.02] font-bold text-bone uppercase md:text-[64px]">
            <span>Проводи репозиторий</span>
            <span className="text-moss-light">в последний путь</span>
          </h1>
        </div>
        <p className="max-w-md text-[16px] leading-relaxed text-ink/75">
          Вставь ссылку на GitHub. Даты, возраст и последние слова подтянутся сами, останется выбрать причину смерти
          и написать эпитафию.
        </p>
      </div>
      <BuryForm nextPlot={count + 1} />
    </main>
  )
}
