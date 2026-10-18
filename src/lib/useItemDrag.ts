import { useCallback, useRef, useState } from 'react'
import type { Item, Location } from './schema'

export type DropTarget =
  | { type: 'move'; to: Location }
  | { type: 'craft'; slot: number }

export type DragState = { item: Item; x: number; y: number } | null

function targetAt(x: number, y: number): DropTarget | null {
  // craft cells are checked first: they sit on top of the counter and are the
  // more specific target wherever the two overlap
  for (const el of document.querySelectorAll<HTMLElement>('[data-craft-slot]')) {
    const r = el.getBoundingClientRect()
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      return { type: 'craft', slot: Number(el.dataset.craftSlot) }
    }
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-drop]')) {
    const r = el.getBoundingClientRect()
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      return { type: 'move', to: el.dataset.drop as Location }
    }
  }
  return null
}

/** Pointer-based drag, so it works the same with a finger as with a mouse.
 *  A press that never moves is a tap and opens the item instead. */
export function useItemDrag(onDrop: (item: Item, t: DropTarget) => void, onTap: (item: Item) => void) {
  const [drag, setDrag] = useState<DragState>(null)
  const start = useRef<{ item: Item; x: number; y: number; moved: boolean } | null>(null)

  const onPointerDown = useCallback((item: Item, e: React.PointerEvent) => {
    e.stopPropagation()
    start.current = { item, x: e.clientX, y: e.clientY, moved: false }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const s = start.current
    if (!s) return
    if (!s.moved && Math.hypot(e.clientX - s.x, e.clientY - s.y) < 5) return
    s.moved = true
    setDrag({ item: s.item, x: e.clientX, y: e.clientY })
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const s = start.current
    start.current = null
    if (!s) return
    if (!s.moved) { onTap(s.item); setDrag(null); return }
    const t = targetAt(e.clientX, e.clientY)
    setDrag(null)
    if (t) onDrop(s.item, t)
  }, [onDrop, onTap])

  return { drag, handlers: { onPointerDown, onPointerMove, onPointerUp } }
}
