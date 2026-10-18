import { useEffect, useRef, useState } from 'react'

/**
 * Steps an integer frame index between 0 and frames-1, forwards when `on` is
 * true and backwards when it goes false.
 *
 * Pixel art can only be animated on whole frames: a CSS transition would
 * interpolate to fractional pixel values and the sprite would shimmer. So every
 * animation in Basil is a discrete frame index, and components map that index
 * to whole-pixel values themselves.
 */
export function useSteps(on: boolean, frames: number, msPerFrame = 55): number {
  const [frame, setFrame] = useState(on ? frames - 1 : 0)
  const raf = useRef(0)

  useEffect(() => {
    const target = on ? frames - 1 : 0
    let last = performance.now()
    let cancelled = false

    const tick = (now: number) => {
      if (cancelled) return
      if (now - last >= msPerFrame) {
        last = now
        let done = false
        setFrame(f => {
          if (f === target) { done = true; return f }
          return f + Math.sign(target - f)
        })
        if (done) return
      }
      raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    return () => { cancelled = true; cancelAnimationFrame(raf.current) }
  }, [on, frames, msPerFrame])

  return frame
}
