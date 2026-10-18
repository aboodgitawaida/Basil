/** The room is authored in art pixels and scaled by a whole number to fit the
 *  viewport. Every coordinate in the scene is in these units. */
export const ROOM = { w: 192, h: 240 } as const

/** The line furniture stands on. Everything below it is foreground floor. */
export const FLOOR_Y = 212

export const DADO_H = 23
export const TRIM_H = 12

export const FRIDGE = { x: 6, y: 96, w: 44, h: 116, freezerH: 36 } as const
export const COUNTER = { x: 52, units: 4 } as const
export const SPLASH = { x: 54, w: 104, top: 126 } as const
export const WINDOW = { x: 96, y: 40, w: 56, h: 48 } as const

/** Things that sit on a surface: [sprite, x, bottom]. Kept as data so the
 *  room can be re-dressed without touching the markup. */
export const PROPS: Array<[string, number, number]> = [
  // upper shelf
  ['generic/jar', 9, 48], ['generic/can', 22, 48], ['kit/plate-stack', 31, 48],
  ['generic/cheese', 48, 48],
  // lower shelf
  ['generic/bottle', 8, 72], ['generic/jar', 20, 72], ['kit/bowl', 32, 72],
  ['food/lemon', 50, 72],
  // on top of the fridge
  ['generic/box', 10, 96], ['generic/bag', 30, 96],
  // along the counter
  ['kit/pot', 56, 191], ['kit/board', 76, 191], ['kit/chef-knife', 92, 191],
  ['kit/mixing-bowl', 104, 191], ['food/apple', 107, 183], ['food/orange', 114, 184],
  ['generic/jar', 126, 191], ['generic/bottle', 137, 191], ['kit/plate', 146, 191],
  // on the windowsill
  ['room/plant-small', 100, 88],
  // on the cupboard
  ['room/plant', 162, 184],
]

/** Utensils hanging from the rail, [sprite, x]. */
export const HANGING: Array<[string, number, boolean]> = [
  ['kit/ladle', 100, false], ['kit/spatula', 114, true], ['kit/pan', 130, true],
]
export const RAIL = { x: 98, w: 52, y: 140 } as const

/** Largest whole-number scale that fits the viewport, never below 2.
 *  Fractional scales are what make pixel art look muddy, so there aren't any. */
export function fitScale(vw: number, vh: number): number {
  return Math.max(2, Math.floor(Math.min(vw / ROOM.w, vh / ROOM.h)))
}
