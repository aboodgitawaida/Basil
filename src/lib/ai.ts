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

/** What a visitor is told when the model can't help. Plain, and never about
 *  configuration: the fallback always works, so this is a note, not an error. */
const REASONS: Record<string, string> = {
  'no-key': 'Basil read it himself this time.',
  unreachable: "Basil couldn't reach his notes, so he read it himself.",
  'bad-json': 'Basil read it himself this time.',
}

/** A short, friendly line for the screen. */
export function failureMessage(reason?: string, detail?: string): string {
  if (reason === 'rate-limited') return 'Basil has been asked a lot just now. Try again in a minute.'
  if (reason === 'no-key' || reason === 'bad-json') return 'Using the built-in cookbook for now.'
  const d = detail ?? ''
  if (/\b429\b/.test(d)) return 'Basil has been asked a lot just now. Try again in a minute.'
  if (/abort|timeout/i.test(d)) return 'Basil took too long to think. Built-in ideas for now.'
  return 'Basil is offline for a moment. Built-in ideas for now.'
}

/** What a developer needs to fix it. Logged to the console, never shown. */
export function developerHint(reason?: string, detail?: string): string {
  if (reason === 'no-key') return 'No model key: set GEMINI_API_KEY or GROQ_API_KEY in .env (or the host\'s environment) and restart.'
  if (reason === 'rate-limited') return `Rate limited by Basil's own API cap: ${detail ?? ''}`
  if (reason === 'bad-json') return `The model replied with something that failed validation: ${detail ?? ''}`
  const d = detail ?? ''
  if (/\b404\b/.test(d)) return `Model not found (retired?): set BASIL_MODEL. ${d}`
  if (/\b(401|403)\b/.test(d) || /API key/i.test(d)) return `The provider rejected the API key. ${d}`
  return `Model call failed: ${d || reason || 'unknown'}`
}

/** Only while developing: in production the fallback is the whole story, and
 *  a visitor opening the console shouldn't find warnings about it. */
const warn = (reason?: string, detail?: string) => {
  if (import.meta.env?.DEV) console.warn(`[basil] ${developerHint(reason, detail)}`)
}

/** Reading shopping never waits longer than this; the built-in reader takes over. */
export const PARSE_TIMEOUT_MS = 8_000

/**
 * Asks the model, and falls back to the keyword matcher on absolutely anything
 * going wrong. The AI is never allowed to be a blocker: a missing key, a dead
 * network and a malformed reply all land in the same place.
 */
export async function parseText(text: string): Promise<ParseOutcome> {
  const fallback = (why: string): ParseOutcome => ({ drafts: keywordParse(text), source: 'keywords', why })
  let res: Response
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), PARSE_TIMEOUT_MS)
  try {
    res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: ctl.signal,
    })
  } catch (err) {
    warn('unreachable', String(err))
    return fallback(REASONS.unreachable)
  } finally {
    clearTimeout(timer)
  }

  // error replies carry a reason too (a 429 says it was rate-limited), so read
  // the body before deciding what went wrong
  let body: any
  try {
    body = await res.json()
  } catch {
    return fallback(res.ok ? REASONS['bad-json'] : REASONS.unreachable)
  }
  if (!body?.ok) {
    warn(body?.reason, body?.detail)
    return fallback(body?.reason === 'rate-limited' ? failureMessage('rate-limited') : REASONS[body?.reason] ?? REASONS.unreachable)
  }

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
    warn(body?.reason, body?.detail)
    why = failureMessage(body?.reason, body?.detail)
  } catch (err) { warn('unreachable', String(err)); why = failureMessage('unreachable') }
  // a fallback answer is not remembered: fix the key and the next ask should work
  return { recipes: [], source: 'local', why }
}
