import { spriteSize, spriteUrl } from '../lib/sprites'

type Props = {
  k: string
  x: number
  y?: number
  /** Align the sprite's bottom edge to `bottom` instead of its top to `y`. */
  bottom?: number
  flip?: boolean
  className?: string
  style?: React.CSSProperties
}

/** One sprite, placed in art pixels. Never scaled here — the whole room is
 *  scaled by one whole number higher up, which is what keeps every pack at the
 *  same apparent pixel size. */
export function Sprite({ k, x, y, bottom, flip, className, style }: Props) {
  const url = spriteUrl(k)
  if (!url) return null
  const { w, h } = spriteSize(k)
  const top = bottom !== undefined ? bottom - h : (y ?? 0)
  return (
    <img
      src={url}
      alt=""
      draggable={false}
      className={className}
      style={{
        position: 'absolute',
        left: x,
        top,
        width: w,
        height: h,
        transform: flip ? 'scaleX(-1)' : undefined,
        ...style,
      }}
    />
  )
}
