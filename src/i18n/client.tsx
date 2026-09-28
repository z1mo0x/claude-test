'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { defaultLang, dictionary, localePath, type Lang } from '.'

const LangContext = createContext<Lang>(defaultLang)

/**
 * Язык страницы для клиентских компонентов. Передаём только код языка: в словарях
 * есть функции (склонения, форматы дат), их нельзя отдать с сервера пропсами.
 */
export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext value={lang}>{children}</LangContext>
}

/** Значение не меняется между рендерами, пока не сменился язык: его можно класть в зависимости эффектов. */
export function useI18n() {
  const lang = useContext(LangContext)
  return useMemo(() => ({ lang, t: dictionary(lang), path: (href: string) => localePath(lang, href) }), [lang])
}
