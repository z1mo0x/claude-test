'use client'

import { useState, type Ref } from 'react'
import { Check, Copy, Download, ImageIcon, Link2, X } from 'lucide-react'

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

/**
 * Попап «Поделиться». Соцсети открываются по их собственным ссылкам для публикации:
 * бесплатно, без SDK и сторонних сервисов. Картинку соцсеть возьмёт из превью ссылки (og:image).
 */
export function ShareDialog({ ref, url, post, imagePath }: Props) {
  const [text, setText] = useState(post)
  const [copied, setCopied] = useState<Copied>(null)
  const card = imageUrl(imagePath)
  const title = text.split('\n')[0]
  const e = encodeURIComponent

  const targets = [
    { name: 'Telegram', href: `https://t.me/share/url?url=${e(url)}&text=${e(text)}` },
    { name: 'X', href: `https://x.com/intent/tweet?text=${e(text)}&url=${e(url)}` },
    { name: 'ВКонтакте', href: `https://vk.com/share.php?url=${e(url)}&title=${e(title)}` },
    { name: 'Reddit', href: `https://www.reddit.com/submit?url=${e(url)}&title=${e(title)}` },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}` },
    { name: 'Threads', href: `https://www.threads.net/intent/post?text=${e(`${text}\n${url}`)}` },
  ]

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
            Поделиться
          </h2>
          <form method="dialog">
            <button aria-label="Закрыть" className="-mt-2 -mr-2 grid size-11 place-items-center rounded-lg text-muted transition-colors hover:text-ink">
              <X size={20} aria-hidden="true" />
            </button>
          </form>
        </div>

        {/* На компьютере две колонки: слева то, что уйдёт в пост, справа куда и как. */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,280px)] md:gap-8">
          <div className="flex flex-col gap-6">
            <img
              src={card}
              alt="Картинка, которая прикрепится к ссылке"
              width={1200}
              height={630}
              loading="lazy"
              className="h-auto w-full rounded-lg border border-white/10 bg-ground"
            />
            <div className="flex flex-col gap-2">
              <label htmlFor="share-post" className="text-[14px] font-semibold">
                Текст поста
              </label>
              <textarea
                id="share-post"
                rows={3}
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="w-full resize-none rounded-[10px] border border-white/14 bg-ground/80 px-4 py-3 text-[15px] leading-relaxed focus:border-moss/60"
              />
              <p className="font-mono text-[12px] text-muted">&gt; ссылка добавится сама, к ней прикрепится свидетельство</p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-2.5">
              {targets.map((target) => (
                <a key={target.name} href={target.href} target="_blank" rel="noopener noreferrer" className={secondary}>
                  {target.name}
                </a>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-white/8 pt-5">
              <div className="grid gap-2.5 [&>*]:justify-start">
                <button type="button" onClick={() => copyText(url, 'link')} className={secondary}>
                  {copied === 'link' ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
                  {copied === 'link' ? 'Скопировано' : 'Копировать ссылку'}
                </button>
                <button type="button" onClick={() => copyText(`${text}\n${url}`, 'text')} className={secondary}>
                  {copied === 'text' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                  {copied === 'text' ? 'Скопировано' : 'Копировать текст'}
                </button>
                <button type="button" onClick={copyImage} className={secondary}>
                  {copied === 'image' ? <Check size={16} aria-hidden="true" /> : <ImageIcon size={16} aria-hidden="true" />}
                  {copied === 'image' ? 'Картинка в буфере' : 'Копировать картинку'}
                </button>
                <a href={imageUrl(imagePath, 'download')} download className={secondary}>
                  <Download size={16} aria-hidden="true" />
                  Скачать PNG 1200×630
                </a>
                <a href={imageUrl(imagePath, 'format=story', 'download')} download className={secondary}>
                  <Download size={16} aria-hidden="true" />
                  Скачать для сторис
                </a>
              </div>
              <p aria-live="polite" className="min-h-5 font-mono text-[12px]">
                {copied === 'image-failed' ? (
                  <span className="text-ember">&gt; браузер не дал скопировать картинку, скачай PNG</span>
                ) : (
                  <span className="text-muted">&gt; картинку из буфера можно вставить в Discord, Telegram или X</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}
