'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useI18n } from '@/i18n/client'
import { secondary } from './share-dialog'

type Props = {
  /** Адрес картинки бейджа на этом сайте, для предпросмотра. */
  src: string
  /** Готовая строка для README: картинка внутри ссылки на свидетельство. */
  markdown: string
}

/** Бейдж «Похоронен на Projectyard» для README: показываем, как он выглядит, и даём скопировать Markdown. */
export function BadgePanel({ src, markdown }: Props) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Буфер обмена запрещён: строка на виду, её можно выделить вручную.
    }
  }

  return (
    <section aria-label={t.badge.title} className="flex flex-col gap-3 rounded-[14px] border border-white/10 bg-panel/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="font-mono text-[13px] font-bold text-moss-light">&gt; {t.badge.title}</h2>
        <img src={src} alt={t.badge.alt} height={20} className="h-5" />
      </div>
      <p className="text-[13px] text-muted">{t.badge.hint}</p>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-white/10 bg-ground/70 px-3 py-2.5 font-mono text-[12px] whitespace-nowrap text-ink select-all">
          {markdown}
        </code>
        <button type="button" onClick={copy} className={`${secondary} min-h-11 shrink-0`}>
          {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          {copied ? t.badge.copied : t.badge.copy}
        </button>
      </div>
    </section>
  )
}
