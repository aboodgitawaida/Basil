import { useEffect, useState } from 'react'

/** Steps a frame index round and round. Whole frames only, like everything
 *  else that moves in this kitchen. */
export function useLoop(frames: number, msPerFrame: number, running = true): number {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    if (!running || frames <= 1) return
    const id = window.setInterval(() => setFrame(f => (f + 1) % frames), msPerFrame)
    return () => window.clearInterval(id)
  }, [frames, msPerFrame, running])
  return running ? frame : 0
}
