import { addItems } from './inventory'
import { keywordParse } from './keywordParser'
import type { Match } from './recipes'
import { newId, plural, prettyName, type AppState, type ShopItem } from './schema'

/** Things you buy in the plural even when no number was said: beans, not bean. */
const BOUGHT_PLURAL = /^(bean|pea|lentil|chickpea|oat|noodle|crisp|grape|berry|olive|mushroom|carrot|potato|tomato|onion|apple|egg|sausage|tortilla|wrap)$/

export function listLabel(name: string, count?: number, unit?: string): string {
  if (!count && !unit && BOUGHT_PLURAL.test(name)) {
    const p = plural(name)
    return p.charAt(0).toUpperCase() + p.slice(1)
  }
  return prettyName(name, count, unit)
}

export type ListEntry = { name: string; label?: string; count?: number; unit?: string; note?: string }

/** Add to the list. Something already on it is not added twice: typed
 *  additions add up ("eggs" then "2 eggs" is 3), recipe ones just make sure
 *  there is enough. */
export const addToList = (entries: ListEntry[], how: 'sum' | 'ensure' = 'sum') => (s: AppState): AppState => {
  const shopping = [...s.shopping]
  for (const e of entries) {
    const at = shopping.findIndex(x => !x.done && x.name === e.name)
    if (at >= 0) {
      const was = shopping[at]
      const count = how === 'sum'
        ? (was.count ?? 1) + (e.count ?? 1)
        : Math.max(was.count ?? 1, e.count ?? 1)
      shopping[at] = {
        ...was,
        count: count > 1 ? count : undefined,
        label: listLabel(was.name, count > 1 ? count : undefined, was.unit),
        note: was.note && e.note && was.note !== e.note && how === 'ensure' ? `${was.note}, ${e.note}` : was.note ?? e.note,
      }
      continue
    }
    shopping.push({
      id: newId(),
      name: e.name,
      label: e.label ?? listLabel(e.name, e.count, e.unit),
      count: e.count && e.count > 1 ? e.count : undefined,
      unit: e.unit,
      note: e.note,
      addedAt: new Date().toISOString(),
    })
  }
  return { ...s, shopping }
}

/** "two eggs, a bag of rice" -> list entries, using the same reader as the kitchen. */
export function readList(text: string): ListEntry[] {
  return keywordParse(text).map(d => ({ name: d.name ?? d.displayName.toLowerCase(), label: d.displayName, count: d.count, unit: d.unit }))
}

/** What a recipe is short of, ready for the list. "egg|cheese" style either-ors
 *  go on as the first choice. */
export function missingFor(m: Match): ListEntry[] {
  return m.missing.map(ing => {
    const name = ing.item.split('|')[0].trim()
    const short = m.uses.find(u => u.ingredient === ing)?.short
    const count = short ?? ing.count
    return { name, count, note: m.recipe.name }
  })
}

export const isOnList = (s: AppState, name: string) => s.shopping.some(x => !x.done && x.name === name)

/** Bought it: tick it off and put it straight in the kitchen. */
export const tick = (id: string) => (s: AppState): AppState => {
  const it = s.shopping.find(x => x.id === id)
  if (!it || it.done) return s
  const stocked = addItems([{ displayName: it.label, name: it.name, count: it.count, unit: it.unit }])(s)
  return { ...stocked, shopping: s.shopping.map(x => (x.id === id ? { ...x, done: true } : x)) }
}

export const unlist = (id: string) => (s: AppState): AppState =>
  ({ ...s, shopping: s.shopping.filter(x => x.id !== id) })

export const clearTicked = (s: AppState): AppState =>
  ({ ...s, shopping: s.shopping.filter(x => !x.done) })

export const toBuy = (list: ShopItem[]) => list.filter(x => !x.done)
