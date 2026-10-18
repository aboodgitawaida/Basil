import { CAT, COUNTER_TOP, ROOM } from '../lib/room'
import { spriteSize } from '../lib/sprites'
import { useLoop } from '../lib/useLoop'
import { Sprite } from './Sprite'
import { Bubble, type Mood } from './Bubble'
import type { Spoken } from '../lib/basilSays'

type Props = {
  /** he stirs when the fridge opens */
  disturbed: boolean
  /** clicking him asks for a meal */
  onAsk: () => void
  onHush: () => void
  speech: Spoken | null
  thinking: boolean
}

/**
 * Basil. Click him and he suggests a meal in his speech bubble; open the
 * fridge and he may have a remark. Otherwise he breathes, drops the odd z,
 * and looks up when the fridge opens. Nothing is locked behind him: the
 * recipe book and the craft board work without him.
 */
export function Basil({ disturbed, onAsk, onHush, speech, thinking }: Props) {
  const frame = useLoop(6, disturbed || thinking ? 180 : 420)
  const { h } = spriteSize('cat/sleep-0')
  const top = COUNTER_TOP - h + CAT.overhang

  const bubble: Mood | null = speech ? null : disturbed ? 'question' : null

  return (
    <>
      <button
        className="basil"
        style={{ left: CAT.x, top, width: 48, height: h }}
        onClick={onAsk}
        aria-label="Ask Basil what to cook"
      >
        <Sprite k={`cat/sleep-${frame}`} x={0} y={0} />
      </button>

      {/* z z z, drawn in code: three glyphs drifting up on a loop */}
      {!disturbed && !speech && (
        <span className="zzz" style={{ left: CAT.x + 34, top: COUNTER_TOP - h - 6 }}>
          <i className="zzz__z zzz__z--a">z</i>
          <i className="zzz__z zzz__z--b">z</i>
          <i className="zzz__z zzz__z--c">z</i>
        </span>
      )}

      {bubble && <Bubble mood={bubble} x={CAT.x + 16} y={COUNTER_TOP - h - 26} />}

      {speech && (
        <div
          className="basilsay"
          role="status"
          style={{ left: CAT.x, bottom: ROOM.h - top + 6 }}
          onClick={onHush}
        >
          <p className="basilsay__title">{speech.title}</p>
          {speech.detail && <p className="basilsay__dim">{speech.detail}</p>}
          {speech.quip && <p>{speech.quip}</p>}
          {speech.note && <p className="basilsay__note">{speech.note} Built-in recipes.</p>}
        </div>
      )}
    </>
  )
}
