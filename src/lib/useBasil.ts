import { useCallback, useEffect, useRef, useState } from 'react'
import { fridgeRemark, type Spoken } from './basilSays'
import type { Item } from './schema'

/** He talks on his own at most this often. */
const COOLDOWN_MS = 90_000
const SHOW_MS = 8_000
/** A beat after the fridge opens, so it reads as him waking up. */
const WAKE_MS = 700

/**
 * Basil's mouth. Clicking him opens the cookbook; this is only what he says
 * unprompted when the fridge opens: a free, local remark about food going off
 * or a meal that is already complete. Never calls the model, never repeats.
 */
export function useBasil(items: Item[], fridgeOpen: boolean) {
  const [speech, setSpeech] = useState<Spoken | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const lastRemark = useRef(0)
  const told = useRef(new Set<string>())
  const latest = useRef(items)
  latest.current = items

  const show = useCallback((s: Spoken | null, ms = SHOW_MS) => {
    window.clearTimeout(timer.current)
    setSpeech(s)
    if (s) timer.current = window.setTimeout(() => setSpeech(null), ms)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    if (!fridgeOpen) return
    const t = window.setTimeout(() => {
      if (Date.now() - lastRemark.current < COOLDOWN_MS) return
      const remark = fridgeRemark(latest.current)
      if (!remark || told.current.has(remark.key)) return
      told.current.add(remark.key)
      lastRemark.current = Date.now()
      show({ title: remark.text })
    }, WAKE_MS)
    return () => window.clearTimeout(t)
  }, [fridgeOpen, show])

  return { speech, say: show, hush: () => show(null) }
}
