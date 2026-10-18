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

  const apply = useCallback((label: string, fn: (s: AppState) => AppState) => {
    setState(prev => {
      setUndoable({ label, before: prev })
      return fn(prev)
    })
  }, [])

  /** Changes that shouldn't offer an undo — settings toggles, say. */
  const applyQuiet = useCallback((fn: (s: AppState) => AppState) => {
    setState(prev => fn(prev))
  }, [])

  const undo = useCallback(() => {
    setUndoable(current => {
      if (current) setState(current.before)
      return null
    })
  }, [])

  const dismissUndo = useCallback(() => setUndoable(null), [])

  return { state, loaded, apply, applyQuiet, undo, undoable, dismissUndo }
}
