import type { ReactNode } from 'react'
import { color, font } from '../theme'

export const CHROME = 46

export function BrowserWindow({ url, width, height, children }: { url: string; width: number; height: number; children: ReactNode }) {
  return (
    <div
      style={{
        width,
        height: height + CHROME,
        borderRadius: 18,
        overflow: 'hidden',
        background: color.ground,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 60px 140px rgba(0,0,0,0.75), 0 0 80px rgba(120,184,90,0.06)',
      }}
    >
      <div
        style={{
          height: CHROME,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 18px',
          background: '#0d1314',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
          <span key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c, opacity: 0.8 }} />
        ))}
        <div
          style={{
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            minWidth: 420,
            height: 28,
            padding: '0 16px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            fontFamily: font.mono,
            fontSize: 13,
            color: color.muted,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color.muted} strokeWidth="2.2" strokeLinecap="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          {url}
        </div>
      </div>
      <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>{children}</div>
    </div>
  )
}
