import { spriteSize, spriteUrl } from '../lib/sprites'
import { FLOOR_Y, LAYOUT } from '../lib/room'
import { useSteps } from '../lib/useSteps'

const KEY = 'room/cupboard'
const SWING = [0, 4, 8, 11] // whole art pixels each door slides outward

type Props = { open: boolean; onToggle: () => void }

export function Cupboard({ open, onToggle }: Props) {
  const { w, h } = spriteSize(KEY)
  const url = spriteUrl(KEY)
  const frame = useSteps(open, SWING.length, 45)
  const slide = SWING[frame]
  const x = LAYOUT.cupboard.x
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
        {[6, 13].map(s => <i key={s} className="cupboard__shelf" style={{ top: s }} />)}
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
