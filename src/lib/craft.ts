import type { AppState, CookedMeal } from './schema'
import { covers, newId } from './schema'
import { spend } from './inventory'
import { spending, type Match } from './recipes'

/** Picks a dish sprite for a meal name. Cooked dishes come from the icon pack,
 *  which has no names of its own, so this maps by what the meal sounds like. */
const DISH_HINTS: Array<[RegExp, string]> = [
  [/soup|broth|stew|chowder/, 'dish/soup_1'],
  [/dal|chilli|curry|shakshuka/, 'dish/soup_2'],
  [/crumble|pancake|smoothie|yoghurt|porridge|oats|cereal|baked apple/, 'dish/desert_2'],
  [/pasta|spaghetti|mac and|carbonara|noodle|fried rice|bolognese/, 'dish/potatodish_3'],
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
export const cook = (m: Match) => (s: AppState): AppState => {
  const name = m.recipe.name
  const meal: CookedMeal = {
    id: newId(),
    name,
    ingredients: m.uses.filter(u => u.item && !u.ingredient.optional).map(u => u.item!.name),
    steps: m.recipe.steps,
    minutes: m.recipe.minutes,
    cookedAt: new Date().toISOString(),
    dishKey: dishSprite(name),
  }
  const spent = spend(spending(m))(s)
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
      need => !have.some(h => covers(h, need)),
    )
    out.push({ meal, have: meal.ingredients.filter(n => !missing.includes(n)), missing })
  }
  return out
}
