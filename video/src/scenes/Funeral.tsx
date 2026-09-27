import { AbsoluteFill, Easing, Img, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { image, lived, sample } from '../copy'
import { color, font } from '../theme'
import { commitsLabel } from '@/lib/format'

/**
 * Та же сцена, что на сайте (src/components/funeral-scene.tsx), только по кадрам:
 * prep → coffin → lowering → burying → silence. Кадр 440×800, как на сайте, увеличен до высоты видео.
 */
const STAGE = { width: 440, height: 800, scale: 1.3 }
const GROUND = 520
const STONE = { width: 400, crop: { x: 430, y: 50, width: 675, height: 880 } }
const k = STONE.width / STONE.crop.width
const stoneHeight = Math.round(STONE.crop.height * k)
const stoneBase = Math.round((900 - STONE.crop.y) * k)

const at = { coffin: 18, lowering: 56, burying: 122, dirtEnd: 160, rise: 152, engrave: 190, silence: 212 }

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

const dirt = Array.from({ length: 26 }, (_, i) => ({
  x: 70 + ((i * 97) % 300),
  from: -40 - ((i * 37) % 160),
  delay: ((i * 13) % 26) * 1.05,
  size: 5 + (i % 4) * 3,
  spin: ((i % 5) - 2) * 40,
}))

const fireflies = Array.from({ length: 8 }, (_, i) => ({
  x: 30 + ((i * 71) % 380),
  y: 150 + ((i * 89) % 330),
  phase: random(`ff${i}`) * Math.PI * 2,
}))

function captionOpacity(frame: number, from: number, to: number) {
  return interpolate(frame, [from, from + 10, to - 10, to], [0, 1, 1, 0], clamp)
}

export function Funeral() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const overlay = interpolate(frame, [0, 18], [0, 1], clamp)
  const push = interpolate(frame, [0, 240], [1, 1.12])

  // Гроб: въезд на пружине, потом опускание по раскадровке: y [0, 30, 110, 230], scale [1, .98, .95, .9].
  const land = spring({ frame: frame - at.coffin, fps, config: { stiffness: 80, damping: 14 } })
  const lower = interpolate(frame, [at.lowering, at.burying], [0, 1], { ...clamp, easing: Easing.inOut(Easing.ease) })
  const coffinY = interpolate(land, [0, 1], [-60, 0]) + interpolate(lower, [0, 0.33, 0.66, 1], [0, 30, 110, 230])
  const coffinScale = interpolate(lower, [0, 0.33, 0.66, 1], [1, 0.98, 0.95, 0.9])
  const coffinOpacity = Math.min(1, land * 1.5) * interpolate(lower, [0, 0.66, 1], [1, 0.9, 0.7]) * (frame < at.burying ? 1 : 0)

  const shaking = (frame >= at.lowering && frame < at.burying) || (frame >= at.rise && frame < at.rise + 36)
  const shakeX = shaking ? Math.sin(frame * 1.9) * 2.4 : 0
  const shakeY = shaking ? Math.cos(frame * 2.3) * 1.4 : 0

  const mound = interpolate(frame, [at.burying + 15, at.burying + 42], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })
  const blur = interpolate(frame, [at.burying + 18, at.burying + 48], [0, 1], clamp)
  const rise = interpolate(frame, [at.rise, at.rise + 42], [0, 1], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) })
  const emblem = interpolate(frame, [at.engrave - 4, at.engrave + 14, at.engrave + 40], [0, 1, 0.7], clamp)
  const years = `${new Date(sample.bornAt!).getUTCFullYear()} — ${new Date(sample.diedAt!).getUTCFullYear()}`

  const stage = { position: 'relative' as const, width: STAGE.width, height: STAGE.height, transform: `scale(${STAGE.scale}) translate(${shakeX}px, ${shakeY}px)` }

  return (
    <AbsoluteFill style={{ opacity: overlay, backgroundColor: color.ground, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <Img src={image('graveyard.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 55%, rgba(120,184,90,0.08), rgba(3,7,8,0.55) 55%, rgba(0,0,0,0.9) 100%)' }} />

      {/* Земля и гроб */}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={stage}>
          <div style={{ position: 'absolute', top: 16, width: '100%', textAlign: 'center', fontFamily: font.mono, fontSize: 13, color: color.muted }}>
            $ projectyard bury {sample.owner}/{sample.name}
          </div>
          <div style={{ position: 'absolute', left: 30, top: GROUND - 20, width: 380, height: 40, borderRadius: '50%', background: 'radial-gradient(ellipse, #000 40%, rgba(0,0,0,0) 75%)' }} />
          <div
            style={{
              position: 'absolute',
              left: 40,
              top: GROUND - 140,
              width: 360,
              height: 150,
              boxSizing: 'border-box',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.14)',
              backgroundImage: `linear-gradient(180deg, rgba(27,34,36,0.45), rgba(10,14,15,0.88)), url(${image('stone.webp')})`,
              backgroundSize: 'cover',
              boxShadow: '0 24px 50px rgba(0,0,0,0.6)',
              opacity: coffinOpacity,
              transform: `translateY(${coffinY}px) scale(${coffinScale})`,
            }}
          >
            <span style={{ fontFamily: font.mono, fontSize: 12, color: color.muted }}>{sample.owner} /</span>
            <span style={{ fontFamily: font.serif, fontWeight: 700, fontSize: 34, lineHeight: 1, color: color.bone }}>{sample.name}</span>
            <span style={{ display: 'flex', justifyContent: 'space-between', fontFamily: font.mono, fontSize: 12, color: color.muted }}>
              <span>{sample.language}</span>
              <span>{years}</span>
            </span>
          </div>

          {/* Пыль при приземлении */}
          {[-1, 1].flatMap((side) =>
            [0, 1, 2].map((i) => {
              const p = interpolate(frame, [at.coffin + 10 + i, at.coffin + 40 + i], [0, 1], clamp)
              return (
                <div
                  key={`${side}${i}`}
                  style={{
                    position: 'absolute',
                    left: 220 + side * 170 - 30 + p * side * (20 + i * 22),
                    top: GROUND - 20 - p * (10 + i * 8),
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(170,180,170,0.35), rgba(170,180,170,0) 70%)',
                    opacity: Math.sin(p * Math.PI) * 0.9,
                    transform: `scale(${0.3 + p * (1.1 + i * 0.3)})`,
                  }}
                />
              )
            }),
          )}

          <div
            style={{
              position: 'absolute',
              left: -200,
              right: -200,
              top: GROUND,
              bottom: -200,
              background: 'linear-gradient(180deg, #1a201c 0%, #0d110f 35%, #070a0b 60%, rgba(3,7,8,0) 100%)',
              clipPath: 'polygon(0 7px, 9% 2px, 21% 8px, 34% 1px, 50% 6px, 63% 1px, 78% 8px, 90% 3px, 100% 6px, 100% 100%, 0 100%)',
              WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 22%, #000 78%, transparent)',
            }}
          />
          <div style={{ position: 'absolute', left: -100, right: -100, top: GROUND + 3, height: 1, background: 'linear-gradient(90deg, rgba(160,175,160,0), rgba(160,175,160,0.35), rgba(160,175,160,0))' }} />

          {/* Земля сыплется в могилу */}
          {dirt.map((d, i) => {
            const p = interpolate(frame, [at.burying + d.delay, at.burying + d.delay + 20], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) })
            if (p <= 0 || p >= 1) return null
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: d.x,
                  top: d.from + p * (GROUND + 4 - d.from),
                  width: d.size,
                  height: d.size * 0.8,
                  borderRadius: '35%',
                  background: '#56604f',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 2px 4px rgba(0,0,0,0.6)',
                  transform: `rotate(${p * d.spin}deg)`,
                }}
              />
            )
          })}

          <div
            style={{
              position: 'absolute',
              left: 30,
              top: GROUND - 34,
              width: 380,
              height: 64,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at 50% 25%, #48533f, #1b221a 55%, #0d110f 80%)',
              transformOrigin: '50% 100%',
              transform: `scaleY(${mound})`,
              opacity: mound,
            }}
          />
        </div>
      </AbsoluteFill>

      {/* Всё глохнет: фон размывается, в фокусе только надгробие */}
      <AbsoluteFill style={{ backdropFilter: `blur(${blur * 7}px)`, background: `rgba(3,7,8,${blur * 0.45})` }} />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={stage}>
          <div style={{ position: 'absolute', left: 20, top: 0, width: 400, height: GROUND + 30, overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: GROUND + 24 - stoneBase,
                width: 400,
                height: stoneHeight,
                transform: `translateY(${(1 - rise) * stoneHeight}px)`,
                WebkitMaskImage: 'radial-gradient(ellipse 62% 58% at 50% 45%, #000 75%, transparent 100%)',
              }}
            >
              <Img
                src={image('tombstone.png')}
                style={{ position: 'absolute', left: -STONE.crop.x * k, top: -STONE.crop.y * k, width: 1536 * k, height: 1024 * k, maxWidth: 'none' }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 152,
                  top: (195 - STONE.crop.y) * k - 48,
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(120,184,90,0.5), rgba(120,184,90,0) 65%)',
                  opacity: emblem,
                }}
              />
              <div style={{ position: 'absolute', left: 52, top: 140, width: 296, height: 270, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
                <span style={{ fontFamily: font.serif, fontWeight: 700, fontSize: 15, letterSpacing: '0.35em', color: color.muted, opacity: interpolate(frame, [at.engrave - 6, at.engrave + 8], [0, 1], clamp) }}>
                  R.I.P.
                </span>
                <span style={{ fontFamily: font.serif, fontWeight: 700, fontSize: 40, lineHeight: 1, color: color.bone }}>
                  {Array.from(sample.name).map((char, i) => {
                    const p = interpolate(frame, [at.engrave + i * 1.4, at.engrave + i * 1.4 + 12], [0, 1], clamp)
                    return (
                      <span key={i} style={{ opacity: p, textShadow: `0 0 ${18 * (1 - p) + 2}px rgba(166,212,122,${0.9 * (1 - p)}), 0 3px 8px rgba(0,0,0,0.6)` }}>
                        {char}
                      </span>
                    )
                  })}
                </span>
                <span style={{ fontFamily: font.serif, fontWeight: 600, fontSize: 22, color: color.ink, opacity: interpolate(frame, [at.engrave + 18, at.engrave + 30], [0, 1], clamp) }}>
                  {years}
                </span>
              </div>
            </div>
          </div>

          {fireflies.map((f, i) => {
            const on = interpolate(frame, [at.engrave + i * 4, at.engrave + i * 4 + 12], [0, 1], clamp)
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: f.x + Math.sin(frame / 18 + f.phase) * 12,
                  top: f.y + Math.cos(frame / 22 + f.phase) * 14,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: color.mossLight,
                  boxShadow: '0 0 10px 3px rgba(166,212,122,0.6)',
                  opacity: on * (0.45 + Math.sin(frame / 7 + f.phase) * 0.45),
                }}
              />
            )
          })}

          <div style={{ position: 'absolute', top: 600, width: '100%', display: 'flex', justifyContent: 'center', textAlign: 'center' }}>
            <span style={{ position: 'absolute', fontFamily: font.sans, fontSize: 18, color: 'rgba(212,216,207,0.85)', opacity: captionOpacity(frame, at.coffin + 4, at.lowering) }}>
              Прощание с {sample.name}
            </span>
            <span style={{ position: 'absolute', fontFamily: font.sans, fontSize: 18, color: 'rgba(212,216,207,0.85)', opacity: captionOpacity(frame, at.lowering + 2, at.burying) }}>
              {lived} · {commitsLabel(sample.commits)}
            </span>
            <span style={{ position: 'absolute', width: 420, fontFamily: font.serif, fontStyle: 'italic', fontSize: 26, color: 'rgba(212,216,207,0.9)', opacity: captionOpacity(frame, at.burying + 4, at.silence) }}>
              «{sample.epitaph}»
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
