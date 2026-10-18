import { useCallback, useEffect, useRef, useState } from 'react'
import { inventoryKey, suggestMeals, type Meal } from './ai'
import { EMPTY, NOTHING, THINKING, fridgeRemark, ranked, speakMeal, type Spoken } from './basilSays'
import type { Item } from './schema'

/** He talks on his own at most this often. Asked-for answers ignore it. */
const COOLDOWN_MS = 90_000
const SHOW_MS = 8_000
/** A beat after the fridge opens, so it reads as him waking up. */
const WAKE_MS = 700

/**
 * Basil's mouth. Two ways in:
 *  - ask(): clicking him. Uses the same suggestMeals as the recipe book, so
 *    the two share one cache and one set of failure messages. Asking again
 *    while the answer is up moves on to the next meal.
 *  - the fridge opening: a free, local remark about food going off or a meal
 *    that is already complete. Never calls the model, never repeats itself.
 */
export function useBasil(items: Item[], dietary: string[], fridgeOpen: boolean) {
  const [speech, setSpeech] = useState<Spoken | null>(null)
  const [thinking, setThinking] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const lastRemark = useRef(0)
  const told = useRef(new Set<string>())
  const asking = useRef(false)
  const answer = useRef<{ key: string; meals: Meal[]; i: number; line?: string; why?: string } | null>(null)
  const latest = useRef({ items, dietary })
  latest.current = { items, dietary }

  const show = useCallback((s: Spoken | null, ms = SHOW_MS) => {
    window.clearTimeout(timer.current)
    setSpeech(s)
    if (s) timer.current = window.setTimeout(() => setSpeech(null), ms)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const ask = useCallback(async () => {
    if (asking.current) return
    const { items: inv, dietary: diet } = latest.current
    if (!inv.length) return show({ title: EMPTY })

    const key = `${inventoryKey(inv)}:${diet.join(',')}`
    const have = answer.current
    if (have && have.key === key && have.meals.length) {
      have.i = (have.i + 1) % have.meals.length
      return show(speakMeal(have.meals[have.i], have.i, have.line, have.why))
    }

    asking.current = true
    setThinking(true)
    show({ title: THINKING }, 30_000)
    try {
      const r = await suggestMeals(inv, diet)
      const meals = ranked(r.meals)
      if (!meals.length) return show({ title: NOTHING, note: r.why })
      answer.current = { key, meals, i: 0, line: r.line, why: r.why }
      show(speakMeal(meals[0], 0, r.line, r.why))
    } finally {
      asking.current = false
      setThinking(false)
    }
  }, [show])

  // unprompted: only on the fridge opening
  useEffect(() => {
    if (!fridgeOpen) return
    const t = window.setTimeout(() => {
      if (asking.current || Date.now() - lastRemark.current < COOLDOWN_MS) return
      const remark = fridgeRemark(latest.current.items)
      if (!remark || told.current.has(remark.key)) return
      told.current.add(remark.key)
      lastRemark.current = Date.now()
      show({ title: remark.text })
    }, WAKE_MS)
    return () => window.clearTimeout(t)
  }, [fridgeOpen, show])

  return { speech, thinking, ask, hush: () => show(null) }
}
