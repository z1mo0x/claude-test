import { shotUrl, type Shot } from '@/data/site'
import { cn } from '@/lib/utils'

export function BrowserFrame({ shot, label, className, priority = false }: { shot: Shot; label: string; className?: string; priority?: boolean }) {
  return (
    <figure className={cn('overflow-hidden rounded-2xl bg-white/[0.04] shadow-2xl ring-1 ring-white/10', className)}>
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-white/20" />
        </span>
        <span className="mx-auto truncate rounded-full bg-white/5 px-4 py-1 text-xs text-muted-foreground">{label}</span>
        <span className="w-[42px]" aria-hidden />
      </div>
      <img
        src={shotUrl(shot)}
        srcSet={`${shotUrl(shot, 'sm')} 760w, ${shotUrl(shot)} 1440w`}
        sizes="(min-width: 1280px) 1216px, 100vw"
        alt={shot.alt}
        loading={priority ? 'eager' : 'lazy'}
        className="block w-full"
      />
    </figure>
  )
}

export function PhoneFrame({ shot, className }: { shot: Shot; className?: string }) {
  return (
    <figure
      className={cn(
        'overflow-hidden rounded-[2.4rem] border-[7px] border-white/10 bg-black shadow-2xl ring-1 ring-white/10',
        className,
      )}
    >
      <img
        src={shotUrl(shot, 'sm')}
        srcSet={`${shotUrl(shot, 'sm')} 390w, ${shotUrl(shot)} 780w`}
        sizes="300px"
        alt={shot.alt}
        loading="lazy"
        className="block aspect-[390/780] w-full object-cover object-top"
      />
    </figure>
  )
}
