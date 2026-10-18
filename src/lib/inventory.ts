import { resolveSprite } from '../assets/manifest'
import {
  guessCategory, guessExpiry, guessLocation, newId,
  type AppState, type Category, type Item, type Location,
} from './schema'
import { normalise } from '../assets/manifest'

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
  expiresAt?: string
}

/** Fills in everything a draft didn't say. Nothing here is required of the
 *  cook: category, shelf, expiry and sprite are all guessed. */
export function materialise(draft: Draft, taken: Item[]): Item {
  const raw = draft.displayName
  const name = draft.name?.trim() || normalise(raw) || raw.toLowerCase()
  const category = draft.category ?? guessCategory(name, raw)
  const location = draft.location ?? guessLocation(name, category, raw)
  const { key } = resolveSprite(name, category)
  const { shelf, position } = freeSlot(location, taken)
  return {
    id: newId(),
    name,
    displayName: draft.displayName.trim(),
    category,
    location,
    shelf,
    position,
    amount: draft.amount ?? 'full',
    count: draft.count,
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

export const addItems = (drafts: Draft[]) => (s: AppState): AppState => {
  const items = [...s.items]
  const quickAdd = { ...s.quickAdd }
  for (const d of drafts) {
    const item = materialise(d, items)
    items.push(item)
    quickAdd[item.name] = (quickAdd[item.name] ?? 0) + 1
  }
  return { ...s, items, quickAdd }
}

export const removeItem = (id: string) => (s: AppState): AppState =>
  ({ ...s, items: s.items.filter(i => i.id !== id) })

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

export const spendItems = (ids: string[]) => (s: AppState): AppState => ({
  ...s,
  items: s.items
    .map(i => {
      if (!ids.includes(i.id)) return i
      if (i.count && i.count > 1) return { ...i, count: i.count - 1 }
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
