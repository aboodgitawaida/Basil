import { materialise } from '../lib/inventory'
import type { ParseOutcome } from '../lib/ai'
import { CATEGORY_LABEL, quantityText, type Item } from '../lib/schema'
import { Modal, Zoom } from './kit'

type Props = {
  outcome: ParseOutcome
  /** what is already in, so it can say when something will top up a shelf */
  have: Item[]
  onConfirm: () => void
  onCancel: () => void
  onDrop: (index: number) => void
  onCount: (index: number, count: number) => void
}

export const describe = (i: Item) =>
  [i.kind ? `a ${i.kind}` : null, CATEGORY_LABEL[i.category], i.location].filter(Boolean).join(' · ')

/** Nothing is saved until this is accepted. It shows exactly what was
 *  understood — what each thing is, how many, where it goes — so a wrong
 *  guess can be fixed or dropped before it reaches the shelves. */
export function ParsePreview({ outcome, have, onConfirm, onCancel, onDrop, onCount }: Props) {
  const preview = outcome.drafts.map(d => ({ draft: d, item: materialise(d, []) }))

  return (
    <Modal
      title="Putting away"
      onClose={onCancel}
      footBetween
      foot={<>
        <button className="sv-btn sv-btn--quiet" onClick={onCancel}>scrap it</button>
        <button className="sv-btn sv-btn--go" onClick={onConfirm} autoFocus>put it away</button>
      </>}
    >
      <p style={{ marginBottom: 15 }}>{preview.length === 1 ? 'One thing' : `${preview.length} things`}, by my reading:</p>
      {outcome.source === 'keywords' && outcome.why && <p className="sv-small sv-dim" style={{ marginBottom: 12 }}>{outcome.why}</p>}

      <ul className="sv-list">
        {preview.map(({ draft, item }, i) => {
          const n = item.count ?? 1
          const topUp = have.find(h => h.name === item.name && h.location === item.location && (h.unit ?? '') === (item.unit ?? ''))
          return (
            <li key={`${item.name}-${i}`} className="sv-row">
              <span className="sv-row__icon"><Zoom k={item.spriteKey} scale={2} max={54} /></span>
              <span className="sv-row__text">
                <span className="sv-row__name">{item.displayName}{item.amount !== 'full' ? ` (${item.amount})` : ''}</span>
                <span className="sv-small sv-dim">{describe(item)}{item.measure && !item.unit ? ` · ${item.measure}` : ''}</span>
                {topUp && <span className="sv-small" style={{ color: 'var(--sv-green)' }}>tops up the {topUp.displayName.toLowerCase()} you have ({quantityText(topUp) || '1'})</span>}
              </span>
              <span className="sv-row__side">
                <span className="sv-stepper">
                  <button className="sv-btn sv-btn--quiet" onClick={() => n <= 1 ? onDrop(i) : onCount(i, n - 1)} aria-label={`One fewer ${item.displayName}`}>-</button>
                  <span className="sv-stepper__n">{quantityText({ ...item, count: n }) || '×1'}</span>
                  <button className="sv-btn sv-btn--quiet" onClick={() => onCount(i, n + 1)} aria-label={`One more ${item.displayName}`}>+</button>
                </span>
                <button className="sv-btn sv-btn--quiet sv-btn--small" onClick={() => onDrop(i)} aria-label={`Drop ${draft.displayName}`}>not that</button>
              </span>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
