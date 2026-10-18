import type { Draft } from './inventory'
import { keywordParse } from './keywordParser'
import type { Category, Item, Location } from './schema'

export type AiStatus = { provider: string; model: string; configured: boolean }

export type ParseOutcome = {
  drafts: Draft[]
  /** Which parser actually produced this, so the UI can say so plainly. */
  source: 'model' | 'keywords'
  why?: string
}

let statusCache: Promise<AiStatus> | null = null

export function aiStatus(): Promise<AiStatus> {
  statusCache ??= fetch('/api/status')
    .then(r => r.json())
    .catch(() => ({ provider: 'none', model: '', configured: false }))
  return statusCache
}

const REASONS: Record<string, string> = {
  'no-key': 'No API key, so the simple parser had a go.',
  unreachable: 'Could not reach the model, so the simple parser had a go.',
  'bad-json': 'The model sent something unreadable, so the simple parser had a go.',
}

/** Turns a failed AI result into a sentence that says what to fix. The server
 *  puts the provider's HTTP status in `detail`, e.g. "gemini 404: ...". */
export function failureMessage(reason?: string, detail?: string): string {
  if (reason === 'no-key') return 'No API key set. Add GEMINI_API_KEY or GROQ_API_KEY (in .env, or the host\'s environment variables) and restart.'
  if (reason === 'rate-limited') return 'Basil has asked the model a lot just now. Try again in a minute.'
  if (reason === 'bad-json') return 'The model sent something unreadable.'
  const d = detail ?? ''
  if (/\b404\b/.test(d)) return 'The model name was not found. It may have been retired: set BASIL_MODEL.'
  if (/\b(401|403)\b/.test(d) || /API key/i.test(d)) return 'The API key was rejected. Check the key for your provider.'
  if (/\b429\b/.test(d)) return 'Rate limited by the model. Wait a minute and try again.'
  if (/\b5\d\d\b/.test(d)) return 'The model service is having trouble. Try again shortly.'
  if (/abort/i.test(d)) return 'The model took too long to answer.'
  return 'Could not reach the model.'
}

/**
 * Asks the model, and falls back to the keyword matcher on absolutely anything
 * going wrong. The AI is never allowed to be a blocker: a missing key, a dead
 * network and a malformed reply all land in the same place.
 */
export async function parseText(text: string): Promise<ParseOutcome> {
  const fallback = (why: string): ParseOutcome => ({ drafts: keywordParse(text), source: 'keywords', why })
  let res: Response
  try {
    res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  } catch {
    return fallback(REASONS.unreachable)
  }

  // error replies carry a reason too (a 429 says it was rate-limited), so read
  // the body before deciding what went wrong
  let body: any
  try {
    body = await res.json()
  } catch {
    return fallback(res.ok ? REASONS['bad-json'] : REASONS.unreachable)
  }
  if (!body?.ok) return fallback(`${failureMessage(body?.reason, body?.detail)} Using the simple parser.`)

  const drafts: Draft[] = body.data.items.map((i: any) => ({
    displayName: i.displayName,
    name: i.name,
    category: i.category as Category,
    location: i.location as Location,
    amount: i.amount as Item['amount'],
    count: i.count,
    expiresAt: typeof i.shelfLifeDays === 'number'
      ? new Date(Date.now() + i.shelfLifeDays * 86_400_000).toISOString()
      : undefined,
  }))
  if (!drafts.length) return fallback(REASONS['bad-json'])
  return { drafts, source: 'model' }
}

/** Responses are cached on exactly what was asked, so idling in the kitchen
 *  doesn't re-ask the same question and burn tokens. */
const memo = new Map<string, unknown>()

async function cached<T extends { source: string }>(key: string, fn: () => Promise<T>): Promise<T> {
  if (memo.has(key)) return memo.get(key) as T
  const value = await fn()
  // a fallback answer is not worth remembering: fix the key and the next ask should work
  if (value.source !== 'model') return value
  memo.set(key, value)
  if (memo.size > 40) memo.delete(memo.keys().next().value as string)
  return value
}

export type Meal = {
  name: string
  ingredients: string[]
  missing: string[]
  steps: string[]
  minutes: number
  usesSoon: string[]
}

