/** The room is authored in art pixels and scaled by a whole number to fit the
 *  viewport. Every coordinate in the scene is in these units. */
export const ROOM = { w: 192, h: 200 } as const

/** The line furniture stands on. */
export const FLOOR_Y = 168

/** Height of the wood dado band; the plaster above it fills the rest. */
export const DADO_H = 23

/** Height of the striped picture rail that sits on top of the dado. */
export const TRIM_H = 12

export const LAYOUT = {
  window:      { x: 104, y: 28 },
  wallCabinet: { x: 66,  y: 104 },
  fridge:      { x: 8,   y: 64, w: 44, h: FLOOR_Y - 64 },
  counter:     { x: 62,  units: 3 },
  cupboard:    { x: 150 },
  lamp:        { x: 67 },
  plant:       { x: 155 },
} as const

/** Largest whole-number scale that fits the viewport, never below 2.
 *  Fractional scales are what make pixel art look muddy, so there aren't any. */
export function fitScale(vw: number, vh: number): number {
  return Math.max(2, Math.floor(Math.min(vw / ROOM.w, vh / ROOM.h)))
}
