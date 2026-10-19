import { useState } from 'react'
import { resolveSprite } from '../assets/manifest'
import { guessCategory, type ShopItem } from '../lib/schema'
import { Check, Modal, Zoom } from './kit'

type Props = {
  list: ShopItem[]
  onAdd: (text: string) => void
  onTick: (id: string) => void
  onRemove: (id: string) => void
  onClearTicked: () => void
  onClose: () => void
}

const qty = (x: ShopItem) => (x.count ? (x.unit ? `${x.count} ${x.unit}s` : `×${x.count}`) : x.unit ? `1 ${x.unit}` : '')
const icon = (x: ShopItem) => resolveSprite(x.name, guessCategory(x.name)).key

/** The list for the shop. Tick something and it goes straight into the
 *  kitchen, on the right shelf; the undo note is there if it was a slip. */
export function ShoppingList({ list, onAdd, onTick, onRemove, onClearTicked, onClose }: Props) {
  const [text, setText] = useState('')
  const todo = list.filter(x => !x.done)
  const done = list.filter(x => x.done)
  const send = () => { if (text.trim()) { onAdd(text.trim()); setText('') } }

  return (
    <Modal
      title="Shopping list"
      onClose={onClose}
      footBetween
      foot={<>
        <button className="sv-btn sv-btn--quiet" onClick={onClearTicked} disabled={!done.length}>clear ticked</button>
        <button className="sv-btn" onClick={onClose}>done</button>
      </>}
    >
      <p className="sv-dim" style={{ marginBottom: 12 }}>Tick things off as you shop. They go straight into the kitchen.</p>

      <div className="hud__bar-row" style={{ marginBottom: 18 }}>
        <input
          className="hud__input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send() }}
          placeholder="add something: two lemons, a bag of rice…"
          aria-label="Add to the shopping list"
        />
        <button className="sv-btn sv-btn--go" onClick={send} disabled={!text.trim()}>add</button>
      </div>

      {todo.length === 0 && (
        <p className="sv-dim">
          Nothing to buy. Things that run out land here on their own, and the cookbook can add what a recipe is missing.
        </p>
      )}
      <ul className="sv-list">
        {todo.map(x => (
          <li key={x.id} className="sv-row shop__row">
            <Check on={false} onChange={() => onTick(x.id)} label="" hint="Bought it: put it in the kitchen" />
            <span className="sv-row__icon" style={{ width: 48, height: 48 }}><Zoom k={icon(x)} max={42} /></span>
            <span className="sv-row__text">
              <span className="sv-row__name">{x.label}</span>
              {x.note && <span className="sv-small sv-dim">{x.note === 'ran out' ? 'ran out' : `for ${x.note.toLowerCase()}`}</span>}
            </span>
            <span className="sv-row__side">
              {qty(x) && <span>{qty(x)}</span>}
              <button className="sv-btn sv-btn--quiet sv-btn--small" onClick={() => onRemove(x.id)} aria-label={`Take ${x.label} off the list`}>x</button>
            </span>
          </li>
        ))}
      </ul>

      {done.length > 0 && (
        <>
          <div className="sv-section"><span className="sv-h2">In the kitchen now</span><span className="sv-dim">{done.length}</span></div>
          <ul className="sv-list">
            {done.map(x => (
              <li key={x.id} className="sv-row shop__row shop__row--done">
                <Check on onChange={() => {}} label="" hint="Already put away" />
                <span className="sv-row__text"><span className="sv-row__name">{x.label}</span></span>
                {qty(x) && <span className="sv-row__side">{qty(x)}</span>}
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  )
}
