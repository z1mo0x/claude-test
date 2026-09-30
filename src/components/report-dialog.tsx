'use client'

import { useRef, useState, type FormEvent } from 'react'
import { Flag, X } from 'lucide-react'
import { report, type ReportInput } from '@/app/report-actions'
import { useI18n } from '@/i18n/client'
import { REPORT_CONTACT_MAX, REPORT_REASON_MAX } from '@/lib/config'
import { BotCheck, botCheckEnabled } from './bot-check'

type Props = { owner: string; name: string }
type Status = { state: 'idle' | 'sending' | 'done' } | { state: 'error'; message: string }

const field =
  'w-full rounded-[10px] border border-white/14 bg-ground/80 px-4 py-3 text-[15px] text-ink placeholder:text-muted/80 focus:border-moss/60'

/**
 * «Удалить или пожаловаться». Форма ничего не удаляет: обращение уходит в закрытую таблицу
 * reports, дальше его разбирает владелец сайта.
 */
export function ReportDialog({ owner, name }: Props) {
  const { t } = useI18n()
  const dialog = useRef<HTMLDialogElement>(null)
  const [kind, setKind] = useState<ReportInput['kind']>('remove_own')
  const [reason, setReason] = useState('')
  const [contact, setContact] = useState('')
  const [human, setHuman] = useState('')
  // Токен Turnstile одноразовый: после каждой попытки виджет создаётся заново.
  const [round, setRound] = useState(0)
  const [status, setStatus] = useState<Status>({ state: 'idle' })
  const busy = status.state === 'sending' || (botCheckEnabled && !human)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy || status.state === 'done') return
    setStatus({ state: 'sending' })
    const result = await report({ owner, name, kind, reason, contact, human }).catch(() => null)
    if (result?.ok) {
      setStatus({ state: 'done' })
      return
    }
    setHuman('')
    setRound((value) => value + 1)
    setStatus({ state: 'error', message: t.report.errors[result ? result.error : 'storage'] })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
        className="flex min-h-11 items-center gap-2 text-[14px] font-semibold text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
      >
        <Flag size={15} aria-hidden="true" />
        {t.report.open}
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="report-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
        className="m-auto max-h-[calc(100dvh-32px)] w-[min(520px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-white/10 bg-panel p-0 text-ink transition duration-300 ease-out backdrop:bg-black/70 backdrop:backdrop-blur-sm starting:open:translate-y-4 starting:open:opacity-0 max-md:mb-0 max-md:max-h-[88dvh] max-md:w-full max-md:max-w-none max-md:rounded-b-none"
      >
        <form onSubmit={submit} className="flex flex-col gap-5 p-5 pb-[max(20px,env(safe-area-inset-bottom))] md:p-7">
          <div className="flex items-start justify-between gap-4">
            <h2 id="report-title" className="font-serif text-[28px] leading-none font-bold text-bone">
              {t.report.title}
            </h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label={t.report.close}
              className="-mt-2 -mr-2 grid size-11 place-items-center rounded-lg text-muted transition-colors hover:text-ink"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2.5 text-[14px] font-semibold">{t.report.kind}</legend>
            {(['remove_own', 'complaint'] as const).map((value) => (
              <label
                key={value}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border border-white/14 bg-ground/60 px-4 text-[15px] has-checked:border-moss/60"
              >
                <input
                  type="radio"
                  name="report-kind"
                  value={value}
                  checked={kind === value}
                  onChange={() => setKind(value)}
                  className="accent-moss"
                />
                {value === 'remove_own' ? t.report.removeOwn : t.report.complaint}
              </label>
            ))}
          </fieldset>

          <div className="flex flex-col gap-2">
            <label htmlFor="report-reason" className="text-[14px] font-semibold">
              {t.report.reason}
            </label>
            <textarea
              id="report-reason"
              rows={4}
              required
              maxLength={REPORT_REASON_MAX}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t.report.reasonPlaceholder}
              className={`${field} resize-none leading-relaxed`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="report-contact" className="text-[14px] font-semibold">
              {t.report.contact}
            </label>
            <input
              id="report-contact"
              maxLength={REPORT_CONTACT_MAX}
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder={t.report.contactPlaceholder}
              autoComplete="off"
              className={`${field} min-h-12 font-mono`}
            />
          </div>

          <p className="font-mono text-[12px] text-muted">&gt; {t.report.note}</p>
          <BotCheck key={round} onToken={setHuman} />

          <p aria-live="polite" className="min-h-5 font-mono text-[13px]">
            {status.state === 'error' && <span className="text-ember">&gt; {status.message}</span>}
            {status.state === 'done' && <span className="text-moss-light">&gt; {t.report.done}</span>}
          </p>

          {status.state === 'done' ? (
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="flex min-h-12 items-center justify-center rounded-[10px] border border-white/14 bg-ground/60 px-6 font-bold"
            >
              {t.report.close}
            </button>
          ) : (
            <button
              type="submit"
              disabled={busy}
              className="neon flex min-h-12 items-center justify-center rounded-[10px] bg-moss px-6 font-extrabold text-[#07120a] disabled:opacity-60"
            >
              {status.state === 'sending' ? t.report.sending : t.report.submit}
            </button>
          )}
        </form>
      </dialog>
    </>
  )
}
