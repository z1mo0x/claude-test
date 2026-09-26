import { AbsoluteFill, Audio } from 'remotion'
import { linearTiming, TransitionSeries } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { usePreload } from './fonts'
import { Background } from './parts/Background'
import { Certificate } from './scenes/Certificate'
import { ColdOpen } from './scenes/ColdOpen'
import { Demo } from './scenes/Demo'
import { Funeral } from './scenes/Funeral'
import { Logo } from './scenes/Logo'
import { Outro } from './scenes/Outro'
import { Wall } from './scenes/Wall'
import timeline from './timeline.json'
// Звук собирает sound/build.mjs по тем же таймингам (npm run sound).
import soundtrack from '../sound/out/soundtrack.wav'

/** Длительность сцен в кадрах и растворение между ними. Те же числа читает звук. */
export const SCENES = timeline.scenes
const TRANSITION = timeline.transition
export const LAUNCH_FRAMES = Object.values(SCENES).reduce((a, b) => a + b, 0) - TRANSITION * (Object.keys(SCENES).length - 1)

export function Launch({ site }: { site: string }) {
  usePreload()
  const timing = linearTiming({ durationInFrames: TRANSITION })
  return (
    <AbsoluteFill>
      <Background />
      <Audio src={soundtrack} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENES.cold}>
          <ColdOpen />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.wall}>
          <Wall />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.logo}>
          <Logo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.demo}>
          <Demo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.funeral}>
          <Funeral />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.certificate}>
          <Certificate />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.outro}>
          <Outro site={site} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  )
}
