import { CUPBOARD } from '../lib/room'
import { useSteps } from '../lib/useSteps'
import { Sprite } from './Sprite'

const FRAMES = 4

type Props = { open: boolean; onToggle: () => void }

export function Cupboard({ open, onToggle }: Props) {
  const frame = useSteps(open, FRAMES, 45)
  const { x, y, w, h } = CUPBOARD
  const half = Math.floor(w / 2)

  return (
    <button
      className="hit"
      onClick={onToggle}
      aria-label={open ? 'Close the cupboard' : 'Open the cupboard'}
      aria-expanded={open}
      style={{ left: x, top: y, width: w, height: h }}
    >
      <Sprite k="room/cupboard-carcass" x={0} y={0} />
      <Sprite k={`room/cup-l-${frame}`} x={0} y={0} />
      <Sprite k={`room/cup-r-${frame}`} x={half} y={0} rightAlign={w} />
    </button>
  )
}
