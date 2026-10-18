/** The room is authored in art pixels where **1 art pixel = 1 centimetre**.
 *
 *  That ruler is what keeps objects honest: a 90cm counter is 90px tall, an
 *  apple is ~12px, a wall clock is 26px. Scale decisions go here, not into
 *  whatever size a sprite's source frame happened to be. */
export const ROOM = { w: 192, h: 240 } as const

/** Floor line. Furniture stands on it; below is foreground floor. */
export const FLOOR_Y = 208

/** Ceiling plane, so hanging things hang from something. */
export const CEILING_H = 8

export const COUNTER = { x: 0, units: 2, w: 64, h: 90 } as const
export const COUNTER_TOP = FLOOR_Y - COUNTER.h

export const FRIDGE = { x: 132, y: 38, w: 60, h: 170, freezerH: 52 } as const
export const CUPBOARD = { x: 84, y: 40, w: 44, h: 62 } as const
export const WINDOW = { x: 6, y: 26, w: 64, paneH: 72 } as const
export const LAMP = { x: 88, cordX: 99, cordTop: CEILING_H, shadeY: 18 } as const

/** Sunlight falling through the window onto the worktop. The cat sleeps in it. */
export const SUNPOOL = { x: 10, w: 58 } as const

/** Surface clutter, kept deliberately short: one group, not a scatter.
 *  [sprite, x, bottom] in centimetres. */
export const PROPS: Array<[string, number, number]> = [
  ['kit/pot', 88, COUNTER_TOP],
  ['kit/mixing-bowl', 112, COUNTER_TOP],
  ['generic/jar', 100, COUNTER_TOP],
]

/** Largest whole-number scale that fits the viewport, never below 2.
 *  Fractional scales are what make pixel art look muddy, so there aren't any. */
export function fitScale(vw: number, vh: number): number {
  return Math.max(2, Math.floor(Math.min(vw / ROOM.w, vh / ROOM.h)))
}
