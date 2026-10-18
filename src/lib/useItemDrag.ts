import { useCallback, useRef, useState } from 'react'
import type { Item, Location } from './schema'

export type DragState = { item: Item; x: number; y: number; over: Location | null } | null

/** Pointer-based drag, so it works the same with a finger as with a mouse.
 *  A press that never moves is a tap and opens the item instead. */
export function useItemDrag(onDrop: (item: Item, to: Location) => void, onTap: (item: Item) => void) {
  const [drag, setDrag] = useState<DragState>(null)
  const start = useRef<{ item: Item; x: number; y: number; moved: boolean } | null>(null)

  const zoneAt = (x: number, y: number): Location | null => {
    for (const el of document.querySelectorAll<HTMLElement>('[data-drop]')) {
      const r = el.getBoundingClientRect()
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return el.dataset.drop as Location
      }
    }
    return null
  }

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
    setDrag({ item: s.item, x: e.clientX, y: e.clientY, over: zoneAt(e.clientX, e.clientY) })
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const s = start.current
    start.current = null
    if (!s) return
    if (!s.moved) { onTap(s.item); setDrag(null); return }
    const to = zoneAt(e.clientX, e.clientY)
    setDrag(null)
    if (to && to !== s.item.location) onDrop(s.item, to)
  }, [onDrop, onTap])

  return { drag, handlers: { onPointerDown, onPointerMove, onPointerUp } }
}
