import { resolveSprite } from '../assets/manifest'
import {
  guessCategory, guessExpiry, guessLocation, kindOf, newId, prettyName,
  type AppState, type Category, type Item, type Location,
} from './schema'
import { normalise } from '../assets/manifest'
import { keywordParse } from './keywordParser'

/** How many item slots each shelf holds, per location. Keeping placement to
 *  whole slots is what stops items overlapping as the fridge fills up. */
export const SHELVES: Record<Location, number> = { fridge: 3, freezer: 1, cupboard: 3 }
/** Must match the bay geometry in room.ts, or items hang off the shelf. */
export const SLOTS_PER_SHELF = 3

export type Draft = {
  displayName: string
  name?: string
  category?: Category
  location?: Location
  amount?: Item['amount']
  count?: number
  unit?: string
  measure?: string
  kind?: string
  expiresAt?: string
}

/** A label that still has the quantity in it ("two eggs") gets cleaned up:
 *  the number belongs in count, not in the name on the shelf. */
const HAS_QUANTITY = /\d|\b(one|two|three|four|five|six|seven|eight|nine|ten|dozen|couple|half|bags?|bottles?|blocks?|cartons?|tins?|cans?|jars?|packs?|packets?|boxes|box|loaf|loaves|of)\b/i

/** Fills in everything a draft didn't say. Nothing here is required of the
 *  cook: category, shelf, expiry and sprite are all guessed. */
export function materialise(input: Draft, taken: Item[]): Item {
  const raw = input.displayName.trim()
  // a bare typed phrase: let the keyword reader fill in count, unit and the rest
  const read = input.name ? undefined : keywordParse(raw)[0]
  const draft: Draft = { ...read, ...stripUndefined(input), displayName: raw }
  const name = draft.name?.trim() || normalise(raw) || raw.toLowerCase()
  const count = draft.count && draft.count > 0 ? draft.count : undefined
  const category = draft.category ?? guessCategory(name, raw)
  const location = draft.location ?? guessLocation(name, category, raw)
  const { key } = resolveSprite(name, category)
  const { shelf, position } = freeSlot(location, taken)
  const label = read?.displayName ?? raw
  return {
    id: newId(),
    name,
    displayName: !label || HAS_QUANTITY.test(label) ? prettyName(name, count, draft.unit) : label,
    category,
    location,
    shelf,
    position,
    amount: draft.amount ?? 'full',
    count,
    unit: draft.unit || undefined,
    measure: draft.measure || undefined,
    kind: draft.kind || kindOf(name),
    addedAt: new Date().toISOString(),
    expiresAt: draft.expiresAt ?? guessExpiry(name, category),
    spriteKey: key,
  }
}

/** First empty slot, scanning shelves top to bottom. Falls back to stacking on
 *  the last shelf rather than refusing to add. */
export function freeSlot(location: Location, items: Item[]): { shelf: number; position: number } {
  const here = items.filter(i => i.location === location)
  for (let shelf = 0; shelf < SHELVES[location]; shelf++) {
    for (let position = 0; position < SLOTS_PER_SHELF; position++) {
      if (!here.some(i => i.shelf === shelf && i.position === position)) return { shelf, position }
    }
  }
  return { shelf: SHELVES[location] - 1, position: SLOTS_PER_SHELF - 1 }
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '')) as Partial<T>
}

/** Buying more of something you already have tops it up rather than putting
 *  a second one on the shelf: six eggs and two more is eight eggs. */
function sameThing(a: Item, b: Item): boolean {
  return a.name === b.name && a.location === b.location && (a.unit ?? '') === (b.unit ?? '') && (a.measure ?? '') === (b.measure ?? '')
}

export const addItems = (drafts: Draft[]) => (s: AppState): AppState => {
  const items = [...s.items]
  const quickAdd = { ...s.quickAdd }
  for (const d of drafts) {
    const item = materialise(d, items)
    quickAdd[item.name] = (quickAdd[item.name] ?? 0) + 1
    const at = items.findIndex(i => sameThing(i, item))
    if (at === -1) { items.push(item); continue }
    const was = items[at]
    const count = (was.count ?? 1) + (item.count ?? 1)
    items[at] = {
      ...was,
      count,
      displayName: relabel(was, count),
      amount: 'full',
      // the old ones are still in there, so the sooner date still stands
      expiresAt: [was.expiresAt, item.expiresAt].filter(Boolean).sort()[0],
    }
  }
  return { ...s, items, quickAdd }
}

