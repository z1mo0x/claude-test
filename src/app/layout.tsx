import type { Metadata } from 'next'
import type { ReactNode } from 'react'
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
import './globals.css'
import { SiteHeader } from '@/components/site-header'
import { siteUrl } from '@/lib/site-url'

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(await siteUrl()),
    title: { default: 'Projectyard — похорони репозиторий', template: '%s · Projectyard' },
    description: 'Вставь ссылку на заброшенный репозиторий и получи свидетельство о его смерти.',
    openGraph: { siteName: 'Projectyard', locale: 'ru_RU', type: 'website' },
    twitter: { card: 'summary_large_image' },
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  )
}
