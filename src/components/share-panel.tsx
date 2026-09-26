'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Check, Copy, Download, Link2, Share2 } from 'lucide-react'

type Props = {
  url: string
  post: string
  imagePath: string
  fileName: string
  /** Кнопка «Поделиться» слегка покачивается, чтобы её заметили сразу после похорон. */
  breathe: boolean
}

const secondary =
  'flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/14 px-4 text-[14px] font-semibold transition-colors hover:border-white/30'

export function SharePanel({ url, post, imagePath, fileName, breathe }: Props) {
  const reduced = useReducedMotion()
  const [text, setText] = useState(post)
  const [copied, setCopied] = useState<'link' | 'post' | null>(null)
  const [native, setNative] = useState(false)

  useEffect(() => {
    setNative(typeof navigator.share === 'function')
  }, [])

  async function copy(value: string, what: 'link' | 'post') {
    await navigator.clipboard.writeText(value)
    setCopied(what)
    setTimeout(() => setCopied(null), 2000)
  }

  async function share() {
    if (!native) {
      await copy(`${text}\n${url}`, 'post')
      return
    }
    try {
      const response = await fetch(`${imagePath}?format=story`)
      const file = new File([await response.blob()], `${fileName}-story.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${text}\n${url}` })
      } else {
        await navigator.share({ text, url })
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') console.error(error)
    }
  }

  const encoded = { url: encodeURIComponent(url), text: encodeURIComponent(text) }
  const targets = [
    { name: 'Telegram', href: `https://t.me/share/url?url=${encoded.url}&text=${encoded.text}` },
    { name: 'ВКонтакте', href: `https://vk.com/share.php?url=${encoded.url}&title=${encodeURIComponent(text.split('\n')[0])}` },
    { name: 'X', href: `https://twitter.com/intent/tweet?text=${encoded.text}&url=${encoded.url}` },
  ]

  return (
    <div className="grid gap-8 rounded-2xl border border-white/10 bg-panel/90 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:p-8">
      <div className="flex flex-col gap-5">
        <h2 className="font-serif text-[30px] leading-none font-bold text-bone">Поделись</h2>

        <div className="flex flex-col gap-2">
          <label htmlFor="post" className="text-[14px] font-semibold">
            Текст поста
          </label>
          <textarea
            id="post"
            rows={3}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="w-full resize-none rounded-[10px] border border-white/14 bg-ground/80 px-4 py-3 text-[15px] leading-relaxed focus:border-moss/60"
          />
          <p className="font-mono text-[12px] text-muted">&gt; ссылка добавится сама, к ней прикрепится свидетельство</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <motion.button
            type="button"
            onClick={share}
            animate={breathe && !reduced ? { y: [10, 0, 10] } : undefined}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="flex min-h-12 items-center gap-2 rounded-[10px] bg-moss px-6 font-extrabold text-[#07120a] shadow-[0_0_30px_rgba(120,184,90,0.25)]"
          >
            <Share2 size={18} aria-hidden="true" />
            {copied === 'post' ? 'Текст и ссылка скопированы' : 'Поделиться'}
          </motion.button>
          {targets.map((target) => (
            <a key={target.name} href={target.href} target="_blank" rel="noopener noreferrer" className={secondary}>
              {target.name}
            </a>
          ))}
          <button type="button" onClick={() => copy(url, 'link')} className={secondary}>
            {copied === 'link' ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
            {copied === 'link' ? 'Скопировано' : 'Ссылка'}
          </button>
          <button type="button" onClick={() => copy(`${text}\n${url}`, 'post')} className={secondary}>
            <Copy size={16} aria-hidden="true" />
            Текст целиком
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5 md:items-start">
        <img
          src={`${imagePath}?format=story`}
          alt="Свидетельство для сторис"
          width={1080}
          height={1920}
          className="hidden h-auto w-[150px] rounded-lg border border-white/10 bg-ground md:block"
        />
        <div className="flex flex-wrap gap-2.5 md:flex-col">
          <a href={`${imagePath}?format=story&download`} download className={secondary}>
            <Download size={16} aria-hidden="true" />
            Для сторис
          </a>
          <a href={`${imagePath}?download`} download className={secondary}>
            <Download size={16} aria-hidden="true" />
            PNG 1200×630
          </a>
        </div>
      </div>
    </div>
  )
}
