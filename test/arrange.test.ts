import { describe, expect, it } from 'vitest'
import { arrange } from '../src/lib/arrange'
import { AREAS } from '../src/lib/room'
import { handCells } from '../src/scene/Clock'
import { item } from './helpers'

const overlaps = (a: { x: number; y: number; w: number; h: number }, b: typeof a) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

describe('arrange', () => {
  const fridge = [
    item({ name: 'milk', spriteKey: 'food/milk' }),
    item({ name: 'cheese', spriteKey: 'food/cheese' }),
    item({ name: 'egg', spriteKey: 'food/egg', count: 6 }),
    item({ name: 'steak', spriteKey: 'food/steak' }),
    item({ name: 'broccoli', spriteKey: 'food/broccoli' }),
    item({ name: 'ketchup', spriteKey: 'food/ketchup' }),
    ...Array.from({ length: 12 }, (_, n) => item({ name: `apple ${n}`, spriteKey: 'food/apple' })),
  ]

  it('never draws one thing on top of another', () => {
    const { placed } = arrange(fridge)
    for (const a of placed) for (const b of placed) if (a !== b) expect(overlaps(a, b), `${a.item.name} / ${b.item.name}`).toBe(false)
  })

  it('keeps everything inside its shelf, standing on it', () => {
    for (const p of arrange(fridge).placed) {
      expect(p.x).toBeGreaterThanOrEqual(p.area.x)
      expect(p.x + p.w).toBeLessThanOrEqual(p.area.x + p.area.w)
      expect(p.y + p.h).toBe(p.area.surface)
      expect(p.y).toBeGreaterThanOrEqual(p.area.top)
    }
  })

  it('puts bottles in the door and the rest on the shelves', () => {
    const { placed } = arrange(fridge)
    expect(placed.find(p => p.item.name === 'milk')?.area.part).toBe('fridge-door')
    expect(placed.find(p => p.item.name === 'ketchup')?.area.part).toBe('fridge-door')
    expect(placed.find(p => p.item.name === 'steak')?.area.part).toBe('fridge')
  })

  it('counts what does not fit rather than piling it up', () => {
    const many = Array.from({ length: 40 }, (_, n) => item({ name: `cheese ${n}`, spriteKey: 'food/cheese' }))
    const { placed, hidden } = arrange(many)
    expect(placed.length + hidden.fridge.length).toBe(40)
    expect(hidden.fridge.length).toBeGreaterThan(0)
  })

  it('keeps each place to its own shelves', () => {
    const { placed } = arrange([
      item({ location: 'freezer', spriteKey: 'generic/box' }),
      item({ location: 'cupboard', spriteKey: 'generic/bag' }),
    ])
    expect(placed.map(p => p.area.place).sort()).toEqual(['cupboard', 'freezer'])
  })

  it('every area is on the 2px grid and has room for something', () => {
    for (const a of AREAS) {
      expect(a.surface - a.top, a.id).toBeGreaterThanOrEqual(20)
      expect(a.w % 2, a.id).toBe(0)
    }
  })
})

describe('clock hands', () => {
  it('point the right way', () => {
    expect(handCells(0, 3).at(-1)).toEqual([0, -3])      // twelve
    expect(handCells(0.25, 3).at(-1)).toEqual([3, 0])    // three
    expect(handCells(0.5, 3).at(-1)).toEqual([0, 3])     // six
    expect(handCells(0.75, 3).at(-1)).toEqual([-3, 0])   // nine
  })
})
