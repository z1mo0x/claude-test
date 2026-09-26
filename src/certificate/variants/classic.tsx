import type { CSSProperties } from 'react'
import { daysBetween, formatDate, lifetime } from '@/lib/format'
import { Mark, Skull } from '../mark'
import type { CertificateData, CertificateVariant } from '../types'
import { typeface } from '../typography'

const color = {
  ground: '#030708',
  bone: '#ece9df',
  ink: '#d4d8cf',
  muted: '#8a928c',
  moss: '#78b85a',
  mossLight: '#a6d47a',
}
const { serif, mono, sans } = typeface
const glow = '0 0 4px rgba(120,184,90,0.45), 0 0 14px rgba(120,184,90,0.3)'
const engraved = '0 4px 12px rgba(0,0,0,0.6)'

function cut(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function nameSize(name: string, base: number) {
  const n = name.length
  if (n <= 10) return base
  if (n <= 14) return Math.round(base * 0.84)
  if (n <= 20) return Math.round(base * 0.68)
  if (n <= 28) return Math.round(base * 0.54)
  return Math.round(base * 0.44)
}

function facts(d: CertificateData) {
  return {
    born: d.bornAt ? formatDate(d.bornAt) : '—',
    died: d.diedAt ? formatDate(d.diedAt) : '—',
    lived: d.bornAt && d.diedAt ? lifetime(daysBetween(d.bornAt, d.diedAt)) : '—',
    silence: d.diedAt ? `тишина ${lifetime(daysBetween(d.diedAt, d.issuedAt))}` : 'коммитов не было',
    lastWords: d.lastWords ? `"${cut(d.lastWords, 60)}"` : '—',
    name: cut(d.name, 40),
    issued: formatDate(d.issuedAt),
  }
}

const label: CSSProperties = {
  display: 'flex',
  fontFamily: mono,
  fontSize: 12,
  letterSpacing: 1,
  textTransform: 'uppercase',
  color: color.muted,
}

function Divider({ width, diamond }: { width: number; diamond: number }) {
  const line: CSSProperties = { display: 'flex', flexGrow: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.14)' }
  return (
    <div style={{ display: 'flex', width, alignItems: 'center' }}>
      <div style={line} />
      <div
        style={{
          display: 'flex',
          width: diamond,
          height: diamond,
          margin: '0 16px',
          border: '2px solid rgba(255,255,255,0.2)',
          transform: 'rotate(45deg)',
        }}
      />
      <div style={line} />
    </div>
  )
}

function Seal({ size, style }: { size: number; style: CSSProperties }) {
  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: size / 2,
        border: '3px solid rgba(120,184,90,0.5)',
        transform: 'rotate(-14deg)',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: size - 24,
          height: size - 24,
          borderRadius: (size - 24) / 2,
          border: '1px solid rgba(120,184,90,0.4)',
          color: 'rgba(120,184,90,0.75)',
        }}
      >
        <div style={{ display: 'flex', fontFamily: mono, fontWeight: 700, fontSize: size * 0.15, lineHeight: 1 }}>{'{ }'}</div>
        <div style={{ display: 'flex', marginTop: size * 0.04, fontFamily: serif, fontWeight: 700, fontSize: size * 0.1, letterSpacing: 2 }}>
          ПОХОРОНЕН
        </div>
        <div style={{ display: 'flex', fontFamily: mono, fontWeight: 700, fontSize: size * 0.08 }}>R.I.C.</div>
      </div>
    </div>
  )
}

function Frames({ width, height, inset }: { width: number; height: number; inset: number }) {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          left: inset,
          top: inset,
          width: width - inset * 2,
          height: height - inset * 2,
          border: '1px solid rgba(145,160,145,0.22)',
          borderRadius: 18,
        }}
      />
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          left: inset + 10,
          top: inset + 10,
          width: width - inset * 2 - 20,
          height: height - inset * 2 - 20,
          border: '1px solid rgba(120,184,90,0.16)',
          borderRadius: 12,
        }}
      />
    </>
  )
}

function Brand({ size }: { size: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Mark size={size * 1.9} />
      <div
        style={{
          display: 'flex',
          marginLeft: size * 0.8,
          fontFamily: serif,
          fontWeight: 700,
          fontSize: size,
          letterSpacing: size * 0.32,
          color: color.mossLight,
        }}
      >
        PROJECTYARD
      </div>
    </div>
  )
}

