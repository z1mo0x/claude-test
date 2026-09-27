import type { CSSProperties } from 'react'
import { AbsoluteFill, Easing, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { classic } from '@/certificate/variants/classic'
import { assets, found, image, placeholder, repoLink, sample } from '../copy'
import { BrowserWindow, CHROME } from '../parts/BrowserWindow'
import { Cursor } from '../parts/Cursor'
import { Caret, typed } from '../parts/Typewriter'
import { color, font, glow } from '../theme'

/** Страница сайта в натуральную величину. Все координаты ниже — внутри неё. */
const PAGE = { width: 1440, height: 840 }
const FORM = { x: 56, y: 318, width: 500, height: 500 }
const PREVIEW = { x: 600, y: 318, width: 784 }

const t = {
  focusInput: [45, 75],
  typeLink: 68,
  found: 106,
  zoomOut: [112, 140],
  swap: [116, 136],
  focusForm: [142, 166],
  pickCause: 160,
  typeEpitaph: 168,
  toButton: [198, 212],
  bury: 212,
}

const chips: { label: string; x: number; y: number; width: number }[] = [
  { label: 'Выгорание', x: 28, y: 188, width: 118 },
  { label: 'Нет времени', x: 154, y: 188, width: 132 },
  { label: 'Техдолг', x: 294, y: 188, width: 98 },
  { label: 'Пропал интерес', x: 28, y: 240, width: 158 },
  { label: 'Нашлась идея получше', x: 194, y: 240, width: 212 },
]

// Центры элементов в координатах страницы: туда ходят камера и курсор.
const inputCenter = { x: FORM.x + 250, y: FORM.y + 84 }
const causeCenter = { x: FORM.x + 194 + 106, y: FORM.y + 262 }
const buttonCenter = { x: FORM.x + 250, y: FORM.y + 447 }
const formFocus = { x: FORM.x + 250, y: FORM.y + 300 }

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ease = { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) }

function label(n: string, text: string, y: number) {
  return (
    <div style={{ position: 'absolute', left: 28, top: y, display: 'flex', alignItems: 'baseline', gap: 12, fontFamily: font.sans, fontWeight: 600, fontSize: 16, color: color.ink }}>
      <span style={{ fontFamily: font.mono, fontSize: 13, color: color.moss }}>{n}</span>
      {text}
    </div>
  )
}

