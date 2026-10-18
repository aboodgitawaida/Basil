import { describe, expect, it } from 'vitest'
import {
  SHELVES, SLOTS_PER_SHELF, addItems, freeSlot, materialise, moveItem,
  removeItem, setAmount, spendItems, topQuickAdd,
} from '../src/lib/inventory'
import { item, state } from './helpers'

describe('freeSlot', () => {
  it('fills shelves left to right, top to bottom', () => {
    expect(freeSlot('fridge', [])).toEqual({ shelf: 0, position: 0 })
    const taken = [item({ shelf: 0, position: 0 }), item({ shelf: 0, position: 1 })]
    expect(freeSlot('fridge', taken)).toEqual({ shelf: 0, position: 2 })
    taken.push(item({ shelf: 0, position: 2 }))
    expect(freeSlot('fridge', taken)).toEqual({ shelf: 1, position: 0 })
  })

  it('only counts items in the same place', () => {
    const inCupboard = [item({ location: 'cupboard', shelf: 0, position: 0 })]
    expect(freeSlot('fridge', inCupboard)).toEqual({ shelf: 0, position: 0 })
  })

  it('stacks on the last slot when everything is full rather than refusing', () => {
    const full = []
    for (let shelf = 0; shelf < SHELVES.freezer; shelf++)
      for (let position = 0; position < SLOTS_PER_SHELF; position++)
        full.push(item({ location: 'freezer', shelf, position }))
    expect(freeSlot('freezer', full)).toEqual({ shelf: SHELVES.freezer - 1, position: SLOTS_PER_SHELF - 1 })
  })
})

describe('materialise', () => {
  it('guesses everything a bare typed name leaves out', () => {
    const it_ = materialise({ displayName: '  2 bags of milk ' }, [])
    expect(it_).toMatchObject({
      name: 'milk',
      displayName: '2 bags of milk',
      category: 'dairy',
      location: 'fridge',
      amount: 'full',
      shelf: 0,
      position: 0,
    })
    expect(it_.expiresAt).toBeTruthy()
    expect(it_.spriteKey).toBe('food/milk')
  })

  it('keeps what the draft did say', () => {
    const it_ = materialise({ displayName: 'Peas', category: 'frozen', location: 'cupboard', amount: 'low' }, [])
    expect(it_).toMatchObject({ category: 'frozen', location: 'cupboard', amount: 'low' })
  })
})

describe('addItems', () => {
  it('gives each new item its own slot and counts it for quick-add', () => {
    const s = addItems([{ displayName: 'milk' }, { displayName: 'cheese' }, { displayName: 'milk' }])(state())
    expect(s.items).toHaveLength(3)
    const slots = s.items.map(i => `${i.location}:${i.shelf}:${i.position}`)
    expect(new Set(slots).size).toBe(3)
    expect(s.quickAdd).toEqual({ milk: 2, cheese: 1 })
  })

  it('does not change the state it was given', () => {
    const before = state()
    addItems([{ displayName: 'milk' }])(before)
    expect(before.items).toHaveLength(0)
    expect(before.quickAdd).toEqual({})
  })
})

describe('edits', () => {
  it('removes and re-amounts by id only', () => {
    const a = item(), b = item()
    const s = state({ items: [a, b] })
    expect(removeItem(a.id)(s).items).toEqual([b])
    const changed = setAmount(b.id, 'low')(s)
    expect(changed.items.find(i => i.id === b.id)?.amount).toBe('low')
    expect(changed.items.find(i => i.id === a.id)?.amount).toBe('full')
  })

  it('moves into a free slot in the new place', () => {
    const there = item({ location: 'cupboard', shelf: 0, position: 0 })
    const mover = item({ location: 'fridge', shelf: 2, position: 2 })
    const s = moveItem(mover.id, 'cupboard')(state({ items: [there, mover] }))
    expect(s.items.find(i => i.id === mover.id)).toMatchObject({ location: 'cupboard', shelf: 0, position: 1 })
  })

  it('moving to where it already is changes nothing', () => {
    const s = state({ items: [item()] })
    expect(moveItem(s.items[0].id, 'fridge')(s)).toBe(s)
    expect(moveItem('nope', 'cupboard')(s)).toBe(s)
  })
})

describe('spendItems', () => {
  it('steps amounts down and drops what runs out', () => {
    const full = item({ amount: 'full' }), half = item({ amount: 'half' }), low = item({ amount: 'low' })
    const untouched = item({ amount: 'low' })
    const s = spendItems([full.id, half.id, low.id])(state({ items: [full, half, low, untouched] }))
    expect(s.items.map(i => [i.id, i.amount])).toEqual([
      [full.id, 'half'],
      [half.id, 'low'],
      [untouched.id, 'low'],
    ])
  })

  it('uses up counted things one at a time', () => {
    const eggs = item({ name: 'egg', count: 6 })
    const s = spendItems([eggs.id])(state({ items: [eggs] }))
    expect(s.items[0]).toMatchObject({ count: 5, amount: 'full' })
  })
})

it('topQuickAdd returns the most added names first', () => {
  const s = state({ quickAdd: { milk: 5, bread: 9, eggs: 1, jam: 3 } })
  expect(topQuickAdd(s, 3)).toEqual(['bread', 'milk', 'jam'])
})
