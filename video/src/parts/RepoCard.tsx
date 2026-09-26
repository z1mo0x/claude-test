import { random } from 'remotion'
import { color, font } from '../theme'

/** Карточка заброшенного репозитория: активность коммитов угасает к правому краю. */
export function RepoCard({ name, language, days }: { name: string; language: string; days: number }) {
  const bars = Array.from({ length: 16 }, (_, i) => Math.max(0.06, (1 - i / 11) * (0.4 + random(`${name}${i}`) * 0.6)))
  return (
    <div
      style={{
        width: 300,
        height: 128,
        boxSizing: 'border-box',
        padding: '18px 20px',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.09)',
        background: 'linear-gradient(180deg, rgba(20,27,28,0.95), rgba(10,15,16,0.95))',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ fontFamily: font.mono, fontSize: 17, fontWeight: 700, color: color.ink }}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 26 }}>
        {bars.map((h, i) => (
          <div key={i} style={{ width: 9, height: `${h * 100}%`, borderRadius: 2, background: i < 9 ? 'rgba(120,184,90,0.55)' : 'rgba(255,255,255,0.12)' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: font.mono, fontSize: 13, color: color.muted }}>
        <span>{language}</span>
        <span>{days} дн. тишины</span>
      </div>
    </div>
  )
}
