import type { Draft } from './inventory'
import { keywordParse } from './keywordParser'
import type { Recipe, Tag } from './recipes'
import { prettyName, type Category, type Item, type Location } from './schema'

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
    displayName: i.displayName || prettyName(i.name, i.count, i.unit),
    name: i.name,
    kind: i.kind,
    unit: i.unit,
    measure: i.measure,
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

/** Responses are cached on exactly what was asked, so reopening the book
 *  doesn't re-ask the same question and burn tokens. */
const memo = new Map<string, SuggestOutcome>()

export type SuggestOutcome = { recipes: Recipe[]; line?: string; source: 'model' | 'local'; why?: string }

export function inventoryKey(items: Item[]): string {
  return items.map(i => `${i.name}:${i.amount}:${i.count ?? ''}`).sort().join('|')
}

type ModelMeal = {
  name: string; serves: number; minutes: number; kcal: number; protein: number
  vegetarian: boolean; vegan: boolean; note?: string
  ingredients: Array<{ item: string; qty: string; optional?: boolean }>
  steps: string[]
}

export function fromModel(m: ModelMeal): Recipe {
  const tags: Tag[] = []
  if (m.vegetarian || m.vegan) tags.push('vegetarian')
  if (m.vegan) tags.push('vegan')
  return {
    name: m.name,
    serves: m.serves,
    minutes: m.minutes,
    kcal: m.kcal,
    protein: m.protein,
    tags,
    ingredients: m.ingredients.map(x => ({ item: x.item.toLowerCase(), qty: x.qty, optional: x.optional || undefined })),
    steps: m.steps,
    source: 'basil',
    note: m.note,
  }
}

/** Basil's own ideas for this exact kitchen. The built-in book always works
 *  without this; these are extra. */
export async function suggestMeals(items: Item[], dietary: string[]): Promise<SuggestOutcome> {
  const key = `${inventoryKey(items)}:${dietary.join(',')}`
  const hit = memo.get(key)
  if (hit) return hit
  const inventory = items
    .map(i => `- ${i.displayName} (${i.name}${i.kind ? `, a ${i.kind}` : ''}, ${i.amount}${i.count ? `, ${i.count}${i.unit ? ` ${i.unit}` : ''}` : ''})`)
    .join('\n')
  let why: string | undefined
  try {
    const res = await fetch('/api/suggest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ inventory, dietary }),
    })
    const body = await res.json()
    if (body?.ok) {
      const out: SuggestOutcome = { recipes: body.data.meals.map(fromModel), line: body.data.line, source: 'model' }
      memo.set(key, out)
      if (memo.size > 40) memo.delete(memo.keys().next().value as string)
      return out
    }
    why = failureMessage(body?.reason, body?.detail)
  } catch { why = failureMessage('unreachable') }
  // a fallback answer is not remembered: fix the key and the next ask should work
  return { recipes: [], source: 'local', why }
}
