import type { ReactElement } from 'react'

/** card — превью ссылки и PNG 1200×630, story — вертикальная картинка для сторис. */
export type CertificateFormat = 'card' | 'story'

export const formatSize: Record<CertificateFormat, { width: number; height: number }> = {
  card: { width: 1200, height: 630 },
  story: { width: 1080, height: 1920 },
}

export type CertificateData = {
  owner: string
  name: string
  language: string | null
  bornAt: string | null
  diedAt: string | null
  commits: number
  lastWords: string | null
  cause: string
  epitaph: string
  buriedBy: string | null
  plot: string
  issuedAt: string
  /** Домен сайта для подписи на сторис. */
  site: string
}

/** Картинки свидетельства: на странице это обычные URL, в PNG — data URI (см. server-assets.ts). */
export type CertificateAssets = {
  logo: string
  backdrop: string
}

/**
 * Вариант оформления свидетельства. Один и тот же render рисует свидетельство
 * на странице (обычный React) и в PNG (next/og, Satori). Поэтому в разметке
 * только то, что умеет Satori: flex-вёрстка, инлайн-стили, у каждого div с
 * несколькими детьми явный display: flex, без CSS-переменных и текста внутри <svg>.
 */
export type CertificateVariant = {
  id: string
  title: string
  render: (data: CertificateData, format: CertificateFormat, assets: CertificateAssets) => ReactElement
}
