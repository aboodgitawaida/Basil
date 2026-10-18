import { spriteSize, spriteUrl } from '../lib/sprites'

type Props = {
  k: string
  x?: number
  y?: number
  /** Align the sprite's bottom edge to `bottom` instead of its top to `y`. */
  bottom?: number
  flip?: boolean
  /** Quarter turn. Only right angles — any other angle would resample. */
  rotate?: boolean
  /** Pin the sprite's right edge to this x instead of its left to `x`. */
  rightAlign?: number
  className?: string
  style?: React.CSSProperties
}

/** One sprite, placed in art pixels. Never scaled here — the whole room is
 *  scaled by one whole number higher up, which is what keeps every pack at the
 *  same apparent pixel size. */
export function Sprite({ k, x, y, bottom, flip, rotate, rightAlign, className, style }: Props) {
  const url = spriteUrl(k)
  if (!url) return null
  const { w, h } = spriteSize(k)
  const top = bottom !== undefined ? bottom - h : (y ?? 0)
  const left = rightAlign !== undefined ? rightAlign - w : (x ?? 0)
  return (
    <img
      src={url}
      alt=""
      draggable={false}
      className={className}
      style={{
        position: 'absolute',
        left,
        top,
        width: w,
        height: h,
        transform: [rotate ? 'rotate(90deg)' : '', flip ? 'scaleX(-1)' : ''].join(' ').trim() || undefined,
        ...style,
      }}
    />
  )
}
