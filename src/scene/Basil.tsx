import { useEffect, useState } from 'react'
import { CAT, COUNTER_TOP } from '../lib/room'
import { spriteSize } from '../lib/sprites'
import { useLoop } from '../lib/useLoop'
import { Sprite } from './Sprite'
import { Bubble, type Mood } from './Bubble'

type Props = {
  /** he stirs when the fridge opens */
  disturbed: boolean
  onPet: () => void
  mood: Mood | null
}

/**
 * Basil. Decoration, deliberately: nothing in the app is behind him. He
 * breathes, he drops the odd z, he looks up when the fridge opens, and petting
 * him does nothing except what petting a cat does.
 */
export function Basil({ disturbed, onPet }: Props & { mood: Mood | null }) {
  const [petted, setPetted] = useState(false)
  const frame = useLoop(6, disturbed ? 180 : 420)
  const { h } = spriteSize('cat/sleep-0')

  useEffect(() => {
    if (!petted) return
    const t = window.setTimeout(() => setPetted(false), 2200)
    return () => window.clearTimeout(t)
  }, [petted])

  const bubble: Mood | null = petted ? 'love' : disturbed ? 'question' : null

  return (
    <>
      <button
        className="basil"
        style={{ left: CAT.x, top: COUNTER_TOP - h + CAT.overhang, width: 48, height: h }}
        onClick={() => { setPetted(true); onPet() }}
        aria-label="Basil"
      >
        <Sprite k={`cat/sleep-${frame}`} x={0} y={0} />
      </button>

      {/* z z z, drawn in code: three glyphs drifting up on a loop */}
      {!disturbed && !petted && (
        <span className="zzz" style={{ left: CAT.x + 34, top: COUNTER_TOP - h - 6 }}>
          <i className="zzz__z zzz__z--a">z</i>
          <i className="zzz__z zzz__z--b">z</i>
          <i className="zzz__z zzz__z--c">z</i>
        </span>
      )}

      {bubble && <Bubble mood={bubble} x={CAT.x + 16} y={COUNTER_TOP - h - 26} />}
    </>
  )
}
