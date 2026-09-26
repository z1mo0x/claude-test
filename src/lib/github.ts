export type RepoFacts = {
  owner: string
  name: string
  url: string
  description: string | null
  language: string | null
  stars: number
  bornAt: string
  diedAt: string | null
  commits: number
  firstWords: string | null
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

async function commitHistory(fullName: string, branch: string) {
  const base = `/repos/${fullName}/commits?per_page=1&sha=${encodeURIComponent(branch)}`
  const res = await gh(base)
  // 409 — пустой репозиторий, коммитов нет.
  if (!res.ok) return { count: 0, first: null, last: null, lastDate: null }

  const [latest] = (await res.json()) as Commit[]
  // При per_page=1 номер последней страницы в Link равен числу коммитов.
  const lastPage = res.headers.get('link')?.match(/[?&]page=(\d+)>;\s*rel="last"/)?.[1]
  const count = lastPage ? Number(lastPage) : latest ? 1 : 0

  let first = latest
  if (count > 1) {
    const oldest = await gh(`${base}&page=${count}`)
    if (oldest.ok) [first] = (await oldest.json()) as Commit[]
  }

  return {
    count,
    first: headline(first?.commit.message),
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
      owner: repo.owner.login,
      name: repo.name,
      url: repo.html_url,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      bornAt: repo.created_at,
      diedAt: history.lastDate ?? repo.pushed_at ?? null,
      commits: history.count,
      firstWords: history.first,
      lastWords: history.last,
    },
  }
}
