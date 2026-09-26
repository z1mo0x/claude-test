import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-[1240px] flex-col items-start gap-5 px-4 pt-16 pb-24 md:px-8">
      <p className="glow font-mono text-[14px] font-bold text-moss">&gt; 404: могила не найдена</p>
      <h1 className="font-serif text-[40px] leading-none font-bold text-bone uppercase md:text-[56px]">Здесь никого не хоронили</h1>
      <p className="max-w-md leading-relaxed text-ink/75">Может, репозиторий ещё жив. А может, его как раз пора проводить.</p>
      <Link
        href="/"
        className="flex min-h-12 items-center rounded-[10px] bg-moss px-6 font-extrabold text-[#07120a]"
      >
        Похоронить репозиторий
      </Link>
    </main>
  )
}
