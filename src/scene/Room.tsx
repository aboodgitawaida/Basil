import { spriteSize } from '../lib/sprites'
import {
  COUNTER, DADO_H, FLOOR_Y, FRIDGE, HANGING, PROPS, RAIL, ROOM, SPLASH, TRIM_H,
} from '../lib/room'
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

/** Anything standing on the floor gets a contact shadow, which is what stops
 *  furniture looking like it is floating. */
function Shadow({ x, w, y = FLOOR_Y }: { x: number; w: number; y?: number }) {
  return <i className="room__contact" style={{ left: x - 1, top: y - 1, width: w + 2 }} />
}

export function Room({ fridgeOpen, cupboardOpen, onFridge, onCupboard }: Props) {
  const counter = spriteSize('room/counter')
  const cupboard = spriteSize('room/cupboard')
  const counterTop = FLOOR_Y - counter.h
  const counterW = counter.w * COUNTER.units
  const cupboardX = COUNTER.x + counterW + 4
  const dadoTop = FLOOR_Y - DADO_H - 2

  return (
    <div className="room" style={{ width: ROOM.w, height: ROOM.h }}>
      <div className="room__cornice" />
      <div className="room__plaster" style={{ height: dadoTop }} />
      <div className="room__trim" style={{ top: dadoTop - TRIM_H, height: TRIM_H }} />
      <div className="room__dado" style={{ top: dadoTop, height: DADO_H }} />
      <div className="room__skirting" style={{ top: FLOOR_Y - 2 }} />
      <div className="room__floor" style={{ top: FLOOR_Y, height: ROOM.h - FLOOR_Y }} />

      {/* tiled splashback behind the run of counter */}
      <div
        className="room__splash"
        style={{ left: SPLASH.x, top: SPLASH.top, width: SPLASH.w, height: counterTop - SPLASH.top }}
      />

      {/* pendant, clear of the window */}
      <i className="room__cord" style={{ left: 77, top: 7, height: 15 }} />
      <Sprite k="room/pendant" x={70} y={22} />

      <Sprite k="room/clock" x={166} y={22} />
      <Sprite k="room/picture-wide" x={162} y={46} />
      <Sprite k="room/picture-1" x={166} y={66} />
      <Sprite k="room/picture-2" x={64} y={56} />
      <Sprite k="room/herbs" x={88} y={104} />

      <Window />

      {/* two shelves of clutter above the fridge */}
      <Sprite k="room/shelf" x={6} y={48} />
      <Sprite k="room/shelf" x={6} y={72} />
      <Sprite k="room/cupboard" x={56} y={98} />
      <Sprite k="room/cupboard" x={129} y={98} />

      {/* hanging rail */}
      <i className="room__rail" style={{ left: RAIL.x, top: RAIL.y, width: RAIL.w }} />
      {HANGING.map(([k, x, rot]) => (
        <Sprite key={k} k={k} x={x} y={RAIL.y + 2} rotate={rot} />
      ))}

      <Shadow x={FRIDGE.x} w={FRIDGE.w} />
      <Shadow x={COUNTER.x} w={counterW} />
      <Shadow x={cupboardX} w={cupboard.w} />

      {Array.from({ length: COUNTER.units }, (_, i) => (
        <Sprite key={i} k="room/counter" x={COUNTER.x + i * counter.w} bottom={FLOOR_Y} />
      ))}

      <Fridge open={fridgeOpen} onToggle={onFridge} />
      <Sprite k="room/towel" x={140} y={191} />
      <Cupboard open={cupboardOpen} onToggle={onCupboard} x={cupboardX} />

      {PROPS.map(([k, x, bottom], i) => <Sprite key={`${k}${i}`} k={k} x={x} bottom={bottom} />)}

      {/* foreground: floor dressing, in front of everything */}
      <Sprite k="room/mat" x={58} y={220} />
      <Shadow x={112} w={spriteSize('kit/stool').w} y={232} />
      <Sprite k="kit/stool" x={112} bottom={232} />
    </div>
  )
}
