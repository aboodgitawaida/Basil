import type { AppState, CookedMeal } from './schema'
import { covers, newId } from './schema'
import { spend } from './inventory'
import { spending, type Match } from './recipes'

/** Picks a dish sprite for a meal name. The icon pack has no names of its
 *  own, so this maps by what the meal sounds like. Order matters: the first
 *  match wins, so "tuna pasta" is pasta and "chicken salad" is a salad.
 *  dish/eggs, pasta, rice and salad are drawn in tools/drawn.py. */
const DISH_HINTS: Array<[RegExp, string]> = [
  [/jacket potato/, 'dish/potatodish_4'],
  [/sausage|hot dog/, 'dish/fish_2'],
  [/pasta|spaghetti|bolognese|carbonara|mac and|noodle|lasagne|macaroni/, 'dish/pasta'],
  [/salad|slaw/, 'dish/salad'],
  [/salmon|fish|prawn/, 'dish/fish_1'],
  [/tuna/, 'dish/fish_3'],
  [/bacon/, 'dish/meat_1'],
  [/tomato soup|chilli|shakshuka|goulash/, 'dish/soup_2'],
  [/dal|curry|korma|chowder/, 'dish/soup_3'],
  [/soup|broth|stew|casserole/, 'dish/soup_1'],
  [/rice|risotto|paella|biryani/, 'dish/rice'],
  [/egg|omelette|frittata/, 'dish/eggs'],
  [/wrap|quesadilla|burrito|taco|pie|pasty/, 'dish/pastry_3'],
  [/toast|sandwich|bread|bagel|burger/, 'dish/pastry_1'],
  [/pancake|crepe|waffle/, 'dish/potatodish_1'],
  [/crumble|cookie|biscuit|scone|muffin|cake/, 'dish/pastry_2'],
  [/smoothie|banana/, 'dish/fruit_2'],
  [/porridge|oats|yoghurt|yogurt|cereal|granola|muesli|pudding/, 'dish/desert_3'],
  [/apple|pear|fruit|berry/, 'dish/fruit_4'],
  [/steak|beef|lamb|pork/, 'dish/meat_3'],
  [/chips|fries|wedges|mash|potato|hash/, 'dish/potatodish_2'],
  [/chicken|turkey|roast|meat/, 'dish/meat_2'],
  [/broccoli|cauliflower|greens/, 'dish/vegetable_1'],
  [/veg|stir-fry|stir fry|carrot/, 'dish/vegetable_2'],
  [/nut/, 'dish/nuts_1'],
]

export function dishSprite(name: string): string {
  const lower = name.toLowerCase()
  for (const [re, key] of DISH_HINTS) if (re.test(lower)) return key
  return 'dish/soup_1'
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
