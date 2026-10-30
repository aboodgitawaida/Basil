import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { spriteSize, spriteUrl } from '../lib/sprites'

/** A sprite at a whole-number zoom, so it stays crisp. */
export function Zoom({ k, scale = 2, max }: { k: string; scale?: number; max?: number }) {
  const { w, h } = spriteSize(k)
  // with a box size, zoom to fill it: tiny eggs grow, big pumpkins shrink
  const s = max ? Math.max(1, Math.min(5, Math.floor(max / Math.max(w, h)))) : scale
  return (
    <span className="zoom" style={{ width: w * s, height: h * s }}>
      <img src={spriteUrl(k)} alt="" width={w} height={h} style={{ transform: `scale(${s})` }} />
    </span>
  )
}

type ModalProps = {
  title: string
  onClose: () => void
  children: ReactNode
  foot?: ReactNode
  footBetween?: boolean
  size?: 'narrow' | 'wide'
  /** Which page of the menu is showing. Each page keeps its own scroll
   *  position, so a recipe opens at the top and "back" returns to the list
   *  where you left it. */
  page?: string
}

/** A menu: wooden frame, parchment inside, a title plaque on the top edge,
 *  the red square to close. Escape and a click outside also close it. */
export function Modal({ title, onClose, children, foot, footBetween, size, page = '' }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const scrolls = useRef(new Map<string, number>())
  const shown = useRef(page)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // keyboard users land inside the menu, and go back where they were after
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus()
    return () => { if (before?.isConnected) before.focus() }
  }, [])

  // recorded as it happens: by the time the page has changed, a shorter page
  // has already clamped the old position
  useLayoutEffect(() => {
    if (!body.current || shown.current === page) return
    shown.current = page
    body.current.scrollTop = scrolls.current.get(page) ?? 0
  }, [page])

  return (
    <div className="sv-modal" onClick={onClose}>
      <div
        ref={panel}
        className={`sv-frame sv-modal__panel${size ? ` sv-modal__panel--${size}` : ''}`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <p className="sv-wood sv-modal__title">{title}</p>
        <button className="sv-close" onClick={onClose} aria-label="Close">x</button>
        <div className="sv-modal__body" ref={body} onScroll={e => scrolls.current.set(shown.current, e.currentTarget.scrollTop)}>{children}</div>
        {foot && <div className={`sv-modal__foot${footBetween ? ' sv-modal__foot--between' : ''}`}>{foot}</div>}
      </div>
    </div>
  )
}

/** A square tick box with a pixel tick. */
export function Check({ on, onChange, label, hint, showHint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string; showHint?: boolean }) {
  return (
    <button
      className={`sv-check${on ? ' sv-check--on' : ''}`}
      role="checkbox"
      aria-checked={on}
      onClick={() => onChange(!on)}
      title={hint}
    >
      <span className="sv-check__box">
        {on && (
          <svg viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden>
            <path d="M2 5h1v1h1v1h1V6h1V5h1V4h1V3h1v1H9v1H8v1H7v1H6v1H5v1H4V8H3V7H2V6H1V5z" fill="#2f6b14" />
          </svg>
        )}
      </span>
      <span style={{ textAlign: 'left' }}>
        {label}
        {showHint && hint && <span className="sv-check__hint sv-small" style={{ display: 'block', marginTop: 3 }}>{hint}</span>}
      </span>
    </button>
  )
}
