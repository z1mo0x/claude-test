import Image from 'next/image'
import { connection } from 'next/server'
import { BuryForm } from '@/components/bury-form'
import { countGraves } from '@/lib/store'

export default async function Home() {
  await connection()
  const count = await countGraves().catch(() => 0)
  // Без базы номер участка знает только браузер, форма посчитает его сама.
  const nextPlot = count === null ? null : count + 1

  return (
    <main>
      <section className="relative overflow-hidden">
        {/* Луна, ворон и надгробие REST IN CODE — та же картинка, что на главной основного Projectyard. */}
        <Image
          src="/images/banner.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[78%_50%] opacity-90"
        />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--color-ground)_0%,rgba(3,7,8,0.55)_45%,rgba(3,7,8,0.2)_100%)] lg:bg-[linear-gradient(90deg,var(--color-ground)_0%,var(--color-ground)_25%,rgba(3,7,8,0.5)_55%,rgba(3,7,8,0)_75%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(0deg,var(--color-ground),rgba(3,7,8,0))]" />

        <div className="relative mx-auto flex max-w-[1240px] flex-col gap-5 px-4 pt-56 pb-6 md:px-8 lg:pt-20 lg:pb-16">
          <p className="glow font-mono text-[14px] font-bold text-moss">projectyard&gt; bury --repo</p>
          <h1 className="flex flex-col font-serif text-[40px] leading-[1.02] font-bold text-bone uppercase md:text-[64px]">
            <span>Проводи репозиторий</span>
            <span className="text-moss-light">в последний путь</span>
          </h1>
          <p className="max-w-md text-[16px] leading-relaxed text-ink/80">
            Вставь ссылку на GitHub. Даты, возраст и последние слова подтянутся сами, останется выбрать причину смерти и
            написать эпитафию.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-4 pb-24 md:px-8">
        <BuryForm nextPlot={nextPlot} />
      </div>
    </main>
  )
}
