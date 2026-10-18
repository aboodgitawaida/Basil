import { EMPTY_STATE, type AppState, type Item } from '../src/lib/schema'

let n = 0
/** A complete item with sensible defaults; override only what a test cares about. */
export function item(over: Partial<Item> = {}): Item {
  n += 1
  return {
    id: `item-${n}`,
    name: 'milk',
    displayName: 'milk',
    category: 'dairy',
    location: 'fridge',
    shelf: 0,
    position: 0,
    amount: 'full',
    addedAt: '2026-01-01T00:00:00.000Z',
    spriteKey: 'food/milk',
    ...over,
  }
}

export function state(over: Partial<AppState> = {}): AppState {
  return { ...structuredClone(EMPTY_STATE), ...over }
}
