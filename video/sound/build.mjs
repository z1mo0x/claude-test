// Звук ролика. Сэмплов нет: всё собрано из шума, синусов, фильтров и ревербератора,
// поэтому звук можно пересобрать и поправить так же, как анимацию.
// Тайминги сцен берутся из src/timeline.json, кадры внутри сцен совпадают с src/scenes/*.
// Запуск: npm run sound → sound/out/soundtrack.wav (48 кГц, стерео).

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const timeline = JSON.parse(readFileSync(new URL('../src/timeline.json', import.meta.url), 'utf8'))
const SR = 48000
const FPS = timeline.fps

const starts = {}
let cursor = 0
for (const [name, frames] of Object.entries(timeline.scenes)) {
  starts[name] = cursor
  cursor += frames - timeline.transition
}
const totalFrames = cursor + timeline.transition
const length = Math.ceil((totalFrames / FPS) * SR)
const duration = length / SR

/** Секунда от начала ролика для кадра внутри сцены. */
const at = (scene, frame) => (starts[scene] + frame) / FPS

// Детерминированный генератор: звук при каждой сборке одинаковый.
function seeded(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const random = seeded(7)
const white = () => random() * 2 - 1
const between = (a, b) => a + random() * (b - a)

const buffer = (seconds) => new Float32Array(Math.ceil(seconds * SR))

// ── Строительные блоки ────────────────────────────────────────────────

function coefficients(type, freq, q) {
  const w = (2 * Math.PI * Math.min(freq, SR * 0.45)) / SR
  const cos = Math.cos(w)
  const alpha = Math.sin(w) / (2 * q)
  let b0
  let b1
  let b2
  if (type === 'lowpass') [b0, b1, b2] = [(1 - cos) / 2, 1 - cos, (1 - cos) / 2]
  else if (type === 'highpass') [b0, b1, b2] = [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2]
  else [b0, b1, b2] = [alpha, 0, -alpha]
  const a0 = 1 + alpha
  return [b0 / a0, b1 / a0, b2 / a0, (-2 * cos) / a0, (1 - alpha) / a0]
}

/** Биквад-фильтр. Частота может быть функцией времени — так делаются свипы. */
function filter(x, type, freq, q = 0.707) {
  const sweep = typeof freq === 'function'
  let c = coefficients(type, sweep ? freq(0) : freq, q)
  const y = new Float32Array(x.length)
  let x1 = 0
  let x2 = 0
  let y1 = 0
  let y2 = 0
  for (let i = 0; i < x.length; i++) {
    if (sweep && i % 32 === 0) c = coefficients(type, freq(i / SR), q)
    const out = c[0] * x[i] + c[1] * x1 + c[2] * x2 - c[3] * y1 - c[4] * y2
    x2 = x1
    x1 = x[i]
    y2 = y1
    y1 = out
    y[i] = out
  }
  return y
}

function noise(seconds) {
  const b = buffer(seconds)
  for (let i = 0; i < b.length; i++) b[i] = white()
  return b
}

function brown(seconds) {
  const b = buffer(seconds)
  let last = 0
  for (let i = 0; i < b.length; i++) {
    last = (last + 0.02 * white()) / 1.02
    b[i] = last * 3.5
  }
  return b
}

/** Синус с частотой freq(t). */
function tone(seconds, freq) {
  const b = buffer(seconds)
  let phase = 0
  for (let i = 0; i < b.length; i++) {
    phase += (2 * Math.PI * freq(i / SR)) / SR
    b[i] = Math.sin(phase)
  }
  return b
}

function shape(x, envelope) {
  for (let i = 0; i < x.length; i++) x[i] *= envelope(i / SR)
  return x
}

const decay = (tau) => (t) => Math.exp(-t / tau)
const hit = (attack, tau) => (t) => (t < attack ? t / attack : Math.exp(-(t - attack) / tau))
const arc = (seconds, power = 2) => (t) => Math.pow(Math.max(0, Math.sin((Math.PI * t) / seconds)), power)

function mix(...layers) {
  const out = new Float32Array(Math.max(...layers.map(([b]) => b.length)))
  for (const [b, gain] of layers) for (let i = 0; i < b.length; i++) out[i] += b[i] * gain
  return out
}

function normalize(x, peak = 1) {
  let max = 0
  for (const v of x) max = Math.max(max, Math.abs(v))
  if (max > 0) for (let i = 0; i < x.length; i++) x[i] *= peak / max
  return x
}

// ── Звуки ──────────────────────────────────────────────────────────────

function keyClick() {
  const click = shape(filter(noise(0.04), 'bandpass', between(2200, 4800), 1.1), decay(0.0035))
  const f = between(160, 230)
  const body = shape(tone(0.05, () => f), decay(0.01))
  return normalize(mix([click, 1.2], [body, 0.35]))
}

function mouseClick() {
  const down = shape(filter(noise(0.02), 'highpass', 3000, 0.9), decay(0.0015))
  const up = shape(filter(noise(0.02), 'highpass', 4200, 0.9), decay(0.001))
  const out = buffer(0.08)
  out.set(down, 0)
  const offset = Math.round(0.045 * SR)
  for (let i = 0; i < up.length; i++) out[i + offset] += up[i] * 0.6
  return normalize(mix([out, 1], [shape(tone(0.03, () => 1800), decay(0.004)), 0.15]))
}

function whoosh(seconds, from, to, q = 0.9) {
  const air = filter(noise(seconds), 'bandpass', (t) => from * Math.pow(to / from, t / seconds), q)
  return normalize(shape(air, arc(seconds)))
}

function riser(seconds) {
  const hiss = shape(filter(noise(seconds), 'highpass', (t) => 300 * Math.pow(20, t / seconds), 0.8), (t) => Math.pow(t / seconds, 2.2))
  const sweep = shape(tone(seconds, (t) => 90 * Math.pow(4, t / seconds)), (t) => Math.pow(t / seconds, 3))
  return normalize(mix([hiss, 0.8], [sweep, 0.25]))
}

/** Низкий удар с насыщением: смены сцен, «похоронить», логотип. */
function boom(base, seconds) {
  const sub = shape(tone(seconds, (t) => base * (1 + 2.2 * Math.exp(-t / 0.045))), decay(seconds * 0.32))
  const knock = shape(filter(noise(0.4), 'lowpass', 500), decay(0.05))
  const out = mix([sub, 1], [knock, 0.6])
  for (let i = 0; i < out.length; i++) out[i] = Math.tanh(out[i] * 1.6)
  // На 3 дБ тише остального: иначе после нормализации клики и шорохи тонут.
  return normalize(out, 0.7)
}

/** Глухой удар о землю. */
function thud(base) {
  const body = shape(tone(0.6, (t) => base * (1 + 1.5 * Math.exp(-t / 0.03))), decay(0.16))
  const dust = shape(filter(noise(0.5), 'lowpass', 900), hit(0.005, 0.09))
  return normalize(mix([body, 1], [dust, 0.45]))
}

function rumble(seconds, cutoff) {
  const r = filter(brown(seconds), 'lowpass', cutoff, 0.7)
  return normalize(shape(r, (t) => arc(seconds, 1)(t) * (0.8 + 0.2 * Math.sin(2 * Math.PI * 6 * t))))
}

/** Скрежет камня и земли. */
function grind(seconds) {
  const gravel = filter(brown(seconds), 'bandpass', 380, 1.4)
  const crackle = filter(noise(seconds), 'bandpass', 1500, 2)
  let level = 0.6
  const jitter = (t) => {
    level = Math.min(1, Math.max(0.25, level + (random() - 0.5) * 0.02))
    return level * arc(seconds, 1)(t)
  }
  const out = mix([gravel, 1], [shape(crackle, (t) => (random() < 0.002 ? 1 : 0.08)), 0.15])
  return normalize(shape(out, jitter))
}

function dirtHit() {
  const grit = shape(filter(noise(0.08), 'lowpass', between(1200, 3400)), hit(0.002, between(0.012, 0.032)))
  const low = shape(filter(noise(0.1), 'lowpass', 300), decay(0.03))
  return normalize(mix([grit, 0.9], [low, 0.6]))
}

/** Удар резца по камню: короткий щелчок и металлический отзвук. */
function chisel() {
  const b = buffer(0.12)
  const n = Math.round(0.003 * SR)
  for (let i = 0; i < n; i++) b[i] = white() * (1 - i / n)
  const ring = filter(b, 'bandpass', between(3600, 6200), 16)
  return normalize(mix([ring, 6], [shape(filter(b, 'highpass', 2000), decay(0.004)), 0.8]))
}

/** Колокол по Риссе: негармонические обертоны с разным затуханием. */
function bell(base, seconds) {
  const partials = [
    [0.56, 1, 1, 0],
    [0.56, 0.67, 0.9, 1],
    [0.92, 1, 0.65, 0],
    [0.92, 1.8, 0.55, 1.7],
    [1.19, 2.67, 0.325, 0],
    [1.7, 1.67, 0.35, 0],
    [2, 1.46, 0.25, 0],
    [2.74, 1.33, 0.2, 0],
    [3, 1.33, 0.15, 0],
    [3.76, 1, 0.1, 0],
    [4.07, 1.33, 0.075, 0],
  ]
  const out = buffer(seconds)
  for (const [ratio, amp, dur, detune] of partials) {
    const f = base * ratio + detune
    const tau = dur * seconds * 0.3
    for (let i = 0; i < out.length; i++) {
      const t = i / SR
      out[i] += amp * Math.sin(2 * Math.PI * f * t) * Math.exp(-t / tau) * Math.min(1, t / 0.002)
    }
  }
  return normalize(out)
}

function shimmer(seconds) {
  const voices = Array.from({ length: 9 }, () => ({ f: between(2000, 6500), rate: between(3, 9), phase: between(0, 6.28) }))
  const out = buffer(seconds)
  for (let i = 0; i < out.length; i++) {
    const t = i / SR
    let s = 0
    for (const v of voices) s += Math.sin(2 * Math.PI * v.f * t + v.phase) * (0.5 + 0.5 * Math.sin(2 * Math.PI * v.rate * t))
    out[i] = s
  }
  return normalize(shape(out, arc(seconds)))
}

function blip(notes) {
  const out = buffer(0.6)
  notes.forEach((f, n) => {
    const offset = Math.round(n * 0.075 * SR)
    for (let i = 0; i + offset < out.length; i++) {
      const t = i / SR
      out[i + offset] += (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t)) * Math.min(1, t / 0.004) * Math.exp(-t / 0.12)
    }
  })
  return normalize(out)
}

