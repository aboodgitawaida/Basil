import { FRIDGE_BAYS, PANTRY_BAYS } from '../lib/room'
import { isGoingOff, quantityText, type Item, type Location } from '../lib/schema'

const label = (i: Item) => [i.displayName, quantityText(i)].filter(Boolean).join(' ')
import { spriteSize } from '../lib/sprites'
import { Sprite } from './Sprite'

type Bay = { x: number; w: number; slots: number; shelves: readonly number[]; revealed: readonly number[] }

const PLACES: Record<'fridge' | 'cupboard', Bay> = {
  fridge: FRIDGE_BAYS,
  cupboard: PANTRY_BAYS,
}

/** Freezer items live in the fridge's top bay; everything else starts below it. */
function shelfY(bay: Bay, location: Location, shelf: number): number {
  if (location === 'freezer') return bay.shelves[0]
  const offset = bay === FRIDGE_BAYS ? 1 : 0
  return bay.shelves[Math.min(shelf + offset, bay.shelves.length - 1)]
}

type Props = {
  where: 'fridge' | 'cupboard'
  frame: number
  items: Item[]
  onPointerDown: (item: Item, e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
  draggingId?: string
}

/** Items standing on shelves. Clipped to however much of the interior the door
 *  has actually revealed, so nothing floats over a closed door. */
export function Shelves({ where, frame, items, onPointerDown, onPointerMove, onPointerUp, draggingId }: Props) {
  const bay = PLACES[where]
  const reveal = bay.revealed[Math.min(frame, bay.revealed.length - 1)]
  if (reveal === Infinity) return null

  const pitch = Math.floor(bay.w / bay.slots)
  const visible = items.filter(i =>
    where === 'fridge' ? i.location !== 'cupboard' : i.location === 'cupboard',
  )

  return (
    <>
      {visible.map(item => {
        const { w: one, h } = spriteSize(item.spriteKey)
        // small counted things show how many, up to three: a row of eggs
        const copies = one <= 14 ? Math.min(item.count ?? 1, 3) : 1
        const step = copies > 1 ? Math.min(one + 1, Math.floor((pitch - one) / (copies - 1))) : 0
        const w = one + step * (copies - 1)
        const slotX = bay.x + item.position * pitch + Math.floor((pitch - w) / 2)
        if (slotX + w < reveal) return null
        const y = shelfY(bay, item.location, item.shelf)
        return (
          <button
            key={item.id}
            className={[
              'shelf-item',
              isGoingOff(item) ? 'shelf-item--soon' : '',
              draggingId === item.id ? 'shelf-item--lifted' : '',
            ].filter(Boolean).join(' ')}
            style={{ left: slotX, top: y - h, width: w, height: h }}
            onPointerDown={e => onPointerDown(item, e)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            title={label(item)}
            aria-label={label(item)}
          >
            {Array.from({ length: copies }, (_, n) => (
              <Sprite key={n} k={item.spriteKey} x={n * step} y={0} />
            ))}
            {item.location === 'freezer' && <i className="shelf-item__frost" />}
            {isGoingOff(item) && <i className="shelf-item__pip" />}
          </button>
        )
      })}
    </>
  )
}
