import { AbsoluteFill, Easing, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { found, image, repoLink } from '../../copy'
import { Cursor } from '../../parts/Cursor'
import { Reveal } from '../../parts/Reveal'
import { Caret, typed } from '../../parts/Typewriter'
import { color, font, glow } from '../../theme'

/** Карточка формы с сайта, переложенная под телефон. Координаты ниже — внутри карточки. */
const CARD = { width: 800, height: 560, top: 790 }
/** Курсор нарисован под страницу 1440 px, на телефоне его увеличиваем. */
const POINTER = 1.8
const INPUT = { x: 44, y: 150, width: 712, height: 104 }
const BUTTON = { x: 44, y: 412, width: 712, height: 104 }

export const link = { click: 12, type: 16, framesPerChar: 1, found: 46, toButton: [50, 64], bury: 66 }

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ease = { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) }

export function Link() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Карточка приходит из лёгкого наклона, как окно браузера в горизонтальном ролике.
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 70 } })
  const rotateX = interpolate(enter, [0, 1], [22, 0])
  const scale = interpolate(enter, [0, 1], [0.9, 1]) * interpolate(frame, [link.toButton[0], link.bury + 4], [1, 1.04], ease)

  const text = typed(repoLink, frame, link.type, link.framesPerChar)
  const focused = frame >= link.click && frame < link.found + 8
  const foundIn = spring({ frame: frame - link.found, fps, config: { damping: 200 } })
  const pressed = frame >= link.bury && frame < link.bury + 6
  const lit = interpolate(frame, [link.bury, link.bury + 8], [0, 1], clamp)

  // Кликаем в правую, пустую часть поля, чтобы курсор не закрывал ссылку.
  const input = { x: INPUT.x + 640, y: INPUT.y + INPUT.height / 2 + 8 }
  const button = { x: BUTTON.x + BUTTON.width / 2 + 70, y: BUTTON.y + BUTTON.height / 2 + 8 }
  const point = (f: number, x: number, y: number) => ({ f, x: x / POINTER, y: y / POINTER })

  return (
    <AbsoluteFill style={{ alignItems: 'center', perspective: 2400 }}>
      <div style={{ position: 'absolute', top: 400, width: 800, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        <div style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 30, color: color.moss, textShadow: glow, opacity: interpolate(frame, [2, 12], [0, 1], clamp) }}>
          projectyard&gt; bury --repo
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: font.serif, fontWeight: 700, fontSize: 72, lineHeight: 1.02, textTransform: 'uppercase', color: color.bone }}>
          <Reveal words={['Проводи']} start={4} style={{ justifyContent: 'center' }} />
          <Reveal words={['репозиторий']} start={7} style={{ justifyContent: 'center' }} />
          <Reveal words={['в', 'последний', 'путь']} start={10} stagger={3} style={{ justifyContent: 'center', color: color.mossLight }} />
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: CARD.top,
          width: CARD.width,
          height: CARD.height,
          borderRadius: 28,
          border: '1px solid rgba(255,255,255,0.12)',
          background: color.panel,
          boxShadow: '0 60px 140px rgba(0,0,0,0.75), 0 0 80px rgba(120,184,90,0.06)',
          opacity: Math.min(1, enter * 1.6),
          transformOrigin: '50% 0%',
          transform: `rotateX(${rotateX}deg) translateY(${(1 - enter) * 120}px) scale(${scale})`,
        }}
      >
        <div style={{ position: 'absolute', left: INPUT.x, top: 52, display: 'flex', alignItems: 'baseline', gap: 16, fontFamily: font.sans, fontWeight: 700, fontSize: 32, color: color.ink }}>
          <span style={{ fontFamily: font.mono, fontSize: 26, color: color.moss }}>01</span>
          Ссылка на репозиторий
        </div>
        <Img src={image('logo.png')} style={{ position: 'absolute', right: 44, top: 44, width: 40, height: 47, opacity: 0.8 }} />

        <div
          style={{
            position: 'absolute',
            left: INPUT.x,
            top: INPUT.y,
            width: INPUT.width,
            height: INPUT.height,
            boxSizing: 'border-box',
            padding: '0 30px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 18,
            border: focused ? `2px solid ${color.moss}` : '2px solid rgba(255,255,255,0.14)',
            boxShadow: focused ? '0 0 0 6px rgba(120,184,90,0.18)' : 'none',
            background: 'rgba(3,7,8,0.8)',
            fontFamily: font.mono,
            fontSize: 36,
            color: text ? color.ink : color.muted,
            whiteSpace: 'pre',
          }}
        >
          {text || 'github.com/ник/проект'}
          {focused && <Caret color={color.ink} width="3px" />}
        </div>

        <div
          style={{
            position: 'absolute',
            left: INPUT.x,
            top: INPUT.y + INPUT.height + 26,
            width: INPUT.width,
            fontFamily: font.mono,
            fontSize: 30,
            lineHeight: 1.4,
            color: foundIn > 0.01 ? color.moss : color.muted,
            textShadow: foundIn > 0.01 ? glow : 'none',
            opacity: foundIn > 0.01 ? foundIn : 1,
            transform: `translateY(${(1 - foundIn) * 10}px)`,
          }}
        >
          {foundIn > 0.01 ? found : '> жду ссылку на GitHub'}
        </div>

        <div
          style={{
            position: 'absolute',
            left: BUTTON.x,
            top: BUTTON.y,
            width: BUTTON.width,
            height: BUTTON.height,
            borderRadius: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: color.moss,
            color: '#07120a',
            fontFamily: font.sans,
            fontWeight: 800,
            fontSize: 36,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            transform: `scale(${pressed ? 0.96 : 1})`,
            boxShadow: `0 0 ${50 + lit * 50}px rgba(120,184,90,${0.25 + lit * 0.35})`,
          }}
        >
          Похоронить
        </div>

        <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `scale(${POINTER})` }}>
          <Cursor
            appear={2}
            clicks={[link.click, link.bury]}
            path={[
              point(0, input.x + 40, input.y + 150),
              point(4, input.x + 40, input.y + 150),
              point(link.click - 1, input.x, input.y),
              point(link.toButton[0], input.x + 10, input.y + 30),
              point(link.bury - 2, button.x, button.y),
              point(80, button.x, button.y),
            ]}
          />
        </div>
      </div>
    </AbsoluteFill>
  )
}
