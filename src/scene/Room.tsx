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
import type { Sky } from '../lib/weather'
import { Basil } from './Basil'
import type { Spoken } from '../lib/basilSays'
import type { Mood } from './Bubble'
import { Bubble } from './Bubble'

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
  /** something is on the board, so the counter clutter gets out of the way */
  crafting?: boolean
  onBoard?: readonly (string | null)[]
  /** 0 is noon, 1 is the middle of the night */
  night: number
  sky: Sky
  skyColour: string
  lampOn: boolean
  onLamp: () => void
  onAskBasil: () => void
  onHushBasil: () => void
  basilSpeech: Spoken | null
  basilThinking: boolean
  say: Mood | null
  children?: React.ReactNode
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
  fridgeOpen, cupboardOpen, onFridge, onCupboard, items, itemHandlers, draggingId, crafting, onBoard, night, sky, skyColour, lampOn, onLamp, onAskBasil, onHushBasil, basilSpeech, basilThinking, say, children,
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

      <Window sky={sky} skyColour={skyColour} />

      {/* ceiling lamp, hung from the ceiling plane above it */}
      <i
        className="room__cord"
        style={{ left: LAMP.cordX, top: CEILING_H, height: LAMP.shadeY - CEILING_H }}
      />
      <Sprite k="room/pendant" x={LAMP.x} y={LAMP.shadeY} />

      <Sprite k="room/clock" x={CLOCK.x} y={CLOCK.y} />

      {/* the dimmer: one switch, no theme toggle */}
      <button
        className="hit"
        style={{ left: 106, top: 128, width: 14, height: 22 }}
        onClick={onLamp}
        aria-label={lampOn ? 'Turn the light off' : 'Turn the light on'}
      >
        <Sprite k={lampOn ? 'room/switch-on' : 'room/switch-off'} x={0} y={0} />
      </button>

      {/* counter run — the pantry on the left, drawers on the right, one worktop */}
      <Pantry frame={pantryFrame} open={cupboardOpen} onToggle={onCupboard}>
        <Shelves where="cupboard" frame={pantryFrame} items={items} draggingId={draggingId} onBoard={onBoard} {...itemHandlers} />
      </Pantry>
      <Sprite k="room/counter-drawers" x={COUNTER.x + COUNTER.w} bottom={FLOOR_Y} />
      <i
        className="room__worktop"
        style={{ left: COUNTER.x, top: COUNTER_TOP, width: COUNTER.w * COUNTER.units }}
      />

      <Shadow x={CAT.x + 4} w={cat.w - 10} y={COUNTER_TOP} soft />
      <Basil disturbed={fridgeOpen} onAsk={onAskBasil} onHush={onHushBasil} speech={basilSpeech} thinking={basilThinking} />

      {!crafting && PROPS.map(([k, x]) => (
        <span key={k}>
          <Shadow x={x} w={spriteSize(k).w - 4} y={COUNTER_TOP} soft />
          <Sprite k={k} x={x} bottom={COUNTER_TOP} />
        </span>
      ))}

      <Shadow x={FRIDGE.right - FRIDGE.w} w={FRIDGE.w} y={FLOOR_Y} />
      {children}

      <Fridge frame={fridgeFrame} open={fridgeOpen} onToggle={onFridge}>
        <Shelves where="fridge" frame={fridgeFrame} items={items} draggingId={draggingId} onBoard={onBoard} {...itemHandlers} />
      </Fridge>

      {/* lighting last, over everything, so it tints the whole room at once */}
      <div
        className="room__dark"
        style={{ opacity: night * (lampOn ? 0.55 : 0.85) }}
      />
      {lampOn && night > 0.1 && (
        <div className="room__lamp" style={{ opacity: 0.12 + night * 0.3 }} />
      )}

      {say && <Bubble mood={say} x={86} y={54} />}
    </div>
  )
}
