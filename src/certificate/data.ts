import { causeLabel } from '@/lib/causes'
import { plotNumber } from '@/lib/format'
import type { Grave } from '@/lib/store'
import type { CertificateData } from './types'

export function certificateFromGrave(grave: Grave, site: string): CertificateData {
  return {
    owner: grave.owner,
    name: grave.name,
    language: grave.language,
    bornAt: grave.bornAt,
    diedAt: grave.diedAt,
    commits: grave.commits,
    lastWords: grave.lastWords,
    cause: causeLabel(grave.cause),
    epitaph: grave.epitaph,
    buriedBy: grave.buriedBy,
    plot: plotNumber(grave.id),
    issuedAt: grave.createdAt,
    site,
  }
}
