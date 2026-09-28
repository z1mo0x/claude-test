import { dictionary, type Lang } from '@/i18n'
import { isCause } from '@/lib/causes'
import { mournerLabel, plotNumber } from '@/lib/format'
import type { Grave } from '@/lib/store'
import type { CertificateData } from './types'

export function certificateFromGrave(grave: Grave, site: string, lang: Lang): CertificateData {
  const { causes } = dictionary(lang)
  return {
    lang,
    owner: grave.owner,
    name: grave.name,
    language: grave.language,
    bornAt: grave.bornAt,
    diedAt: grave.diedAt,
    commits: grave.commits,
    lastWords: grave.lastWords,
    cause: causes[isCause(grave.cause) ? grave.cause : 'other'],
    epitaph: grave.epitaph,
    buriedBy: mournerLabel(grave.buriedBy),
    plot: plotNumber(grave.id),
    issuedAt: grave.createdAt,
    site,
  }
}
