import type { Arrangement } from '../lib/arrange'
import { DOOR_PANEL, FRIDGE, FRIDGE_REVEAL } from '../lib/room'
import { spriteSize } from '../lib/sprites'
import { Sprite } from './Sprite'
import { More, Stock, type ItemHandlers } from './Shelves'

/** Five frames of each door: closed, squashed twice toward the hinge, then
 *  the inside of the door opening out. See tools/doors.py. */
export const FRIDGE_FRAMES = 5

const BODY_X = FRIDGE.right - FRIDGE.w
const FREEZER_ROWS = [0, 60] as const
const FRIDGE_ROWS = [62, 154] as const

type Props = ItemHandlers & {
  fridgeFrame: number
  freezerFrame: number
  fridgeOpen: boolean
  freezerOpen: boolean
  onFridge: () => void
  onFreezer: () => void
  arrangement: Arrangement
  draggingId?: string
  onMore?: () => void
}

/** One door: a button wrapping its sprite, so the highlight and the click
 *  follow the door's real shape, whichever frame it is on. */
function Door({ name, frame, rows, panelY, open, onToggle }: {
  name: 'fridge' | 'freezer'; frame: number; rows: readonly [number, number]; panelY: number; open: boolean; onToggle: () => void
}) {
  const k = `fridge/${name}-${frame}`
  const { w, h } = spriteSize(k)
  const out = frame >= 3
  return (
    <button
      className="hit interact"
      style={{ left: out ? BODY_X - w : BODY_X, top: out ? panelY : FRIDGE.y + rows[0], width: w, height: h }}
      onClick={onToggle}
      aria-label={open ? `Close the ${name}` : `Open the ${name}`}
      aria-expanded={open}
      title={open ? `Close the ${name}` : `Open the ${name}`}
    >
      <Sprite k={k} x={0} y={0} />
    </button>
  )
}

export function Fridge(p: Props) {
  const { fridgeFrame, freezerFrame, arrangement, draggingId, onMore, ...rest } = p
  const handlers: ItemHandlers = {
    onPointerDown: rest.onPointerDown, onPointerMove: rest.onPointerMove, onPointerUp: rest.onPointerUp,
    onPointerCancel: rest.onPointerCancel, onActivate: rest.onActivate,
  }
  const inPart = (part: string) => arrangement.placed.filter(x => x.area.part === part)
  const right = FRIDGE.right - 4

  return (
    <>
      <Sprite k="fridge/shell" x={BODY_X} y={FRIDGE.y} />

      {/* the compartments: clicking inside (not on a thing) shuts the door,
          and anything dragged here goes in */}
      {p.freezerOpen && (
        <button className="hit" data-drop="freezer" onClick={p.onFreezer} aria-label="Shut the freezer"
          style={{ left: BODY_X, top: FRIDGE.y + FREEZER_ROWS[0], width: FRIDGE.w, height: FREEZER_ROWS[1] - FREEZER_ROWS[0] }} />
      )}
      {p.fridgeOpen && (
        <button className="hit" data-drop="fridge" onClick={p.onFridge} aria-label="Shut the fridge"
          style={{ left: BODY_X, top: FRIDGE.y + FRIDGE_ROWS[0], width: FRIDGE.w, height: FRIDGE_ROWS[1] - FRIDGE_ROWS[0] }} />
      )}

      {freezerFrame > 0 && (
        <Stock placed={inPart('freezer')} draggingId={draggingId} from={BODY_X + FRIDGE_REVEAL[freezerFrame]} to={right} {...handlers} />
      )}
      {fridgeFrame > 0 && (
        <Stock placed={inPart('fridge')} draggingId={draggingId} from={BODY_X + FRIDGE_REVEAL[fridgeFrame]} to={right} {...handlers} />
      )}

      <Door name="freezer" frame={freezerFrame} rows={FREEZER_ROWS} panelY={DOOR_PANEL.freezerY} open={p.freezerOpen} onToggle={p.onFreezer} />
      <Door name="fridge" frame={fridgeFrame} rows={FRIDGE_ROWS} panelY={DOOR_PANEL.fridgeY} open={p.fridgeOpen} onToggle={p.onFridge} />

      {/* the bins on the inside of each door, once it is all the way open */}
      {freezerFrame === FRIDGE_FRAMES - 1 && (
        <>
          <Stock placed={inPart('freezer-door')} draggingId={draggingId} {...handlers} />
          <i className="bin" style={{ left: DOOR_PANEL.x + 8, top: DOOR_PANEL.freezerY + 52, width: 52 }} />
        </>
      )}
      {fridgeFrame === FRIDGE_FRAMES - 1 && (
        <>
          <Stock placed={inPart('fridge-door')} draggingId={draggingId} {...handlers} />
          <i className="bin" style={{ left: DOOR_PANEL.x + 8, top: DOOR_PANEL.fridgeY + 42, width: 52 }} />
          <i className="bin" style={{ left: DOOR_PANEL.x + 8, top: DOOR_PANEL.fridgeY + 84, width: 52 }} />
        </>
      )}

      {p.freezerOpen && freezerFrame === FRIDGE_FRAMES - 1 && (
        <More n={arrangement.hidden.freezer.length} x={right - 14} y={FRIDGE.y + 44} onClick={onMore} />
      )}
      {p.fridgeOpen && fridgeFrame === FRIDGE_FRAMES - 1 && (
        <More n={arrangement.hidden.fridge.length} x={right - 14} y={FRIDGE.y + 138} onClick={onMore} />
      )}
    </>
  )
}
