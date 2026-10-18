import { FLOOR_Y, LAYOUT } from '../lib/room'
import { useSteps } from '../lib/useSteps'

const { x, y, w, h } = LAYOUT.fridge
const FREEZER_H = 34
const SHELVES = [14, 32, 50]      // offsets inside the fridge compartment
const DOOR_FRAMES = [w, 32, 20, 9] // whole art pixels, so the door stays crisp

type Props = { open: boolean; onToggle: () => void }

export function Fridge({ open, onToggle }: Props) {
  const frame = useSteps(open, DOOR_FRAMES.length, 45)
  const doorW = DOOR_FRAMES[frame]
  const ajar = frame > 0

  return (
    <button
      className="fridge"
      onClick={onToggle}
      aria-label={open ? 'Close the fridge' : 'Open the fridge'}
      aria-expanded={open}
      style={{ position: 'absolute', left: x, top: y, width: w, height: h }}
    >
      {/* carcass */}
      <div className="fridge__body" style={{ height: h }}>
        {/* freezer, above the divider */}
        <div className="fridge__cell" style={{ top: 2, height: FREEZER_H - 4 }}>
          <i className="fridge__shelf" style={{ top: 15 }} />
        </div>
        {/* fridge compartment */}
        <div className="fridge__cell" style={{ top: FREEZER_H + 1, height: h - FREEZER_H - 3 }}>
          {SHELVES.map(s => <i key={s} className="fridge__shelf" style={{ top: s }} />)}
        </div>
      </div>

      {/* doors: two panels that narrow in whole pixels as they swing open */}
      <div className="fridge__door" style={{ top: 0, height: FREEZER_H, width: doorW }}>
        <i className="fridge__handle" style={{ top: FREEZER_H - 12 }} />
      </div>
      <div
        className="fridge__door"
        style={{ top: FREEZER_H, height: h - FREEZER_H, width: doorW }}
      >
        <i className="fridge__handle" style={{ top: 6 }} />
      </div>

      {/* the open door's edge, caught by the room light */}
      {ajar && <div className="fridge__edge" style={{ left: doorW - 1, height: h }} />}
      <div className="fridge__feet" style={{ top: FLOOR_Y - y - 2 }} />
    </button>
  )
}
