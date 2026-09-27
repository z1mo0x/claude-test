/** Снимок репозитория на момент похорон. Потом он не меняется: свидетельство — документ. */
export type RepoFacts = {
  /** id репозитория на GitHub. В отличие от owner/name, не меняется при переименовании и передаче. */
  repoId: number
  owner: string
  name: string
  description: string | null
  language: string | null
  topics: string[]
  /** SPDX-код лицензии: MIT, Apache-2.0… null — лицензии нет или GitHub её не распознал. */
  license: string | null
  stars: number
  bornAt: string
  diedAt: string | null
  commits: number
  lastWords: string | null
}

export type LookupError = 'invalid' | 'not_found' | 'rate_limited' | 'unavailable'

type Commit = { commit: { message: string; committer: { date: string } | null } }

const API = 'https://api.github.com'

async function gh(path: string) {
  const token = process.env.GITHUB_TOKEN
  return fetch(`${API}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'projectyard-bury',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    next: { revalidate: 600 },
  })
}

function headline(message: string | undefined) {
  return message ? message.split('\n')[0].trim().slice(0, 120) || null : null
}

/** NOASSERTION — лицензия есть, но GitHub не понял какая. Для нас это то же, что её нет. */
function spdx(id: string | null | undefined) {
  return id && id !== 'NOASSERTION' ? id : null
}

async function commitHistory(fullName: string, branch: string) {
  const res = await gh(`/repos/${fullName}/commits?per_page=1&sha=${encodeURIComponent(branch)}`)
  // 409 — пустой репозиторий, коммитов нет.
  if (!res.ok) return { count: 0, last: null, lastDate: null }

  const [latest] = (await res.json()) as Commit[]
  // При per_page=1 номер последней страницы в Link равен числу коммитов.
  const lastPage = res.headers.get('link')?.match(/[?&]page=(\d+)>;\s*rel="last"/)?.[1]
  const count = lastPage ? Number(lastPage) : latest ? 1 : 0

  return {
    count,
    last: headline(latest?.commit.message),
    lastDate: latest?.commit.committer?.date ?? null,
  }
}

export async function fetchRepo(
  owner: string,
  name: string,
): Promise<{ ok: true; repo: RepoFacts } | { ok: false; error: LookupError }> {
  let res: Response
  try {
    res = await gh(`/repos/${owner}/${name}`)
  } catch {
    return { ok: false, error: 'unavailable' }
  }
  if (res.status === 404) return { ok: false, error: 'not_found' }
  if (res.status === 403 || res.status === 429) return { ok: false, error: 'rate_limited' }
  if (!res.ok) return { ok: false, error: 'unavailable' }

  const repo = await res.json()
  const history = await commitHistory(repo.full_name, repo.default_branch)

  return {
    ok: true,
    repo: {
      repoId: repo.id,
      owner: repo.owner.login,
      name: repo.name,
      description: repo.description,
      language: repo.language,
      topics: repo.topics ?? [],
      license: spdx(repo.license?.spdx_id),
      stars: repo.stargazers_count,
      bornAt: repo.created_at,
      diedAt: history.lastDate ?? repo.pushed_at ?? null,
      commits: history.count,
      lastWords: history.last,
    },
  }
}
