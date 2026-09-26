/** Знак Projectyard: надгробие с { } и >_. */
export function Mark({ size = 28 }: { size?: number }) {
  const stroke = { stroke: '#78b85a', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  return (
    <svg width={size} height={Math.round((size * 56) / 48)} viewBox="0 0 48 56" fill="none" aria-hidden="true">
      <path d="M7 52V22C7 12 14.5 5 24 5s17 7 17 17v30" fill="#141b1d" stroke="#5f6a64" strokeWidth={2.5} />
      <path d="M3 52.5h42" stroke="#5f6a64" strokeWidth={3} strokeLinecap="round" />
      <path d="M20 17c-2.6 0-3.6 1.3-3.6 3.6v2.6c0 1.4-.9 2.3-2.4 2.3 1.5 0 2.4.9 2.4 2.3v2.6c0 2.3 1 3.6 3.6 3.6" {...stroke} />
      <path d="M28 17c2.6 0 3.6 1.3 3.6 3.6v2.6c0 1.4.9 2.3 2.4 2.3-1.5 0-2.4.9-2.4 2.3v2.6c0 2.3-1 3.6-3.6 3.6" {...stroke} />
      <path d="M15 40l4.5 3.2L15 46.4" {...stroke} />
      <path d="M23 46.5h10" {...stroke} />
    </svg>
  )
}

export function Skull({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <path d="M8 20v2h8v-2" />
      <path d="m12.5 17-.5-1-.5 1h1z" />
      <path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20" />
    </svg>
  )
}