export function Demo() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Окно влетает в кадр с наклоном и выравнивается.
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 70 } })
  const rotateX = interpolate(enter, [0, 1], [26, 5]) - interpolate(frame, [30, 70], [0, 5], ease)
  const rotateY = interpolate(enter, [0, 1], [-22, -5]) + interpolate(frame, [30, 70], [0, 5], ease)

  // Камера: наезд на поле ссылки, отъезд к превью, наезд на причину и эпитафию, потом на кнопку.
  const keys = [0, t.focusInput[0], t.focusInput[1], t.zoomOut[0], t.zoomOut[1], t.focusForm[0], t.focusForm[1], t.toButton[0], t.toButton[1], 225]
  const scale = interpolate(frame, keys, [0.86, 1, 1.55, 1.55, 1, 1, 1.45, 1.45, 1.5, 1.62], ease) * interpolate(enter, [0, 1], [0.9, 1])
  const focusX = interpolate(frame, keys, [0, 0, inputCenter.x - 720, inputCenter.x - 720, 0, 0, formFocus.x - 720, formFocus.x - 720, buttonCenter.x - 720, buttonCenter.x - 720], ease)
  const focusY = interpolate(frame, keys, [0, 0, inputCenter.y - 420, inputCenter.y - 420, 0, 0, formFocus.y - 420, formFocus.y - 420, buttonCenter.y - 420, buttonCenter.y - 420], ease) + CHROME / 2

  const link = typed(repoLink, frame, t.typeLink, 1.1)
  const epitaph = typed(sample.epitaph, frame, t.typeEpitaph, 0.95)
  const foundIn = spring({ frame: frame - t.found, fps, config: { damping: 200 } })
  const swap = interpolate(frame, t.swap, [0, 1], clamp)
  const cause = frame >= t.pickCause ? 'Нашлась идея получше' : 'Выгорание'
  const pressed = frame >= t.bury && frame < t.bury + 6
  const focusedInput = frame >= t.focusInput[0] + 15 && frame < t.found + 20

  const preview = classic.render({ ...sample, cause, epitaph: epitaph || '…' }, 'card', assets)
  const empty = classic.render({ ...placeholder, cause, epitaph: sample.epitaph }, 'card', assets)

  const chip = (selected: boolean): CSSProperties => ({
    position: 'absolute',
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    boxSizing: 'border-box',
    border: selected ? `1px solid ${color.moss}` : '1px solid rgba(255,255,255,0.14)',
    background: selected ? 'rgba(120,184,90,0.14)' : 'transparent',
    color: selected ? color.mossLight : 'rgba(212,216,207,0.8)',
    fontFamily: font.sans,
    fontWeight: selected ? 700 : 500,
    fontSize: 14,
  })

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 2400 }}>
      <div
        style={{
          opacity: Math.min(1, enter * 1.6),
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale}) translate(${-focusX}px, ${-focusY}px)`,
        }}
      >
        <BrowserWindow url="projectyard" width={PAGE.width} height={PAGE.height}>
          {/* Шапка */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: PAGE.width, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', boxSizing: 'border-box', borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: 2, background: 'rgba(3,7,8,0.85)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Img src={image('logo.png')} style={{ width: 24, height: 28 }} />
              <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 15, color: color.moss, textShadow: glow }}>projectyard&gt;</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, padding: '6px 12px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontFamily: font.mono, fontSize: 13, color: color.ink }}>
              <span>
                <b style={{ color: color.mossLight }}>0</b>
                <span style={{ color: color.muted }}>/100</span> проектов
              </span>
              <span style={{ width: 118, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }} />
            </div>
          </div>

          {/* Первый экран с луной и вороном */}
          <div style={{ position: 'absolute', left: 0, top: 64, width: PAGE.width, height: 230, overflow: 'hidden' }}>
            <Img src={image('banner.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '78% 50%', opacity: 0.9 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #030708 0%, #030708 25%, rgba(3,7,8,0.5) 55%, rgba(3,7,8,0) 75%)' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, background: 'linear-gradient(0deg, #030708, rgba(3,7,8,0))' }} />
            <div style={{ position: 'absolute', left: 56, top: 38, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 13, color: color.moss }}>projectyard&gt; bury --repo</span>
              <div style={{ fontFamily: font.serif, fontWeight: 700, fontSize: 54, lineHeight: 1.02, textTransform: 'uppercase', color: color.bone }}>
                <div>Проводи репозиторий</div>
                <div style={{ color: color.mossLight }}>в последний путь</div>
              </div>
            </div>
          </div>

          {/* Форма */}
          <div style={{ position: 'absolute', left: FORM.x, top: FORM.y, width: FORM.width, height: FORM.height, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', background: color.panel }}>
            {label('01', 'Ссылка на репозиторий', 26)}
            <div
              style={{
                position: 'absolute',
                left: 28,
                top: 58,
                width: 444,
                height: 52,
                boxSizing: 'border-box',
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: 10,
                border: focusedInput ? `1px solid ${color.moss}` : '1px solid rgba(255,255,255,0.14)',
                boxShadow: focusedInput ? '0 0 0 3px rgba(120,184,90,0.18)' : 'none',
                background: 'rgba(3,7,8,0.8)',
                fontFamily: font.mono,
                fontSize: 15,
                color: link ? color.ink : color.muted,
                whiteSpace: 'pre',
              }}
            >
              {link || 'https://github.com/ник/проект'}
              {focusedInput && <Caret color={color.ink} width="2px" />}
            </div>
            <div
              style={{
                position: 'absolute',
                left: 28,
                top: 122,
                fontFamily: font.mono,
                fontSize: 13,
                color: foundIn > 0.01 ? color.moss : color.muted,
                textShadow: foundIn > 0.01 ? glow : 'none',
                opacity: foundIn > 0.01 ? foundIn : 1,
              }}
            >
              {foundIn > 0.01 ? found : '> жду ссылку на GitHub'}
            </div>

            {label('02', 'Причина смерти', 156)}
            {chips.map((c) => (
              <div key={c.label} style={{ ...chip(c.label === cause), left: c.x, top: c.y, width: c.width }}>
                {c.label}
              </div>
            ))}

            {label('03', 'Эпитафия', 300)}
            <div
              style={{
                position: 'absolute',
                left: 28,
                top: 332,
                width: 444,
                height: 70,
                boxSizing: 'border-box',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(3,7,8,0.8)',
                fontFamily: font.serif,
                fontStyle: 'italic',
                fontSize: 21,
                color: color.ink,
              }}
            >
              {epitaph}
              {frame >= t.typeEpitaph && frame < t.toButton[0] && <Caret color={color.ink} width="2px" />}
            </div>

            <div
              style={{
                position: 'absolute',
                left: 28,
                top: 418,
                width: 444,
                height: 58,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: color.moss,
                color: '#07120a',
                fontFamily: font.sans,
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                transform: `scale(${pressed ? 0.96 : 1})`,
                boxShadow: frame >= t.bury ? '0 0 60px rgba(120,184,90,0.55)' : '0 0 36px rgba(120,184,90,0.22)',
              }}
            >
              Похоронить
            </div>
          </div>

          {/* Предпросмотр свидетельства: тот же компонент, что на сайте и в PNG */}
          <div style={{ position: 'absolute', left: PREVIEW.x, top: FORM.y - 28, fontFamily: font.mono, fontSize: 13, color: color.muted }}>
            &gt; предпросмотр. Эта картинка прикрепится к ссылке
          </div>
          <div style={{ position: 'absolute', left: PREVIEW.x, top: PREVIEW.y, width: PREVIEW.width, height: 412, overflow: 'hidden', borderRadius: 12 }}>
            <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `scale(${PREVIEW.width / 1200})`, width: 1200, height: 630, opacity: (1 - swap) * 0.45 }}>
              {empty}
            </div>
            <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `scale(${PREVIEW.width / 1200})`, width: 1200, height: 630, opacity: swap }}>
              {preview}
            </div>
          </div>

          <Cursor
            appear={28}
            clicks={[t.typeLink - 6, t.pickCause, t.bury]}
            path={[
              { f: 0, x: 1180, y: 760 },
              { f: 30, x: 1180, y: 760 },
              { f: t.typeLink - 8, x: inputCenter.x + 40, y: inputCenter.y + 4 },
              { f: 142, x: inputCenter.x + 60, y: inputCenter.y + 30 },
              { f: t.pickCause - 2, x: causeCenter.x, y: causeCenter.y },
              { f: t.toButton[0], x: causeCenter.x + 10, y: causeCenter.y + 20 },
              { f: t.bury - 2, x: buttonCenter.x + 40, y: buttonCenter.y },
              { f: 225, x: buttonCenter.x + 40, y: buttonCenter.y },
            ]}
          />
        </BrowserWindow>
      </div>
    </AbsoluteFill>
  )
}