function pop(f) {
  const body = shape(tone(0.2, (t) => f * (1 + 0.8 * Math.exp(-t / 0.015))), hit(0.002, 0.05))
  const tick = shape(filter(noise(0.01), 'highpass', 2500), decay(0.002))
  return normalize(mix([body, 1], [tick, 0.3]))
}

function drone(seconds) {
  const voices = [[55, 0.5], [55.6, 0.5], [82.4, 0.28], [110.3, 0.12], [164.8, 0.05]]
  const out = buffer(seconds)
  for (let i = 0; i < out.length; i++) {
    const t = i / SR
    let s = 0
    for (const [f, a] of voices) s += a * Math.sin(2 * Math.PI * f * t)
    out[i] = s * (0.75 + 0.25 * Math.sin(2 * Math.PI * 0.07 * t))
  }
  return normalize(out)
}

function wind(seconds) {
  const air = filter(noise(seconds), 'bandpass', (t) => 520 + 260 * Math.sin(2 * Math.PI * 0.09 * t) + 120 * Math.sin(2 * Math.PI * 0.23 * t), 0.6)
  return normalize(shape(air, (t) => 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.05 * t + 1)))
}

// ── Микшер ─────────────────────────────────────────────────────────────

const L = new Float32Array(length)
const R = new Float32Array(length)
const sendL = new Float32Array(length)
const sendR = new Float32Array(length)

