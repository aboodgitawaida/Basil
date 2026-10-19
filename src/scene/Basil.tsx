import { CAT, COUNTER_TOP, ROOM } from '../lib/room'
import { spriteSize } from '../lib/sprites'
import { useBasilPose, type BasilMode } from '../lib/useBasilPose'
import { Sprite } from './Sprite'
import { Bubble } from './Bubble'
import type { Spoken } from '../lib/basilSays'

type Props = {
  /** sleep, alert (the fridge opened), attentive (the cookbook is up), happy (you cooked) */
  mode: BasilMode
  /** clicking him opens the cookbook */
  onAsk: () => void
  onHush: () => void
  speech: Spoken | null
}

/** Basil, on the worktop. Asleep most of the time; he opens an eye when the
 *  fridge opens, wakes, stretches and sits up for the cookbook, and hops
 *  about when you cook something. */
export function Basil({ mode, onAsk, onHush, speech }: Props) {
  const step = useBasilPose(mode)
  const { h } = spriteSize(step.k)
  const rest = spriteSize('cat/sleep-0').h
  const top = COUNTER_TOP - h + CAT.overhang + (step.dy ?? 0)
  const asleep = mode === 'sleep' && step.k.startsWith('cat/sleep')

  return (
    <>
      <button
        className="basil interact"
        style={{ left: CAT.x, top: COUNTER_TOP - rest + CAT.overhang, width: 48, height: rest - CAT.overhang }}
        onClick={onAsk}
        aria-label="Ask Basil what you can cook"
        title="Basil — what can I cook?"
      >
        <Sprite k={step.k} x={0} y={top - (COUNTER_TOP - rest + CAT.overhang)} />
      </button>

      {asleep && !speech && (
        <span className="zzz" style={{ left: CAT.x + 34, top: COUNTER_TOP - rest - 6 }}>
          <i className="zzz__z zzz__z--a">z</i>
          <i className="zzz__z zzz__z--b">z</i>
          <i className="zzz__z zzz__z--c">z</i>
        </span>
      )}

      {mode === 'alert' && !speech && <Bubble mood="question" x={CAT.x + 14} y={COUNTER_TOP - rest - 26} />}
      {mode === 'attentive' && !speech && <Bubble mood="idea" x={CAT.x + 14} y={COUNTER_TOP - rest - 28} />}
      {mode === 'happy' && <Bubble mood="love" x={CAT.x + 14} y={COUNTER_TOP - rest - 28} />}

      {speech && (
        <div
          className="basilsay"
          role="status"
          style={{ left: CAT.x - 2, bottom: ROOM.h - (COUNTER_TOP - h + CAT.overhang) + 8 }}
          onClick={onHush}
        >
          <p>{speech.title}</p>
          {speech.detail && <p className="basilsay__dim">{speech.detail}</p>}
        </div>
      )}
    </>
  )
}
