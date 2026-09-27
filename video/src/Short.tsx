import { AbsoluteFill, Audio } from 'remotion'
import { linearTiming, TransitionSeries } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { usePreload } from './fonts'
import { Background } from './parts/Background'
import { Funeral } from './scenes/Funeral'
import { Certificate } from './scenes/short/Certificate'
import { Hook } from './scenes/short/Hook'
import { Link } from './scenes/short/Link'
import { Outro } from './scenes/short/Outro'
import timeline from './timeline-short.json'
// Звук собирает `node sound/build.mjs short` по тем же таймингам (npm run sound).
import soundtrack from '../sound/out/short.wav'

/** Вертикальная версия для TikTok, Reels и Shorts. Длительности сцен — в timeline-short.json, их же читает звук. */
export const SHORT_SCENES = timeline.scenes
const TRANSITION = timeline.transition
export const SHORT_FRAMES = Object.values(SHORT_SCENES).reduce((a, b) => a + b, 0) - TRANSITION * (Object.keys(SHORT_SCENES).length - 1)

export function Short({ site }: { site: string }) {
  usePreload()
  const timing = linearTiming({ durationInFrames: TRANSITION })
  return (
    <AbsoluteFill>
      <Background />
      <Audio src={soundtrack} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SHORT_SCENES.hook}>
          <Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SHORT_SCENES.link}>
          <Link />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SHORT_SCENES.funeral}>
          <Funeral scale={2.2} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SHORT_SCENES.certificate}>
          <Certificate />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SHORT_SCENES.outro}>
          <Outro site={site} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  )
}
