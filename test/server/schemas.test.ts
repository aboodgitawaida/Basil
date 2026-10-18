import { describe, expect, it } from 'vitest'
import { looseJson, validateCraft, validateParse, validateSuggest } from '../../server/schemas'

const goodItem = { displayName: 'Whole Milk', name: 'Milk', category: 'dairy', location: 'fridge', amount: 'full' }

describe('looseJson', () => {
  it('reads plain JSON, fenced JSON and JSON wrapped in prose', () => {
    expect(looseJson('{"a":1}')).toEqual({ a: 1 })
    expect(looseJson('```json\n{"a":1}\n```')).toEqual({ a: 1 })
    expect(looseJson('Sure, here you go: {"a":{"b":2}} hope that helps')).toEqual({ a: { b: 2 } })
  })

  it('gives null rather than throwing on junk', () => {
    expect(looseJson('')).toBeNull()
    expect(looseJson('no braces here')).toBeNull()
    expect(looseJson('{broken')).toBeNull()
  })
})

describe('validateParse', () => {
  it('accepts a good reply and tidies names', () => {
    expect(validateParse({ items: [{ ...goodItem, count: 2, shelfLifeDays: 7 }] })).toEqual({
      items: [{ ...goodItem, name: 'milk', count: 2, shelfLifeDays: 7 }],
    })
  })

  it.each([
    ['no items', { items: [] }],
    ['not an object', 'milk'],
    ['unknown category', { items: [{ ...goodItem, category: 'potions' }] }],
    ['unknown location', { items: [{ ...goodItem, location: 'garage' }] }],
    ['blank name', { items: [{ ...goodItem, name: '  ' }] }],
    ['fractional count', { items: [{ ...goodItem, count: 1.5 }] }],
    ['negative shelf life', { items: [{ ...goodItem, shelfLifeDays: -1 }] }],
    ['too many items', { items: Array(41).fill(goodItem) }],
  ])('rejects the whole reply for %s', (_, raw) => {
    expect(validateParse(raw)).toBeNull()
  })

  it('rejects everything when one item is bad, rather than half-trusting it', () => {
    expect(validateParse({ items: [goodItem, { ...goodItem, amount: 'lots' }] })).toBeNull()
  })
})

describe('validateSuggest', () => {
  const meal = { name: 'Omelette', ingredients: ['egg'], steps: ['beat', 'cook'], minutes: 10 }

  it('fills in optional lists and keeps the line', () => {
    expect(validateSuggest({ meals: [meal], line: ' Eggs again. ' })).toEqual({
      meals: [{ ...meal, missing: [], usesSoon: [] }],
      line: 'Eggs again.',
    })
  })

  it('rejects bad minutes and non-string ingredients', () => {
    expect(validateSuggest({ meals: [{ ...meal, minutes: 'ten' }] })).toBeNull()
    expect(validateSuggest({ meals: [{ ...meal, minutes: 9999 }] })).toBeNull()
    expect(validateSuggest({ meals: [{ ...meal, ingredients: [3] }] })).toBeNull()
  })
})

describe('validateCraft', () => {
  it('accepts a verdict and defaults minutes', () => {
    expect(validateCraft({ name: 'Toast', ok: true, steps: ['toast'] })).toEqual({
      name: 'Toast', ok: true, steps: ['toast'], minutes: 0, line: undefined,
    })
  })

  it('needs a name and a real boolean', () => {
    expect(validateCraft({ name: 'Toast', ok: 'yes' })).toBeNull()
    expect(validateCraft({ ok: true })).toBeNull()
  })
})
