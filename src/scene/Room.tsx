import {
  CAT, CEILING_H, CLOCK, COUNTER, COUNTER_TOP, FLOOR_Y, FRIDGE, KIT_W, KIT_X, LAMP, NOOK, PROPS, ROOM,
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
import { Nook } from './Nook'

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
  /** the real time, which is what the window shows */
  now: Date
  /** 0 is noon, 1 is the middle of the night, from the real clock */
  night: number
  sky: Sky
  lampOn: boolean
  onLamp: () => void
  onAskBasil: () => void
  onHushBasil: () => void
  basilSpeech: Spoken | null
  /** the cookbook is open, so he is awake */
  basilAwake: boolean
  say: Mood | null
}

/** Contact shadow. The light is up and to the left, so shadows fall right. */
export function Shadow({ x, w, y, soft = false }: { x: number; w: number; y: number; soft?: boolean }) {
  return (
    <i
      className={soft ? 'contact contact--soft' : 'contact'}
      style={{ left: x + 2, top: y, width: w }}
    />
  )
}

/** Big enough to reach any screen edge from the room at the smallest scale. */
const BEYOND = 2000

export function Room({
  fridgeOpen, cupboardOpen, onFridge, onCupboard, items, itemHandlers, draggingId,
  now, night, sky, lampOn, onLamp, onAskBasil, onHushBasil, basilSpeech, basilAwake, say,
}: Props) {
  const cat = spriteSize('cat/sleep-0')
  const fridgeFrame = useSteps(fridgeOpen, FRIDGE_FRAMES, 55)
  const pantryFrame = useSteps(cupboardOpen, PANTRY_FRAMES, 50)

  // indoors: dark only when it is dark outside, and much less with the lamp on
  const dark = night * (lampOn ? 0.28 : 0.78)
  const glow = lampOn ? 0.25 + night * 0.55 : 0

  return (
    <div className="room" style={{ width: ROOM.w, height: ROOM.h }}>
      {/* wall, ceiling and floor carry on past the room so it never sits in a box */}
      <div className="room__wall" style={{ left: -BEYOND, right: -BEYOND, top: CEILING_H, height: FLOOR_Y - CEILING_H }} />
      <div className="room__ceiling" style={{ left: -BEYOND, right: -BEYOND, top: -BEYOND, height: BEYOND + CEILING_H }} />
      <div className="room__floor" style={{ left: -BEYOND, right: -BEYOND, top: FLOOR_Y, height: BEYOND }} />
      <div className="room__skirting" style={{ left: -BEYOND, right: -BEYOND, top: FLOOR_Y - 8 }} />

      <Nook />

      <div className="room__kit" style={{ left: KIT_X, width: KIT_W, height: ROOM.h }}>
        <Window sky={sky} now={now} />

        <i className="room__cord" style={{ left: LAMP.cordX, top: CEILING_H, height: LAMP.shadeY - CEILING_H }} />
        <Sprite k="room/pendant" x={LAMP.x} y={LAMP.shadeY} />

        <Sprite k="room/clock" x={CLOCK.x} y={CLOCK.y} />

        <button
          className="hit hit--glow"
          style={{ left: 106, top: 128, width: 14, height: 22 }}
          onClick={onLamp}
          aria-label={lampOn ? 'Turn the lamp off' : 'Turn the lamp on'}
          title={lampOn ? 'Lamp: on' : 'Lamp: off'}
        >
          <Sprite k={lampOn ? 'room/switch-on' : 'room/switch-off'} x={0} y={0} />
        </button>

        <Pantry frame={pantryFrame} open={cupboardOpen} onToggle={onCupboard}>
          <Shelves where="cupboard" frame={pantryFrame} items={items} draggingId={draggingId} {...itemHandlers} />
        </Pantry>
        <Sprite k="room/counter-drawers" x={COUNTER.x + COUNTER.w} bottom={FLOOR_Y} />
        <i className="room__worktop" style={{ left: COUNTER.x, top: COUNTER_TOP, width: COUNTER.w * COUNTER.units }} />

        <Shadow x={CAT.x + 4} w={cat.w - 10} y={COUNTER_TOP} soft />
        <Basil awake={fridgeOpen || basilAwake} onAsk={onAskBasil} onHush={onHushBasil} speech={basilSpeech} />

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

        {say && <Bubble mood={say} x={CAT.x + 14} y={COUNTER_TOP - cat.h - 26} />}
      </div>

      {/* lighting last, over everything, so it tints the whole room at once */}
      <div className="room__dark" style={{ inset: -BEYOND, opacity: dark }} />
      {glow > 0 && (
        <>
          <i className="room__glow" style={{ left: KIT_X + LAMP.x + 11, top: LAMP.shadeY + 14, opacity: glow }} />
          <i className="room__glow" style={{ left: NOOK.lamp.x + 11, top: NOOK.lamp.shadeY + 14, opacity: glow }} />
        </>
      )}
    </div>
  )
}
