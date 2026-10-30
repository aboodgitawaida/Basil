import { describe, expect, it } from 'vitest'
import { book, cook, dishSprite } from '../src/lib/cooking'
import { RECIPES, match } from '../src/lib/recipes'
import { item, state } from './helpers'

describe('dishSprite', () => {
  it.each([
    ['Tomato soup', 'dish/soup_1'],
    ['Cheese on toast', 'dish/pastry_1'],
    ['Roast chicken', 'dish/meat_1'],
    ['Greek salad', 'dish/vegetable_1'],
    ['Lentil dal', 'dish/soup_2'],
    ['Mystery', 'dish/potatodish_2'],
  ])('%s -> %s', (name, key) => expect(dishSprite(name)).toBe(key))
})

const recipe = (name: string) => RECIPES.find(r => r.name === name)!

describe('cook', () => {
  it('spends what the recipe used and records the meal first in history', () => {
    const bread = item({ name: 'bread', amount: 'low' })
    const cheese = item({ name: 'cheddar', kind: 'cheese', amount: 'full' })
    const s0 = state({ items: [bread, cheese] })
    const s = cook(match(recipe('Cheese on toast'), s0.items))(s0)
    expect(s.items).toEqual([{ ...cheese, amount: 'half' }])
    expect(s.history[0]).toMatchObject({ name: 'Cheese on toast', ingredients: ['bread', 'cheddar'], minutes: 8 })
  })

  it('takes the number of eggs the recipe asks for', () => {
    const eggs = item({ name: 'egg', count: 6, displayName: 'Eggs' })
    const cheese = item({ name: 'cheese' })
    const s0 = state({ items: [eggs, cheese] })
    const s = cook(match(recipe('Cheese omelette'), s0.items))(s0)
    expect(s.items.find(i => i.id === eggs.id)).toMatchObject({ count: 3, displayName: 'Eggs' })
  })

  it('keeps history to 200 meals', () => {
    let s = state({ items: [item({ name: 'bread' }), item({ name: 'jam' })] })
    for (let i = 0; i < 205; i++) s = cook(match(recipe('Toast and jam'), s.items))({ ...s, items: [item({ name: 'bread' }), item({ name: 'jam' })] })
    expect(s.history).toHaveLength(200)
  })
})

describe('book', () => {
  it('lists each meal once, newest first, with what is missing now', () => {
    let s = state({ items: [item({ name: 'bread' }), item({ name: 'cheese' })] })
    s = cook(match(recipe('Cheese on toast'), s.items))(s)
    s = { ...s, items: [item({ name: 'bread' }), item({ name: 'cheese' })] }
    s = cook(match(recipe('Cheese on toast'), s.items))(s)
    s = { ...s, items: [item({ name: 'bread' })] }
    const entries = book(s)
    expect(entries).toHaveLength(1)
    expect(entries[0].missing).toEqual(['cheese'])
  })
})
