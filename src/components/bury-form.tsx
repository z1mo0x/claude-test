'use client'

import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence } from 'motion/react'
import { Check, Shuffle, X } from 'lucide-react'
import { bury, lookup } from '@/app/actions'
import { formatSize, type CertificateData } from '@/certificate/types'
import { defaultVariant, getVariant, variants } from '@/certificate/variants'
import { webAssets } from '@/certificate/web-assets'
import { useI18n } from '@/i18n/client'
import { causeIds, type CauseId } from '@/lib/causes'
import { EPITAPH_MAX, NAME_MAX } from '@/lib/config'
import { daysBetween, mournerLabel, plotNumber } from '@/lib/format'
import type { RepoFacts } from '@/lib/github'
import { rememberLogin, savedLogin } from '@/lib/local-profile'
import { isLinkPrefix, isLogin, linkPrefix, normalizeLogin, parseRepoLink } from '@/lib/repo-link'
import { BotCheck, botCheckEnabled } from './bot-check'
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

/**
 * Кнопка выбора в ряду: причина смерти, оформление. Выбранная пишется жирным, и чтобы ряд
 * не перестраивался, под жирный текст место занято заранее невидимой копией подписи.
 */
function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={
        selected
          ? 'min-h-11 rounded-full border border-moss bg-moss/22 px-4 text-[14px] font-bold text-moss-light shadow-[0_0_14px_rgba(120,184,90,0.35)]'
          : 'min-h-11 rounded-full border border-white/20 bg-ground/75 px-4 text-[14px] text-ink/85 transition-colors hover:border-white/40 hover:bg-ground/90'
      }
    >
      <span className="grid text-center">
        <span aria-hidden="true" className="invisible col-start-1 row-start-1 font-bold">
          {children}
        </span>
        <span className="col-start-1 row-start-1">{children}</span>
      </span>
    </button>
  )
}

function Step({ n, children, htmlFor }: { n: string; children: ReactNode; htmlFor?: string }) {
  const Tag = htmlFor ? 'label' : 'span'
  return (
    <Tag htmlFor={htmlFor} className="flex items-baseline gap-3 text-[16px] font-semibold">
      <span className="font-mono text-[13px] text-moss">{n}</span>
      {children}
    </Tag>
  )
}

