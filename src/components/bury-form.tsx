'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence } from 'motion/react'
import { Shuffle } from 'lucide-react'
import { bury, lookup } from '@/app/actions'
import { formatSize, type CertificateData } from '@/certificate/types'
import { defaultVariant, getVariant, variants } from '@/certificate/variants'
import { webAssets } from '@/certificate/web-assets'
import { causeLabel, causes, epitaphs, type CauseId } from '@/lib/causes'
import { EPITAPH_MAX, NAME_MAX } from '@/lib/config'
import { errorMessages } from '@/lib/errors'
import { commitsLabel, daysBetween, lifetime, plotNumber } from '@/lib/format'
import type { RepoFacts } from '@/lib/github'
import { localGraves, rememberGrave, useLocalGraveCount } from '@/lib/local-graves'
import { parseRepoLink, slugOf } from '@/lib/repo-link'
import { CertificateFrame } from './certificate-frame'
import { FuneralScene } from './funeral-scene'

type Found =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'found'; repo: RepoFacts }
  | { status: 'buried'; repo: RepoFacts; path: string }

const input =
  'h-13 w-full rounded-[10px] border border-white/14 bg-ground/80 px-4 font-mono text-[15px] text-ink placeholder:text-muted/80 focus:border-moss/60'

function Step({ n, children, htmlFor }: { n: string; children: ReactNode; htmlFor?: string }) {
  const Tag = htmlFor ? 'label' : 'span'
  return (
    <Tag htmlFor={htmlFor} className="flex items-baseline gap-3 text-[16px] font-semibold">
      <span className="font-mono text-[13px] text-moss">{n}</span>
      {children}
    </Tag>
  )
}