function place(sound, seconds, { gain = 1, pan = 0, reverb = 0.15 } = {}) {
  const start = Math.round(seconds * SR)
  const l = gain * Math.cos(((pan + 1) * Math.PI) / 4)
  const r = gain * Math.sin(((pan + 1) * Math.PI) / 4)
  for (let i = 0; i < sound.length; i++) {
    const j = start + i
    if (j < 0) continue
    if (j >= length) break
    L[j] += sound[i] * l
    R[j] += sound[i] * r
    sendL[j] += sound[i] * l * reverb
    sendR[j] += sound[i] * r * reverb
  }
}

/** Freeverb: 8 гребенчатых и 4 всепропускающих фильтра на канал. */
function freeverb(inL, inR, room = 0.86, damp = 0.35) {
  const scale = SR / 44100
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617]
  const allpasses = [556, 441, 341, 225]
  function channel(input, spread) {
    const cs = combs.map((d) => ({ buf: new Float32Array(Math.round((d + spread) * scale)), i: 0, store: 0 }))
    const as = allpasses.map((d) => ({ buf: new Float32Array(Math.round((d + spread) * scale)), i: 0 }))
    const out = new Float32Array(input.length)
    for (let n = 0; n < input.length; n++) {
      const x = input[n] * 0.015
      let s = 0
      for (const c of cs) {
        const y = c.buf[c.i]
        c.store = y * (1 - damp) + c.store * damp
        c.buf[c.i] = x + c.store * room
        c.i = (c.i + 1) % c.buf.length
        s += y
      }
      for (const a of as) {
        const b = a.buf[a.i]
        a.buf[a.i] = s + b * 0.5
        a.i = (a.i + 1) % a.buf.length
        s = b - s
      }
      out[n] = s
    }
    return out
  }
  return [channel(inL, 0), channel(inR, 23)]
}

