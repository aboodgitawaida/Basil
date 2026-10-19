import { useMemo } from 'react'
import type { Sky } from '../lib/weather'
import { Sprite } from './Sprite'

type Props = { sky: Sky; w: number; h: number; drift?: 'petals' | 'leaves' | 'none' }

/** Particles inside the window pane. The pack's rain, splash, snowflake and
 *  leaves, falling on staggered loops. */
export function Weather({ sky, w, h, drift = 'none' }: Props) {
  const drops = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({
      x: (i * 37) % Math.max(1, w - 4),
      delay: (i * 137) % 1400,
      dur: 900 + ((i * 211) % 700),
      alt: i % 2 === 0,
    })),
    [w],
  )

  // the season's own drift: autumn leaves or spring blossom, on dry days
  const seasonal = drift !== 'none' && (sky === 'clear' || sky === 'cloud') && (
    <>
      {drops.slice(0, 6).map((d, i) => (
        <i
          key={`d${i}`}
          className="fall fall--drift"
          style={{ left: d.x, animationDelay: `${d.delay * 3}ms`, animationDuration: `${d.dur * 5}ms`, height: h }}
        >
          {drift === 'leaves'
            ? <Sprite k={`weather/leaf-${(i % 4) + 1}`} x={0} y={0} />
            : <i className={`petal${i % 2 ? ' petal--white' : ''}`} />}
        </i>
      ))}
    </>
  )

  if (sky === 'clear') return seasonal || null

  if (sky === 'cloud') {
    return (
      <>
        <Sprite k="sky/cloud-1" x={0} y={Math.round(h * 0.15)} className="win__cloud win__cloud--c" />
        <Sprite k="sky/cloud-3" x={0} y={Math.round(h * 0.05)} className="win__cloud win__cloud--d" />
        {seasonal}
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
