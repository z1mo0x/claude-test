'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Download, Link2, Share2 } from 'lucide-react'
import { imageUrl, secondary, ShareDialog } from './share-dialog'

type Props = {
  url: string
  post: string
  imagePath: string
  /** d=… без базы, иначе пусто. */
  imageQuery: string
  fileName: string
}

/**
 * Ряд под свидетельством. «Поделиться» на телефоне открывает системное меню с картинкой
 * для сторис, на компьютере — наш попап: системное меню там бедное, а в соцсети удобнее
 * по прямым ссылкам.
 */
export function SharePanel({ url, post, imagePath, imageQuery, fileName }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [native, setNative] = useState(false)
  const [story, setStory] = useState<File | null>(null)
  const [copied, setCopied] = useState(false)
  const storyUrl = imageUrl(imagePath, imageQuery, 'format=story')

  useEffect(() => {
    if (!window.matchMedia('(pointer: coarse)').matches || typeof navigator.share !== 'function') return
    setNative(true)
    // Картинку загружаем заранее: если ждать её после нажатия, браузер (особенно Safari)
    // решает, что это уже не жест пользователя, и не открывает меню.
    let active = true
    fetch(storyUrl)
      .then((response) => (response.ok ? response.blob() : Promise.reject(new Error(String(response.status)))))
      .then((blob) => {
        const file = new File([blob], `${fileName}-story.png`, { type: 'image/png' })
        if (active && navigator.canShare?.({ files: [file] })) setStory(file)
      })
      .catch(() => {
        // Без картинки поделимся текстом и ссылкой, к ссылке всё равно прикрепится превью.
      })
    return () => {
      active = false
    }
  }, [storyUrl, fileName])

  function share() {
    if (!native) {
      dialog.current?.showModal()
      return
    }
    navigator.share(story ? { files: [story], text: `${post}\n${url}` } : { text: post, url }).catch((error: Error) => {
      if (error.name !== 'AbortError') dialog.current?.showModal()
    })
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      dialog.current?.showModal()
    }
  }

  return (
    <>
      <div className="flex gap-2.5 md:flex-wrap">
        <button
          type="button"
          onClick={share}
          aria-haspopup={native ? undefined : 'dialog'}
          className="neon flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[10px] bg-moss px-6 font-extrabold text-[#07120a] md:flex-none"
        >
          <Share2 size={18} aria-hidden="true" />
          Поделиться
        </button>
        <button type="button" onClick={copyLink} className={`${secondary} min-h-12 min-w-12 max-md:px-0`}>
          {copied ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
          <span className="sr-only md:not-sr-only">{copied ? 'Скопировано' : 'Ссылка'}</span>
        </button>
        <a
          href={imageUrl(imagePath, imageQuery, 'format=story', 'download')}
          download
          aria-label="Скачать свидетельство для сторис"
          className={`${secondary} min-h-12 min-w-12 px-0 md:hidden`}
        >
          <Download size={16} aria-hidden="true" />
        </a>
        <a href={imageUrl(imagePath, imageQuery, 'download')} download className={`${secondary} hidden min-h-12 md:flex`}>
          <Download size={16} aria-hidden="true" />
          Скачать PNG
        </a>
      </div>
      <ShareDialog ref={dialog} url={url} post={post} imagePath={imagePath} imageQuery={imageQuery} />
    </>
  )
}
