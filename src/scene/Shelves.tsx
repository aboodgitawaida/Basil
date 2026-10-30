import type { Placed } from '../lib/arrange'
import { KIT_W } from '../lib/room'
import { isGoingOff, quantityText, type Item } from '../lib/schema'
import { Sprite } from './Sprite'

export type ItemHandlers = {
  onPointerDown: (item: Item, e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
  onPointerCancel: (e: React.PointerEvent) => void
  /** Enter or Space on a focused item: the keyboard's tap */
  onActivate: (item: Item) => void
}

const label = (i: Item) => [i.displayName, quantityText(i)].filter(Boolean).join(' ')

type Props = ItemHandlers & {
  placed: Placed[]
  draggingId?: string
  /** only draw what lies between these x positions: what the door has uncovered */
  from?: number
  to?: number
}

/** Things standing on shelves, as laid out by arrange(). Clipped to the part
 *  of the compartment the door has actually uncovered, so nothing floats over
 *  a half-open door. */
export function Stock({ placed, draggingId, from = 0, to = KIT_W, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onActivate }: Props) {
  if (!placed.length || to <= from) return null
  return (
    <div className="stock" style={{ clipPath: `inset(-40px ${KIT_W - to}px -40px ${from}px)` }}>
      {placed.map(({ item, x, y, w, h, copies, step }) => (
        <button
          key={item.id}
          className={[
            'shelf-item',
            isGoingOff(item) ? 'shelf-item--soon' : '',
            draggingId === item.id ? 'shelf-item--lifted' : '',
          ].filter(Boolean).join(' ')}
          style={{ left: x, top: y, width: w, height: h }}
          onPointerDown={e => onPointerDown(item, e)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          // a pointer tap is handled on pointer-up; a click with no pointer
          // behind it (detail 0) came from the keyboard
          onClick={e => { if (e.detail === 0) onActivate(item) }}
          title={label(item)}
          aria-label={label(item)}
        >
          {Array.from({ length: copies }, (_, n) => (
            <Sprite key={n} k={item.spriteKey} x={n * step} y={0} />
          ))}
          {item.location === 'freezer' && <i className="shelf-item__frost" />}
          {isGoingOff(item) && <i className="shelf-item__pip" />}
        </button>
      ))}
    </div>
  )
}

/** "+3": more than the shelves hold. Clicking it lists everything. */
export function More({ n, x, y, onClick }: { n: number; x: number; y: number; onClick?: () => void }) {
  if (n <= 0) return null
  return (
    <button className="more" style={{ left: x, top: y }} onClick={onClick} title={`${n} more not shown — see the kitchen list`}>
      +{n}
    </button>
  )
}
