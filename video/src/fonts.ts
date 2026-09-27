import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/700.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/700.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'
import { useEffect, useState } from 'react'
import { continueRender, delayRender } from 'remotion'
import { image } from './copy'

const faces = [
  '600 80px "Cormorant Garamond"',
  '700 80px "Cormorant Garamond"',
  'italic 500 80px "Cormorant Garamond"',
  '400 40px "JetBrains Mono"',
  '700 40px "JetBrains Mono"',
  '500 40px Manrope',
  '700 40px Manrope',
  '800 40px Manrope',
]

const pictures = ['logo.png', 'banner.png', 'graveyard.png', 'tombstone.png', 'stone.webp'].map(image)

/** Кадр не снимается, пока не загружены шрифты (и кириллица, и латиница) и картинки. */
export function usePreload() {
  const [handle] = useState(() => delayRender('Шрифты и картинки'))
  useEffect(() => {
    const fonts = faces.map((face) => document.fonts.load(face, 'Аб Ab №'))
    const images = pictures.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = src
        }),
    )
    Promise.all([...fonts, ...images]).then(() => continueRender(handle))
  }, [handle])
}
