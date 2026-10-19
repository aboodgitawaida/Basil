import { CAT, COUNTER_TOP, ROOM } from '../lib/room'
import { spriteSize } from '../lib/sprites'
import { useLoop } from '../lib/useLoop'
import { Sprite } from './Sprite'
import { Bubble } from './Bubble'
import type { Spoken } from '../lib/basilSays'

type Props = {
  /** he stirs when the fridge opens or the cookbook is up */
  awake: boolean
  /** clicking him opens the cookbook */
  onAsk: () => void
  onHush: () => void
  speech: Spoken | null
}

/** Basil, asleep on the worktop. Click him for the cookbook; open the fridge
 *  and he may have a remark. Otherwise he breathes and drops the odd z. */
export function Basil({ awake, onAsk, onHush, speech }: Props) {
  const frame = useLoop(6, awake ? 180 : 420)
  const { h } = spriteSize('cat/sleep-0')
  const top = COUNTER_TOP - h + CAT.overhang

  return (
    <>
      <button
        className="basil"
        style={{ left: CAT.x, top, width: 48, height: h - CAT.overhang }}
        onClick={onAsk}
        aria-label="Ask Basil what you can cook"
        title="Basil — what can I cook?"
      >
        <Sprite k={`cat/sleep-${frame}`} x={0} y={0} />
      </button>

      {!awake && !speech && (
        <span className="zzz" style={{ left: CAT.x + 34, top: COUNTER_TOP - h - 6 }}>
          <i className="zzz__z zzz__z--a">z</i>
          <i className="zzz__z zzz__z--b">z</i>
          <i className="zzz__z zzz__z--c">z</i>
        </span>
      )}

      {awake && !speech && <Bubble mood="question" x={CAT.x + 14} y={COUNTER_TOP - h - 26} />}

      {speech && (
        <div
          className="basilsay"
          role="status"
          style={{ left: CAT.x - 2, bottom: ROOM.h - top + 8 }}
          onClick={onHush}
        >
          <p>{speech.title}</p>
          {speech.detail && <p className="basilsay__dim">{speech.detail}</p>}
        </div>
      )}
    </>
  )
}
