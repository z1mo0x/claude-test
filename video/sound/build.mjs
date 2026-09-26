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

/**
 * Клавиатура как на айфоне: короткий сухой «тик» от резонанса около 2 кГц, без низа.
 * pitch < 1 — клавиша ниже, как Enter и пробел на iOS.
 */
function keyClick(pitch = 1) {
  const b = buffer(0.03)
  const n = Math.round(0.0008 * SR)
  for (let i = 0; i < n; i++) b[i] = white() * (1 - i / n)
  const f = 2100 * pitch * between(0.97, 1.03)
  const ring = filter(b, 'bandpass', f, 5)
  const edge = shape(filter(b, 'highpass', 3500), decay(0.0015))
  return normalize(filter(mix([ring, 1], [edge, 0.08]), 'highpass', 400))
}

/** Мягкий свист воздуха: шум через полосовой фильтр, частота плавно едет от from к to. */
function whoosh(seconds, from, to) {
  const air = filter(noise(seconds), 'bandpass', (t) => from * Math.pow(to / from, t / seconds), 0.7)
  return normalize(filter(shape(air, arc(seconds, 3)), 'lowpass', 5000))
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

/** Гроб встаёт на землю: глухой деревянный стук, низ срезан, чтобы не гудело. */
function knock() {
  const wood = shape(filter(noise(0.25), 'bandpass', 240, 3), hit(0.002, 0.04))
  const dust = shape(filter(noise(0.4), 'lowpass', 900), hit(0.004, 0.08))
  return normalize(filter(mix([wood, 1], [dust, 0.6]), 'highpass', 90))
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

/** Земля сыплется с лопаты. */
function pour(seconds) {
  return normalize(shape(filter(noise(seconds), 'lowpass', 1400), arc(seconds)))
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

/** Ставит звук так, чтобы его середина пришлась на секунду peak. */
function centred(sound, peak, options) {
  place(sound, peak - sound.length / SR / 2, options)
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
// Только то, что происходит в кадре: печать, клики, гроб, земля, камень, резец,
// и тихий свист воздуха, когда появляется текст или меняется сцена. Ни фона, ни музыки, ни ударов.

// Печать: по тику на каждую появившуюся букву.
function typing(scene, start, count, framesPerChar, gain) {
  for (let i = 1; i <= count; i++) {
    place(keyClick(), at(scene, start + i * framesPerChar), { gain: gain * between(0.85, 1), pan: between(-0.08, 0.08), reverb: 0.02 })
  }
}

// Смена сцены: переход длится timeline.transition кадров, середина свиста — на середине перехода.
for (const scene of Object.keys(starts).slice(1)) {
  centred(whoosh(0.8, 350, 1600), at(scene, timeline.transition / 2), { gain: 0.05, reverb: 0.2 })
}

// Появление текста: слова выезжают за 6–8 кадров, середина свиста чуть позже старта.
const text = [
  ['cold', 58],
  ['wall', 8],
  ['wall', 16],
  ['wall', 106],
  ['wall', 112],
  ['logo', 36],
  ['funeral', 22],
  ['funeral', 58],
  ['funeral', 126],
  ['certificate', 10],
  ['certificate', 30],
  ['outro', 6],
  ['outro', 12],
  ['outro', 62],
  ['outro', 80],
]
text.forEach(([scene, frame], i) => {
  centred(whoosh(0.45, 900, 2600), at(scene, frame + 4), { gain: 0.03, pan: i % 2 ? 0.15 : -0.15, reverb: 0.15 })
})

// 1. git commit -m "доделаю на выходных" и Enter.
typing('cold', 10, 35, 1, 0.045)
place(keyClick(0.75), at('cold', 48), { gain: 0.06, reverb: 0.02 })

// 3. Логотип печатается.
typing('logo', 12, 12, 1.2, 0.04)

// 4. Сайт: курсор кликает и печатает (см. scenes/Demo.tsx).
place(mouseClick(), at('demo', 62), { gain: 0.24, pan: -0.2 })
typing('demo', 68, 26, 1.1, 0.04)
place(mouseClick(), at('demo', 160), { gain: 0.24, pan: -0.1 })
typing('demo', 168, 32, 0.95, 0.035)
place(mouseClick(), at('demo', 212), { gain: 0.28 })

// 5. Похороны (см. scenes/Funeral.tsx): гроб встаёт, опускается, земля, камень, резец.
place(knock(), at('funeral', 30), { gain: 0.45, reverb: 0.15 })
place(grind(2.3), at('funeral', 56), { gain: 0.16, reverb: 0.1 })
place(pour(0.9), at('funeral', 122), { gain: 0.1, reverb: 0.1 })
for (let i = 0; i < 26; i++) {
  const land = 122 + ((i * 13) % 26) * 1.05 + 20
  const x = 70 + ((i * 97) % 300)
  place(dirtHit(), at('funeral', land), { gain: between(0.07, 0.13), pan: (x - 220) / 400, reverb: 0.1 })
}
place(grind(1.5), at('funeral', 152), { gain: 0.22, reverb: 0.15 })
for (let i = 0; i < 11; i++) place(chisel(), at('funeral', 190 + i * 1.4), { gain: 0.1, pan: between(-0.1, 0.1), reverb: 0.2 })

// 7. Финал: печатается projectyard>.
typing('outro', 46, 12, 1.1, 0.04)

// ── Мастер ─────────────────────────────────────────────────────────────

const [wetL, wetR] = freeverb(sendL, sendR)
for (let i = 0; i < length; i++) {
  L[i] += wetL[i] * 1.4
  R[i] += wetR[i] * 1.4
}
// Срезаем низ: бурый шум в скрежете даёт медленный дрейф, который только гудит в динамиках.
const cleanL = filter(L, 'highpass', 60)
const cleanR = filter(R, 'highpass', 60)
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
// Пик на −3 дБ: звук редкий и тихий, громче нормализовать незачем.
const gain = 0.7 / peak

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
