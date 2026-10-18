import { daysLeft, type Item, type Location } from '../lib/schema'
import { spriteSize, spriteUrl } from '../lib/sprites'

const PLACES: Array<[Location, string]> = [
  ['fridge', 'fridge'], ['freezer', 'freezer'], ['cupboard', 'cupboard'],
]
const AMOUNTS: Array<Item['amount']> = ['full', 'half', 'low']

type Props = {
  item: Item
  onClose: () => void
  onAmount: (a: Item['amount']) => void
  onMove: (l: Location) => void
  onRemove: () => void
}

/** Tap an item to get this. No form, no required fields — four taps' worth of
 *  everything you might want to change. */
export function ItemCard({ item, onClose, onAmount, onMove, onRemove }: Props) {
  const { w, h } = spriteSize(item.spriteKey)
  const left = daysLeft(item)
  return (
    <div className="sheet" onClick={onClose}>
      <div className="sheet__panel" onClick={e => e.stopPropagation()}>
        <div className="sheet__head">
          <span className="sheet__icon" style={{ width: w * 2, height: h * 2 }}>
            <img src={spriteUrl(item.spriteKey)} alt="" width={w} height={h} />
          </span>
          <div>
            <p>{item.displayName}</p>
            <p className="u-small sheet__dim">
              {left === null ? item.category
                : left < 0 ? `${item.category} · past it by ${-left}d`
                : `${item.category} · about ${left}d left`}
            </p>
          </div>
        </div>

        <p className="u-small sheet__dim">how much is left</p>
        <div className="sheet__row">
          {AMOUNTS.map(a => (
            <button
              key={a}
              className={`chip${item.amount === a ? ' chip--on' : ''}`}
              onClick={() => onAmount(a)}
            >{a}</button>
          ))}
        </div>

        <p className="u-small sheet__dim">where it lives</p>
        <div className="sheet__row">
          {PLACES.map(([loc, label]) => (
            <button
              key={loc}
              className={`chip${item.location === loc ? ' chip--on' : ''}`}
              onClick={() => onMove(loc)}
            >{label}</button>
          ))}
        </div>

        <div className="sheet__row sheet__row--end">
          <button className="chip chip--quiet" onClick={onRemove}>all gone</button>
          <button className="chip" onClick={onClose}>done</button>
        </div>
      </div>
    </div>
  )
}