export type SuggestOutcome = { meals: Meal[]; line?: string; source: 'model' | 'local'; why?: string }

export function inventoryKey(items: Item[]): string {
  return items.map(i => `${i.name}:${i.amount}:${i.count ?? ''}`).sort().join('|')
}

export async function suggestMeals(items: Item[], dietary: string[]): Promise<SuggestOutcome> {
  const key = `suggest:${inventoryKey(items)}:${dietary.join(',')}`
  return cached(key, async () => {
    const inventory = items
      .map(i => `- ${i.displayName} (${i.name}, ${i.amount}${i.count ? `, ${i.count}` : ''})`)
      .join('\n')
    let why: string | undefined
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ inventory, dietary }),
      })
      const body = await res.json()
      if (body?.ok) return { ...body.data, source: 'model' as const }
      why = failureMessage(body?.reason, body?.detail)
    } catch { why = failureMessage('unreachable') }
    return { meals: localSuggest(items), source: 'local' as const, why }
  })
}

export type Verdict = { name: string; ok: boolean; steps: string[]; minutes: number; line?: string }

export async function judgeCraft(items: Item[]): Promise<{ verdict: Verdict; source: 'model' | 'local'; why?: string }> {
  const key = `craft:${items.map(i => i.name).sort().join('+')}`
  return cached(key, async () => {
    let why: string | undefined
    try {
      const res = await fetch('/api/craft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ingredients: items.map(i => i.displayName) }),
      })
      const body = await res.json()
      if (body?.ok) return { verdict: body.data as Verdict, source: 'model' as const }
      why = failureMessage(body?.reason, body?.detail)
    } catch { why = failureMessage('unreachable') }
    return { verdict: localCraft(items), source: 'local' as const, why }
  })
}

/* ---- the offline stand-ins ------------------------------------------- */

const LOCAL_RECIPES: Array<{ name: string; needs: string[]; steps: string[]; minutes: number }> = [
  { name: 'Cheese on toast', needs: ['bread', 'cheese'], steps: ['Toast the bread', 'Cheese on top', 'Under the grill'], minutes: 8 },
  { name: 'Scrambled eggs', needs: ['egg'], steps: ['Beat the eggs', 'Low heat, keep stirring'], minutes: 7 },
  { name: 'Omelette', needs: ['egg', 'cheese'], steps: ['Beat the eggs', 'Pour into a hot pan', 'Cheese, then fold'], minutes: 10 },
  { name: 'Steak and greens', needs: ['steak', 'broccoli'], steps: ['Hot pan for the steak', 'Steam the greens', 'Rest the meat'], minutes: 20 },
  { name: 'Buttered toast', needs: ['bread'], steps: ['Toast it', 'Butter it'], minutes: 4 },
  { name: 'Roast chicken', needs: ['drumstick'], steps: ['Season', 'Oven until it runs clear'], minutes: 45 },
]

function localSuggest(items: Item[]): Meal[] {
  const have = new Set(items.map(i => i.name))
  return LOCAL_RECIPES
    .map(r => ({
      name: r.name,
      ingredients: r.needs,
      missing: r.needs.filter(n => ![...have].some(h => h.includes(n) || n.includes(h))),
      steps: r.steps,
      minutes: r.minutes,
      usesSoon: [],
    }))
    .sort((a, b) => a.missing.length - b.missing.length)
    .slice(0, 4)
}

function localCraft(items: Item[]): Verdict {
  const names = items.map(i => i.name)
  const hit = LOCAL_RECIPES.find(r => r.needs.every(n => names.some(h => h.includes(n) || n.includes(h))))
  if (hit) return { name: hit.name, ok: true, steps: hit.steps, minutes: hit.minutes }
  return {
    name: names.length > 1 ? `${names.slice(0, 2).join(' and ')}, together` : names[0] ?? 'nothing',
    ok: false,
    steps: [],
    minutes: 0,
    line: 'Technically food. Technically.',
  }
}

/** Built-in recipes the kitchen can already make in full. Free and instant,
 *  which is why Basil's unprompted remarks use it instead of asking the model. */
export function localMakings(items: Item[]): Meal[] {
  return localSuggest(items).filter(m => !m.missing.length && m.ingredients.length > 1)
}
