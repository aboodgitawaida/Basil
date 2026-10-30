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

/** The two cupboards under the worktop: the one on the left and the one
 *  that used to be drawers. Both use room/cupboard-inside. */
export const CUPBOARDS = [
  { x: 0, hinge: 'left' as const },
  { x: 52, hinge: 'right' as const },
]

/** One run of shelf something can stand on. `top` is how high the space
 *  goes, so a 28cm carton is never put on a 22cm shelf. Measured off the
 *  sprites built by tools/doors.py; keep the two in step. */
export type Area = {
  id: string
  /** which door it is behind */
  part: 'fridge' | 'fridge-door' | 'freezer' | 'freezer-door' | 'cup-0' | 'cup-1'
  place: 'fridge' | 'freezer' | 'cupboard'
  x: number
  w: number
  top: number
  surface: number
}

const BODY_X = FRIDGE.right - FRIDGE.w   // 116, the fridge body's left edge
/** the inside of each door, opened out to the left of the hinge */
export const DOOR_PANEL = { x: BODY_X - 68, fridgeY: FRIDGE.y + 60, freezerY: FRIDGE.y - 2 } as const

export const AREAS: Area[] = [
  // freezer compartment: body rows 0-60
  { id: 'freezer-1', part: 'freezer', place: 'freezer', x: BODY_X + 10, w: 56, top: FRIDGE.y + 4, surface: FRIDGE.y + 30 },
  { id: 'freezer-2', part: 'freezer', place: 'freezer', x: BODY_X + 10, w: 56, top: FRIDGE.y + 34, surface: FRIDGE.y + 56 },
  { id: 'freezer-door', part: 'freezer-door', place: 'freezer', x: DOOR_PANEL.x + 10, w: 48, top: DOOR_PANEL.freezerY + 10, surface: DOOR_PANEL.freezerY + 56 },
  // fridge compartment: body rows 62-154, shelves at 34 and 62, floor at 88
  { id: 'fridge-1', part: 'fridge', place: 'fridge', x: BODY_X + 10, w: 56, top: FRIDGE.y + 66, surface: FRIDGE.y + 96 },
  { id: 'fridge-2', part: 'fridge', place: 'fridge', x: BODY_X + 10, w: 56, top: FRIDGE.y + 100, surface: FRIDGE.y + 124 },
  { id: 'fridge-3', part: 'fridge', place: 'fridge', x: BODY_X + 10, w: 56, top: FRIDGE.y + 128, surface: FRIDGE.y + 150 },
  // the door's two bins, where bottles go
  { id: 'door-1', part: 'fridge-door', place: 'fridge', x: DOOR_PANEL.x + 10, w: 48, top: DOOR_PANEL.fridgeY + 8, surface: DOOR_PANEL.fridgeY + 46 },
  { id: 'door-2', part: 'fridge-door', place: 'fridge', x: DOOR_PANEL.x + 10, w: 48, top: DOOR_PANEL.fridgeY + 50, surface: DOOR_PANEL.fridgeY + 88 },
  // cupboards: carcass rows 12-44 and 50-78, interior cols 8-44
  ...CUPBOARDS.flatMap((c, n) => [
    { id: `cup-${n}-1`, part: `cup-${n}` as Area['part'], place: 'cupboard' as const, x: c.x + 8, w: 36, top: PANTRY.y + 12, surface: PANTRY.y + 44 },
    { id: `cup-${n}-2`, part: `cup-${n}` as Area['part'], place: 'cupboard' as const, x: c.x + 8, w: 36, top: PANTRY.y + 50, surface: PANTRY.y + 78 },
  ]),
]

/** How far into the compartment each door frame lets you see, measured from
 *  the hinge: frames 1 and 2 are the closed door squashed to 46 and 18. */
export const FRIDGE_REVEAL = [76, 46, 18, 0, 0] as const
/** Cupboard door widths per frame (pantry-door-N), from the hinge side. */
export const CUPBOARD_DOOR_W = [44, 30, 16, 4] as const

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
  // on a desktop the menu buttons and the clock box sit either side of the
  // room's top; leave them their own margins so they never cover the room
  const sides = vw >= 900 ? 2 * 240 : 0
  const room = Math.floor(Math.min((vw - sides) / ROOM.w, (vh - reserve) / needH))
  // just the kitchen half (counter, cupboards, fridge), cropping the table
  const kitchen = Math.max(2, Math.floor(Math.min(vw / KIT_W, (vh - reserve) / needH)))
  // a tall screen would draw the whole room small in a band across the
  // middle; when the kitchen alone can be drawn bigger, it is
  const scale = room >= 2 && !(vh > vw && kitchen > room) ? room : kitchen
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