function Stat({ title, value, size }: { title: string; value: string; size: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ ...label, fontSize: size * 0.45 }}>{title}</div>
      <div style={{ display: 'flex', marginTop: 4, fontFamily: serif, fontWeight: 600, fontSize: size, color: color.ink }}>
        {value}
      </div>
    </div>
  )
}

function LastWords({ d, f, scale }: { d: CertificateData; f: ReturnType<typeof facts>; scale: number }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: `${18 * scale}px ${20 * scale}px`,
        borderRadius: 14,
        border: '1px solid rgba(145,160,145,0.2)',
        backgroundColor: 'rgba(3,7,8,0.72)',
      }}
    >
      <div style={{ ...label, fontSize: 12 * scale }}>Последние слова</div>
      <div style={{ display: 'flex', marginTop: 8 * scale, fontFamily: mono, fontSize: 14 * scale, color: color.muted }}>
        $ git log -1 --oneline
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 6 * scale,
          fontFamily: mono,
          fontWeight: 700,
          fontSize: 19 * scale,
          lineHeight: 1.35,
          color: color.moss,
          textShadow: glow,
        }}
      >
        {f.lastWords}
      </div>
      <div style={{ display: 'flex', marginTop: 8 * scale, fontFamily: mono, fontSize: 13 * scale, color: color.muted }}>
        {d.diedAt ? `${f.died} · ${f.silence}` : f.silence}
      </div>
    </div>
  )
}

function Cause({ d, scale, marginTop }: { d: CertificateData; scale: number; marginTop: number }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        marginTop,
        padding: `${16 * scale}px ${20 * scale}px`,
        borderRadius: 14,
        border: '1px solid rgba(120,184,90,0.55)',
        backgroundColor: 'rgba(120,184,90,0.08)',
      }}
    >
      <div style={{ ...label, fontSize: 12 * scale }}>Причина смерти</div>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 * scale, color: color.mossLight }}>
        <Skull size={24 * scale} color={color.mossLight} />
        <div style={{ display: 'flex', marginLeft: 10 * scale, fontFamily: sans, fontWeight: 700, fontSize: 21 * scale }}>
          {d.cause}
        </div>
      </div>
    </div>
  )
}

