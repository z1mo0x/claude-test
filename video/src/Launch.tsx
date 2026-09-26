import { AbsoluteFill } from 'remotion'
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

/** Длительность сцен в кадрах при 30 fps. Между сценами — растворение на TRANSITION кадров. */
export const SCENES = { cold: 90, wall: 165, logo: 80, demo: 225, funeral: 240, certificate: 180, outro: 150 }
const TRANSITION = 15
export const LAUNCH_FRAMES = Object.values(SCENES).reduce((a, b) => a + b, 0) - TRANSITION * (Object.keys(SCENES).length - 1)

export function Launch({ site }: { site: string }) {
  usePreload()
  const timing = linearTiming({ durationInFrames: TRANSITION })
  return (
    <AbsoluteFill>
      <Background />
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
