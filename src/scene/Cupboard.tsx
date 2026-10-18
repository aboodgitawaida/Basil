import { spriteSize, spriteUrl } from '../lib/sprites'
import { FLOOR_Y } from '../lib/room'
import { useSteps } from '../lib/useSteps'

const KEY = 'room/cupboard'
/** Whole art pixels each door slides outward. Capped so the open doors stay
 *  inside the room rather than clipping at its edge. */
const SWING = [0, 3, 6, 8]

type Props = { open: boolean; onToggle: () => void; x: number }

export function Cupboard({ open, onToggle, x }: Props) {
  const { w, h } = spriteSize(KEY)
  const url = spriteUrl(KEY)
  const frame = useSteps(open, SWING.length, 45)
  const slide = SWING[frame]
  const top = FLOOR_Y - h
  const half = Math.floor(w / 2)

  if (!url) return null

  return (
    <button
      className="cupboard"
      onClick={onToggle}
      aria-label={open ? 'Close the cupboard' : 'Open the cupboard'}
      aria-expanded={open}
      style={{ position: 'absolute', left: x, top, width: w, height: h }}
    >
      {/* shelves behind the doors */}
      <div className="cupboard__inside">
        {[5, 11, 17].map(s => <i key={s} className="cupboard__shelf" style={{ top: s }} />)}
      </div>

      {/* the sprite's own two doors, cut down the middle and slid apart */}
      <span
        className="cupboard__door"
        style={{
          left: -slide, width: half, height: h,
          backgroundImage: `url(${url})`, backgroundPosition: '0 0',
        }}
      />
      <span
        className="cupboard__door"
        style={{
          left: half + slide, width: w - half, height: h,
          backgroundImage: `url(${url})`, backgroundPosition: `-${half}px 0`,
        }}
      />
    </button>
  )
}
