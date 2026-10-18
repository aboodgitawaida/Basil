import { spriteUrl } from '../lib/sprites'
import { useLoop } from '../lib/useLoop'

export type Mood = 'sleepy' | 'love' | 'question' | 'idea' | 'eager' | 'ok'

const FRAME = 32
const COLS = 5
const FRAMES = 20

type Props = { mood: Mood; x: number; y: number; flip?: boolean }

/** One of the pack's animated emoticon bubbles, stepped through with
 *  background-position so the whole sheet is a single request. */
export function Bubble({ mood, x, y, flip }: Props) {
  const frame = useLoop(FRAMES, 90)
  const url = spriteUrl(`bubble/${mood}`)
  if (!url) return null
  return (
    <i
      className="bubble"
      style={{
        left: x,
        top: y,
        width: FRAME,
        height: FRAME,
        backgroundImage: `url(${url})`,
        backgroundPosition: `-${(frame % COLS) * FRAME}px -${Math.floor(frame / COLS) * FRAME}px`,
        transform: flip ? 'scaleX(-1)' : undefined,
      }}
    />
  )
}
