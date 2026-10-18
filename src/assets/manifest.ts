import { hasSprite } from '../lib/sprites'

export type Category =
  | 'dairy' | 'produce' | 'meat' | 'grain' | 'condiment'
  | 'drink' | 'frozen' | 'tinned' | 'baking' | 'snack' | 'other'

/** Last-resort sprite per category. Every category must map to something that
 *  exists, which is what keeps a blank square off the shelf. */
export const CATEGORY_FALLBACK: Record<Category, string> = {
  dairy:     'generic/carton',
  produce:   'generic/produce',
  meat:      'generic/meat',
  grain:     'generic/bag',
  condiment: 'generic/jar',
  drink:     'generic/bottle',
  frozen:    'generic/box',
  tinned:    'generic/can',
  baking:    'generic/bag',
  snack:     'generic/box',
  other:     'generic/box',
}

/** Known foods that have a sprite of their own. The key is the normalised
 *  name; see `normalise`. */
const DIRECT: Record<string, string> = {
  // fruit
  apple: 'food/apple', banana: 'food/banana', grape: 'food/grapes',
  orange: 'food/orange', lime: 'food/lime', lemon: 'food/lemon',
  pear: 'food/pear', cherry: 'food/cherry',
  // vegetables
  corn: 'food/corn', sweetcorn: 'food/corn', garlic: 'food/garlic',
  pumpkin: 'food/pumpkin', squash: 'food/pumpkin', carrot: 'food/carrot',
  radish: 'food/radish', beetroot: 'food/radish', pepper: 'food/pepper',
  'bell pepper': 'food/pepper', capsicum: 'food/pepper',
  mushroom: 'food/mushroom', chilli: 'food/chilli', chili: 'food/chilli',
  aubergine: 'food/aubergine', eggplant: 'food/aubergine',
  pea: 'food/pea', 'green bean': 'food/pea',
  // meat + protein
  chicken: 'food/chicken', 'roast chicken': 'food/roast-chicken',
  turkey: 'food/chicken', bacon: 'food/bacon', steak: 'food/steak',
  beef: 'food/steak', ham: 'food/ham', pork: 'food/ham', egg: 'food/egg',
  // store cupboard
  cheese: 'generic/cheese', cheddar: 'generic/cheese', parmesan: 'generic/cheese',
  herb: 'generic/herb', basil: 'generic/herb', parsley: 'generic/herb',
  coriander: 'generic/herb', mint: 'generic/herb', thyme: 'generic/herb',
  milk: 'generic/carton', cream: 'generic/carton', juice: 'generic/carton',
  yoghurt: 'generic/jar', yogurt: 'generic/jar', jam: 'generic/jar',
  honey: 'generic/jar', 'peanut butter': 'generic/jar', mustard: 'generic/jar',
  mayonnaise: 'generic/jar', pickle: 'generic/jar',
  oil: 'generic/bottle', vinegar: 'generic/bottle', wine: 'generic/bottle',
  beer: 'generic/bottle', water: 'generic/bottle', cordial: 'generic/bottle',
  rice: 'generic/bag', pasta: 'generic/bag', flour: 'generic/bag',
  sugar: 'generic/bag', bread: 'generic/bag', oat: 'generic/bag',
  lentil: 'generic/bag', potato: 'generic/bag', onion: 'food/garlic',
  bean: 'generic/can', tomato: 'generic/can', soup: 'generic/can',
  tuna: 'generic/can', chickpea: 'generic/can',
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
