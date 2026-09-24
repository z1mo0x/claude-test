import { SiteFooter } from '@/components/site-footer'
import { SiteNav } from '@/components/site-nav'
import { TransitionLink } from '@/components/transition/page-transition'
import { Button } from '@/components/ui/button'
import { displayFont } from '@/lib/utils'

export function NotFoundPage() {
  return (
    <>
      <SiteNav activeHref="" />
      <main className="flex min-h-[70svh] flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">404</p>
        <h1 className="mt-4 text-5xl leading-[0.95] tracking-[-1.5px] sm:text-7xl" style={displayFont}>
          Такой страницы <em className="text-muted-foreground not-italic">нет.</em>
        </h1>
        <Button asChild variant="glass" size="none" className="mt-12 px-10 py-4 text-base">
          <TransitionLink to="/" label="Главная">
            На главную
          </TransitionLink>
        </Button>
      </main>
      <SiteFooter />
    </>
  )
}
