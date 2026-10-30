import { describe, expect, it } from 'vitest'
import { KIT_W, ROOM, layout } from '../src/lib/room'

describe('layout', () => {
  it('fits the whole room on a desktop, at a whole-number scale', () => {
    const v = layout(1440, 900, 105)
    expect(v.scale).toBe(3)
    expect(v.left).toBe(Math.round(720 - (ROOM.w / 2) * 3))
  })

  it('draws just the kitchen, bigger, on a portrait tablet', () => {
    const v = layout(820, 1180, 105)
    expect(v.scale).toBe(4)
    expect(KIT_W * v.scale).toBeLessThanOrEqual(820)
  })

  it('never goes below 2x on a phone', () => {
    expect(layout(390, 844, 90).scale).toBe(2)
  })
})