// ── Партитура ──────────────────────────────────────────────────────────

// Фон: гул и ветер. Тихо на интерфейсе, громче на похоронах, затухание в конце.
const bedPoints = [
  [0, 0],
  [20, 0.5],
  [starts.demo, 0.55],
  [starts.demo + 30, 0.4],
  [starts.funeral, 0.5],
  [starts.funeral + 30, 1],
  [starts.certificate + 20, 0.7],
  [starts.outro, 0.9],
  [totalFrames - 40, 0.7],
  [totalFrames, 0],
]
function bedLevel(t) {
  const f = t * FPS
  for (let i = 1; i < bedPoints.length; i++) {
    const [f0, v0] = bedPoints[i - 1]
    const [f1, v1] = bedPoints[i]
    if (f <= f1) return v0 + ((v1 - v0) * (f - f0)) / Math.max(1, f1 - f0)
  }
  return 0
}
place(shape(drone(duration), bedLevel), 0, { gain: 0.16, reverb: 0.05 })
place(shape(wind(duration), bedLevel), 0, { gain: 0.1, reverb: 0.1, pan: -0.2 })

// Печать: по щелчку на каждую появившуюся букву.
function typing(scene, start, count, framesPerChar, gain) {
  for (let i = 1; i <= count; i++) {
    place(keyClick(), at(scene, start + i * framesPerChar), { gain: 1.3 * gain * between(0.75, 1.1), pan: between(-0.15, 0.15), reverb: 0.08 })
  }
}

// 1. git commit -m "доделаю на выходных"
typing('cold', 10, 35, 1, 0.3)
place(thud(150), at('cold', 48), { gain: 0.18, reverb: 0.1 })
place(normalize(shape(tone(1.6, () => 98), hit(0.02, 0.5))), at('cold', 58), { gain: 0.22, reverb: 0.4 })

