import { describe, expect, it } from 'vitest'
import { looseJson, validateParse, validateSuggest } from '../../server/schemas'

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

  it('keeps unit, size and kind, lower-cased', () => {
    const out = validateParse({ items: [{ ...goodItem, name: 'cheddar', count: 1, unit: 'Block', kind: 'Cheese', measure: '200g' }] })
    expect(out?.items[0]).toMatchObject({ unit: 'block', kind: 'cheese', measure: '200g' })
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
  const meal = {
    name: 'Omelette', serves: 1, minutes: 10, kcal: 390, protein: 27, vegetarian: true,
    ingredients: [{ item: 'egg', qty: '3 eggs' }, { item: 'butter', qty: 'a knob', optional: true }],
    steps: ['beat', 'cook'],
  }

  it('keeps a full recipe with nutrition, and the line', () => {
    expect(validateSuggest({ meals: [meal], line: ' Eggs again. ' })).toEqual({
      meals: [{ ...meal, vegan: false, note: undefined }],
      line: 'Eggs again.',
    })
  })

  it('vegan implies vegetarian', () => {
    expect(validateSuggest({ meals: [{ ...meal, vegetarian: false, vegan: true }] })?.meals[0]).toMatchObject({ vegetarian: true, vegan: true })
  })

  it('rejects bad numbers, missing steps and bad ingredients', () => {
    expect(validateSuggest({ meals: [{ ...meal, minutes: 'ten' }] })).toBeNull()
    expect(validateSuggest({ meals: [{ ...meal, minutes: 9999 }] })).toBeNull()
    expect(validateSuggest({ meals: [{ ...meal, kcal: -5 }] })).toBeNull()
    expect(validateSuggest({ meals: [{ ...meal, steps: [] }] })).toBeNull()
    expect(validateSuggest({ meals: [{ ...meal, ingredients: ['egg'] }] })).toBeNull()
  })
})

