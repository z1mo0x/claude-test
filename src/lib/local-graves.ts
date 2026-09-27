import { useSyncExternalStore } from 'react'

/** Похороны, сделанные в этом браузере. Пока нет базы, по ним работает счётчик. */
export type LocalGrave = { slug: string; href: string }

const KEY = 'projectyard:graves'
const EVENT = 'projectyard:graves'

export function localGraves(): LocalGrave[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function rememberGrave(grave: LocalGrave) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...localGraves().filter((g) => g.slug !== grave.slug), grave]))
  } catch {
    // Приватный режим или запрет хранилища: счётчик просто не вырастет.
  }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function useLocalGraveCount() {
  return useSyncExternalStore(subscribe, () => localGraves().length, () => 0)
}
