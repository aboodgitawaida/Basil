/** JSON schemas sent to the provider, and strict validators for what comes
 *  back. The validators are the contract: anything that doesn't match is
 *  rejected outright so the caller can fall back, rather than half-trusted. */

export const CATEGORIES = [
  'dairy', 'produce', 'meat', 'grain', 'condiment',
  'drink', 'frozen', 'tinned', 'baking', 'snack', 'other',
] as const
export const LOCATIONS = ['fridge', 'freezer', 'cupboard'] as const
export const AMOUNTS = ['full', 'half', 'low', 'out'] as const

/** The fields a parser can actually know. id, shelf, position and spriteKey
 *  are ours to assign — a model guessing them would only fight the layout. */
export const PARSE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          displayName: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string', enum: [...CATEGORIES] },
          location: { type: 'string', enum: [...LOCATIONS] },
          amount: { type: 'string', enum: [...AMOUNTS] },
          count: { type: 'integer' },
          unit: { type: 'string' },
          measure: { type: 'string' },
          kind: { type: 'string' },
          shelfLifeDays: { type: 'integer' },
        },
        required: ['displayName', 'name', 'category', 'location', 'amount'],
      },
    },
  },
  required: ['items'],
} as const

export const SUGGEST_SCHEMA = {
  type: 'object',
  properties: {
    meals: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          serves: { type: 'integer' },
          minutes: { type: 'integer' },
          kcal: { type: 'integer' },
          protein: { type: 'integer' },
          vegetarian: { type: 'boolean' },
          vegan: { type: 'boolean' },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                item: { type: 'string' },
                qty: { type: 'string' },
                optional: { type: 'boolean' },
              },
              required: ['item', 'qty'],
            },
          },
          steps: { type: 'array', items: { type: 'string' } },
          note: { type: 'string' },
        },
        required: ['name', 'serves', 'minutes', 'kcal', 'protein', 'ingredients', 'steps'],
      },
    },
    line: { type: 'string' },
  },
  required: ['meals'],
} as const

const str = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const inSet = <T extends readonly string[]>(set: T, v: unknown): v is T[number] =>
  typeof v === 'string' && (set as readonly string[]).includes(v)

export type ParsedDraft = {
  displayName: string
  name: string
  category: typeof CATEGORIES[number]
  location: typeof LOCATIONS[number]
  amount: typeof AMOUNTS[number]
  count?: number
  unit?: string
  measure?: string
  kind?: string
  shelfLifeDays?: number
}

const optStr = (v: unknown, max: number): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim().toLowerCase().slice(0, max) : undefined

/** Returns null — not a partial result — when anything is off. A half-parsed
 *  list is worse than falling back to the keyword matcher. */
export function validateParse(raw: unknown): { items: ParsedDraft[] } | null {
  if (!raw || typeof raw !== 'object') return null
  const items = (raw as any).items
  if (!Array.isArray(items) || items.length === 0 || items.length > 40) return null
  const out: ParsedDraft[] = []
  for (const it of items) {
    if (!it || typeof it !== 'object') return null
    if (!str(it.displayName) || !str(it.name)) return null
    if (!inSet(CATEGORIES, it.category)) return null
    if (!inSet(LOCATIONS, it.location)) return null
    if (!inSet(AMOUNTS, it.amount)) return null
    if (it.count !== undefined && (!Number.isInteger(it.count) || it.count < 1 || it.count > 999)) return null
    if (it.shelfLifeDays !== undefined && (!Number.isInteger(it.shelfLifeDays) || it.shelfLifeDays < 0 || it.shelfLifeDays > 3650)) return null
    out.push({
      displayName: it.displayName.trim().slice(0, 80),
      name: it.name.trim().toLowerCase().slice(0, 60),
      category: it.category,
      location: it.location,
      amount: it.amount,
      count: it.count,
      unit: optStr(it.unit, 20),
      measure: optStr(it.measure, 20),
      kind: optStr(it.kind, 30),
      shelfLifeDays: it.shelfLifeDays,
    })
  }
  return { items: out }
}

export type SuggestedMeal = {
  name: string
  serves: number
  minutes: number
  kcal: number
  protein: number
  vegetarian: boolean
  vegan: boolean
  ingredients: Array<{ item: string; qty: string; optional?: boolean }>
  steps: string[]
  note?: string
}

const strList = (v: unknown, max = 24): string[] | null => {
  if (v === undefined) return []
  if (!Array.isArray(v) || v.length > max) return null
  const out: string[] = []
  for (const s of v) {
    if (!str(s)) return null
    out.push(s.trim().slice(0, 240))
  }
  return out
}

const int = (v: unknown, min: number, max: number): v is number =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max

export function validateSuggest(raw: unknown): { meals: SuggestedMeal[]; line?: string } | null {
  if (!raw || typeof raw !== 'object') return null
  const meals = (raw as any).meals
  if (!Array.isArray(meals) || meals.length > 10) return null
  const out: SuggestedMeal[] = []
  for (const m of meals) {
    if (!m || typeof m !== 'object' || !str(m.name)) return null
    const steps = strList(m.steps, 12)
    if (!steps || !steps.length) return null
    if (!Array.isArray(m.ingredients) || !m.ingredients.length || m.ingredients.length > 20) return null
    const ingredients: SuggestedMeal['ingredients'] = []
    for (const x of m.ingredients) {
      if (!x || typeof x !== 'object' || !str(x.item)) return null
      ingredients.push({
        item: x.item.trim().slice(0, 60),
        qty: str(x.qty) ? x.qty.trim().slice(0, 60) : '',
        ...(x.optional === true ? { optional: true } : {}),
      })
    }
    if (!int(m.minutes, 0, 600) || !int(m.serves, 1, 20) || !int(m.kcal, 0, 5000) || !int(m.protein, 0, 300)) return null
    out.push({
      name: m.name.trim().slice(0, 80),
      serves: m.serves,
      minutes: m.minutes,
      kcal: m.kcal,
      protein: m.protein,
      vegetarian: m.vegetarian === true || m.vegan === true,
      vegan: m.vegan === true,
      ingredients,
      steps,
      note: str(m.note) ? m.note.trim().slice(0, 160) : undefined,
    })
  }
  const line = str((raw as any).line) ? (raw as any).line.trim().slice(0, 160) : undefined
  return { meals: out, line }
}

/** Models sometimes wrap JSON in prose or a code fence even when asked not to. */
export function looseJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const first = trimmed.indexOf('{')
    const last = trimmed.lastIndexOf('}')
    if (first === -1 || last <= first) return null
    try {
      return JSON.parse(trimmed.slice(first, last + 1))
    } catch {
      return null
    }
  }
}
