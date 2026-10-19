import { afterEach, describe, expect, it, vi } from 'vitest'
import { failureMessage, fromModel, inventoryKey, parseText, suggestMeals } from '../src/lib/ai'
import { item } from './helpers'

afterEach(() => vi.unstubAllGlobals())

const reply = (body: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status }))

describe('failureMessage', () => {
  it.each([
    ['no-key', '', /No API key/],
    ['rate-limited', '', /a lot just now/],
    ['bad-json', '', /unreadable/],
    ['unreachable', 'groq 404: model not found', /not found/],
    ['unreachable', 'gemini 403: denied', /rejected/],
    ['unreachable', 'groq 429: slow down', /Rate limited by the model/],
    ['unreachable', 'groq 503', /having trouble/],
    ['unreachable', 'AbortError: aborted', /too long/],
    ['unreachable', '', /Could not reach/],
  ])('%s %s', (reason, detail, re) => expect(failureMessage(reason, detail)).toMatch(re))
})

describe('parseText', () => {
  it('uses the model when it answers well', async () => {
    vi.stubGlobal('fetch', reply({
      ok: true,
      data: { items: [{ displayName: 'Milk', name: 'milk', category: 'dairy', location: 'fridge', amount: 'full', shelfLifeDays: 5 }] },
    }))
    const out = await parseText('Milk')
    expect(out.source).toBe('model')
    expect(out.drafts[0]).toMatchObject({ name: 'milk', location: 'fridge' })
    const days = (new Date(out.drafts[0].expiresAt!).getTime() - Date.now()) / 86_400_000
    expect(days).toBeCloseTo(5, 0)
  })

  it('falls back to keywords when the network is down', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline') }))
    const out = await parseText('milk and bread')
    expect(out.source).toBe('keywords')
    expect(out.drafts.map(d => d.name)).toEqual(['milk', 'bread'])
  })

  it('says why when the server refuses', async () => {
    vi.stubGlobal('fetch', reply({ ok: false, reason: 'rate-limited' }, 429))
    const out = await parseText('milk')
    expect(out.source).toBe('keywords')
    expect(out.why).toMatch(/a lot just now/)
  })

  it('falls back on a reply that is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>oops</html>', { status: 502 })))
    expect((await parseText('milk')).source).toBe('keywords')
  })
})

it('inventoryKey ignores order', () => {
  const a = item({ name: 'milk' }), b = item({ name: 'bread', amount: 'low' })
  expect(inventoryKey([a, b])).toBe(inventoryKey([b, a]))
})

it('suggestMeals comes back empty with a reason when there is no model', async () => {
  vi.stubGlobal('fetch', reply({ ok: false, reason: 'no-key' }))
  const out = await suggestMeals([item({ name: 'egg' })], [])
  expect(out).toMatchObject({ recipes: [], source: 'local' })
  expect(out.why).toMatch(/No API key/)
})

it('suggestMeals turns model meals into recipes', async () => {
  vi.stubGlobal('fetch', reply({ ok: true, data: { meals: [{
    name: 'Egg fried rice', serves: 2, minutes: 15, kcal: 450, protein: 16, vegetarian: true, vegan: false,
    ingredients: [{ item: 'Egg', qty: '2 eggs' }, { item: 'rice', qty: '200g' }], steps: ['fry'],
  }], line: 'Rice again.' } }))
  const out = await suggestMeals([item({ name: 'rice' })], [])
  expect(out.source).toBe('model')
  expect(out.recipes[0]).toMatchObject({ name: 'Egg fried rice', tags: ['vegetarian'], source: 'basil' })
  expect(out.recipes[0].ingredients[0].item).toBe('egg')
})

it('fromModel tags vegan meals as vegetarian too', () => {
  const r = fromModel({ name: 'Dal', serves: 2, minutes: 30, kcal: 300, protein: 15, vegetarian: false, vegan: true, ingredients: [{ item: 'lentil', qty: '200g' }], steps: ['simmer'] })
  expect(r.tags).toEqual(['vegetarian', 'vegan'])
})

it('parseText keeps the quantity out of the label', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline') }))
  const out = await parseText('two eggs')
  expect(out.drafts[0]).toMatchObject({ displayName: 'Eggs', name: 'egg', count: 2 })
})
