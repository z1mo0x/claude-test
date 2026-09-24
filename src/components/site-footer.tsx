import { useLocation } from 'react-router'

import { Logo } from '@/components/logo'
import { SectionLink } from '@/components/site-nav'
import { TransitionLink } from '@/components/transition/page-transition'
import { nav, profile } from '@/data/site'

export function SiteFooter() {
  const { pathname } = useLocation()

  return (
    <footer className="mx-auto max-w-7xl px-6 pb-16 md:px-8">
      <div className="flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 text-sm text-muted-foreground md:flex-row">
        {pathname === '/' ? (
          <Logo className="text-2xl" />
        ) : (
          <TransitionLink to="/" label={profile.nick} className="text-2xl">
            <Logo asSpan />
          </TransitionLink>
        )}
        <ul className="flex flex-wrap justify-center gap-6">
          {nav.slice(1).map((item) => (
            <li key={item.href}>
              <SectionLink href={item.href} label={item.label} className="transition-colors hover:text-foreground" />
            </li>
          ))}
        </ul>
        <p>
          © {new Date().getFullYear()} {profile.name}
        </p>
      </div>
    </footer>
  )
}
