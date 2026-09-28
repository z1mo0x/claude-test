import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/700.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/700.css'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'
import '../globals.css'
import { SiteHeader } from '@/components/site-header'
import { defaultLang, dictionary, isLang, langs, languageAlternates, localePath, toLang } from '@/i18n'
import { I18nProvider } from '@/i18n/client'
import { siteUrl } from '@/lib/site-url'
import { Analytics } from '@vercel/analytics/next'

type Props = { params: Promise<{ lang: string }> }

export function generateStaticParams() {
  return langs.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = toLang((await params).lang)
  const t = dictionary(lang)
  const image = {
    url: lang === defaultLang ? '/og.png' : `/og.png?lang=${lang}`,
    width: 1200,
    height: 630,
    alt: t.meta.imageAlt,
  }
  return {
    metadataBase: new URL(await siteUrl()),
    title: { default: t.meta.title, template: '%s · Projectyard' },
    description: t.meta.description,
    keywords: t.meta.keywords,
    alternates: { canonical: localePath(lang, '/'), languages: languageAlternates('/') },
    // Коды подтверждения из Google Search Console и Яндекс Вебмастера (способ «HTML-тег»).
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION, yandex: process.env.YANDEX_VERIFICATION },
    openGraph: { siteName: 'Projectyard', locale: t.ogLocale, type: 'website', images: [image] },
    twitter: { card: 'summary_large_image', images: [image] },
  }
}

export default async function RootLayout({ children, params }: Props & { children: ReactNode }) {
  const { lang } = await params
  if (!isLang(lang)) notFound()

  return (
    <html lang={lang}>
      <body>
        <I18nProvider lang={lang}>
          <SiteHeader lang={lang} />
          {children}
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  )
}
