import { useEffect } from 'react'
import type { Undoable } from '../lib/useStore'

type Props = { undoable: Undoable | null; onUndo: () => void; onDismiss: () => void }

/** Every change gets one of these. It fades on its own; nothing is ever
 *  confirmed up front. */
export function Toast({ undoable, onUndo, onDismiss }: Props) {
  useEffect(() => {
    if (!undoable) return
    const t = window.setTimeout(onDismiss, 6000)
    return () => window.clearTimeout(t)
  }, [undoable, onDismiss])

  if (!undoable) return null
  return (
    <div className="toast sv-frame" role="status" >
      <span>{undoable.label}</span>
      <button className="sv-btn sv-btn--small" onClick={onUndo}>undo</button>
    </div>
  )
}
