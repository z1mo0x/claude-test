import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { getVariant } from '@/certificate/variants'
import { assets, sample } from '../../copy'
import { goldGlow } from '../../theme'

/**
 * Сторис-свидетельство на весь кадр. Появление — как на странице свидетельства (globals.css,
 * «Появление свидетельства»), только по кадрам: блоки data-reveal проступают по очереди, потом падает печать.
 */
const STORY = { width: 1080, height: 1920 }
/** Центр и размер печати внутри сторис: Seal size 190, right 72, bottom 104. */
const SEAL = { x: 913, y: 1721, size: 190 }
/** Центр карточки по вертикали: чуть выше середины, чтобы низ не уходил под интерфейс TikTok. */
const CENTER_Y = 880

export const certificate = { blocks: [12, 16.5, 24, 31.5, 39, 46.5], block: 21, seal: 64, slam: 13.5 }
/** Печать касается бумаги на 60 % своей анимации: здесь дрожь, кольцо, пыль и звук удара. */
export const sealImpact = certificate.seal + certificate.slam * 0.6

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const outQuint = Easing.bezier(0.22, 1, 0.36, 1)
const slamIn = Easing.bezier(0.55, 0, 1, 0.45)

// Пыль от удара: те же точки, что в ::before печати на сайте (x, y, разброс, светлая или зелёная).
const dust: [number, number, number, boolean][] = [
  [64, 8, 2, true],
  [67, 43, 1, false],
  [38, 61, 1, true],
  [7, 64, 2, false],
  [-27, 75, 1, true],
  [-51, 50, 1, false],
  [-61, 21, 2, true],
  [-79, -10, 1, false],
  [-61, -39, 1, true],
  [-34, -55, 2, false],
  [-8, -80, 1, true],
  [24, -68, 1, false],
  [46, -45, 2, true],
  [76, -26, 1, false],
]

function sealScale(u: number) {
  if (u <= 0) return 2.6
  if (u < 0.6) return interpolate(slamIn(u / 0.6), [0, 1], [2.6, 0.94])
  if (u < 0.8) return interpolate(Easing.out(Easing.ease)((u - 0.6) / 0.2), [0, 1], [0.94, 1.04])
  return interpolate(Easing.ease(Math.min(1, (u - 0.8) / 0.2)), [0, 1], [1.04, 1])
}

/** Дрожь карточки от удара, как keyframes thump на сайте, но вдвое сильнее: кадр телефона крупнее. */
function thump(t: number) {
  if (t <= 0 || t >= 1) return [0, 0]
  const keys = [0, 0.25, 0.5, 0.75, 1]
  const eased = { ...clamp, easing: Easing.out(Easing.ease) }
  return [interpolate(t, keys, [0, 0, -2, 1, 0], eased) * 2, interpolate(t, keys, [0, 4, -1, 1, 0], eased) * 2]
}

export function Certificate() {
  const frame = useCurrentFrame()
  const { fps, width } = useVideoConfig()

  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 24 })
  const scale = 0.84 * interpolate(enter, [0, 1], [0.95, 1]) * interpolate(frame, [0, 110], [1, 1.02])
  const [shakeX, shakeY] = thump((frame - sealImpact) / 12)
  const left = (width - STORY.width * scale) / 2 + shakeX
  const top = CENTER_Y - (STORY.height * scale) / 2 + shakeY

  const blocks = certificate.blocks
    .map((start, i) => {
      const p = outQuint(interpolate(frame, [start, start + certificate.block], [0, 1], clamp))
      return `.short-certificate [data-reveal="${i + 1}"] { opacity: ${p}; translate: 0 ${(1 - p) * 28}px; filter: blur(${(1 - p) * 5}px); }`
    })
    .join('\n')
  const u = (frame - certificate.seal) / certificate.slam
  // Как на сайте: к касанию печать непрозрачна, потом возвращается к своей 0.6 из инлайн-стиля.
  const sealOpacity = u <= 0 ? 0 : u < 0.6 ? u / 0.6 : interpolate(u, [0.6, 1], [1, 0.6], clamp)
  const css = `${blocks}\n.short-certificate [data-reveal="seal"] { opacity: ${sealOpacity} !important; scale: ${sealScale(u)}; }`

  // Кольцо и пыль рисуются поверх карточки в координатах кадра: иначе их обрежет край сторис.
  const seal = { x: left + SEAL.x * scale, y: top + SEAL.y * scale, size: SEAL.size * scale }
  const ring = interpolate(frame, [sealImpact, sealImpact + 27], [0, 1], { ...clamp, easing: Easing.out(Easing.ease) })
  const burst = interpolate(frame, [sealImpact, sealImpact + 24], [0, 1], { ...clamp, easing: Easing.out(Easing.ease) })
  const spread = seal.size / 124
  const struck = frame >= sealImpact

  return (
    <AbsoluteFill>
      <style>{css}</style>
      <div
        className="short-certificate"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: STORY.width,
          height: STORY.height,
          borderRadius: 40,
          overflow: 'hidden',
          boxShadow: goldGlow,
          opacity: enter,
          transformOrigin: '0 0',
          transform: `translate(${left}px, ${top}px) scale(${scale})`,
        }}
      >
        {getVariant('classic').render(sample, 'story', assets)}
      </div>

      {struck && ring < 1 && (
        <div
          style={{
            position: 'absolute',
            left: seal.x - seal.size / 2 - 6,
            top: seal.y - seal.size / 2 - 6,
            width: seal.size + 12,
            height: seal.size + 12,
            borderRadius: '50%',
            border: '3px solid rgba(166,212,122,0.8)',
            background: 'radial-gradient(circle, rgba(166,212,122,0.35), rgba(166,212,122,0) 65%)',
            opacity: 0.9 * (1 - ring),
            transform: `scale(${0.9 + ring * 1.5})`,
          }}
        />
      )}
      {struck &&
        burst < 1 &&
        dust.map(([x, y, grow, green], i) => {
          const size = (4 + grow * 2) * spread * (0.35 + burst * 1.15)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: seal.x + x * spread * (0.35 + burst * 1.15) - size / 2,
                top: seal.y + y * spread * (0.35 + burst * 1.15) - size / 2,
                width: size,
                height: size,
                borderRadius: '50%',
                background: green ? 'rgba(166,212,122,0.6)' : 'rgba(212,216,207,0.55)',
                opacity: 1 - burst,
              }}
            />
          )
        })}
    </AbsoluteFill>
  )
}
