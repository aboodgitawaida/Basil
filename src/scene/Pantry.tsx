import type { Arrangement } from '../lib/arrange'
import { CUPBOARDS, CUPBOARD_DOOR_W, PANTRY } from '../lib/room'
import { Sprite } from './Sprite'
import { More, Stock, type ItemHandlers } from './Shelves'

export const PANTRY_FRAMES = 4

type Props = ItemHandlers & {
  /** which cupboard: 0 on the left (hinged left), 1 on the right (hinged right) */
  n: 0 | 1
  frame: number
  open: boolean
  onToggle: () => void
  arrangement: Arrangement
  draggingId?: string
  /** show the "+N more" on this one */
  showMore?: boolean
  onMore?: () => void
}

/** A base cupboard under the worktop. The right-hand one is the left one
 *  mirrored, so the pair opens like a real double cupboard. */
export function Cupboard({ n, frame, open, onToggle, arrangement, draggingId, showMore, onMore, ...handlers }: Props) {
  const { x, hinge } = CUPBOARDS[n]
  const { y, w, h } = PANTRY
  const doorW = CUPBOARD_DOOR_W[frame]
  const doorX = hinge === 'left' ? x + 6 : x + 50 - doorW
  // what the door has uncovered so far
  const from = hinge === 'left' ? x + 6 + doorW : x + 6
  const to = hinge === 'left' ? x + 50 : x + 50 - doorW
  const placed = arrangement.placed.filter(p => p.area.part === `cup-${n}`)

  return (
    <>
      <Sprite k="room/cupboard-inside" x={x} y={y} />
      {open && (
        <button className="hit" data-drop="cupboard" onClick={onToggle} aria-label="Shut the cupboard"
          style={{ left: x, top: y + 8, width: w, height: h - 8 }} />
      )}
      {frame > 0 && <Stock placed={placed} draggingId={draggingId} from={from} to={to} {...handlers} />}
      <button
        className="hit interact"
        style={{ left: doorX, top: y + 12, width: doorW, height: 68 }}
        onClick={onToggle}
        aria-label={open ? 'Close the cupboard' : 'Open the cupboard'}
        aria-expanded={open}
        title={open ? 'Close the cupboard' : 'Open the cupboard'}
      >
        <Sprite k={`room/pantry-door-${frame}`} x={0} y={0} flip={hinge === 'right'} />
      </button>
      {showMore && open && frame === PANTRY_FRAMES - 1 && (
        <More n={arrangement.hidden.cupboard.length} x={x + 34} y={y + 64} onClick={onMore} />
      )}
    </>
  )
}
