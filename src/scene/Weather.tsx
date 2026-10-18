import { useMemo } from 'react'
import type { Sky } from '../lib/weather'
import { Sprite } from './Sprite'

type Props = { sky: Sky; w: number; h: number }

/** Particles inside the window pane. The pack's rain, splash, snowflake and
 *  leaves, falling on staggered loops. */
export function Weather({ sky, w, h }: Props) {
  const drops = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({
      x: (i * 37) % Math.max(1, w - 4),
      delay: (i * 137) % 1400,
      dur: 900 + ((i * 211) % 700),
      alt: i % 2 === 0,
    })),
    [w],
  )

  if (sky === 'clear') return null

  if (sky === 'cloud') {
    return (
      <>
        <Sprite k="sky/cloud-1" x={Math.round(w * 0.1)} y={Math.round(h * 0.15)} />
        <Sprite k="sky/cloud-3" x={Math.round(w * 0.55)} y={Math.round(h * 0.05)} />
      </>
    )
  }

  return (
    <>
      {drops.map((d, i) => (
        <i
          key={i}
          className={sky === 'snow' ? 'fall fall--snow' : 'fall fall--rain'}
          style={{
            left: d.x,
            animationDelay: `${d.delay}ms`,
            animationDuration: `${sky === 'snow' ? d.dur * 2.4 : d.dur}ms`,
            height: h,
          }}
        >
          <Sprite
            k={sky === 'snow' ? 'weather/snowflake' : d.alt ? 'weather/rain-1' : 'weather/rain-2'}
            x={0}
            y={0}
          />
        </i>
      ))}
    </>
  )
}
