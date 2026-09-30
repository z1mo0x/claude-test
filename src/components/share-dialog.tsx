'use client'

import { useState, type CSSProperties, type Ref } from 'react'
import { Check, Copy, Download, ImageIcon, Link2, X } from 'lucide-react'
import { useI18n } from '@/i18n/client'
import type { Network } from '@/lib/share'
import { BlueskyIcon, LinkedinIcon, RedditIcon, TelegramIcon, ThreadsIcon, VkIcon, XIcon } from './brand-icons'

export const secondary =
  'flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/14 bg-ground/60 px-4 text-[14px] font-semibold transition-colors hover:border-white/30'

export function imageUrl(imagePath: string, ...params: string[]) {
  return params.length ? `${imagePath}?${params.join('&')}` : imagePath
}

type Props = {
  ref: Ref<HTMLDialogElement>
  url: string
  post: string
  imagePath: string
}

type Copied = 'link' | 'text' | 'image' | 'image-failed' | null

type Post = { url: string; text: string; title: string }
const e = encodeURIComponent

/**
 * Ссылки для публикации у самих соцсетей. Какие показывать и в каком порядке — в словаре языка.
 * color — цвет знакомой всем плашки соцсети, чтобы кнопку узнавали с первого взгляда. У X и Threads он чёрный,
 * на тёмном фоне его не видно, поэтому светло-серый.
 */
const networks: Record<Network, { name: string; Icon: typeof XIcon; color: string; href: (post: Post) => string }> = {
  telegram: { name: 'Telegram', Icon: TelegramIcon, color: '#26A5E4', href: ({ url, text }) => `https://t.me/share/url?url=${e(url)}&text=${e(text)}` },
  x: { name: 'X', Icon: XIcon, color: '#E7E7E7', href: ({ url, text }) => `https://x.com/intent/tweet?text=${e(text)}&url=${e(url)}` },
  vk: { name: 'ВКонтакте', Icon: VkIcon, color: '#4C9AFF', href: ({ url, title }) => `https://vk.com/share.php?url=${e(url)}&title=${e(title)}` },
  reddit: { name: 'Reddit', Icon: RedditIcon, color: '#FF5A1F', href: ({ url, title }) => `https://www.reddit.com/submit?url=${e(url)}&title=${e(title)}` },
  linkedin: { name: 'LinkedIn', Icon: LinkedinIcon, color: '#4C9BE8', href: ({ url }) => `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}` },
  threads: { name: 'Threads', Icon: ThreadsIcon, color: '#E7E7E7', href: ({ url, text }) => `https://www.threads.net/intent/post?text=${e(`${text}\n${url}`)}` },
  bluesky: { name: 'Bluesky', Icon: BlueskyIcon, color: '#3D9BFF', href: ({ url, text }) => `https://bsky.app/intent/compose?text=${e(`${text}\n${url}`)}` },
}

/**
 * Попап «Поделиться». Соцсети открываются по их собственным ссылкам для публикации:
 * бесплатно, без SDK и сторонних сервисов. Картинку соцсеть возьмёт из превью ссылки (og:image).
 */
