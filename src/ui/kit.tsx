import { useEffect, type ReactNode } from 'react'
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
}

/** A menu: wooden frame, parchment inside, a title plaque on the top edge,
 *  the red square to close. Escape and a click outside also close it. */
export function Modal({ title, onClose, children, foot, footBetween, size }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="sv-modal" onClick={onClose}>
      <div
        className={`sv-frame sv-modal__panel${size ? ` sv-modal__panel--${size}` : ''}`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <p className="sv-wood sv-modal__title">{title}</p>
        <button className="sv-close" onClick={onClose} aria-label="Close">x</button>
        <div className="sv-modal__body">{children}</div>
        {foot && <div className={`sv-modal__foot${footBetween ? ' sv-modal__foot--between' : ''}`}>{foot}</div>}
      </div>
    </div>
  )
}

/** A square tick box with a pixel tick. */
export function Check({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
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
      <span>{label}</span>
    </button>
  )
}
