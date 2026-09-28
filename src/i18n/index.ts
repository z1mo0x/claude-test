import { en } from './en'
import { ru, type Dictionary } from './ru'

export type { Dictionary }

/**
 * Языки сайта. Русский — основной: его адреса без префикса (/, /r/…), остальные
 * с префиксом (/en, /en/r/…). Внутри приложения все страницы лежат в app/[lang],
 * русские адреса туда переписывает src/proxy.ts.
 */
export const langs = ['ru', 'en'] as const
export type Lang = (typeof langs)[number]
export const defaultLang: Lang = 'ru'

const dictionaries: Record<Lang, Dictionary> = { ru, en }

export function isLang(value: string): value is Lang {
  return (langs as readonly string[]).includes(value)
}

export function toLang(value: string | null | undefined): Lang {
  return value && isLang(value) ? value : defaultLang
}

export function dictionary(lang: Lang) {
  return dictionaries[lang]
}

/** Адрес на сайте для языка: localePath('en', '/r/a/b') → '/en/r/a/b', для русского путь не меняется. */
export function localePath(lang: Lang, path: string) {
  if (lang === defaultLang) return path
  return path === '/' ? `/${lang}` : `/${lang}${path}`
}

/** Убирает языковой префикс: '/en/r/a/b' → '/r/a/b'. */
export function stripLang(path: string) {
  return path.replace(new RegExp(`^/(${langs.join('|')})(?=/|$)`), '') || '/'
}

/** Ссылки на все языковые версии страницы для hreflang. */
export function languageAlternates(path: string) {
  return {
    ...Object.fromEntries(langs.map((lang) => [lang, localePath(lang, path)])),
    'x-default': path,
  }
}
