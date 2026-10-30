import { useCallback, useEffect, useRef, useState } from 'react'
import { repository } from './storage'
import { EMPTY_STATE, type AppState } from './schema'

export type Undoable = { label: string; before: AppState }

/**
 * The single place app state lives. Every mutation goes through `apply`, which
 * records the previous state so anything can be undone — that is the rule the
 * whole app leans on: never block, never confirm, always offer the way back.
 */
export function useStore() {
  const [state, setState] = useState<AppState>(EMPTY_STATE)
  const [loaded, setLoaded] = useState(false)
  const [undoable, setUndoable] = useState<Undoable | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    repository.load().then(s => { setState(s); setLoaded(true) })
  }, [])

  // persist after the dust settles rather than on every keystroke
  useEffect(() => {
    if (!loaded) return
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => { void repository.save(state) }, 200)
    return () => window.clearTimeout(timer.current)
  }, [state, loaded])

  // The current state is tracked in a ref so `apply` can read it without
  // doing work inside a setState updater. Updaters must stay pure: React
  // double-invokes them in development, which applied every change twice.
  const latest = useRef(state)
  latest.current = state

  const apply = useCallback((label: string, fn: (s: AppState) => AppState) => {
    const before = latest.current
    const next = fn(before)
    latest.current = next
    setUndoable({ label, before })
    setState(next)
  }, [])

  /** Changes that shouldn't offer an undo — settings toggles, say. */
  const applyQuiet = useCallback((fn: (s: AppState) => AppState) => {
    const next = fn(latest.current)
    latest.current = next
    setState(next)
  }, [])

  const undo = useCallback(() => {
    if (!undoable) return
    latest.current = undoable.before
    setState(undoable.before)
    setUndoable(null)
  }, [undoable])

  const dismissUndo = useCallback(() => setUndoable(null), [])

  /** the state as of the last apply, for reading straight after one */
  return { state, latest, loaded, apply, applyQuiet, undo, undoable, dismissUndo }
}
