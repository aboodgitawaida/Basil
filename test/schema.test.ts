import { describe, expect, it } from 'vitest'
import { daysLeft, guessCategory, guessExpiry, guessLocation, isGoingOff, newId } from '../src/lib/schema'
import { item } from './helpers'

describe('guessCategory', () => {
  it.each([
    ['milk', 'dairy'],
    ['cheddar', 'dairy'],
    ['chicken', 'meat'],
    ['apple', 'produce'],
    ['pasta', 'grain'],
    ['ketchup', 'condiment'],
    ['orange juice', 'drink'],
    ['chocolate', 'snack'],
    ['sugar', 'baking'],
    ['tuna', 'tinned'],
    ['widget', 'other'],
  ])('%s -> %s', (name, cat) => {
    expect(guessCategory(name)).toBe(cat)
  })

  it('reads words that normalising strips out of the name', () => {
    // "frozen" is stripped from the name but is what makes it frozen
    expect(guessCategory('pizza', 'frozen pizza')).toBe('frozen')
  })
})

describe('guessLocation', () => {
  it('sends frozen things to the freezer whatever their category', () => {
    expect(guessLocation('peas', 'produce')).toBe('freezer')
    expect(guessLocation('pizza', 'other', 'frozen pizza')).toBe('freezer')
    expect(guessLocation('x', 'frozen')).toBe('freezer')
  })

  it('keeps fresh food cold and dry goods in the cupboard', () => {
    expect(guessLocation('milk', 'dairy')).toBe('fridge')
    expect(guessLocation('steak', 'meat')).toBe('fridge')
    expect(guessLocation('pasta', 'grain')).toBe('cupboard')
    expect(guessLocation('tuna', 'tinned')).toBe('cupboard')
  })

  it('splits drinks and condiments by what they are', () => {
    expect(guessLocation('beer', 'drink')).toBe('fridge')
    expect(guessLocation('cola', 'drink')).toBe('cupboard')
    expect(guessLocation('mayo', 'condiment')).toBe('fridge')
    expect(guessLocation('vinegar', 'condiment')).toBe('cupboard')
  })
})

describe('expiry', () => {
  const from = new Date('2026-03-01T12:00:00Z')

  it('uses a known shelf life before the category one', () => {
    const chicken = new Date(guessExpiry('chicken', 'meat', from))
    expect((chicken.getTime() - from.getTime()) / 86_400_000).toBe(2)
    const unknownMeat = new Date(guessExpiry('venison', 'meat', from))
    expect((unknownMeat.getTime() - from.getTime()) / 86_400_000).toBe(3)
  })

  it('counts whole days left and flags things close to the end', () => {
    const now = new Date('2026-03-01T12:00:00Z')
    const soon = item({ expiresAt: '2026-03-03T12:00:00Z' })
    const later = item({ expiresAt: '2026-03-20T12:00:00Z' })
    expect(daysLeft(soon, now)).toBe(2)
    expect(isGoingOff(soon, now)).toBe(true)
    expect(isGoingOff(later, now)).toBe(false)
  })

  it('treats a missing expiry as unknown, never as going off', () => {
    const none = item({ expiresAt: undefined })
    expect(daysLeft(none)).toBeNull()
    expect(isGoingOff(none)).toBe(false)
  })
})

it('newId does not repeat', () => {
  const ids = new Set(Array.from({ length: 500 }, newId))
  expect(ids.size).toBe(500)
})

it('drinks are matched as whole words', () => {
  expect(guessCategory('apple juice')).toBe('drink')
  expect(guessCategory('watermelon')).toBe('produce')
  expect(guessCategory('hot chocolate')).toBe('snack')
})
