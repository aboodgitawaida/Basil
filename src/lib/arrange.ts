import { AREAS, type Area } from './room'
import type { Item } from './schema'
import { spriteSize } from './sprites'

/** Where one item is drawn. A small counted thing (eggs) is drawn up to three
 *  times in a row, `step` apart. */
export type Placed = { item: Item; area: Area; x: number; y: number; w: number; h: number; copies: number; step: number }

export type Arrangement = {
  placed: Placed[]
  /** what didn't fit anywhere, per place, so the scene can say "+3 more" */
  hidden: Record<Area['place'], Item[]>
}

const GAP = 2

/** Bottles and cartons stand in the fridge door, like in a real fridge. */
const BOTTLES = new Set([
  'food/milk', 'food/milk-bottle', 'food/tetrapak', 'food/juice', 'food/juice-carton', 'food/ketchup',
  'food/mustard', 'food/hot-sauce', 'food/water', 'food/wine', 'food/oil', 'generic/jar',
])
export const isBottle = (i: Item) => BOTTLES.has(i.spriteKey)

function footprint(i: Item): { w: number; h: number; copies: number; step: number; one: number } {
  const { w: one, h } = spriteSize(i.spriteKey)
  const copies = one <= 14 ? Math.min(i.count ?? 1, 3) : 1
  // copies overlap a little, like eggs in a row
  const step = copies > 1 ? Math.max(4, Math.ceil(one * 0.6)) : 0
  return { w: one + step * (copies - 1), h, copies, step, one }
}

/** The order to try areas in for an item: the door for bottles, otherwise
 *  the shortest shelf it fits, so tall shelves stay free for tall things. */
function candidates(i: Item, areas: Area[], h: number): Area[] {
  const fits = areas.filter(a => a.surface - a.top >= h)
  const bottle = isBottle(i)
  const isDoor = (a: Area) => a.part.endsWith('-door')
  return [...fits].sort((a, b) =>
    (bottle ? Number(isDoor(b)) - Number(isDoor(a)) : Number(isDoor(a)) - Number(isDoor(b)))
    || (a.surface - a.top) - (b.surface - b.top)
    || a.surface - b.surface,
  )
}

/**
 * Lays everything out on real shelves, side by side with a small gap,
 * bottoms on the shelf, each row centred. Nothing is ever drawn on top of
 * anything else: what doesn't fit is counted instead. Tall things are placed
 * first so they get the tall shelves; on screen each shelf keeps the order
 * things were added in.
 */
export function arrange(items: Item[], areas: Area[] = AREAS): Arrangement {
  const used = new Map<string, number>()
  const rows = new Map<string, Array<{ item: Item; n: number; f: ReturnType<typeof footprint> }>>()
  const hidden: Arrangement['hidden'] = { fridge: [], freezer: [], cupboard: [] }

  const order = items
    .map((item, n) => ({ item, n, f: footprint(item) }))
    .sort((a, b) => b.f.h - a.f.h || a.n - b.n)

  for (const { item, n, f } of order) {
    const here = areas.filter(a => a.place === item.location)
    const area = candidates(item, here, f.h).find(a => (used.get(a.id) ?? -GAP) + GAP + f.w <= a.w)
    if (!area) { hidden[item.location].push(item); continue }
    used.set(area.id, (used.get(area.id) ?? -GAP) + GAP + f.w)
    const row = rows.get(area.id) ?? []
    row.push({ item, n, f })
    rows.set(area.id, row)
  }

  const placed: Placed[] = []
  for (const area of areas) {
    const row = (rows.get(area.id) ?? []).sort((a, b) => a.n - b.n)
    const width = row.reduce((s, r) => s + r.f.w, 0) + GAP * Math.max(0, row.length - 1)
    let x = area.x + Math.floor((area.w - width) / 2 / 2) * 2   // centred, on the 2px grid
    for (const { item, f } of row) {
      placed.push({ item, area, x, y: area.surface - f.h, w: f.w, h: f.h, copies: f.copies, step: f.step })
      x += f.w + GAP
    }
  }
  // keep the original order of hidden things too
  for (const k of Object.keys(hidden) as Array<keyof typeof hidden>) {
    hidden[k].sort((a, b) => items.indexOf(a) - items.indexOf(b))
  }
  return { placed, hidden }
}
