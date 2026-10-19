import { daysLeft, quantityText, type Item, type Location } from '../lib/schema'
import { Modal, Zoom } from './kit'
import { describe } from './ParsePreview'

const PLACES: Location[] = ['fridge', 'freezer', 'cupboard']
const AMOUNTS: Array<Item['amount']> = ['full', 'half', 'low']

type Props = {
  item: Item
  onClose: () => void
  onAmount: (a: Item['amount']) => void
  onCount: (n: number) => void
  onMove: (l: Location) => void
  onRemove: () => void
}

/** Click an item to get this. No form, no required fields. */
export function ItemCard({ item, onClose, onAmount, onCount, onMove, onRemove }: Props) {
  const left = daysLeft(item)
  const n = item.count ?? 1
  return (
    <Modal title={item.displayName} onClose={onClose} size="narrow" footBetween
      foot={<>
        <button className="sv-btn sv-btn--danger" onClick={onRemove}>all gone</button>
        <button className="sv-btn" onClick={onClose}>done</button>
      </>}>
      <div className="recipe__hero">
        <span className="sv-row__icon" style={{ width: 96, height: 96 }}><Zoom k={item.spriteKey} scale={3} max={90} /></span>
        <div>
          <p className="sv-h2">{item.displayName}</p>
          <p className="sv-dim" style={{ marginTop: 9 }}>{describe(item)}</p>
          <p className="sv-small" style={{ marginTop: 9, color: left !== null && left <= 3 ? 'var(--sv-red)' : 'var(--sv-ink-dim)' }}>
            {left === null ? 'keeps a good while'
              : left < 0 ? `past it by ${-left} day${left === -1 ? '' : 's'}`
              : left === 0 ? 'use it today'
              : `about ${left} day${left === 1 ? '' : 's'} left`}
          </p>
        </div>
      </div>

      <p className="sv-section">How many</p>
      <div className="sv-stepper" style={{ marginBottom: 6 }}>
        <button className="sv-btn sv-btn--quiet" onClick={() => onCount(n - 1)} aria-label="One fewer">-</button>
        <span className="sv-stepper__n">{quantityText({ ...item, count: n }) || '×1'}</span>
        <button className="sv-btn sv-btn--quiet" onClick={() => onCount(n + 1)} aria-label="One more">+</button>
      </div>

      <p className="sv-section">How much is left</p>
      <div className="sv-grid">
        {AMOUNTS.map(a => (
          <button key={a} className={`sv-btn sv-btn--small${item.amount === a ? ' sv-btn--go' : ' sv-btn--quiet'}`} onClick={() => onAmount(a)}>{a}</button>
        ))}
      </div>

      <p className="sv-section">Where it lives</p>
      <div className="sv-grid">
        {PLACES.map(loc => (
          <button key={loc} className={`sv-btn sv-btn--small${item.location === loc ? ' sv-btn--go' : ' sv-btn--quiet'}`} onClick={() => onMove(loc)}>{loc}</button>
        ))}
      </div>
    </Modal>
  )
}
