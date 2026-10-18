import type { AppState, CookedMeal, Item } from './schema'
import { newId } from './schema'
import { spendItems } from './inventory'

export const SLOTS = 9
export type Board = Array<string | null>
export const emptyBoard = (): Board => Array(SLOTS).fill(null)

export const boardItems = (board: Board, items: Item[]): Item[] =>
  board.flatMap(id => (id ? items.filter(i => i.id === id) : []))

/** Picks a dish sprite for a meal name. Cooked dishes come from the icon pack,
 *  which has no names of its own, so this maps by what the meal sounds like. */
const DISH_HINTS: Array<[RegExp, string]> = [
  [/soup|broth|stew|chowder/, 'dish/soup_1'],
  [/pie|pastry|tart|bake|bread|toast/, 'dish/pastry_1'],
  [/cake|pudding|dessert|sweet|ice/, 'dish/desert_1'],
  [/fish|salmon|tuna|prawn/, 'dish/fish_1'],
  [/steak|chicken|beef|pork|lamb|meat|roast|burger/, 'dish/meat_1'],
  [/potato|chips|mash|fries|hash/, 'dish/potatodish_1'],
  [/salad|veg|greens|slaw/, 'dish/vegetable_1'],
  [/nut|granola|muesli/, 'dish/nuts_1'],
  [/fruit|apple|pear|berry/, 'dish/fruit_1'],
]

export function dishSprite(name: string): string {
  const lower = name.toLowerCase()
  for (const [re, key] of DISH_HINTS) if (re.test(lower)) return key
  return 'dish/potatodish_2'
}

/** Cooking is the mechanic that keeps the fridge honest: it spends what it
 *  used, without anyone having to tidy up afterwards. */
export const cook = (
  name: string,
  used: Item[],
  steps: string[],
  minutes: number,
) => (s: AppState): AppState => {
  const meal: CookedMeal = {
    id: newId(),
    name,
    ingredients: used.map(i => i.name),
    steps,
    minutes,
    cookedAt: new Date().toISOString(),
    dishKey: dishSprite(name),
  }
  const spent = spendItems(used.map(i => i.id))(s)
  return { ...spent, history: [meal, ...s.history].slice(0, 200) }
}

/** What the recipe book knows: everything cooked before, most recent first,
 *  with whether it could be made again right now. */
export type BookEntry = {
  meal: CookedMeal
  have: string[]
  missing: string[]
}

export function book(state: AppState): BookEntry[] {
  const have = state.items.map(i => i.name)
  const seen = new Set<string>()
  const out: BookEntry[] = []
  for (const meal of state.history) {
    if (seen.has(meal.name.toLowerCase())) continue
    seen.add(meal.name.toLowerCase())
    const missing = meal.ingredients.filter(
      need => !have.some(h => h.includes(need) || need.includes(h)),
    )
    out.push({ meal, have: meal.ingredients.filter(n => !missing.includes(n)), missing })
  }
  return out
}
