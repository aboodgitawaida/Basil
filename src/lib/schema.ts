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
  /** how many: 2 eggs, 2 bags of milk. Absent means one. */
  count?: number
  /** what the count is counted in: "bag", "bottle". Absent for loose things like eggs */
  unit?: string
  /** a size that isn't a count: "2 litres", "500g" */
  measure?: string
  /** the general thing it is: cheddar is a cheese, a sirloin is beef */
  kind?: string
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
  /** sound effects */
  sound: boolean
  music: boolean
  /** the room lamp: null switches itself on after dark, true/false is the
   *  switch on the wall. It never changes the time of day outside. */
  lamp: boolean | null
  /** ask the browser for a location so the window shows the real weather */
  weather: boolean
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

export const SCHEMA_VERSION = 2

export const EMPTY_STATE: AppState = {
  version: SCHEMA_VERSION,
  items: [],
  history: [],
  settings: { dietary: [], sound: false, music: false, lamp: null, weather: true },
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
  // before produce, so "orange juice" is a drink; whole words, so "chocolate"
  // is not cola and "watermelon" is not water
  [/\b(juice|water|wine|beer|cola|soda|squash|cordial|lemonade|cider)s?\b/, 'drink'],
  [/chicken|beef|steak|pork|lamb|bacon|ham|mince|fish|salmon|cod|prawn|shrimp|turkey|drumstick|sausage|chorizo/, 'meat'],
  [/apple|pear|banana|orange|lemon|lime|berry|grape|peach|plum|mango|avocado|lettuce|salad|spinach|rocket|kale|cabbage|broccoli|cauliflower|carrot|onion|garlic|potato|tomato|pepper|courgette|cucumber|mushroom|leek|celery|pumpkin|melon|veg|fruit|herb|basil|coriander|parsley/, 'produce'],
  [/bread|loaf|sourdough|baguette|bagel|brioche|tortilla|wrap|pitta|pasta|spaghetti|penne|rice|flour|oat|cereal|granola|noodle|couscous|quinoa|lentil/, 'grain'],
  [/ketchup|mustard|sauce|mayo|vinegar|oil|jam|honey|pickle|marmite|paste/, 'condiment'],
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

/** Specific things that count as a general ingredient: a recipe that wants
 *  cheese is happy with cheddar. */
const KINDS: Record<string, string[]> = {
  cheese: ['cheddar', 'brie', 'feta', 'gouda', 'parmesan', 'mozzarella', 'halloumi', 'stilton', 'emmental', 'gruyere', 'camembert', 'ricotta'],
  bread: ['loaf', 'baguette', 'sourdough', 'bagel', 'bap', 'roll', 'brioche', 'ciabatta', 'pitta', 'pita', 'wrap', 'tortilla'],
  drumstick: ['chicken'],
  chicken: ['drumstick', 'thigh', 'breast', 'wing'],
  steak: ['beef', 'sirloin', 'ribeye'],
  beef: ['steak', 'sirloin', 'ribeye', 'mince'],
  pasta: ['spaghetti', 'penne', 'fusilli', 'macaroni', 'linguine', 'tagliatelle', 'lasagne', 'rigatoni'],
  rice: ['basmati', 'jasmine', 'arborio'],
  apple: ['bramley', 'granny smith', 'gala', 'braeburn', 'pink lady'],
  fish: ['salmon', 'cod', 'haddock', 'tuna', 'mackerel', 'trout', 'prawn', 'shrimp'],
  onion: ['shallot', 'red onion', 'spring onion', 'scallion'],
  potato: ['maris piper', 'king edward', 'new potato'],
  berry: ['strawberry', 'raspberry', 'blueberry', 'blackberry'],
  lettuce: ['romaine', 'iceberg', 'little gem', 'rocket', 'spinach'],
  yoghurt: ['yogurt', 'greek yoghurt', 'greek yogurt'],
  oat: ['porridge', 'oatmeal', 'rolled oat'],
  sausage: ['chorizo', 'bratwurst', 'frankfurter', 'hot dog'],
  bacon: ['pancetta', 'lardon'],
  ham: ['prosciutto', 'gammon'],
  tomato: ['cherry tomato', 'plum tomato', 'passata'],
  milk: ['whole milk', 'semi skimmed'],
}

/** The general thing a specific one is: cheddar -> cheese. Undefined when
 *  the name already is the general thing, or nobody knows. */
export function kindOf(name: string): string | undefined {
  for (const [kind, specific] of Object.entries(KINDS)) {
    // these two exist for recipe matching, not as names for things
    if (kind === 'drumstick' || kind === 'steak') continue
    if (name === kind || name.includes(kind)) continue
    if (specific.some(k => name.includes(k))) return kind
  }
  return undefined
}

export const CATEGORY_LABEL: Record<Category, string> = {
  dairy: 'dairy & eggs', produce: 'fruit & veg', meat: 'meat & fish',
  grain: 'bread & grains', condiment: 'sauces', drink: 'drinks',
  frozen: 'frozen', tinned: 'tins & jars', baking: 'baking',
  snack: 'snacks', other: 'odds & ends',
}

/** Things counted one by one, which read naturally in the plural: "Eggs". */
export const COUNTABLE = /\b(egg|apple|banana|onion|potato|lemon|lime|orange|pear|peach|plum|avocado|tomato|pepper|carrot|courgette|zucchini|cucumber|yoghurt|yogurt|sausage|burger|drumstick|thigh|breast|bagel|roll|croissant|muffin|tortilla|wrap|pitta|steak|chop|fillet|kiwi|mango|clove|leek)\b/

export function plural(word: string): string {
  if (/(s|sh|ch|x|z)$/.test(word)) return `${word}es`
  if (/[^aeiou]y$/.test(word)) return `${word.slice(0, -1)}ies`
  if (/(potato|tomato|mango)$/.test(word)) return `${word}es`
  return `${word}s`
}

const cap = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase())

