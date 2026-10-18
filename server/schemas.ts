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
          ingredients: { type: 'array', items: { type: 'string' } },
          missing: { type: 'array', items: { type: 'string' } },
          steps: { type: 'array', items: { type: 'string' } },
          minutes: { type: 'integer' },
          usesSoon: { type: 'array', items: { type: 'string' } },
        },
        required: ['name', 'ingredients', 'steps', 'minutes'],
      },
    },
    line: { type: 'string' },
  },
  required: ['meals'],
} as const

export const CRAFT_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    ok: { type: 'boolean' },
    steps: { type: 'array', items: { type: 'string' } },
    minutes: { type: 'integer' },
    line: { type: 'string' },
  },
  required: ['name', 'ok'],
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
  shelfLifeDays?: number
}

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
      shelfLifeDays: it.shelfLifeDays,
    })
  }
  return { items: out }
}

export type SuggestedMeal = {
  name: string
  ingredients: string[]
  missing: string[]
  steps: string[]
  minutes: number
  usesSoon: string[]
}

const strList = (v: unknown, max = 24): string[] | null => {
  if (v === undefined) return []
  if (!Array.isArray(v) || v.length > max) return null
  const out: string[] = []
  for (const s of v) {
    if (!str(s)) return null
    out.push(s.trim().slice(0, 160))
  }
  return out
}

export function validateSuggest(raw: unknown): { meals: SuggestedMeal[]; line?: string } | null {
  if (!raw || typeof raw !== 'object') return null
  const meals = (raw as any).meals
  if (!Array.isArray(meals) || meals.length > 8) return null
  const out: SuggestedMeal[] = []
  for (const m of meals) {
    if (!m || typeof m !== 'object' || !str(m.name)) return null
    const ingredients = strList(m.ingredients)
    const missing = strList(m.missing)
    const steps = strList(m.steps)
    const usesSoon = strList(m.usesSoon)
    if (!ingredients || !missing || !steps || !usesSoon) return null
    if (!Number.isInteger(m.minutes) || m.minutes < 0 || m.minutes > 600) return null
    out.push({ name: m.name.trim().slice(0, 80), ingredients, missing, steps, minutes: m.minutes, usesSoon })
  }
  const line = str((raw as any).line) ? (raw as any).line.trim().slice(0, 160) : undefined
  return { meals: out, line }
}

export type CraftVerdict = { name: string; ok: boolean; steps: string[]; minutes: number; line?: string }

export function validateCraft(raw: unknown): CraftVerdict | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as any
  if (!str(r.name) || typeof r.ok !== 'boolean') return null
  const steps = strList(r.steps)
  if (!steps) return null
  const minutes = Number.isInteger(r.minutes) ? r.minutes : 0
  if (minutes < 0 || minutes > 600) return null
  return {
    name: r.name.trim().slice(0, 80),
    ok: r.ok,
    steps,
    minutes,
    line: str(r.line) ? r.line.trim().slice(0, 160) : undefined,
  }
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