// 2. Стена мёртвых репозиториев. «Похоронить» — удар, карточки падают.
place(whoosh(0.9, 200, 2600), at('wall', 0) - 0.3, { gain: 0.3, pan: -0.3, reverb: 0.25 })
place(whoosh(0.5, 900, 3500, 1.2), at('wall', 8), { gain: 0.12, pan: -0.2 })
place(whoosh(0.5, 900, 3500, 1.2), at('wall', 16), { gain: 0.12, pan: 0.2 })
place(whoosh(0.45, 3000, 800), at('wall', 94), { gain: 0.1 })
place(whoosh(0.45, 900, 3000), at('wall', 106), { gain: 0.1 })
place(boom(46, 2.8), at('wall', 112), { gain: 0.9, reverb: 0.35 })
place(rumble(1.8, 140), at('wall', 112), { gain: 0.45 })
for (let i = 0; i < 12; i++) {
  place(thud(between(55, 95)), at('wall', 112 + 30 + between(0, 18)), { gain: between(0.1, 0.2), pan: between(-0.6, 0.6), reverb: 0.25 })
}
place(riser(1.2), at('logo', 0) - 1.2, { gain: 0.4, reverb: 0.2 })

// 3. Логотип: удар, колокольчик, мерцание.
place(boom(52, 3), at('logo', 0), { gain: 0.85, reverb: 0.4 })
place(bell(520, 4), at('logo', 0), { gain: 0.3, reverb: 0.6 })
place(shimmer(2.2), at('logo', 2), { gain: 0.1, reverb: 0.6 })
typing('logo', 12, 12, 1.2, 0.22)
place(whoosh(0.5, 1200, 4000, 1.4), at('logo', 36), { gain: 0.08 })

// 4. Сайт: окно влетает, камера ездит, курсор печатает и кликает (см. scenes/Demo.tsx).
place(whoosh(1, 150, 2200), at('demo', 0) - 0.2, { gain: 0.35, pan: 0.4, reverb: 0.25 })
place(thud(120), at('demo', 20), { gain: 0.14, reverb: 0.2 })
for (const [frame, from, to] of [[45, 300, 1800], [112, 1800, 300], [142, 300, 1800], [198, 400, 2000]]) {
  place(whoosh(0.8, from, to), at('demo', frame), { gain: 0.14, reverb: 0.2 })
}
place(mouseClick(), at('demo', 62), { gain: 0.4, pan: -0.2 })
typing('demo', 68, 26, 1.1, 0.22)
place(blip([880, 1320]), at('demo', 106), { gain: 0.2, reverb: 0.3 })
place(shimmer(0.8), at('demo', 116), { gain: 0.06, pan: 0.4, reverb: 0.5 })
place(mouseClick(), at('demo', 160), { gain: 0.4, pan: -0.1 })
place(pop(700), at('demo', 160), { gain: 0.1 })
typing('demo', 168, 32, 0.95, 0.18)
place(mouseClick(), at('demo', 212), { gain: 0.45 })
place(boom(44, 3.2), at('demo', 214), { gain: 0.7, reverb: 0.45 })

// 5. Похороны (см. scenes/Funeral.tsx).
place(thud(62), at('funeral', 30), { gain: 0.8, reverb: 0.3 })
place(grind(2.3), at('funeral', 56), { gain: 0.3, reverb: 0.2 })
place(rumble(2.4, 120), at('funeral', 56), { gain: 0.45 })
place(normalize(shape(filter(noise(0.9), 'lowpass', 1400), arc(0.9))), at('funeral', 122), { gain: 0.12, reverb: 0.2 })
for (let i = 0; i < 26; i++) {
  const land = 122 + ((i * 13) % 26) * 1.05 + 20
  const x = 70 + ((i * 97) % 300)
  place(dirtHit(), at('funeral', land), { gain: between(0.14, 0.26), pan: (x - 220) / 400, reverb: 0.15 })
}
place(grind(1.5), at('funeral', 152), { gain: 0.4, reverb: 0.25 })
place(rumble(1.6, 110), at('funeral', 152), { gain: 0.55 })
place(thud(55), at('funeral', 194), { gain: 0.55, reverb: 0.35 })
place(shimmer(1.6), at('funeral', 186), { gain: 0.07, reverb: 0.6 })
for (let i = 0; i < 11; i++) place(chisel(), at('funeral', 190 + i * 1.4), { gain: 0.1, pan: between(-0.1, 0.1), reverb: 0.3 })
place(bell(190, 7), at('funeral', 196), { gain: 0.55, reverb: 0.7 })