export function BuryForm({ nextPlot }: { nextPlot: number }) {
  const { lang, t, path } = useI18n()
  const [link, setLink] = useState(linkPrefix(null))
  const [found, setFound] = useState<Found>({ status: 'idle' })
  const [cause, setCause] = useState<CauseId>('better')
  const [epitaph, setEpitaph] = useState(t.epitaphs[0])
  const [buriedBy, setBuriedBy] = useState('')
  const [adoptable, setAdoptable] = useState(false)
  // Токен Turnstile. Одноразовый: после попытки похорон виджет пересоздаётся (checkRound).
  const [human, setHuman] = useState('')
  const [checkRound, setCheckRound] = useState(0)
  const [variant, setVariant] = useState(defaultVariant.id)
  const [ceremony, setCeremony] = useState(false)
  const [today] = useState(() => new Date().toISOString())
  const request = useRef(0)
  const linkInput = useRef<HTMLInputElement>(null)
  const loginValid = isLogin(buriedBy)

  // Ник из прошлых похорон: сразу в поле и в заготовку ссылки. Только после загрузки,
  // чтобы разметка с сервера совпала с первой отрисовкой.
  useEffect(() => {
    const login = savedLogin()
    if (!login) return
    setBuriedBy(login)
    setLink((current) => (current === linkPrefix(null) ? linkPrefix(login) : current))
  }, [])

  useEffect(() => {
    const id = ++request.current
    if (!link.trim() || isLinkPrefix(link)) {
      setFound({ status: 'idle' })
      return
    }
    const parsed = parseRepoLink(link)
    if (parsed) setFound({ status: 'loading' })
    const timer = setTimeout(async () => {
      if (!parsed) {
        setFound({ status: 'error', message: t.errors.invalid })
        return
      }
      const result = await lookup(link).catch(() => ({ ok: false as const, error: 'unavailable' as const }))
      if (id !== request.current) return
      if (!result.ok) {
        setFound({ status: 'error', message: t.errors[result.error] })
        return
      }
      setFound(
        result.buriedHref ? { status: 'buried', repo: result.repo, path: result.buriedHref } : { status: 'found', repo: result.repo },
      )
    }, 450)
    return () => clearTimeout(timer)
  }, [link, t])

  const repo = found.status === 'found' || found.status === 'buried' ? found.repo : null
  const checking = botCheckEnabled && !human
  const ready = found.status === 'found' && epitaph.trim().length > 0 && loginValid && !checking

  const preview: CertificateData = {
    lang,
    owner: repo?.owner ?? t.form.previewOwner,
    name: repo?.name ?? t.form.previewName,
    language: repo?.language ?? null,
    bornAt: repo?.bornAt ?? null,
    diedAt: repo?.diedAt ?? null,
    commits: repo?.commits ?? 0,
    lastWords: repo?.lastWords ?? null,
    cause: t.causes[cause],
    epitaph: epitaph.trim() || '…',
    buriedBy: mournerLabel(buriedBy || null),
    plot: plotNumber(nextPlot),
    issuedAt: today,
    site: '',
  }
  const certificate = (
    <div className={repo ? undefined : 'opacity-45'}>
      <CertificateFrame {...formatSize.card}>{getVariant(variant).render(preview, 'card', webAssets)}</CertificateFrame>
    </div>
  )

  const commit = useCallback(async () => {
    const result = await bury({ link, cause, epitaph, buriedBy, adoptable, variant, human })
    if (result.ok) rememberLogin(buriedBy)
    setHuman('')
    setCheckRound((round) => round + 1)
    return result
  }, [link, cause, epitaph, buriedBy, adoptable, variant, human])
  const abort = useCallback(() => setCeremony(false), [])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (ready) setCeremony(true)
  }

  function paste(event: ClipboardEvent<HTMLInputElement>) {
    if (!isLinkPrefix(link)) return
    const text = event.clipboardData.getData('text').trim()
    // Полная ссылка или owner/repo поверх заготовки заменяют её, а не приклеиваются в конец.
    if (/github\.com|^https?:/i.test(text)) {
      event.preventDefault()
      setLink(text)
    } else if (/^[\w.-]+\/[\w.-]+/.test(text)) {
      event.preventDefault()
      setLink(linkPrefix(null) + text)
    }
  }

  function clearLink() {
    setLink('')
    linkInput.current?.focus()
  }

  function shuffle() {
    const next = (t.epitaphs.indexOf(epitaph) + 1) % t.epitaphs.length
    setEpitaph(t.epitaphs[next])
  }

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:items-start">
      <form onSubmit={submit} className="stone-panel flex flex-col gap-7 rounded-2xl border border-white/10 p-5 md:p-8">
        <div className="flex flex-col gap-3">
          <Step n="01" htmlFor="repo">
            {t.form.link}
          </Step>
          <div className="relative">
            <input
              ref={linkInput}
              id="repo"
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder={t.form.linkPlaceholder}
              value={link}
              onChange={(event) => setLink(event.target.value)}
              onPaste={paste}
              aria-describedby="repo-status"
              className={`${input} pr-12`}
            />
            {link && (
              <button
                type="button"
                onClick={clearLink}
                aria-label={t.form.clearLink}
                className="absolute top-1/2 right-1.5 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-muted transition-colors hover:text-ink"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>
          <p id="repo-status" aria-live="polite" className="min-h-5 font-mono text-[13px] leading-relaxed">
            {found.status === 'idle' && <span className="text-muted">&gt; {t.form.waiting}</span>}
            {found.status === 'loading' && <span className="text-muted">&gt; {t.form.searching}</span>}
            {found.status === 'error' && <span className="text-ember">&gt; {found.message}</span>}
            {found.status === 'found' && (
              <span className="glow text-moss">
                &gt; {t.form.found}:{' '}
                {[
                  found.repo.language,
                  t.format.commits(found.repo.commits),
                  found.repo.diedAt && t.certificate.silence(t.format.lifetime(daysBetween(found.repo.diedAt, today))),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            )}
            {found.status === 'buried' && (
              <span className="text-ember">
                &gt; {t.form.alreadyBuried}{' '}
                <Link href={path(found.path)} className="text-moss-light underline underline-offset-4">
                  {t.form.openCertificate}
                </Link>
              </span>
            )}
          </p>
          {repo && <div className="lg:hidden">{certificate}</div>}
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3">
            <Step n="02">{t.form.cause}</Step>
          </legend>
          <div className="flex flex-wrap gap-2">
            {causeIds.map((id) => (
              <Chip key={id} selected={cause === id} onClick={() => setCause(id)}>
                {t.causes[id]}
              </Chip>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-3">
          <Step n="03" htmlFor="epitaph">
            {t.form.epitaph}
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
              className="flex min-h-11 items-center gap-2 rounded-lg border border-white/20 bg-ground/75 px-3.5 text-[14px] font-semibold transition-colors hover:border-white/40"
            >
              <Shuffle size={17} aria-hidden="true" />
              {t.form.shuffle}
            </button>
            <span className="font-mono text-[13px] text-muted">
              {epitaph.length} / {EPITAPH_MAX}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Step n="04" htmlFor="buried-by">
            {t.form.mourner} <span className="text-[14px] font-medium text-muted">{t.form.mournerNote}</span>
          </Step>
          <div className="relative">
            <span aria-hidden="true" className="absolute top-1/2 left-4 -translate-y-1/2 font-mono text-[15px] text-muted">
              @
            </span>
            <input
              id="buried-by"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={NAME_MAX}
              placeholder={t.form.mournerPlaceholder}
              value={buriedBy}
              onChange={(event) => setBuriedBy(normalizeLogin(event.target.value))}
              aria-describedby="buried-by-hint"
              aria-invalid={buriedBy !== '' && !loginValid}
              className={`${input} pl-8`}
            />
          </div>
          <p id="buried-by-hint" className="min-h-5 font-mono text-[13px]">
            {buriedBy && !loginValid ? (
              <span className="text-ember">&gt; {t.form.mournerInvalid}</span>
            ) : (
              <span className="text-muted">&gt; {t.form.mournerHint}</span>
            )}
          </p>
        </div>

        {variants.length > 1 && (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3">
              <Step n="05">{t.form.style}</Step>
            </legend>
            <div className="flex flex-wrap gap-2">
              {variants.map((item) => (
                <Chip key={item.id} selected={variant === item.id} onClick={() => setVariant(item.id)}>
                  {item.title}
                </Chip>
              ))}
            </div>
          </fieldset>
        )}

        <label className="group flex min-h-11 cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={adoptable}
            onChange={(event) => setAdoptable(event.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-[5px] border border-white/25 bg-ground/80 transition-colors group-hover:border-white/45 peer-checked:border-moss peer-checked:bg-moss/15 peer-checked:shadow-[0_0_12px_rgba(120,184,90,0.35)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-moss"
          >
            {adoptable && <Check size={14} strokeWidth={3} className="text-moss-light drop-shadow-[0_0_4px_rgba(166,212,122,0.6)]" />}
          </span>
          <span className="text-[15px] leading-snug text-ink/85">
            {t.form.adoptable}
          </span>
        </label>

        <BotCheck key={checkRound} onToken={setHuman} />
        {checking && found.status === 'found' && (
          <p className="-mb-4 font-mono text-[13px] text-muted">&gt; {t.form.checking}</p>
        )}

        <button
          type="submit"
          disabled={!ready}
          className="stone-button flex h-15 items-center justify-center font-extrabold tracking-[0.06em] uppercase disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t.form.submit}
        </button>
      </form>

      <div className="hidden flex-col gap-3 lg:sticky lg:top-24 lg:flex">
        <p className="font-mono text-[13px] text-muted">&gt; {t.form.preview}</p>
        {certificate}
      </div>

      <AnimatePresence>
        {ceremony && repo && <FuneralScene repo={repo} epitaph={epitaph.trim()} commit={commit} onAbort={abort} />}
      </AnimatePresence>
    </div>
  )
}
