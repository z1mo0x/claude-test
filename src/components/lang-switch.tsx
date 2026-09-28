'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { dictionary, langs, localePath, stripLang } from '@/i18n'
import { useI18n } from '@/i18n/client'

/**
 * Ссылка на ту же страницу на другом языке. Путь чистим от префикса сами: на сервере
 * usePathname видит внутренний /ru/…, в браузере — адрес без префикса.
 */
export function LangSwitch() {
  const { lang } = useI18n()
  const path = stripLang(usePathname())
  const other = langs.find((item) => item !== lang) ?? lang

  return (
    <Link
      href={localePath(other, path)}
      hrefLang={other}
      lang={other}
      aria-label={dictionary(other).header.switchLabel}
      className="grid min-h-11 min-w-10 place-items-center rounded-lg border border-white/12 px-2 font-mono text-[12px] font-bold text-muted transition-colors hover:border-moss/60 hover:text-ink sm:min-w-11 sm:text-[13px]"
    >
      {other.toUpperCase()}
    </Link>
  )
}
