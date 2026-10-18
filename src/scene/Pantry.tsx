import { PANTRY } from '../lib/room'
import { useSteps } from '../lib/useSteps'
import { Sprite } from './Sprite'

const FRAMES = 4

type Props = { open: boolean; onToggle: () => void }

/** The base cabinet under the left of the worktop. It is a base unit rather
 *  than a wall cupboard because the fridge door sweeps the wall above the
 *  counter, which would leave a wall unit hidden and unclickable. */
export function Pantry({ open, onToggle }: Props) {
  const frame = useSteps(open, FRAMES, 50)
  const { x, y, w, h } = PANTRY

  return (
    <>
      <Sprite k="room/pantry-carcass" x={x} y={y} />
      <Sprite k={`room/pantry-door-${frame}`} x={x + 6} y={y + 12} />
      <button
        className="hit"
        onClick={onToggle}
        aria-label={open ? 'Close the cupboard' : 'Open the cupboard'}
        aria-expanded={open}
        style={{ left: x, top: y + 8, width: w, height: h - 8 }}
      />
    </>
  )
}
