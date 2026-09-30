import { NextResponse, type NextRequest } from 'next/server'

/**
 * Языки в адресах. Все страницы лежат в app/[lang]:
 * - русские адреса без префикса (/, /r/…) внутренне переписываются на /ru/…, в браузере адрес не меняется;
 * - /ru/… ведёт постоянным редиректом на адрес без префикса, чтобы у страницы был один адрес;
 * - /en/… проходит как есть.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const first = pathname.split('/')[1]
  if (first === 'en') return NextResponse.next()

  const url = request.nextUrl.clone()
  if (first === 'ru') {
    url.pathname = pathname.slice(3) || '/'
    return NextResponse.redirect(url, 308)
  }
  url.pathname = pathname === '/' ? '/ru' : `/ru${pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  // Мимо proxy: служебные пути Next и Vercel, API, бейджи (/badge/…), картинки и файлы в корне (robots.txt, sitemap.xml,
  // llms.txt, og.png, icon.png). Свидетельства /r/…/certificate.png глубже корня, их proxy видит.
  matcher: ['/((?!_next/|_vercel/|api/|badge/|images/|[^/]+\\.\\w+$).*)'],
}
