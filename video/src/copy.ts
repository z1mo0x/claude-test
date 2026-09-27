import { staticFile } from 'remotion'
import type { CertificateAssets, CertificateData } from '@/certificate/types'
import { commitsLabel, daysBetween, lifetime } from '@/lib/format'

/** Пример для ролика. Все тексты здесь, чтобы ролик легко переписать или перевести. */
export const sample: CertificateData = {
  owner: 'you',
  name: 'weekend-app',
  language: 'TypeScript',
  bornAt: '2024-03-02T00:00:00Z',
  diedAt: '2025-01-12T00:00:00Z',
  commits: 214,
  lastWords: 'wip: почти готово',
  cause: 'Нашлась идея получше',
  epitaph: 'Доделаю на выходных. Не доделал.',
  buriedBy: '@you',
  plot: '0001',
  issuedAt: '2026-09-26T00:00:00Z',
  site: 'projectyard',
}

export const placeholder: CertificateData = {
  ...sample,
  owner: 'владелец',
  name: 'репозиторий',
  language: null,
  bornAt: null,
  diedAt: null,
  commits: 0,
  lastWords: null,
  buriedBy: null,
}

export const repoLink = `github.com/${sample.owner}/${sample.name}`
export const lived = `${lifetime(daysBetween(sample.bornAt!, sample.diedAt!))} разработки`
export const found = `> найден: ${sample.language} · ${commitsLabel(sample.commits)} · тишина ${lifetime(daysBetween(sample.diedAt!, sample.issuedAt))}`

export const image = (name: string) => staticFile(`images/${name}`)

export const assets: CertificateAssets = {
  logo: image('logo.png'),
  backdrop: image('graveyard.png'),
}

/** Кладбище в репозиториях: стена мёртвых проектов во второй сцене. */
export const deadRepos: [name: string, language: string, days: number][] = [
  ['todo-app-v7', 'TypeScript', 412],
  ['my-saas-final-FINAL', 'Next.js', 287],
  ['crypto-bot', 'Python', 1203],
  ['portfolio-2024', 'Astro', 198],
  ['game-engine', 'C++', 1561],
  ['bot-dlya-mamy', 'Go', 890],
  ['landing-new-new', 'HTML', 95],
  ['rust-rewrite', 'Rust', 733],
  ['habit-tracker', 'Swift', 521],
  ['notion-clone', 'React', 640],
  ['ai-startup', 'Python', 301],
  ['dotfiles-v3', 'Shell', 1102],
  ['recipe-app', 'Kotlin', 845],
  ['chess-engine', 'Rust', 1320],
  ['blog-engine', 'Go', 977],
  ['minecraft-mod', 'Java', 1650],
  ['budget-app', 'Vue', 455],
  ['discord-bot', 'JavaScript', 610],
  ['tetris-3d', 'C#', 1405],
  ['url-shortener', 'Go', 380],
  ['twitter-clone', 'React', 1012],
  ['pomodoro', 'Svelte', 266],
  ['kanban-board', 'Angular', 1188],
  ['weekend-app', 'TypeScript', 622],
]
