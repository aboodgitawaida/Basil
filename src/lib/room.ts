/** The room is authored in art pixels where **1 art pixel = 1 centimetre**.
 *
 *  That ruler is what keeps objects honest: a 90cm counter is 90px tall, the
 *  fridge is 166px, a wall clock is 26px, a milk carton is 28px. Objects are
 *  sized by what they are, not by whatever their source frame happened to be. */
export const ROOM = { w: 296, h: 240 } as const

/** The kitchen run (pantry, counter, fridge) is authored in its own 192cm
 *  space and placed this far in; the dining nook fills the wall to its left. */
export const KIT_X = 104
export const KIT_W = 192

/** Floor line. Furniture stands on it; below is foreground floor. */
export const FLOOR_Y = 208

/** Ceiling plane, so hanging things hang from something. */
export const CEILING_H = 8

export const COUNTER = { x: 0, units: 2, w: 52, h: 90 } as const
export const COUNTER_TOP = FLOOR_Y - COUNTER.h

/** The pack's fridge, mirrored so its door opens into the room. The body is
 *  pinned to `right`; the door grows leftwards out of it. */
export const FRIDGE = { right: 192, y: 42, w: 76, h: 166 } as const
export const PANTRY = { x: 0, y: FLOOR_Y - 90, w: 52, h: 90 } as const
export const WINDOW = { x: 4, y: 24, w: 64, paneH: 72 } as const
export const LAMP = { x: 76, cordX: 87, shadeY: 12 } as const
export const CLOCK = { x: 146, y: 10 } as const
/** `overhang` is how much of the sprite hangs past the worktop edge: the
 *  curled tail, which drapes over the front rather than resting on it. */
export const CAT = { x: 4, overhang: 10 } as const

/** Where things sit inside the fridge and the pantry, measured off the
 *  sprites. Shelf values are the surface an item stands on. */
export const FRIDGE_BAYS = {
  x: 120, w: 58, slots: 3,
  /** top bay doubles as the freezer; the pack's freezer door never opens */
  shelves: [124, 144, 166, 193],
  /** how much of the interior each door frame has revealed, as a left edge */
  revealed: [Infinity, Infinity, 150, 118, 118],
} as const

export const PANTRY_BAYS = {
  x: 10, w: 36, slots: 3,
  shelves: [150, 172, 196],
  /** the door narrows towards its hinge, so the interior clears from the right */
  revealed: [Infinity, 42, 28, 18],
} as const

/** Surface clutter, kept to one group with space around it.
 *  [sprite, x] in centimetres; everything stands on the worktop. */
export const PROPS: Array<[string, number]> = [
  ['kit/pot', 58],
  ['food/milk', 80],
  ['food/ketchup', 96],
]

/** The dining nook, left of the kitchen. Shelf values are the surface
 *  things stand on, measured off the cupboard sprite. */
export const NOOK = {
  /** surfaces are offsets from the top of the cupboard sprite */
  shelf: { x: 56, y: 36, surfaces: [20, 38, 57] },
  table: { x: 8, w: 78, h: 30 },
  lamp: { x: 26, cordX: 37, shadeY: 40 },
  picture: { x: 8, y: 52, w: 20, h: 24 },
} as const

export type Layout = { scale: number; left: number; top: number }

/** Largest whole-number scale that fits the viewport, never below 2.
 *  Fractional scales are what make pixel art look muddy, so there aren't any.
 *
 *  `reserve` is the height of the bar along the bottom. The floor line must
 *  stay above it so the fridge and cupboards are never covered; the strip of
 *  floor in front and the ceiling above may run under the menus, because
 *  both carry on past the room's edges anyway. When the whole room is too
 *  wide (a phone) the kitchen part is centred and the nook runs off the left. */
export function layout(vw: number, vh: number, reserve = 0): Layout {
  // what must be on screen: from just under the ceiling to the floor line
  const needH = FLOOR_Y - CEILING_H
  const room = Math.floor(Math.min(vw / ROOM.w, (vh - reserve) / needH))
  const scale = room >= 2 ? room : Math.max(2, Math.floor(Math.min(vw / KIT_W, (vh - reserve) / needH)))
  const focus = ROOM.w * scale <= vw ? ROOM.w / 2 : KIT_X + KIT_W / 2
  const centred = Math.round((vh - ROOM.h * scale) / 2)
  const floorLimit = vh - reserve - 6 - FLOOR_Y * scale
  return {
    scale,
    left: Math.round(vw / 2 - focus * scale),
    top: Math.max(-CEILING_H * scale, Math.min(centred, floorLimit)),
  }
}

export function fitScale(vw: number, vh: number): number {
  return layout(vw, vh).scale
}
