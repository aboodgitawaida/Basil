import { describe, expect, it } from 'vitest'
import { RECIPES, cookable, match, passes, spending } from '../src/lib/recipes'
import { item } from './helpers'

const r = (name: string) => RECIPES.find(x => x.name === name)!

describe('the built-in book', () => {
  it('every recipe has nutrition, steps and at least one required ingredient', () => {
    for (const x of RECIPES) {
      expect(x.kcal, x.name).toBeGreaterThan(0)
      expect(x.protein, x.name).toBeGreaterThanOrEqual(0)
      expect(x.steps.length, x.name).toBeGreaterThan(1)
      expect(x.ingredients.some(i => !i.optional), x.name).toBe(true)
    }
  })

  it('has no duplicate names', () => {
    expect(new Set(RECIPES.map(x => x.name)).size).toBe(RECIPES.length)
  })
})

describe('match', () => {
  it('a specific cheese counts for a recipe that wants cheese', () => {
    const m = match(r('Cheese on toast'), [item({ name: 'bread' }), item({ name: 'cheddar', kind: 'cheese' })])
    expect(m.missing).toEqual([])
  })

  it('two eggs is not enough for a three-egg omelette', () => {
    const m = match(r('Cheese omelette'), [item({ name: 'egg', count: 2 }), item({ name: 'cheese' })])
    expect(m.missing.map(i => i.item)).toEqual(['egg'])
    expect(m.uses[0].short).toBe(1)
  })

  it('optional things are never missing', () => {
    const m = match(r('Cheese omelette'), [item({ name: 'egg', count: 6 }), item({ name: 'cheese' })])
    expect(m.missing).toEqual([])
  })

  it('pear is not pea, and peanut butter is not butter', () => {
    const m = match(r('Fried rice'), [item({ name: 'rice' }), item({ name: 'egg', count: 4 }), item({ name: 'pear' })])
    expect(m.missing.length).toBe(1)
    const crumble = match(r('Apple crumble'), [item({ name: 'apple', count: 4 }), item({ name: 'flour' }), item({ name: 'sugar' }), item({ name: 'peanut butter' })])
    expect(crumble.missing.map(i => i.item)).toEqual(['butter'])
  })

  it('"either" ingredients take any of them', () => {
    const m = match(r('Steak and greens'), [item({ name: 'beef' }), item({ name: 'spinach' })])
    expect(m.missing).toEqual([])
  })
})

describe('cookable and filters', () => {
  const kitchen = [
    item({ name: 'egg', count: 6 }), item({ name: 'bread' }), item({ name: 'cheese' }),
    item({ name: 'chicken' }), item({ name: 'lettuce' }),
  ]

  it('lists what is ready first', () => {
    const all = cookable(kitchen)
    expect(all.length).toBeGreaterThan(3)
    const firstShort = all.findIndex(m => m.missing.length > 0)
    expect(all.slice(0, firstShort).every(m => m.missing.length === 0)).toBe(true)
    expect(all.map(m => m.recipe.name)).toContain('Cheese omelette')
  })

  it('high protein and vegetarian filter as labelled', () => {
    const all = cookable(kitchen)
    expect(all.filter(m => passes(m, ['protein'])).every(m => m.recipe.protein >= 25)).toBe(true)
    expect(all.filter(m => passes(m, ['vegetarian'])).map(m => m.recipe.name)).not.toContain('Grilled chicken salad')
    expect(all.filter(m => passes(m, ['protein', 'light'])).map(m => m.recipe.name)).toContain('Grilled chicken salad')
  })

  it('spending takes counts for counted things and one of everything else', () => {
    const m = match(r('Scrambled eggs on toast'), kitchen)
    expect(spending(m)).toEqual([{ id: kitchen[0].id, count: 3 }, { id: kitchen[1].id, count: 1 }])
  })
})
