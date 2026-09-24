import { useLocation } from 'react-router'

import { Logo } from '@/components/logo'
import { TransitionLink } from '@/components/transition/page-transition'
import { Button } from '@/components/ui/button'
import { nav, profile } from '@/data/site'
import { cn } from '@/lib/utils'

/** Section link: a plain anchor on the home page, a curtain transition back to it from anywhere else. */
export function SectionLink({ href, label, className }: { href: string; label: string; className?: string }) {
  const { pathname } = useLocation()
  if (pathname === '/') {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    )
  }
  return (
    <TransitionLink to={`/${href}`} label={label} className={className}>
      {label}
    </TransitionLink>
  )
}

export function SiteNav({ activeHref = '#top' }: { activeHref?: string }) {
  const { pathname } = useLocation()

  return (
    <nav className="relative z-10 mx-auto flex w-full max-w-7xl flex-row items-center justify-between px-8 py-6">
      {pathname === '/' ? (
        <Logo className="text-3xl" />
      ) : (
        <TransitionLink to="/" label={profile.nick} className="text-3xl">
          <Logo className="pointer-events-none" asSpan />
        </TransitionLink>
      )}
      <ul className="hidden items-center gap-8 md:flex">
        {nav.map((item) => (
          <li key={item.href}>
            <SectionLink
              href={item.href}
              label={item.label}
              className={cn(
                'text-sm transition-colors hover:text-foreground',
                item.href === activeHref ? 'text-foreground' : 'text-muted-foreground',
              )}
            />
          </li>
        ))}
      </ul>
      <Button asChild variant="glass" size="none" className="px-6 py-2.5 text-sm">
        <a href={profile.telegramUrl} target="_blank" rel="noreferrer">
          Написать
        </a>
      </Button>
    </nav>
  )
}
