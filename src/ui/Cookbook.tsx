import { useEffect, useMemo, useState } from 'react'
import { suggestMeals } from '../lib/ai'
import { cookbookLine } from '../lib/basilSays'
import { dishSprite } from '../lib/craft'
import {
  FILTERS, RECIPES, cookable, ingredientLabel, match, passes, rank,
  type Filter, type Match, type Recipe,
} from '../lib/recipes'
import { quantityText, type CookedMeal, type Item } from '../lib/schema'
import { Check, Modal, Zoom } from './kit'

type Props = {
  items: Item[]
  history: CookedMeal[]
  dietary: string[]
  /** whether a model key is set, so it is worth asking Basil for more */
  aiReady: boolean
  filters: Filter[]
  onFilters: (f: Filter[]) => void
  onCook: (m: Match) => void
  /** add what a recipe is missing to the shopping list */
  onList: (m: Match) => void
  /** names already on the shopping list */
  listed: Set<string>
  onClose: () => void
}

const need = (m: Match) =>
  m.missing.map(ing => {
    const u = m.uses.find(x => x.ingredient === ing)
    return u?.short ? `${u.short} more ${ingredientLabel(ing.item)}` : ingredientLabel(ing.item)
  })

/** "3 eggs" already says it is eggs; "30g, grated" does not say cheese. */
const saysWhat = (qty: string, item: string) =>
  item.split('|').some(w => qty.toLowerCase().includes(w.trim().toLowerCase()))

/** Whether everything a recipe is short of is already on the list. */
const allListed = (m: Match, listed: Set<string>) =>
  m.missing.every(i => listed.has(i.item.split('|')[0].trim()))

function ListButton({ m, listed, onList, small }: { m: Match; listed: Set<string>; onList: (m: Match) => void; small?: boolean }) {
  const done = allListed(m, listed)
  return (
    <button
      className={`sv-btn${done ? ' sv-btn--quiet' : ''}${small ? ' sv-btn--small cook__list' : ''}`}
      onClick={e => { e.stopPropagation(); if (!done) onList(m) }}
      disabled={done}
      title={done ? 'Already on your shopping list' : `Add ${need(m).join(', ')} to your shopping list`}
    >
      {done ? 'on your list' : small ? '+ list' : `add ${m.missing.length === 1 ? 'it' : `all ${m.missing.length}`} to my list`}
    </button>
  )
}

function Card({ m, onOpen, listed, onList }: { m: Match; onOpen: () => void; listed: Set<string>; onList: (m: Match) => void }) {
  const r = m.recipe
  return (
    <div className="cook__cardwrap">
    <button className={`cook__card${m.missing.length ? ' cook__card--short' : ''}`} onClick={onOpen}>
      <span className="cook__dish"><Zoom k={dishSprite(r.name)} scale={2} max={66} /></span>
      <span>
        <span className="cook__card-name">{r.name}</span>
        <span className="cook__card-meta">
          <span className="sv-tag">{r.kcal} kcal</span>
          <span className={`sv-tag${r.protein >= 25 ? ' sv-tag--green' : ''}`}>{r.protein}g protein</span>
          <span className="sv-tag">{r.minutes} min</span>
          {m.usesSoon.length > 0 && <span className="sv-tag sv-tag--gold">uses {m.usesSoon[0].toLowerCase()}</span>}
        </span>
        {m.missing.length > 0 && <span className="cook__card-need" style={{ display: 'block' }}>need: {need(m).join(', ')}</span>}
      </span>
    </button>
    {m.missing.length > 0 && <ListButton m={m} listed={listed} onList={onList} small />}
    </div>
  )
}

