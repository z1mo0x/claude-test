import { isCause } from './causes'
import { EPITAPH_MAX, NAME_MAX } from './config'
import { gravePath, slugOf } from './repo-link'
import { findGrave, type CertificateSource } from './store'

/**
 * Пока база не подключена, свидетельство целиком едет в ссылке:
 * /r/owner/repo?d=<base64url(JSON)>. Такая ссылка открывает именно это
 * свидетельство и подтягивает его картинку без всякого хранилища.
 */
type Payload = {
  o: string
  n: string
  l: string | null
  b: string
  d: string | null
  c: number
  w: string | null
  k: string
  e: string
  by: string | null
  v: string
  p: number
  t: string
}

export function encodeGrave(g: CertificateSource) {
  const payload: Payload = {
    o: g.owner,
    n: g.name,
    l: g.language,
    b: g.bornAt,
    d: g.diedAt,
    c: g.commits,
    w: g.lastWords,
    k: g.cause,
    e: g.epitaph,
    by: g.buriedBy,
    v: g.variant,
    p: g.id,
    t: g.createdAt,
  }
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

const text = (v: unknown, max: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= max
const optionalText = (v: unknown, max: number): v is string | null => v === null || text(v, max)
const date = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))
const count = (v: unknown, max: number): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max

export function decodeGrave(token: string, owner: string, repo: string): CertificateSource | null {
  let p: Partial<Payload>
  try {
    p = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (
    !p ||
    !text(p.o, 39) ||
    !text(p.n, 100) ||
    !optionalText(p.l, 40) ||
    !date(p.b) ||
    !(p.d === null || date(p.d)) ||
    !count(p.c, 10_000_000) ||
    !optionalText(p.w, 120) ||
    !text(p.k, 20) ||
    !isCause(p.k) ||
    !text(p.e, EPITAPH_MAX) ||
    !optionalText(p.by, NAME_MAX) ||
    !text(p.v, 40) ||
    !count(p.p, 999_999) ||
    !date(p.t) ||
    slugOf(p.o, p.n) !== slugOf(owner, repo)
  ) {
    return null
  }
  return {
    owner: p.o,
    name: p.n,
    language: p.l,
    bornAt: p.b,
    diedAt: p.d,
    commits: p.c,
    lastWords: p.w,
    cause: p.k,
    epitaph: p.e,
    buriedBy: p.by,
    variant: p.v,
    id: p.p,
    createdAt: p.t,
  }
}

/** Свидетельство по адресу: из ссылки, если там есть ?d=, иначе из базы. */
export async function resolveGrave(owner: string, repo: string, token: string | null | undefined) {
  if (token) return decodeGrave(token, owner, repo)
  return findGrave(slugOf(owner, repo))
}

export function graveHref(grave: Pick<CertificateSource, 'owner' | 'name'>, token?: string | null) {
  const path = gravePath(grave.owner, grave.name)
  return token ? `${path}?d=${token}` : path
}
