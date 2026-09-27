import { Composition } from 'remotion'
import { Launch, LAUNCH_FRAMES } from './Launch'
import { Short, SHORT_FRAMES } from './Short'
import timeline from './timeline.json'
import timelineShort from './timeline-short.json'

export function Root() {
  return (
    <>
      <Composition
        id="Launch"
        component={Launch}
        durationInFrames={LAUNCH_FRAMES}
        fps={timeline.fps}
        width={1920}
        height={1080}
        defaultProps={{ site: '' }}
      />
      <Composition
        id="Short"
        component={Short}
        durationInFrames={SHORT_FRAMES}
        fps={timelineShort.fps}
        width={1080}
        height={1920}
        defaultProps={{ site: 'projectyard-bury.vercel.app' }}
      />
    </>
  )
}