export function BuryForm({ nextPlot }: { nextPlot: number | null }) {
  const [link, setLink] = useState('')
  const [found, setFound] = useState<Found>({ status: 'idle' })
  const [cause, setCause] = useState<CauseId>('better')
  const [epitaph, setEpitaph] = useState(epitaphs[0])
  const [buriedBy, setBuriedBy] = useState('')
  const [adoptable, setAdoptable] = useState(false)
  const [variant, setVariant] = useState(defaultVariant.id)
  const [ceremony, setCeremony] = useState(false)
  const [today] = useState(() => new Date().toISOString())
  const request = useRef(0)
  const localCount = useLocalGraveCount()
  const plot = nextPlot ?? localCount + 1

  useEffect(() => {
    const id = ++request.current
    if (!link.trim()) {
      setFound({ status: 'idle' })
      return
    }
    const parsed = parseRepoLink(link)
    if (parsed) setFound({ status: 'loading' })
    const timer = setTimeout(async () => {
      if (!parsed) {
        setFound({ status: 'error', message: errorMessages.invalid })
        return
      }
      const result = await lookup(link).catch(() => ({ ok: false as const, error: 'unavailable' as const }))
      if (id !== request.current) return
      if (!result.ok) {
        setFound({ status: 'error', message: errorMessages[result.error] })
        return
      }
      const buriedHere = localGraves().find((g) => g.slug === slugOf(result.repo.owner, result.repo.name))
      const href = result.buriedHref ?? buriedHere?.href
      setFound(href ? { status: 'buried', repo: result.repo, path: href } : { status: 'found', repo: result.repo })
    }, 450)
    return () => clearTimeout(timer)
  }, [link])

  const repo = found.status === 'found' || found.status === 'buried' ? found.repo : null
  const ready = found.status === 'found' && epitaph.trim().length > 0

  const preview: CertificateData = {
    owner: repo?.owner ?? 'владелец',
    name: repo?.name ?? 'репозиторий',
    language: repo?.language ?? null,
    bornAt: repo?.bornAt ?? null,
    diedAt: repo?.diedAt ?? null,
    commits: repo?.commits ?? 0,
    lastWords: repo?.lastWords ?? null,
    cause: causeLabel(cause),
    epitaph: epitaph.trim() || '…',
    buriedBy: buriedBy.trim() || null,
    plot: plotNumber(plot),
    issuedAt: today,
    site: '',
  }
  const certificate = (
    <div className={repo ? undefined : 'opacity-45'}>
      <CertificateFrame {...formatSize.card}>{getVariant(variant).render(preview, 'card', webAssets)}</CertificateFrame>
    </div>
  )

  const commit = useCallback(async () => {
    const result = await bury({ link, cause, epitaph, buriedBy, adoptable, variant, plot })
    if (result.ok) rememberGrave({ slug: result.slug, href: result.href })
    return result
  }, [link, cause, epitaph, buriedBy, adoptable, variant, plot])
  const abort = useCallback(() => setCeremony(false), [])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (ready) setCeremony(true)
  }

  function shuffle() {
    const next = (epitaphs.indexOf(epitaph) + 1) % epitaphs.length
    setEpitaph(epitaphs[next])
  }

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)] lg:items-start">
      <form onSubmit={submit} className="flex flex-col gap-7 rounded-2xl border border-white/10 bg-panel p-5 md:p-8">
        <div className="flex flex-col gap-3">
          <Step n="01" htmlFor="repo">
            Ссылка на репозиторий
          </Step>
          <input
            id="repo"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://github.com/ник/проект"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            aria-describedby="repo-status"
            className={input}
          />
          <p id="repo-status" aria-live="polite" className="min-h-5 font-mono text-[13px] leading-relaxed">
            {found.status === 'idle' && <span className="text-muted">&gt; жду ссылку на GitHub</span>}
            {found.status === 'loading' && <span className="text-muted">&gt; ищу репозиторий…</span>}
            {found.status === 'error' && <span className="text-ember">&gt; {found.message}</span>}
            {found.status === 'found' && (
              <span className="glow text-moss">
                &gt; найден: {[found.repo.language, commitsLabel(found.repo.commits), found.repo.diedAt && `тишина ${lifetime(daysBetween(found.repo.diedAt, today))}`]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            )}
            {found.status === 'buried' && (
              <span className="text-ember">
                &gt; уже похоронен.{' '}
                <Link href={found.path} className="text-moss-light underline underline-offset-4">
                  Открыть свидетельство
                </Link>
              </span>
            )}
          </p>
          {repo && <div className="lg:hidden">{certificate}</div>}
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3">
            <Step n="02">Причина смерти</Step>
          </legend>
          <div className="flex flex-wrap gap-2">
            {causes.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={cause === item.id}
                onClick={() => setCause(item.id)}
                className={
                  cause === item.id
                    ? 'min-h-11 rounded-full border border-moss bg-moss/14 px-4 text-[14px] font-bold text-moss-light'
                    : 'min-h-11 rounded-full border border-white/14 px-4 text-[14px] text-ink/80 transition-colors hover:border-white/30'
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-3">
          <Step n="03" htmlFor="epitaph">
            Эпитафия
          </Step>
          <textarea
            id="epitaph"
            rows={2}
            maxLength={EPITAPH_MAX}
            value={epitaph}
            onChange={(event) => setEpitaph(event.target.value)}
            className="w-full resize-none rounded-[10px] border border-white/14 bg-ground/80 px-4 py-3 font-serif text-[21px] leading-snug text-ink italic focus:border-moss/60"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={shuffle}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-white/14 px-3.5 text-[14px] font-semibold transition-colors hover:border-white/30"
            >
              <Shuffle size={17} aria-hidden="true" />
              Другая эпитафия
            </button>
            <span className="font-mono text-[13px] text-muted">
              {epitaph.length} / {EPITAPH_MAX}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Step n="04" htmlFor="buried-by">
            Кто хоронит <span className="text-[14px] font-medium text-muted">необязательно</span>
          </Step>
          <input
            id="buried-by"
            type="text"
            maxLength={NAME_MAX}
            placeholder="@ник"
            value={buriedBy}
            onChange={(event) => setBuriedBy(event.target.value)}
            className={input}
          />
        </div>

        {variants.length > 1 && (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3">
              <Step n="05">Оформление</Step>
            </legend>
            <div className="flex flex-wrap gap-2">
              {variants.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={variant === item.id}
                  onClick={() => setVariant(item.id)}
                  className={
                    variant === item.id
                      ? 'min-h-11 rounded-full border border-moss bg-moss/14 px-4 text-[14px] font-bold text-moss-light'
                      : 'min-h-11 rounded-full border border-white/14 px-4 text-[14px] text-ink/80'
                  }
                >
                  {item.title}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <label className="flex min-h-11 cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={adoptable}
            onChange={(event) => setAdoptable(event.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-moss"
          />
          <span className="text-[15px] leading-snug text-ink/85">
            Можно передать проект новому хозяину, когда откроется основной Projectyard
          </span>
        </label>

        <button
          type="submit"
          disabled={!ready}
          className="flex h-15 items-center justify-center rounded-[10px] bg-moss font-extrabold tracking-[0.06em] text-[#07120a] uppercase shadow-[0_0_36px_rgba(120,184,90,0.22)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          Похоронить
        </button>
      </form>

      <div className="hidden flex-col gap-3 lg:sticky lg:top-24 lg:flex">
        <p className="font-mono text-[13px] text-muted">&gt; предпросмотр. Эта картинка прикрепится к ссылке</p>
        {certificate}
      </div>

      <AnimatePresence>
        {ceremony && repo && <FuneralScene repo={repo} epitaph={epitaph.trim()} commit={commit} onAbort={abort} />}
      </AnimatePresence>
    </div>
  )
}