function Detail({ m, onBack, onCook, listed, onList }: { m: Match; onBack: () => void; onCook: () => void; listed: Set<string>; onList: (m: Match) => void }) {
  const r = m.recipe
  return (
    <div>
      <div className="recipe__hero">
        <span className="cook__dish" style={{ width: 108, height: 108 }}><Zoom k={dishSprite(r.name)} scale={3} max={100} /></span>
        <div>
          <p className="sv-h2">{r.name}</p>
          <p className="sv-dim" style={{ marginTop: 9 }}>
            {r.source === 'basil' ? (r.note ?? "One of Basil's own.") : m.missing.length ? `Short of ${need(m).join(', ')}.` : 'You have everything for this.'}
          </p>
          <p style={{ marginTop: 9, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {r.tags.includes('vegan') ? <span className="sv-tag sv-tag--green">vegan</span>
              : r.tags.includes('vegetarian') && <span className="sv-tag sv-tag--green">vegetarian</span>}
            {m.usesSoon.map(n => <span key={n} className="sv-tag sv-tag--gold">uses up {n.toLowerCase()}</span>)}
          </p>
        </div>
      </div>

      <div className="recipe__stats">
        <div className="recipe__stat"><b>{r.kcal}</b>kcal each</div>
        <div className="recipe__stat"><b>{r.protein}g</b>protein each</div>
        <div className="recipe__stat"><b>{r.minutes}</b>minutes</div>
        <div className="recipe__stat"><b>{r.serves}</b>{r.serves === 1 ? 'serving' : 'servings'}</div>
      </div>

      <div className="recipe">
        <div>
          <p className="sv-section">Ingredients</p>
          <ul className="recipe__ings">
            {m.uses.map(({ ingredient, item, short }, n) => {
              const state = item && !short ? 'have' : ingredient.optional ? 'opt' : 'miss'
              return (
                <li key={n} className="recipe__ing">
                  <i className={`recipe__mark recipe__mark--${state}`} />
                  <span>
                    {ingredient.qty ? `${ingredient.qty} ` : ''}
                    {!saysWhat(ingredient.qty, ingredient.item) && <span className="sv-dim">{ingredient.qty ? '— ' : ''}{ingredientLabel(ingredient.item)}</span>}
                    {ingredient.optional && <span className="sv-dim"> (optional)</span>}
                    {item && (
                      <span className="sv-small sv-dim" style={{ display: 'block', marginTop: 3 }}>
                        you have {item.displayName}{quantityText(item) ? ` ${quantityText(item)}` : ''}
                        {short ? `, ${short} short` : ''}
                      </span>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="sv-small sv-dim" style={{ marginTop: 12 }}>Salt, pepper and water are assumed.</p>
        </div>
        <div>
          <p className="sv-section">Method</p>
          <ol className="recipe__steps">
            {r.steps.map((s, n) => <li key={n}><span>{s}</span></li>)}
          </ol>
        </div>
      </div>

      <div className="sv-modal__foot sv-modal__foot--between" style={{ margin: '24px -27px -24px' }}>
        <button className="sv-btn sv-btn--quiet" onClick={onBack}>&lt; back</button>
        {m.missing.length > 0
          ? <ListButton m={m} listed={listed} onList={onList} />
          : <button className="sv-btn sv-btn--go" onClick={onCook} title="Uses up what it needs from the kitchen">cook it</button>}
      </div>
    </div>
  )
}

/** Basil's cookbook: everything the kitchen can make, filtered by what you
 *  are after, with the full recipe a click away. The built-in book works with
 *  no model at all; with one, Basil adds a few ideas of his own. */
export function Cookbook({ items, history, dietary, aiReady, filters, onFilters, onCook, onList, listed, onClose }: Props) {
  const [open, setOpen] = useState<string | null>(null)
  const [extra, setExtra] = useState<Recipe[]>([])
  const [asking, setAsking] = useState(false)
  const [why, setWhy] = useState<string | undefined>()
  const [showShort, setShowShort] = useState(true)

  const ask = () => {
    if (!items.length) return
    setAsking(true)
    void suggestMeals(items, dietary).then(r => {
      setExtra(r.recipes)
      setWhy(r.why)
      setAsking(false)
    })
  }
  useEffect(() => { if (aiReady) ask() }, [aiReady])

  const all = useMemo(() => cookable(items), [items])
  const ideas = useMemo(() => {
    const known = new Set(RECIPES.map(r => r.name.toLowerCase()))
    return rank(extra.filter(r => !known.has(r.name.toLowerCase())).map(r => match(r, items)))
  }, [extra, items])

  const shown = all.filter(m => passes(m, filters))
  const ready = shown.filter(m => !m.missing.length)
  const short = shown.filter(m => m.missing.length)
  const ideasShown = ideas.filter(m => passes(m, filters))
  const readyAll = all.filter(m => !m.missing.length).length

  const opened = open
    ? [...all, ...ideas].find(m => m.recipe.name === open)
      ?? (() => { const r = RECIPES.find(x => x.name === open); return r ? match(r, items) : undefined })()
    : undefined

  const toggle = (f: Filter, on: boolean) => onFilters(on ? [...filters, f] : filters.filter(x => x !== f))
  const pastNames = [...new Set(history.map(h => h.name))].slice(0, 8)

  return (
    <Modal title={opened ? 'Recipe' : "Basil's Cookbook"} onClose={onClose} size="wide">
      {opened ? (
        <Detail m={opened} onBack={() => setOpen(null)} onCook={() => onCook(opened)} listed={listed} onList={onList} />
      ) : (
        <>
          <div className="cook__head">
            <span className="cook__basil"><Zoom k="cat/sleep-0" scale={1} /></span>
            <p className="cook__say">
              {cookbookLine(readyAll, all.length - readyAll, items.length === 0)}
            </p>
          </div>

          <div className="cook__filters" role="group" aria-label="Filters">
            {FILTERS.map(f => (
              <Check key={f.id} on={filters.includes(f.id)} onChange={v => toggle(f.id, v)} label={f.label} hint={f.hint} />
            ))}
            <Check on={showShort} onChange={setShowShort} label="Show nearly-there" hint="recipes one or two things short" />
          </div>

          <div className="sv-section"><span className="sv-h2">Ready to cook</span><span className="sv-dim">{ready.length}</span></div>
          {ready.length ? (
            <div className="cook__cards">{ready.map(m => <Card key={m.recipe.name} m={m} onOpen={() => setOpen(m.recipe.name)} listed={listed} onList={onList} />)}</div>
          ) : (
            <p className="sv-dim">
              {items.length === 0 ? 'The kitchen is empty. Type what you bought in the bar at the bottom.'
                : filters.length ? 'Nothing ready that fits those boxes. Untick one.'
                : 'Nothing you can make in full yet.'}
            </p>
          )}

          {showShort && short.length > 0 && (
            <>
              <div className="sv-section"><span className="sv-h2">Nearly there</span><span className="sv-dim">a thing or two short</span></div>
              <div className="cook__cards">{short.map(m => <Card key={m.recipe.name} m={m} onOpen={() => setOpen(m.recipe.name)} listed={listed} onList={onList} />)}</div>
            </>
          )}

          {(aiReady || ideas.length > 0) && (
            <>
              <div className="sv-section">
                <span className="sv-h2">Basil's ideas</span>
                {asking && <span className="sv-dim">thinking…</span>}
              </div>
              {why && !asking && <p className="sv-dim">{why}</p>}
              {ideasShown.length > 0 && (
                <div className="cook__cards">{ideasShown.map(m => <Card key={m.recipe.name} m={m} onOpen={() => setOpen(m.recipe.name)} listed={listed} onList={onList} />)}</div>
              )}
              {!asking && !why && ideas.length > 0 && ideasShown.length === 0 && <p className="sv-dim">None of his fit those boxes.</p>}
            </>
          )}

          {pastNames.length > 0 && (
            <>
              <div className="sv-section"><span className="sv-h2">Cooked before</span></div>
              <div className="sv-grid">
                {pastNames.map(n => (
                  <button key={n} className="sv-btn sv-btn--quiet sv-btn--small"
                    onClick={() => RECIPES.some(r => r.name === n) ? setOpen(n) : undefined}>
                    <Zoom k={dishSprite(n)} scale={1} /> {n}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  )
}
