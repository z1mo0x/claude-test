import { Composition } from 'remotion'
import { Launch, LAUNCH_FRAMES } from './Launch'
import timeline from './timeline.json'

export function Root() {
  return (
    <Composition
      id="Launch"
      component={Launch}
      durationInFrames={LAUNCH_FRAMES}
      fps={timeline.fps}
      width={1920}
      height={1080}
      defaultProps={{ site: '' }}
    />
  )
}
