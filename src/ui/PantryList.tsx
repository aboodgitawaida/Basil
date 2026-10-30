import { daysLeft, isGoingOff, quantityText, type Item, type Location } from '../lib/schema'
import { Modal, Zoom } from './kit'
import { describe } from '../lib/describe'

const ORDER: Array<[Location, string]> = [['fridge', 'Fridge'], ['freezer', 'Freezer'], ['cupboard', 'Cupboard']]

/** Everything in the kitchen at a glance, without opening every door. */
export function PantryList({ items, onPick, onClose }: { items: Item[]; onPick: (i: Item) => void; onClose: () => void }) {
  return (
    <Modal title="In the kitchen" onClose={onClose}>
      {items.length === 0 && <p className="sv-dim">Empty. Type what you bought in the bar at the bottom, like “two eggs, a bag of rice, half a block of cheddar”.</p>}
      {ORDER.map(([loc, label]) => {
        const here = items.filter(i => i.location === loc).sort((a, b) => (daysLeft(a) ?? 999) - (daysLeft(b) ?? 999))
        if (!here.length) return null
        return (
          <div key={loc}>
            <div className="sv-section"><span className="sv-h2">{label}</span><span className="sv-dim">{here.length}</span></div>
            <ul className="sv-list">
              {here.map(i => {
                const left = daysLeft(i)
                return (
                  <li key={i.id}>
                    <button className="sv-row" onClick={() => onPick(i)}>
                      <span className="sv-row__icon"><Zoom k={i.spriteKey} scale={2} max={54} /></span>
                      <span className="sv-row__text">
                        <span className="sv-row__name">{i.displayName}</span>
                        <span className="sv-small sv-dim">{describe(i).split(' · ').slice(0, 2).join(' · ')}</span>
                      </span>
                      <span className="sv-row__side">
                        {quantityText(i) && <span>{quantityText(i)}</span>}
                        {i.amount !== 'full' && <span className="sv-tag">{i.amount}</span>}
                        {left !== null && (
                          <span className={`sv-tag${isGoingOff(i) ? ' sv-tag--red' : ''}`}>{left < 0 ? 'past it' : `${left}d`}</span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </Modal>
  )
}
