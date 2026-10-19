import { describe, expect, it } from 'vitest'
import { boardItems, book, cook, dishSprite, emptyBoard, SLOTS } from '../src/lib/craft'
import { item, state } from './helpers'

it('an empty board has nine empty slots', () => {
  expect(emptyBoard()).toEqual(Array(SLOTS).fill(null))
})

it('boardItems skips empty slots and ids that no longer exist', () => {
  const a = item(), b = item()
  expect(boardItems([a.id, null, 'gone', b.id], [a, b])).toEqual([a, b])
})

describe('dishSprite', () => {
  it.each([
    ['Tomato soup', 'dish/soup_1'],
    ['Cheese on toast', 'dish/pastry_1'],
    ['Roast chicken', 'dish/meat_1'],
    ['Greek salad', 'dish/vegetable_1'],
    ['Mystery', 'dish/potatodish_2'],
  ])('%s -> %s', (name, key) => expect(dishSprite(name)).toBe(key))
})

describe('cook', () => {
  it('spends the ingredients and records the meal first in history', () => {
    const bread = item({ name: 'bread', amount: 'low' })
    const cheese = item({ name: 'cheese', amount: 'full' })
    const s = cook('Cheese on toast', [bread, cheese], ['toast', 'melt'], 8)(state({ items: [bread, cheese] }))
    expect(s.items).toEqual([{ ...cheese, amount: 'half' }])
    expect(s.history[0]).toMatchObject({
      name: 'Cheese on toast',
      ingredients: ['bread', 'cheese'],
      minutes: 8,
      dishKey: 'dish/pastry_1',
    })
  })

  it('keeps history to 200 meals', () => {
    let s = state()
    for (let i = 0; i < 205; i++) s = cook(`meal ${i}`, [], [], 1)(s)
    expect(s.history).toHaveLength(200)
    expect(s.history[0].name).toBe('meal 204')
  })
})

describe('book', () => {
  it('lists each meal once, newest first, with what is missing now', () => {
    let s = state({ items: [item({ name: 'bread' })] })
    s = cook('Cheese on toast', [item({ name: 'bread' }), item({ name: 'cheese' })], [], 8)(s)
    s = cook('cheese on toast', [item({ name: 'bread' }), item({ name: 'cheese' })], [], 8)(s)
    s = { ...s, items: [item({ name: 'bread' })] }
    const entries = book(s)
    expect(entries).toHaveLength(1)
    expect(entries[0].have).toEqual(['bread'])
    expect(entries[0].missing).toEqual(['cheese'])
  })

  it('matches loosely, so "cheddar cheese" covers "cheese"', () => {
    let s = cook('Toastie', [item({ name: 'cheese' })], [], 5)(state())
    s = { ...s, items: [item({ name: 'cheddar cheese' })] }
    expect(book(s)[0].missing).toEqual([])
  })
})

it('a specific cheese counts for a recipe that wants cheese', () => {
  let s = cook('Cheese on toast', [item({ name: 'bread' }), item({ name: 'cheese' })], [], 8)(state())
  s = { ...s, items: [item({ name: 'bread' }), item({ name: 'cheddar' })] }
  expect(book(s)[0].missing).toEqual([])
})
