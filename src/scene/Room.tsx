import {
  CEILING_H, COUNTER, COUNTER_TOP, FLOOR_Y, FRIDGE, LAMP, PROPS,
  ROOM,
} from '../lib/room'
import { spriteSize } from '../lib/sprites'
import { Sprite } from './Sprite'
import { Fridge } from './Fridge'
import { Cupboard } from './Cupboard'
import { Window } from './Window'

type Props = {
  fridgeOpen: boolean
  cupboardOpen: boolean
  onFridge: () => void
  onCupboard: () => void
}

/** Contact shadow. The light is up and to the left, so shadows fall right. */
function Shadow({ x, w, y, soft = false }: { x: number; w: number; y: number; soft?: boolean }) {
  return (
    <i
      className={soft ? 'contact contact--soft' : 'contact'}
      style={{ left: x + 1, top: y - 1, width: w }}
    />
  )
}

export function Room({ fridgeOpen, cupboardOpen, onFridge, onCupboard }: Props) {
  const cat = spriteSize('cat/sleep-0')

  return (
    <div className="room" style={{ width: ROOM.w, height: ROOM.h }}>
      <div className="room__wall" style={{ top: CEILING_H, height: FLOOR_Y - CEILING_H }} />
      <div className="room__ceiling" style={{ height: CEILING_H }} />
      <div className="room__floor" style={{ top: FLOOR_Y, height: ROOM.h - FLOOR_Y }} />
      <div className="room__skirting" style={{ top: FLOOR_Y - 7 }} />

      {/* daylight on the wall, falling away from the window */}
      <div className="room__daylight" style={{ top: CEILING_H, height: FLOOR_Y - CEILING_H }} />

      <Window />

      {/* ceiling lamp — short cord, hung from the ceiling plane above it */}
      <i className="room__cord" style={{ left: LAMP.cordX, top: LAMP.cordTop, height: LAMP.shadeY - LAMP.cordTop }} />
      <Sprite k="room/pendant" x={LAMP.x} y={LAMP.shadeY} />

      <Sprite k="room/clock" x={148} y={8} />

      <Cupboard open={cupboardOpen} onToggle={onCupboard} />

      {/* counter run — a door unit and a drawer stack, so the lower half of
          the frame isn't one flat field */}
      <Sprite k="room/counter" x={COUNTER.x} bottom={FLOOR_Y} />
      <Sprite k="room/counter-drawers" x={COUNTER.x + COUNTER.w} bottom={FLOOR_Y} />
      <i
        className="room__worktop"
        style={{ left: COUNTER.x, top: COUNTER_TOP, width: COUNTER.w * COUNTER.units }}
      />

      <Shadow x={14} w={cat.w - 2} y={COUNTER_TOP} soft />
      <Sprite k="cat/sleep-0" x={14} bottom={COUNTER_TOP} />

      {PROPS.map(([k, x, bottom]) => (
        <span key={k}>
          <Shadow x={x} w={spriteSize(k).w - 2} y={bottom} soft />
          <Sprite k={k} x={x} bottom={bottom} />
        </span>
      ))}

      {/* light from an open fridge, stepped rather than tapered: a diagonal
          clip would anti-alias and soften the whole scene */}
      {fridgeOpen && [0, 1, 2, 3].map(i => (
        <i
          key={i}
          className="room__spill"
          style={{
            left: FRIDGE.x - 26 + i * 7, top: FLOOR_Y + i * 3,
            width: 26 - i * 7, height: 3, opacity: 0.2 - i * 0.03,
          }}
        />
      ))}
      <Shadow x={FRIDGE.x} w={FRIDGE.w} y={FLOOR_Y} />
      <Fridge open={fridgeOpen} onToggle={onFridge} />
    </div>
  )
}