function Card({ d }: { d: CertificateData }) {
  const f = facts(d)
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        width: 1200,
        height: 630,
        overflow: 'hidden',
        backgroundColor: color.ground,
        backgroundImage:
          'radial-gradient(circle at 50% 0%, rgba(120,184,90,0.1), rgba(3,7,8,0) 55%), radial-gradient(circle at 50% 130%, rgba(70,84,78,0.35), rgba(3,7,8,0) 60%)',
        color: color.ink,
        fontFamily: sans,
      }}
    >
      <Frames width={1200} height={630} inset={22} />
      <Seal size={124} style={{ right: 60, bottom: 30, opacity: 0.7 }} />

      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1200,
          height: 630,
          padding: '52px 72px 50px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Brand size={15} />
          <div style={{ display: 'flex', fontFamily: mono, fontSize: 14, color: color.muted }}>
            {`№ ${d.plot} · выдано ${f.issued}`}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 18 }}>
          <div
            style={{
              display: 'flex',
              fontFamily: serif,
              fontWeight: 700,
              fontSize: 50,
              lineHeight: 1,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: color.bone,
              textShadow: engraved,
            }}
          >
            Свидетельство о смерти
          </div>
          <div style={{ display: 'flex', marginTop: 12 }}>
            <Divider width={380} diamond={10} />
          </div>
        </div>

        <div style={{ display: 'flex', flexGrow: 1, marginTop: 26 }}>
          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
            <div style={{ display: 'flex', fontFamily: mono, fontSize: 17, color: color.muted }}>{`${d.owner} /`}</div>
            <div
              style={{
                display: 'flex',
                marginTop: 2,
                fontFamily: serif,
                fontWeight: 700,
                fontSize: nameSize(d.name, 82),
                lineHeight: 0.95,
                wordBreak: 'break-all',
                color: color.bone,
                textShadow: engraved,
              }}
            >
              {f.name}
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 14,
                maxWidth: 580,
                fontFamily: serif,
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: 25,
                lineHeight: 1.25,
                color: 'rgba(212,216,207,0.88)',
              }}
            >
              {`«${d.epitaph}»`}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 'auto',
                paddingTop: 18,
                borderTop: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Stat title="Родился" value={f.born} size={27} />
              <Stat title="Умер" value={f.died} size={27} />
              <Stat title="Прожил" value={f.lived} size={27} />
              <Stat title="Коммитов" value={String(d.commits)} size={27} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', width: 370, marginLeft: 48 }}>
            <LastWords d={d} f={f} scale={1} />
            <Cause d={d} scale={1} marginTop={14} />
            <div style={{ display: 'flex', marginTop: 14, fontFamily: mono, fontSize: 13, color: color.muted }}>
              {[d.language, d.buriedBy ? `buried_by: ${d.buriedBy}` : null].filter(Boolean).join(' · ') || ' '}
            </div>
            <div style={{ display: 'flex', marginTop: 6, fontFamily: mono, fontSize: 13, color: color.moss }}>
              rest in code_
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Story({ d }: { d: CertificateData }) {
  const f = facts(d)
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        width: 1080,
        height: 1920,
        overflow: 'hidden',
        backgroundColor: color.ground,
        backgroundImage:
          'radial-gradient(circle at 50% 18%, rgba(120,184,90,0.12), rgba(3,7,8,0) 45%), radial-gradient(circle at 50% 110%, rgba(70,84,78,0.4), rgba(3,7,8,0) 55%)',
        color: color.ink,
        fontFamily: sans,
      }}
    >
      <Frames width={1080} height={1920} inset={36} />
      <Seal size={190} style={{ right: 72, bottom: 104, opacity: 0.6 }} />

      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          padding: '130px 100px 120px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Brand size={26} />
        <div style={{ display: 'flex', marginTop: 18, fontFamily: mono, fontSize: 24, color: color.muted }}>
          {`№ ${d.plot} · выдано ${f.issued}`}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: 60,
            fontFamily: serif,
            fontWeight: 700,
            fontSize: 92,
            lineHeight: 1,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: color.bone,
            textShadow: engraved,
          }}
        >
          <div style={{ display: 'flex' }}>Свидетельство</div>
          <div style={{ display: 'flex' }}>о смерти</div>
        </div>
        <div style={{ display: 'flex', marginTop: 28 }}>
          <Divider width={520} diamond={14} />
        </div>

        <div style={{ display: 'flex', marginTop: 56, fontFamily: mono, fontSize: 30, color: color.muted }}>{`${d.owner} /`}</div>
        <div
          style={{
            display: 'flex',
            marginTop: 6,
            textAlign: 'center',
            justifyContent: 'center',
            fontFamily: serif,
            fontWeight: 700,
            fontSize: nameSize(d.name, 150),
            lineHeight: 0.95,
            wordBreak: 'break-all',
            color: color.bone,
            textShadow: engraved,
          }}
        >
          {f.name}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 30,
            maxWidth: 820,
            textAlign: 'center',
            justifyContent: 'center',
            fontFamily: serif,
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 46,
            lineHeight: 1.2,
            color: 'rgba(212,216,207,0.9)',
          }}
        >
          {`«${d.epitaph}»`}
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            width: 880,
            marginTop: 64,
            paddingTop: 28,
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {[
            ['Родился', f.born],
            ['Умер', f.died],
            ['Прожил', f.lived],
            ['Коммитов', String(d.commits)],
          ].map(([title, value]) => (
            <div key={title} style={{ display: 'flex', width: 440, marginBottom: 28 }}>
              <Stat title={title} value={value} size={48} />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', width: 880, marginTop: 12 }}>
          <LastWords d={d} f={f} scale={1.7} />
          <Cause d={d} scale={1.7} marginTop={24} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'auto' }}>
          <div style={{ display: 'flex', fontFamily: sans, fontWeight: 700, fontSize: 34, color: color.ink }}>
            Похорони свой репозиторий
          </div>
          <div style={{ display: 'flex', marginTop: 10, fontFamily: mono, fontWeight: 700, fontSize: 32, color: color.moss, textShadow: glow }}>
            {d.site}
          </div>
        </div>
      </div>
    </div>
  )
}

export const classic: CertificateVariant = {
  id: 'classic',
  title: 'Классическое',
  render: (data, format) => (format === 'story' ? <Story d={data} /> : <Card d={data} />),
}
