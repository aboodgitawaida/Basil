/** The season, from the real date. Meteorological seasons: spring is March to
 *  May and so on, flipped for the southern hemisphere. */

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']

export function seasonAt(d = new Date(), south = false): Season {
  const m = d.getMonth()
  const north: Season = m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter'
  if (!south) return north
  return SEASONS[(SEASONS.indexOf(north) + 2) % 4]
}

/** `?season=winter` in the address bar shows a season early, for a look. */
export function seasonOverride(search = typeof window === 'undefined' ? '' : window.location.search): Season | null {
  const s = new URLSearchParams(search).get('season')
  return SEASONS.includes(s as Season) ? (s as Season) : null
}

export const SEASON_LABEL: Record<Season, string> = {
  spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter',
}

/** Land colours: far hill, near field, trees, and a sprinkle colour (blossom,
 *  wildflowers, fallen leaves, or snow sparkle). */
export type Land = { far: string; near: string; tree: string; trunk: string; dot: string; dot2: string }

export const LAND: Record<Season, Land> = {
  spring: { far: '#8cc063', near: '#5f9a3e', tree: '#6ea845', trunk: '#5a3a22', dot: '#f4b6c8', dot2: '#fff4f0' },
  summer: { far: '#5f9a3e', near: '#3f7a2e', tree: '#356b28', trunk: '#5a3a22', dot: '#f2d64e', dot2: '#ffffff' },
  autumn: { far: '#b98a40', near: '#8a6a2e', tree: '#c8622e', trunk: '#4a2e1a', dot: '#e0953a', dot2: '#a8452f' },
  winter: { far: '#e4edf0', near: '#cddbe0', tree: '#4f6b5a', trunk: '#4a3a32', dot: '#ffffff', dot2: '#b8cbd2' },
}

/** Darken a colour for night, warm it a little for dawn and evening. */
export function tint(hex: string, dim: number): string {
  const n = parseInt(hex.slice(1), 16)
  const f = (v: number) => Math.round(Math.max(0, Math.min(255, v * dim))).toString(16).padStart(2, '0')
  return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`
}

/** What drifts past outside when the weather isn't doing anything else. */
export const DRIFT: Record<Season, 'petals' | 'none' | 'leaves'> = {
  spring: 'petals', summer: 'none', autumn: 'leaves', winter: 'none',
}
