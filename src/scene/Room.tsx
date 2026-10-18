import {
  CAT, CEILING_H, CLOCK, COUNTER, COUNTER_TOP, FLOOR_Y, FRIDGE, LAMP, PROPS, ROOM,
} from '../lib/room'
import { spriteSize } from '../lib/sprites'
import { Sprite } from './Sprite'
import { Fridge, FRIDGE_FRAMES } from './Fridge'
import { Pantry, PANTRY_FRAMES } from './Pantry'
import { Window } from './Window'
import { Shelves } from './Shelves'
import { useSteps } from '../lib/useSteps'
import type { Item } from '../lib/schema'

type Props = {
  fridgeOpen: boolean
  cupboardOpen: boolean
  onFridge: () => void
  onCupboard: () => void
  items: Item[]
  itemHandlers: {
    onPointerDown: (item: Item, e: React.PointerEvent) => void
    onPointerMove: (e: React.PointerEvent) => void
    onPointerUp: (e: React.PointerEvent) => void
  }
  draggingId?: string
}

/** Contact shadow. The light is up and to the left, so shadows fall right. */
function Shadow({ x, w, y, soft = false }: { x: number; w: number; y: number; soft?: boolean }) {
  return (
    <i
      className={soft ? 'contact contact--soft' : 'contact'}
      style={{ left: x + 2, top: y, width: w }}
    />
  )
}

export function Room({
  fridgeOpen, cupboardOpen, onFridge, onCupboard, items, itemHandlers, draggingId,
}: Props) {
  const cat = spriteSize('cat/sleep-0')
  const fridgeFrame = useSteps(fridgeOpen, FRIDGE_FRAMES, 55)
  const pantryFrame = useSteps(cupboardOpen, PANTRY_FRAMES, 50)

  return (
    <div className="room" style={{ width: ROOM.w, height: ROOM.h }}>
      <div className="room__wall" style={{ top: CEILING_H, height: FLOOR_Y - CEILING_H }} />
      <div className="room__ceiling" style={{ height: CEILING_H }} />
      <div className="room__floor" style={{ top: FLOOR_Y, height: ROOM.h - FLOOR_Y }} />
      <div className="room__skirting" style={{ top: FLOOR_Y - 8 }} />

      <Window />

      {/* ceiling lamp, hung from the ceiling plane above it */}
      <i
        className="room__cord"
        style={{ left: LAMP.cordX, top: CEILING_H, height: LAMP.shadeY - CEILING_H }}
      />
      <Sprite k="room/pendant" x={LAMP.x} y={LAMP.shadeY} />

      <Sprite k="room/clock" x={CLOCK.x} y={CLOCK.y} />

      {/* counter run — the pantry on the left, drawers on the right, one worktop */}
      <Pantry frame={pantryFrame} open={cupboardOpen} onToggle={onCupboard}>
        <Shelves where="cupboard" frame={pantryFrame} items={items} draggingId={draggingId} {...itemHandlers} />
      </Pantry>
      <Sprite k="room/counter-drawers" x={COUNTER.x + COUNTER.w} bottom={FLOOR_Y} />
      <i
        className="room__worktop"
        style={{ left: COUNTER.x, top: COUNTER_TOP, width: COUNTER.w * COUNTER.units }}
      />

      <Shadow x={CAT.x + 4} w={cat.w - 10} y={COUNTER_TOP} soft />
      <Sprite k="cat/sleep-0" x={CAT.x} bottom={COUNTER_TOP} overhang={CAT.overhang} />

      {PROPS.map(([k, x]) => (
        <span key={k}>
          <Shadow x={x} w={spriteSize(k).w - 4} y={COUNTER_TOP} soft />
          <Sprite k={k} x={x} bottom={COUNTER_TOP} />
        </span>
      ))}

      <Shadow x={FRIDGE.right - FRIDGE.w} w={FRIDGE.w} y={FLOOR_Y} />
      <Fridge frame={fridgeFrame} open={fridgeOpen} onToggle={onFridge}>
        <Shelves where="fridge" frame={fridgeFrame} items={items} draggingId={draggingId} {...itemHandlers} />
      </Fridge>
    </div>
  )
}
