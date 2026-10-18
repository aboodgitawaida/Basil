import { hasSprite } from '../lib/sprites'

export type Category =
  | 'dairy' | 'produce' | 'meat' | 'grain' | 'condiment'
  | 'drink' | 'frozen' | 'tinned' | 'baking' | 'snack' | 'other'

/** Last-resort sprite per category. Every category must map to something that
 *  exists, which is what keeps a blank square off the shelf. */
export const CATEGORY_FALLBACK: Record<Category, string> = {
  dairy:     'food/milk',
  produce:   'food/apple',
  meat:      'food/steak',
  grain:     'generic/bag',
  condiment: 'food/ketchup',
  drink:     'food/water',
  frozen:    'generic/box',
  tinned:    'food/can-1',
  baking:    'generic/bag',
  snack:     'generic/box',
  other:     'generic/box',
}

/** Known foods that have a sprite of their own. The key is the normalised
 *  name; see `normalise`. */
const DIRECT: Record<string, string> = {
  // dairy and cartons
  milk: 'food/milk', cream: 'food/milk', buttermilk: 'food/milk',
  'oat milk': 'food/tetrapak', 'soy milk': 'food/tetrapak', custard: 'food/tetrapak',
  'orange juice': 'food/juice-carton', juice: 'food/juice-carton',
  smoothie: 'food/juice', yoghurt: 'generic/jar', yogurt: 'generic/jar',
  cheese: 'food/cheese', cheddar: 'food/cheese', parmesan: 'food/cheese-wedge',
  brie: 'food/cheese-wedge', feta: 'food/cheese-wedge', gouda: 'food/cheese',
  egg: 'food/egg', butter: 'food/cheese-wedge',
  // condiments and bottles
  ketchup: 'food/ketchup', mustard: 'food/mustard',
  'hot sauce': 'food/hot-sauce', sriracha: 'food/hot-sauce', tabasco: 'food/hot-sauce',
  oil: 'food/oil', 'olive oil': 'food/oil', vinegar: 'food/oil',
  wine: 'food/wine', beer: 'food/can-2', cider: 'food/can-3',
  water: 'food/water', squash: 'food/juice', cordial: 'food/juice',
  jam: 'generic/jar', honey: 'generic/jar', 'peanut butter': 'generic/jar',
  mayonnaise: 'generic/jar', pickle: 'generic/jar', marmite: 'generic/jar',
  // tins and cans
  bean: 'food/can-1', tomato: 'food/can-1', soup: 'food/can-4',
  tuna: 'food/can-1', chickpea: 'food/can-1', coke: 'food/can-2',
  lemonade: 'food/can-3', soda: 'food/can-2',
  // produce
  apple: 'food/apple', pear: 'food/pear', broccoli: 'food/broccoli',
  pumpkin: 'food/pumpkin', squash_veg: 'food/pumpkin', watermelon: 'food/watermelon',
  melon: 'food/watermelon',
  // meat
  steak: 'food/steak', beef: 'food/steak', mince: 'food/steak', lamb: 'food/steak',
  chicken: 'food/drumstick', drumstick: 'food/drumstick', thigh: 'food/drumstick',
  turkey: 'food/turkey-leg', ham: 'food/steak', pork: 'food/steak',
  bacon: 'food/steak', sausage: 'food/drumstick',
  // dry goods
  bread: 'food/paper-bag', flour: 'food/paper-bag', sugar: 'food/paper-bag',
  rice: 'generic/bag', pasta: 'generic/bag', oat: 'generic/bag',
  lentil: 'generic/bag', potato: 'generic/bag', onion: 'generic/bag',
  cereal: 'generic/box', biscuit: 'generic/box', cracker: 'generic/box',
}

/** Words that describe an item without changing what it is. Stripped before
 *  matching so "half a block of mature cheddar" still finds the cheese. */
const NOISE = new Set([
  'a', 'an', 'the', 'of', 'some', 'bag', 'bags', 'block', 'blocks', 'bottle',
  'bottles', 'box', 'boxes', 'can', 'cans', 'tin', 'tins', 'jar', 'jars',
  'carton', 'cartons', 'packet', 'packets', 'pack', 'packs', 'punnet', 'half',
  'whole', 'semi', 'skimmed', 'fresh', 'frozen', 'dried', 'tinned', 'canned',
  'organic', 'free', 'range', 'mature', 'extra', 'large', 'small', 'big',
  'little', 'red', 'green', 'white', 'brown', 'plain', 'light', 'low', 'fat',
  // counts belong in `count`, not in the name
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'dozen', 'couple', 'few', 'loaf', 'loaves', 'bunch', 'head',
])

const singular = (w: string): string =>
  w.endsWith('ies') && w.length > 4 ? `${w.slice(0, -3)}y`
  : w.endsWith('es') && /(ch|sh|ss|x|z)es$/.test(w) ? w.slice(0, -2)
  : w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1)
  : w

/** "2 Bags of Mature Cheddar" -> "cheddar" */
export function normalise(input: string): string {
  const words = input
    .toLowerCase()
    .replace(/[0-9]+/g, ' ')
    .replace(/[^a-z\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter(Boolean)
    .map(singular)
    .filter(w => !NOISE.has(w))
  return words.join(' ').trim()
}

export type Resolved = { key: string; exact: boolean }

/**
 * Finds the best sprite for a typed name. Falls back through the category
 * sprite and finally a generic box, so this never returns a key that is
 * missing from the sprite index.
 */
export function resolveSprite(name: string, category: Category = 'other'): Resolved {
  const n = normalise(name)

  if (n && DIRECT[n]) return { key: DIRECT[n], exact: true }

  // any single word of the name, longest first ("chicken stock" -> chicken)
  const words = n.split(' ').filter(Boolean).sort((a, b) => b.length - a.length)
  for (const w of words) {
    if (DIRECT[w]) return { key: DIRECT[w], exact: true }
  }

  // a known food contained in the name ("bramley apple sauce" -> apple)
  for (const [known, key] of Object.entries(DIRECT)) {
    if (known.length >= 4 && n.includes(known)) return { key, exact: false }
  }

  const fallback = CATEGORY_FALLBACK[category] ?? CATEGORY_FALLBACK.other
  return { key: hasSprite(fallback) ? fallback : 'generic/box', exact: false }
}
