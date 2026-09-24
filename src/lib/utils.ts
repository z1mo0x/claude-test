import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { CSSProperties } from 'react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Inline display-font style for headings (see `.font-display` in index.css for why the stack has a Cyrillic fallback). */
export const displayFont: CSSProperties = {
  fontFamily: "'Instrument Serif', 'Noto Serif Display', serif",
  fontStretch: '70%',
  fontWeight: 300,
}