/** The label for a new count: "Egg" becomes "Eggs" at two. A label someone
 *  chose themselves ("Oat Milk") is left as it is. */
function relabel(i: Item, count: number): string {
  const auto = i.displayName.toLowerCase() === prettyName(i.name, i.count, i.unit).toLowerCase()
  return auto ? prettyName(i.name, count, i.unit) : i.displayName
}

/** Set how many there are. None left means it is gone. */
export const setCount = (id: string, count: number) => (s: AppState): AppState => {
  if (count <= 0) return allGone(id)(s)
  return {
    ...s,
    items: s.items.map(i => (i.id === id
      ? { ...i, count, displayName: relabel(i, count) }
      : i)),
  }
}

export const removeItem = (id: string) => (s: AppState): AppState =>
  ({ ...s, items: s.items.filter(i => i.id !== id) })

/** Things that have run out go on the shopping list, once. */
function remember(s: AppState, gone: Item[]): AppState {
  const shopping = [...(s.shopping ?? [])]
  for (const i of gone) {
    if (shopping.some(x => !x.done && x.name === i.name)) continue
    shopping.push({ id: newId(), name: i.name, label: prettyName(i.name), unit: i.unit, note: 'ran out', addedAt: new Date().toISOString() })
  }
  return { ...s, shopping }
}

/** All gone: off the shelf and onto the shopping list. */
export const allGone = (id: string) => (s: AppState): AppState => {
  const gone = s.items.filter(i => i.id === id)
  return remember(removeItem(id)(s), gone)
}

export const setAmount = (id: string, amount: Item['amount']) => (s: AppState): AppState =>
  ({ ...s, items: s.items.map(i => (i.id === id ? { ...i, amount } : i)) })

export const moveItem = (id: string, location: Location) => (s: AppState): AppState => {
  const item = s.items.find(i => i.id === id)
  if (!item || item.location === location) return s
  const slot = freeSlot(location, s.items.filter(i => i.id !== id))
  return {
    ...s,
    items: s.items.map(i => (i.id === id ? { ...i, location, ...slot } : i)),
  }
}

/** Cooking spends ingredients: a full thing goes half, a half goes low, a low
 *  one runs out and leaves. This is what keeps the fridge honest without the
 *  cook ever editing it. */
const NEXT_DOWN: Record<Item['amount'], Item['amount']> = {
  full: 'half', half: 'low', low: 'out', out: 'out',
}

export const spendItems = (ids: string[]) => spend(ids.map(id => ({ id, count: 1 })))

/** Spend a number of each: a recipe that wants two eggs takes two. Loose
 *  things (milk, cheese) step down one amount however many were asked for. */
export const spend = (uses: Array<{ id: string; count: number }>) => (s: AppState): AppState => {
  const after = spendOnly(uses)(s)
  const gone = s.items.filter(i => !after.items.some(a => a.id === i.id))
  return remember(after, gone)
}

const spendOnly = (uses: Array<{ id: string; count: number }>) => (s: AppState): AppState => ({
  ...s,
  items: s.items
    .map(i => {
      const use = uses.find(u => u.id === i.id)
      if (!use) return i
      if (i.count && i.count > 1) {
        const left = i.count - Math.max(1, use.count)
        if (left <= 0) return { ...i, count: undefined, amount: 'out' as const }
        return { ...i, count: left, displayName: relabel(i, left) }
      }
      return { ...i, amount: NEXT_DOWN[i.amount] }
    })
    .filter(i => i.amount !== 'out'),
})

/** The handful of things bought most often, for the quick-add row. */
export function topQuickAdd(s: AppState, n = 5): string[] {
  return Object.entries(s.quickAdd)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name]) => name)
}