// 6. Свидетельство, телефон со сторис, кнопки.
place(whoosh(0.9, 250, 3000), at('certificate', 0), { gain: 0.24, reverb: 0.3 })
place(shimmer(1.8), at('certificate', 4), { gain: 0.11, reverb: 0.6 })
place(boom(70, 1.5), at('certificate', 4), { gain: 0.3, reverb: 0.3 })
place(whoosh(0.5, 900, 3500, 1.2), at('certificate', 10), { gain: 0.08 })
place(whoosh(0.9, 2500, 300), at('certificate', 78), { gain: 0.2, pan: 0.5, reverb: 0.2 })
;[520, 600, 690, 790, 900].forEach((f, i) => {
  place(pop(f), at('certificate', 110 + i * 4), { gain: 0.2, pan: -0.4 + i * 0.2, reverb: 0.2 })
})

// 7. Финал.
place(boom(40, 3.5), at('outro', 0), { gain: 0.8, reverb: 0.5 })
place(whoosh(0.6, 900, 3500, 1.2), at('outro', 6), { gain: 0.1, pan: -0.2 })
place(whoosh(0.6, 900, 3500, 1.2), at('outro', 12), { gain: 0.1, pan: 0.2 })
typing('outro', 46, 12, 1.1, 0.2)
place(blip([660]), at('outro', 62), { gain: 0.1, reverb: 0.3 })
place(bell(260, 5), at('outro', 80), { gain: 0.38, reverb: 0.7 })
place(pop(880), at('outro', 80), { gain: 0.18 })
place(boom(55, 2.5), at('outro', 80), { gain: 0.45, reverb: 0.4 })

// ── Мастер ─────────────────────────────────────────────────────────────

const [wetL, wetR] = freeverb(sendL, sendR)
for (let i = 0; i < length; i++) {
  L[i] += wetL[i] * 1.4
  R[i] += wetR[i] * 1.4
}
// Срезаем инфранизкие частоты: бурый шум даёт медленный дрейф, который только гудит в динамиках.
const cleanL = filter(L, 'highpass', 25)
const cleanR = filter(R, 'highpass', 25)
const outL = new Float32Array(length)
const outR = new Float32Array(length)
const fadeOut = 0.8
for (let i = 0; i < length; i++) {
  const t = i / SR
  const fade = Math.min(1, t / 0.05) * Math.min(1, (duration - t) / fadeOut)
  outL[i] = Math.tanh(cleanL[i] * 1.1) * fade
  outR[i] = Math.tanh(cleanR[i] * 1.1) * fade
}
let peak = 0
for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(outL[i]), Math.abs(outR[i]))
const gain = 0.89 / peak

const data = Buffer.alloc(44 + length * 4)
data.write('RIFF', 0)
data.writeUInt32LE(36 + length * 4, 4)
data.write('WAVE', 8)
data.write('fmt ', 12)
data.writeUInt32LE(16, 16)
data.writeUInt16LE(1, 20)
data.writeUInt16LE(2, 22)
data.writeUInt32LE(SR, 24)
data.writeUInt32LE(SR * 4, 28)
data.writeUInt16LE(4, 32)
data.writeUInt16LE(16, 34)
data.write('data', 36)
data.writeUInt32LE(length * 4, 40)
for (let i = 0; i < length; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, outL[i] * gain)) * 32767), 44 + i * 4)
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, outR[i] * gain)) * 32767), 46 + i * 4)
}

const dir = new URL('./out/', import.meta.url)
mkdirSync(dir, { recursive: true })
writeFileSync(new URL('soundtrack.wav', dir), data)
console.log(`soundtrack.wav: ${duration.toFixed(2)} с, пик до нормализации ${peak.toFixed(2)}`)
