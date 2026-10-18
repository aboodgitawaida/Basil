import { FRIDGE } from '../lib/room'
import { useSteps } from '../lib/useSteps'
import { Sprite } from './Sprite'

const FRAMES = 4

type Props = { open: boolean; onToggle: () => void }

export function Fridge({ open, onToggle }: Props) {
  const frame = useSteps(open, FRAMES, 45)
  const { x, y, w, h, freezerH } = FRIDGE

  return (
    <button
      className="hit"
      onClick={onToggle}
      aria-label={open ? 'Close the fridge' : 'Open the fridge'}
      aria-expanded={open}
      style={{ left: x, top: y, width: w, height: h }}
    >
      <Sprite k="fridge/carcass" x={0} y={0} />
      <Sprite k={`fridge/freezer-${frame}`} x={0} y={0} />
      <Sprite k={`fridge/door-${frame}`} x={0} y={freezerH} />
    </button>
  )
}
