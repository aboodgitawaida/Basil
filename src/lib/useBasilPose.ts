import { useEffect, useRef, useState } from 'react'

/** What Basil is up to, from the outside. */
export type BasilMode = 'sleep' | 'alert' | 'attentive' | 'happy'

/** One step of an animation: which sprite, for how long, lifted how far. */
export type Step = { k: string; ms: number; dy?: number }

const SLEEP: Step[] = [0, 1, 2, 3, 4, 5].map(i => ({ k: `cat/sleep-${i}`, ms: 420 }))

/** The sequences, played in order; the last list loops until the mode changes. */
export function sequence(mode: BasilMode, from: BasilMode | null): { intro: Step[]; loop: Step[] } {
  switch (mode) {
    case 'sleep':
      // waking things settle back down: eyes open a beat, then sleep
      return { intro: from && from !== 'sleep' ? [{ k: 'cat/awake', ms: 700 }] : [], loop: SLEEP }
    case 'alert':
      // the fridge opened: eyes open, head still down, the odd blink
      return { intro: [], loop: [{ k: 'cat/awake', ms: 2600 }, { k: 'cat/sleep-0', ms: 140 }] }
    case 'attentive':
      // the cookbook opened: wake, a long stretch, then sit up and pay attention
      return {
        intro: [
          { k: 'cat/awake', ms: 450 },
          { k: 'cat/stretch-1', ms: 220 },
          { k: 'cat/stretch-2', ms: 650 },
          { k: 'cat/stretch-1', ms: 220 },
          { k: 'cat/awake', ms: 200 },
        ],
        loop: [{ k: 'cat/up', ms: 3200 }, { k: 'cat/blink', ms: 150 }],
      }
    case 'happy':
      // something got cooked: little hops with his eyes squeezed shut
      return {
        intro: Array.from({ length: 4 }, () => [
          { k: 'cat/happy', ms: 160, dy: -2 },
          { k: 'cat/happy', ms: 160 },
        ]).flat(),
        loop: [{ k: 'cat/happy', ms: 99_999 }],
      }
  }
}

/** Steps through Basil's poses for the current mode. Whole frames only. */
export function useBasilPose(mode: BasilMode): Step {
  const prev = useRef<BasilMode | null>(null)
  const [step, setStep] = useState<Step>(SLEEP[0])

  useEffect(() => {
    const { intro, loop } = sequence(mode, prev.current)
    prev.current = mode
    const all = [...intro, ...loop]
    let i = 0
    let timer = 0
    const next = () => {
      setStep(all[i])
      const ms = all[i].ms
      i = i + 1 >= all.length ? intro.length : i + 1
      timer = window.setTimeout(next, ms)
    }
    next()
    return () => window.clearTimeout(timer)
  }, [mode])

  return step
}
