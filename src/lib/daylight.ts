/** How dark the room is, 0 (noon) to 1 (middle of the night).
 *  One curve, used to drive a tint overlay and the lamp — not two
 *  stylesheets. */
export function nightLevel(d = new Date()): number {
  const hours = d.getHours() + d.getMinutes() / 60
  // full dark before 6 and after 21, full light 10-16, ramps between
  if (hours <= 5 || hours >= 22) return 1
  if (hours >= 10 && hours <= 16) return 0
  if (hours < 10) return clamp((10 - hours) / 5)
  return clamp((hours - 16) / 6)
}

const clamp = (n: number) => Math.max(0, Math.min(1, n))

export type Lighting = { night: number; lamp: number; sky: string }

/** The sky through the window follows the same clock. */
export function lighting(night: number): Lighting {
  const sky =
    night > 0.8 ? 'var(--blue-dark)'
    : night > 0.5 ? 'var(--blue)'
    : night > 0.2 ? 'var(--terracotta)'
    : 'var(--blue-light)'
  return { night, lamp: night, sky }
}