/** A clean label for a thing on the shelf: "two eggs" -> "Eggs",
 *  "half a block of mature cheddar" -> "Cheddar". The quantity lives
 *  separately, in count/unit/measure. */
export function prettyName(name: string, count?: number, unit?: string): string {
  const n = name.trim()
  if (!n) return ''
  const many = (count ?? 1) > 1 && !unit && COUNTABLE.test(n)
  if (!many) return cap(n)
  const words = n.split(' ')
  words[words.length - 1] = plural(words[words.length - 1])
  return cap(words.join(' '))
}

/** "×6", "2 bags", "1 bottle", "2 litres", or "" for a single loose thing. */
export function quantityText(i: Pick<Item, 'count' | 'unit' | 'measure'>): string {
  const n = i.count ?? 1
  if (i.unit) return `${n} ${n === 1 ? i.unit : plural(i.unit)}${i.measure ? ` · ${i.measure}` : ''}`
  if (i.measure) return n > 1 ? `${n} × ${i.measure}` : i.measure
  return n > 1 ? `×${n}` : ''
}

/** Whether something in the kitchen covers what a recipe needs. Loose on
 *  purpose: "cheddar cheese" covers "cheese", and so does plain "cheddar". */
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** `words` appears in `hay` as whole words, allowing a plural: "pea" is in
 *  "frozen peas" but not in "pear" or "peanut butter". */
const wordIn = (hay: string, words: string) => new RegExp(`\\b${esc(words)}(e?s)?\\b`).test(hay)

/** Things whose name contains an ingredient they are not. */
const NOT_REALLY: Array<[RegExp, string]> = [
  [/peanut butter|nut butter|almond butter/, 'butter'],
  [/coconut milk/, 'milk'],
]

/** Needs that only their whole name satisfies: plain butter is not peanut butter. */
const WHOLE_ONLY = new Set(['peanut butter', 'soy sauce', 'hot sauce', 'coconut milk', 'green bean', 'spring onion', 'sweet potato'])

export function covers(have: string, need: string): boolean {
  if (!have || !need) return false
  if (WHOLE_ONLY.has(need)) return wordIn(have, need)
  if (NOT_REALLY.some(([re, n]) => n === need && re.test(have))) return false
  if (wordIn(have, need) || wordIn(need, have)) return true
  return (KINDS[need] ?? []).some(k => wordIn(have, k))
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
