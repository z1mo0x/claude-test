import 'server-only'
import { ru } from '@/i18n/ru'
import { commitsLabel, daysBetween, lifetime, plural } from '@/lib/format'
import { GOAL } from '@/lib/config'
import { allGraves, type GraveRow } from './db'
import { botEnv } from './env'

/** Значения для подстановок {…} в текстах постов. Чего нет в базе, того нет и в объекте. */
export type Facts = Record<string, string>

const lived = (g: GraveRow) => (g.died_at ? daysBetween(g.born_at, g.died_at) : 0)

function longest(graves: GraveRow[]) {
  return graves.filter((g) => g.died_at).sort((a, b) => lived(b) - lived(a))[0]
}

function about(prefix: string, g: GraveRow | undefined, site: string): Facts {
  if (!g) return {}
  return {
    [`${prefix}_name`]: g.repo_name,
    [`${prefix}_lived`]: lifetime(lived(g)),
    [`${prefix}_commits`]: commitsLabel(g.commits),
    ...(g.last_words ? { [`${prefix}_words`]: g.last_words } : {}),
    [`${prefix}_cert`]: `${site}/r/${g.repo_owner}/${g.repo_name}/certificate.png`,
    [`${prefix}_page`]: `${site}/r/${g.repo_owner}/${g.repo_name}`,
  }
}

export async function collectFacts(): Promise<{ facts: Facts; total: number; mine: number }> {
  const { ownerLogin, site } = botEnv()
  const graves = await allGraves()

  const byCause = new Map<string, number>()
  for (const g of graves) byCause.set(g.cause, (byCause.get(g.cause) ?? 0) + 1)
  const top = [...byCause.entries()].sort((a, b) => b[1] - a[1])[0]

  const mine = ownerLogin ? graves.filter((g) => g.buried_by?.toLowerCase() === ownerLogin.toLowerCase()) : []

  const facts: Facts = {
    count: String(graves.length),
    count_graves: `${graves.length} ${plural(graves.length, ['могила', 'могилы', 'могил'])}`,
    left: String(Math.max(0, GOAL - graves.length)),
    ...(top ? { top_cause: ru.causes[top[0] as keyof typeof ru.causes] ?? top[0] } : {}),
    ...about('longest', longest(graves), site),
    ...(mine.length
      ? { mine_projects: `${mine.length} ${plural(mine.length, ['свой пет-проект', 'своих пет-проекта', 'своих пет-проектов'])}` }
      : {}),
    ...about('mine', longest(mine), site),
  }
  return { facts, total: graves.length, mine: mine.length }
}
