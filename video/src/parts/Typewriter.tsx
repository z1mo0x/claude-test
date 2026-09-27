import { useCurrentFrame } from 'remotion'

export function typed(text: string, frame: number, start: number, framesPerChar = 1) {
  return text.slice(0, Math.max(0, Math.floor((frame - start) / framesPerChar)))
}

export function Caret({ color, width = '0.55em' }: { color: string; width?: string }) {
  const frame = useCurrentFrame()
  return (
    <span
      style={{
        display: 'inline-block',
        width,
        height: '1.05em',
        marginLeft: 4,
        verticalAlign: '-0.16em',
        background: color,
        opacity: Math.floor(frame / 14) % 2 ? 0 : 1,
      }}
    />
  )
}
