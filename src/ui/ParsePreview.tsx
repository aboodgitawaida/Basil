import { materialise } from '../lib/inventory'
import { spriteSize, spriteUrl } from '../lib/sprites'
import type { ParseOutcome } from '../lib/ai'

type Props = {
  outcome: ParseOutcome
  onConfirm: () => void
  onCancel: () => void
  onDrop: (index: number) => void
}

/** Nothing is saved until this is accepted. It shows exactly what was
 *  understood — including the guesses — so a wrong one can be dropped before
 *  it ever reaches the shelves. */
export function ParsePreview({ outcome, onConfirm, onCancel, onDrop }: Props) {
  const preview = outcome.drafts.map(d => ({ draft: d, item: materialise(d, []) }))

  return (
    <div className="sheet" onClick={onCancel}>
      <div className="sheet__panel" onClick={e => e.stopPropagation()}>
        <p>{preview.length === 1 ? 'One thing' : `${preview.length} things`}, by my reading:</p>
        {outcome.source === 'keywords' && (
          <p className="u-small sheet__dim">{outcome.why}</p>
        )}

        <ul className="parsed">
          {preview.map(({ draft, item }, i) => {
            const { w, h } = spriteSize(item.spriteKey)
            return (
              <li key={`${item.name}-${i}`} className="parsed__row">
                <span className="parsed__icon" style={{ width: w * 2, height: h * 2 }}>
                  <img src={spriteUrl(item.spriteKey)} alt="" width={w} height={h} />
                </span>
                <span className="parsed__text">
                  <span>{draft.displayName}</span>
                  <span className="u-small sheet__dim">
                    {item.category} · {item.location}
                    {item.count ? ` · ${item.count}` : ''}
                    {item.amount !== 'full' ? ` · ${item.amount}` : ''}
                  </span>
                </span>
                <button className="chip chip--quiet" onClick={() => onDrop(i)} aria-label={`Drop ${draft.displayName}`}>
                  not that
                </button>
              </li>
            )
          })}
        </ul>

        <div className="sheet__row sheet__row--end">
          <button className="chip chip--quiet" onClick={onCancel}>scrap it</button>
          <button className="chip chip--on" onClick={onConfirm}>put it away</button>
        </div>
      </div>
    </div>
  )
}
