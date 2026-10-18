/** The room is authored in art pixels where **1 art pixel = 1 centimetre**.
 *
 *  That ruler is what keeps objects honest: a 90cm counter is 90px tall, the
 *  fridge is 166px, a wall clock is 26px, a milk carton is 28px. Objects are
 *  sized by what they are, not by whatever their source frame happened to be. */
export const ROOM = { w: 192, h: 240 } as const

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

/** Surface clutter, kept to one group with space around it.
 *  [sprite, x] in centimetres; everything stands on the worktop. */
export const PROPS: Array<[string, number]> = [
  ['kit/pot', 58],
  ['food/milk', 80],
  ['food/ketchup', 96],
]

/** Largest whole-number scale that fits the viewport, never below 2.
 *  Fractional scales are what make pixel art look muddy, so there aren't any. */
export function fitScale(vw: number, vh: number): number {
  return Math.max(2, Math.floor(Math.min(vw / ROOM.w, vh / ROOM.h)))
}
