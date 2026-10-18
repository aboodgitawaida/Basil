/** The data model. Everything persisted goes through here. */

export type Amount = 'full' | 'half' | 'low' | 'out'
export type Location = 'fridge' | 'freezer' | 'cupboard'

export type Category =
  | 'dairy' | 'produce' | 'meat' | 'grain' | 'condiment'
  | 'drink' | 'frozen' | 'tinned' | 'baking' | 'snack' | 'other'

export const CATEGORIES: Category[] = [
  'dairy', 'produce', 'meat', 'grain', 'condiment',
  'drink', 'frozen', 'tinned', 'baking', 'snack', 'other',
]

export type Item = {
  id: string
  /** normalised, used for matching: "whole milk" -> "milk" */
  name: string
  /** exactly what was typed */
  displayName: string
  category: Category
  location: Location
  shelf: number
  position: number
  amount: Amount
  count?: number
  addedAt: string
  /** guessed from the item type, never required */
  expiresAt?: string
  spriteKey: string
}

export type CookedMeal = {
  id: string
  name: string
  ingredients: string[]
  steps: string[]
  minutes: number
  cookedAt: string
  dishKey: string
}

export type Settings = {
  dietary: string[]
  sound: boolean
  /** null follows the real clock; a number 0-1 overrides the dimmer */
  lightOverride: number | null
  lat?: number
  lon?: number
}

export type AppState = {
  version: number
  items: Item[]
  history: CookedMeal[]
  settings: Settings
  /** name -> how many times it has been added, for quick-add buttons */
  quickAdd: Record<string, number>
}

export const SCHEMA_VERSION = 1

export const EMPTY_STATE: AppState = {
  version: SCHEMA_VERSION,
  items: [],
  history: [],
  settings: { dietary: [], sound: false, lightOverride: null },
  quickAdd: {},
}

/** Rough shelf life in days, by category then by name. Guesses only — an item
 *  without an expiry is fine, and the app never blocks on one. */
const SHELF_LIFE: Record<string, number> = {
  milk: 7, cream: 5, yoghurt: 14, yogurt: 14, cheese: 21, 'cheese wedge': 21,
  egg: 21, butter: 30,
  bread: 4, salad: 3, lettuce: 5, spinach: 4, berry: 4, banana: 5,
  apple: 21, pear: 10, broccoli: 7, pumpkin: 60, watermelon: 7,
  chicken: 2, drumstick: 2, steak: 3, beef: 3, mince: 2, fish: 2,
  bacon: 7, ham: 5, turkey: 3,
}

const CATEGORY_LIFE: Record<Category, number> = {
  dairy: 7, produce: 7, meat: 3, grain: 60, condiment: 180,
  drink: 90, frozen: 120, tinned: 365, baking: 180, snack: 60, other: 30,
}

export function guessExpiry(name: string, category: Category, from = new Date()): string {
  const key = Object.keys(SHELF_LIFE).find(k => name.includes(k))
  const days = key ? SHELF_LIFE[key] : CATEGORY_LIFE[category]
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

/** Where a thing goes if nobody says otherwise. */
export function guessLocation(name: string, category: Category, raw = ''): Location {
  const hay = `${raw.toLowerCase()} ${name}`
  if (/\bfrozen\b|ice cream|\bpeas?\b/.test(hay)) return 'freezer'
  if (category === 'frozen') return 'freezer'
  if (category === 'dairy' || category === 'meat' || category === 'produce') return 'fridge'
  if (category === 'drink') return /wine|beer|juice|milk/.test(hay) ? 'fridge' : 'cupboard'
  if (category === 'condiment') return /ketchup|mayo|mustard|pickle|jam/.test(hay) ? 'fridge' : 'cupboard'
  return 'cupboard'
}

const CATEGORY_WORDS: Array<[RegExp, Category]> = [
  [/milk|cream|cheese|cheddar|brie|feta|gouda|parmesan|mozzarella|yog|yoghurt|butter|egg/, 'dairy'],
  [/chicken|beef|steak|pork|lamb|bacon|ham|mince|fish|turkey|drumstick|sausage/, 'meat'],
  [/apple|pear|banana|orange|berry|lettuce|salad|broccoli|carrot|onion|potato|tomato|pumpkin|melon|veg|fruit/, 'produce'],
  [/bread|pasta|rice|flour|oat|cereal|noodle|couscous|quinoa|lentil/, 'grain'],
  [/ketchup|mustard|sauce|mayo|vinegar|oil|jam|honey|pickle|marmite|paste/, 'condiment'],
  [/juice|water|wine|beer|cola|soda|squash|cordial|lemonade|cider/, 'drink'],
  [/\bfrozen\b|ice cream|\bpeas?\b|\bchips\b/, 'frozen'],
  [/tin|can|soup|bean|chickpea|tuna/, 'tinned'],
  [/sugar|baking|yeast|vanilla/, 'baking'],
  [/crisp|biscuit|chocolate|cracker|snack|nuts/, 'snack'],
]

/** `raw` is what was typed, before normalisation. Words like "frozen" and
 *  plural endings are stripped to make the name matchable, but they are
 *  exactly what tells us the category, so both are checked. */
export function guessCategory(name: string, raw = ''): Category {
  const hay = `${raw.toLowerCase()} ${name}`
  for (const [re, cat] of CATEGORY_WORDS) if (re.test(hay)) return cat
  return 'other'
}

/** Items within this many days of their guessed expiry get a quiet visual cue. */
export const SOON_DAYS = 3

export function daysLeft(item: Item, now = new Date()): number | null {
  if (!item.expiresAt) return null
  return Math.ceil((new Date(item.expiresAt).getTime() - now.getTime()) / 86_400_000)
}

export function isGoingOff(item: Item, now = new Date()): boolean {
  const d = daysLeft(item, now)
  return d !== null && d <= SOON_DAYS
}

export const newId = (): string =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
