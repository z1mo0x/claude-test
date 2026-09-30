'use server'

import { after } from 'next/server'
import { announceReport } from '@/bot/handlers'
import { clean } from '@/lib/clean'
import { clientIp, ipHash } from '@/lib/client-ip'
import { REPORT_CONTACT_MAX, REPORT_LIMITS, REPORT_REASON_MAX } from '@/lib/config'
import type { ReportError } from '@/lib/errors'
import { slugOf } from '@/lib/repo-link'
import { findGrave, getStore, type ReportKind } from '@/lib/store'
import { verifyHuman } from '@/lib/turnstile'

export type ReportInput = {
  owner: string
  name: string
  kind: ReportKind
  reason: string
  contact: string
  /** Токен Cloudflare Turnstile из формы. Пустой, если проверка на бота выключена. */
  human: string
}

export type ReportResult = { ok: true } | { ok: false; error: ReportError }

const KINDS: readonly string[] = ['remove_own', 'complaint'] satisfies ReportKind[]

/**
 * Обращение только записывается. Могилы отсюда не удаляются: владелец разбирает каждое
 * вручную, иначе форма стала бы кнопкой «удалить чужие могилы».
 */
export async function report(input: ReportInput): Promise<ReportResult> {
  const kind = String(input?.kind)
  const reason = clean(input?.reason, REPORT_REASON_MAX)
  const contact = clean(input?.contact, REPORT_CONTACT_MAX)
  if (!KINDS.includes(kind) || !reason) return { ok: false, error: 'bad_input' }

  const ip = await clientIp()
  if (!(await verifyHuman(String(input.human ?? ''), ip))) return { ok: false, error: 'bot' }

  const hash = ipHash(ip)
  try {
    const grave = await findGrave(slugOf(String(input.owner), String(input.name)))
    if (!grave) return { ok: false, error: 'not_found' }

    const now = Date.now()
    for (const { limit, windowMs } of REPORT_LIMITS) {
      if ((await getStore().recentReports(hash, new Date(now - windowMs))) >= limit) return { ok: false, error: 'too_many' }
    }

    const id = await getStore().createReport({ slug: grave.slug, kind: kind as ReportKind, reason, contact: contact || null, ipHash: hash })
    // Владельцу в Telegram карточкой с кнопками, если бот настроен. after: отправка доедет после ответа, обращение уже сохранено.
    after(() => announceReport(id))
    return { ok: true }
  } catch (error) {
    console.error('Не удалось сохранить обращение', error)
    return { ok: false, error: 'storage' }
  }
}
