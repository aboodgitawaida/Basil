import type { Meal } from '../lib/ai'
import { dishSprite, type BookEntry } from '../lib/craft'
import { spriteSize, spriteUrl } from '../lib/sprites'

type Props = {
  entries: BookEntry[]
  suggestions: Meal[]
  line?: string
  /** set when the model failed and these are the built-in recipes */
  why?: string
  loading: boolean
  onClose: () => void
}

function Dish({ name }: { name: string }) {
  const key = dishSprite(name)
  const { w, h } = spriteSize(key)
  return (
    <span className="book__icon" style={{ width: w, height: h }}>
      <img src={spriteUrl(key)} alt="" width={w} height={h} />
    </span>
  )
}

/** Everything cooked before, plus what the kitchen reckons you could make now.
 *  Meals you are short of are greyed with the missing bits listed — that is
 *  the bit that makes you want to go and buy them. */
export function RecipeBook({ entries, suggestions, line, why, loading, onClose }: Props) {
  return (
    <div className="sheet" onClick={onClose}>
      <div className="sheet__panel sheet__panel--tall" onClick={e => e.stopPropagation()}>
        <div className="sheet__head sheet__head--between">
          <p>The book</p>
          <button className="chip chip--quiet" onClick={onClose}>shut it</button>
        </div>

        <p className="u-small sheet__dim">{loading ? 'Having a think…' : line ?? 'What you could make.'}</p>
        {why && !loading && <p className="u-small sheet__warn">{why} Showing built-in recipes.</p>}
        <ul className="book">
          {suggestions.map(m => (
            <li key={`s-${m.name}`} className={`book__row${m.missing.length ? ' book__row--short' : ''}`}>
              <Dish name={m.name} />
              <span className="book__text">
                <span>{m.name}</span>
                <span className="u-small sheet__dim">
                  {m.missing.length
                    ? `short of ${m.missing.join(', ')}`
                    : `${m.minutes} min · ${m.ingredients.join(', ')}`}
                </span>
              </span>
            </li>
          ))}
        </ul>

        {entries.length > 0 && (
          <>
            <p className="u-small sheet__dim">Cooked before</p>
            <ul className="book">
              {entries.map(e => (
                <li key={e.meal.id} className={`book__row${e.missing.length ? ' book__row--short' : ''}`}>
                  <Dish name={e.meal.name} />
                  <span className="book__text">
                    <span>{e.meal.name}</span>
                    <span className="u-small sheet__dim">
                      {e.missing.length ? `short of ${e.missing.join(', ')}` : 'you have everything'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
