import { describe, expect, it } from 'vitest'
import { allGone, setCount, spend } from '../src/lib/inventory'
import { RECIPES, match } from '../src/lib/recipes'
import { addToList, clearTicked, missingFor, readList, tick, unlist } from '../src/lib/shopping'
import { sequence } from '../src/lib/useBasilPose'
import { item, state } from './helpers'

describe('the shopping list', () => {
  it('reads typed things like the kitchen does', () => {
    expect(readList('two lemons, a bag of rice')).toEqual([
      expect.objectContaining({ name: 'lemon', label: 'Lemons', count: 2 }),
      expect.objectContaining({ name: 'rice', unit: 'bag' }),
    ])
  })

  it('adds up typed things and does not list the same thing twice', () => {
    let s = addToList(readList('eggs'))(state())
    s = addToList(readList('2 eggs'))(s)
    expect(s.shopping).toHaveLength(1)
    expect(s.shopping[0]).toMatchObject({ name: 'egg', count: 3, label: 'Eggs' })
  })

  it('recipe additions only make sure there is enough', () => {
    let s = addToList([{ name: 'egg', count: 3, note: 'Omelette' }], 'ensure')(state())
    s = addToList([{ name: 'egg', count: 2, note: 'Fried rice' }], 'ensure')(s)
    expect(s.shopping[0]).toMatchObject({ count: 3, note: 'Omelette, Fried rice' })
  })

  it('takes what a recipe is short of, including how many more', () => {
    const omelette = RECIPES.find(r => r.name === 'Cheese omelette')!
    const entries = missingFor(match(omelette, [item({ name: 'egg', count: 1 })]))
    expect(entries).toEqual([
      { name: 'egg', count: 2, note: 'Cheese omelette' },
      { name: 'cheese', count: undefined, note: 'Cheese omelette' },
    ])
  })

  it('ticking puts it straight in the kitchen, once', () => {
    const s0 = addToList(readList('two lemons'))(state())
    const id = s0.shopping[0].id
    const s1 = tick(id)(s0)
    expect(s1.items).toEqual([expect.objectContaining({ name: 'lemon', count: 2, location: 'fridge' })])
    expect(s1.shopping[0].done).toBe(true)
    expect(tick(id)(s1)).toBe(s1)
    expect(clearTicked(s1).shopping).toEqual([])
  })

  it('says beans, not bean', () => {
    expect(addToList([{ name: 'bean', note: 'Beans on toast' }])(state()).shopping[0].label).toBe('Beans')
    expect(addToList([{ name: 'milk' }])(state()).shopping[0].label).toBe('Milk')
  })

  it('can take things off', () => {
    const s = addToList(readList('jam'))(state())
    expect(unlist(s.shopping[0].id)(s).shopping).toEqual([])
  })
})

describe('running out puts it on the list', () => {
  it('when you say it is all gone', () => {
    const milk = item({ name: 'milk' })
    const s = allGone(milk.id)(state({ items: [milk] }))
    expect(s.items).toEqual([])
    expect(s.shopping[0]).toMatchObject({ name: 'milk', label: 'Milk', note: 'ran out' })
  })

  it('when the count goes to nothing, and when cooking uses the last', () => {
    const eggs = item({ name: 'egg', count: 2 })
    expect(setCount(eggs.id, 0)(state({ items: [eggs] })).shopping[0].name).toBe('egg')
    expect(spend([{ id: eggs.id, count: 2 }])(state({ items: [eggs] })).shopping[0].name).toBe('egg')
  })

  it('but not twice, and not for things still there', () => {
    const milk = item({ name: 'milk', amount: 'full' })
    let s = state({ items: [milk], shopping: [] })
    s = spend([{ id: milk.id, count: 1 }])(s)
    expect(s.shopping).toEqual([])
    s = addToList(readList('milk'))(s)
    s = allGone(milk.id)(s)
    expect(s.shopping).toHaveLength(1)
  })
})

describe("Basil's poses", () => {
  it('wakes, stretches and sits up for the cookbook', () => {
    const { intro, loop } = sequence('attentive', 'sleep')
    expect(intro.map(s => s.k)).toContain('cat/stretch-2')
    expect(loop[0].k).toBe('cat/up')
  })

  it('hops when happy, and settles before sleeping again', () => {
    expect(sequence('happy', 'sleep').intro.some(s => s.dy)).toBe(true)
    expect(sequence('sleep', 'happy').intro[0].k).toBe('cat/awake')
    expect(sequence('sleep', null).intro).toEqual([])
  })
})