export function ShareDialog({ ref, url, post, imagePath }: Props) {
  const { t } = useI18n()
  const [text, setText] = useState(post)
  const [copied, setCopied] = useState<Copied>(null)
  const card = imageUrl(imagePath)
  const shared = { url, text, title: text.split('\n')[0] }
  const targets = t.share.networks.map((id) => ({ ...networks[id], href: networks[id].href(shared) }))

  function flash(what: Copied) {
    setCopied(what)
    setTimeout(() => setCopied(null), 2000)
  }

  async function copyText(value: string, what: 'link' | 'text') {
    try {
      await navigator.clipboard.writeText(value)
      flash(what)
    } catch {
      // Буфер обмена запрещён: текст остаётся в поле, его можно выделить вручную.
    }
  }

  async function copyImage() {
    try {
      // Промис с картинкой отдаём в ClipboardItem сразу: Safari запрещает запись в буфер после await.
      const png = fetch(card).then((response) => response.blob())
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
      flash('image')
    } catch {
      flash('image-failed')
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="share-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close()
      }}
      className="m-auto max-h-[calc(100dvh-32px)] w-[min(920px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-white/10 bg-panel p-0 text-ink transition duration-300 ease-out backdrop:bg-black/70 backdrop:backdrop-blur-sm starting:open:translate-y-4 starting:open:opacity-0 max-md:mb-0 max-md:max-h-[88dvh] max-md:w-full max-md:max-w-none max-md:rounded-b-none"
    >
      <div className="flex flex-col gap-6 p-5 pb-[max(20px,env(safe-area-inset-bottom))] md:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id="share-title" className="font-serif text-[32px] leading-none font-bold text-bone">
            {t.share.title}
          </h2>
          <form method="dialog">
            <button aria-label={t.share.close} className="-mt-2 -mr-2 grid size-11 place-items-center rounded-lg text-muted transition-colors hover:text-ink">
              <X size={20} aria-hidden="true" />
            </button>
          </form>
        </div>

        {/* На компьютере две колонки: слева то, что уйдёт в пост, справа куда и как. */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,280px)] md:gap-8">
          <div className="flex flex-col gap-6">
            <img
              src={card}
              alt={t.share.imageAlt}
              width={1200}
              height={630}
              loading="lazy"
              className="h-auto w-full rounded-lg border border-white/10 bg-ground"
            />
            <div className="flex flex-col gap-2">
              <label htmlFor="share-post" className="text-[14px] font-semibold">
                {t.share.postLabel}
              </label>
              <textarea
                id="share-post"
                rows={3}
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="w-full resize-none rounded-[10px] border border-white/14 bg-ground/80 px-4 py-3 text-[15px] leading-relaxed focus:border-moss/60"
              />
              <p className="font-mono text-[12px] text-muted">&gt; {t.share.postHint}</p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-2.5">
              {targets.map((target) => (
                <a
                  key={target.name}
                  href={target.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ '--brand': target.color } as CSSProperties}
                  className="flex min-h-11 items-center justify-start gap-2.5 rounded-lg border border-[color-mix(in_srgb,var(--brand)_38%,transparent)] bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] px-3.5 text-[14px] font-semibold transition-colors hover:border-[color-mix(in_srgb,var(--brand)_70%,transparent)] hover:bg-[color-mix(in_srgb,var(--brand)_22%,transparent)]"
                >
                  <target.Icon className="size-[18px] shrink-0 text-(--brand)" />
                  {target.name}
                </a>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-white/8 pt-5">
              <div className="grid gap-2.5 [&>*]:justify-start">
                <button type="button" onClick={() => copyText(url, 'link')} className={secondary}>
                  {copied === 'link' ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
                  {copied === 'link' ? t.share.copied : t.share.copyLink}
                </button>
                <button type="button" onClick={() => copyText(`${text}\n${url}`, 'text')} className={secondary}>
                  {copied === 'text' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                  {copied === 'text' ? t.share.copied : t.share.copyText}
                </button>
                <button type="button" onClick={copyImage} className={secondary}>
                  {copied === 'image' ? <Check size={16} aria-hidden="true" /> : <ImageIcon size={16} aria-hidden="true" />}
                  {copied === 'image' ? t.share.imageCopied : t.share.copyImage}
                </button>
                <a href={imageUrl(imagePath, 'download')} download className={secondary}>
                  <Download size={16} aria-hidden="true" />
                  {t.share.downloadCard}
                </a>
                <a href={imageUrl(imagePath, 'format=story', 'download')} download className={secondary}>
                  <Download size={16} aria-hidden="true" />
                  {t.share.downloadStory}
                </a>
              </div>
              <p aria-live="polite" className="min-h-5 font-mono text-[12px]">
                {copied === 'image-failed' ? (
                  <span className="text-ember">&gt; {t.share.imageFailed}</span>
                ) : (
                  <span className="text-muted">&gt; {t.share.imageHint}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}
