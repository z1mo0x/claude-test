import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

type Face = [name: string, pkg: string, weight: 400 | 500 | 600 | 700, style: 'normal' | 'italic']

const faces: Face[] = [
  ['Cormorant Garamond', 'cormorant-garamond', 600, 'normal'],
  ['Cormorant Garamond', 'cormorant-garamond', 700, 'normal'],
  ['Cormorant Garamond', 'cormorant-garamond', 500, 'italic'],
  ['JetBrains Mono', 'jetbrains-mono', 400, 'normal'],
  ['JetBrains Mono', 'jetbrains-mono', 700, 'normal'],
  ['Manrope', 'manrope', 500, 'normal'],
  ['Manrope', 'manrope', 700, 'normal'],
]

async function load() {
  return Promise.all(
    faces.flatMap(([name, pkg, weight, style]) =>
      ['latin', 'cyrillic'].map(async (subset) => ({
        name: subset === 'cyrillic' ? `${name} Cyrillic` : name,
        weight,
        style,
        data: await readFile(join(process.cwd(), 'node_modules/@fontsource', pkg, 'files', `${pkg}-${subset}-${weight}-${style}.woff`)),
      })),
    ),
  )
}

let fonts: ReturnType<typeof load> | undefined

/** Шрифты для next/og. Satori не читает woff2, поэтому берём woff из @fontsource. */
export function certificateFonts() {
  fonts ??= load()
  return fonts
}
