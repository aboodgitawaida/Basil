import { spriteSize } from '../lib/sprites'
import { DADO_H, FLOOR_Y, LAYOUT, ROOM, TRIM_H } from '../lib/room'
import { Sprite } from './Sprite'
import { Fridge } from './Fridge'
import { Cupboard } from './Cupboard'

type Props = {
  fridgeOpen: boolean
  cupboardOpen: boolean
  onFridge: () => void
  onCupboard: () => void
}

/** Anything standing on the floor gets a one-pixel contact shadow, which is
 *  what stops furniture looking like it is floating. */
function Shadow({ x, w }: { x: number; w: number }) {
  return <i className="room__contact" style={{ left: x - 1, top: FLOOR_Y - 1, width: w + 2 }} />
}

export function Room({ fridgeOpen, cupboardOpen, onFridge, onCupboard }: Props) {
  const counter = spriteSize('room/counter')
  const cupboard = spriteSize('room/cupboard')
  const counterTop = FLOOR_Y - counter.h
  const counterW = counter.w * LAYOUT.counter.units
  const dadoTop = FLOOR_Y - DADO_H - 2

  return (
    <div className="room" style={{ width: ROOM.w, height: ROOM.h }}>
      <div className="room__plaster" style={{ height: dadoTop }} />
      <div className="room__trim" style={{ top: dadoTop - TRIM_H, height: TRIM_H }} />
      <div className="room__dado" style={{ top: dadoTop, height: DADO_H }} />
      <div className="room__skirting" style={{ top: FLOOR_Y - 2 }} />
      <div className="room__floor" style={{ top: FLOOR_Y, height: ROOM.h - FLOOR_Y }} />

      <Sprite k="room/window" x={LAYOUT.window.x} y={LAYOUT.window.y} />
      <Sprite k="room/wall-cabinet" x={LAYOUT.wallCabinet.x} y={LAYOUT.wallCabinet.y} />

      <Shadow x={LAYOUT.fridge.x} w={LAYOUT.fridge.w} />
      <Shadow x={LAYOUT.counter.x} w={counterW} />
      <Shadow x={LAYOUT.cupboard.x} w={cupboard.w} />

      {Array.from({ length: LAYOUT.counter.units }, (_, i) => (
        <Sprite key={i} k="room/counter" x={LAYOUT.counter.x + i * counter.w} bottom={FLOOR_Y} />
      ))}

      <Sprite k="room/lamp" x={LAYOUT.lamp.x} bottom={counterTop + 1} />
      <Sprite k="room/plant" x={LAYOUT.plant.x} bottom={FLOOR_Y - cupboard.h} />

      <Fridge open={fridgeOpen} onToggle={onFridge} />
      <Cupboard open={cupboardOpen} onToggle={onCupboard} />
    </div>
  )
}
