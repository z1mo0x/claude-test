'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

type Turnstile = {
  render(container: HTMLElement, options: Record<string, unknown>): string
  remove(widgetId: string): void
}

declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

/** Проверка на бота включена на этом деплое: задан публичный ключ Turnstile. */
export const botCheckEnabled = Boolean(SITE_KEY)

/**
 * Невидимая проверка Cloudflare Turnstile. Обычно человек её не видит: флажок появляется,
 * только если Cloudflare что-то заподозрил. Токен одноразовый, поэтому после попытки
 * похорон форма пересоздаёт виджет сменой key.
 */
export function BotCheck({ onToken }: { onToken: (token: string) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const callback = useRef(onToken)

  useEffect(() => {
    callback.current = onToken
  }, [onToken])

  useEffect(() => {
    if (!loaded || !SITE_KEY || !box.current || !window.turnstile) return
    const widget = window.turnstile.render(box.current, {
      sitekey: SITE_KEY,
      appearance: 'interaction-only',
      'refresh-expired': 'auto',
      theme: 'dark',
      language: 'ru',
      callback: (token: string) => callback.current(token),
      'expired-callback': () => callback.current(''),
      'error-callback': () => callback.current(''),
    })
    return () => window.turnstile?.remove(widget)
  }, [loaded])

  if (!SITE_KEY) return null
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={() => setLoaded(true)} />
      <div ref={box} className="empty:hidden" />
    </>
  )
}
