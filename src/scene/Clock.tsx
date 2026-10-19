import { CLOCK } from '../lib/room'
import { Sprite } from './Sprite'

/** Pixels along a hand, from the centre out, as offsets from the face's
 *  centre point. `turn` is 0 at twelve o'clock and 1 all the way round. */
export function handCells(turn: number, length: number): Array<[number, number]> {
  const a = turn * Math.PI * 2
  const out: Array<[number, number]> = []
  for (let i = 1; i <= length; i++) {
    const cell: [number, number] = [Math.floor(Math.sin(a) * i + 0.5), Math.floor(-Math.cos(a) * i + 0.5)]
    if (!out.some(c => c[0] === cell[0] && c[1] === cell[1])) out.push(cell)
  }
  return out
}

/** The wall clock, telling the real time. The face is the pack's clock with
 *  its painted hands taken off (tools/doors.py); these are drawn on top. */
export function WallClock({ now }: { now: Date }) {
  const m = now.getMinutes() + now.getSeconds() / 60
  const h = (now.getHours() % 12) + m / 60
  // the face's centre is the 2x2 block at (12, 12); hands start from its middle
  const px = (c: [number, number], k: string, cls: string) => (
    <i key={k} className={cls} style={{ left: CLOCK.x + 12 + (c[0] >= 0 ? 1 : 0) + c[0], top: CLOCK.y + 12 + (c[1] >= 0 ? 1 : 0) + c[1] }} />
  )
  return (
    <>
      <Sprite k="room/clock-face" x={CLOCK.x} y={CLOCK.y} />
      {handCells(m / 60, 6).map((c, n) => px(c, `m${n}`, 'clock__hand'))}
      {handCells(h / 12, 4).map((c, n) => px(c, `h${n}`, 'clock__hand clock__hand--hour'))}
      <i className="clock__hub" style={{ left: CLOCK.x + 12, top: CLOCK.y + 12 }} />
    </>
  )
}
