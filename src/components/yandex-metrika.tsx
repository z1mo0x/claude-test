'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { YANDEX_METRIKA_ID } from '@/lib/config'

declare global {
  interface Window {
    ym?: (id: number, method: string, ...args: unknown[]) => void
  }
}

/**
 * Прошлый адрес хранится в модуле, а не в компоненте: при смене языка меняется сегмент [lang] и компонент
 * создаётся заново, а переход всё равно нужно засчитать.
 */
let previousUrl: string | null = null

/**
 * Счётчик Яндекс.Метрики. Вебвизор и карта кликов выключены: они записывают, что люди вводят на странице,
 * а в форме «Удалить или пожаловаться» это личный текст. Считаются визиты, источники и переходы по ссылкам.
 * Только в продакшене, чтобы разработка и превью не портили цифры.
 *
 * Next переключает страницы без перезагрузки, поэтому о каждом переходе после первого сообщаем счётчику сами:
 * так похороны (переход на свидетельство) тоже попадают в статистику.
 */
export function YandexMetrika() {
  const id = Number(YANDEX_METRIKA_ID)
  const pathname = usePathname()

  useEffect(() => {
    if (!id || process.env.NODE_ENV !== 'production') return
    const url = window.location.href
    // Первое посещение считает init внутри скрипта, здесь только переходы дальше.
    if (previousUrl !== null && previousUrl !== url) window.ym?.(id, 'hit', url, { referer: previousUrl })
    previousUrl = url
  }, [id, pathname])

  if (!id || process.env.NODE_ENV !== 'production') return null

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=${id}','ym');ym(${id},'init',{ssr:true,webvisor:false,clickmap:false,accurateTrackBounce:true,trackLinks:true,referrer:document.referrer,url:location.href});`}
      </Script>
      <noscript>
        <div>
          <img src={`https://mc.yandex.ru/watch/${id}`} style={{ position: 'absolute', left: '-9999px' }} alt="" />
        </div>
      </noscript>
    </>
  )
}
