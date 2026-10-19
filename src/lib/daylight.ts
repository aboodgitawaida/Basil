/** Time of day, from the real clock. The sky outside always follows this;
 *  the light switch only changes the lamp indoors. */

/** How dark it is outside, 0 (noon) to 1 (middle of the night). */
export function nightLevel(d = new Date()): number {
  const hours = d.getHours() + d.getMinutes() / 60
  // full dark before 5 and after 22, full light 9-17, ramps between
  if (hours <= 5 || hours >= 22) return 1
  if (hours >= 9 && hours <= 17) return 0
  if (hours < 9) return clamp((9 - hours) / 4)
  return clamp((hours - 17) / 5)
}

const clamp = (n: number) => Math.max(0, Math.min(1, n))

export type Phase = 'night' | 'dawn' | 'morning' | 'day' | 'evening' | 'dusk'

export function phaseAt(d = new Date()): Phase {
  const h = d.getHours() + d.getMinutes() / 60
  if (h < 5 || h >= 21) return 'night'
  if (h < 7) return 'dawn'
  if (h < 11) return 'morning'
  if (h < 17) return 'day'
  if (h < 19) return 'evening'
  return 'dusk'
}

/** Sky colours per phase: top band, middle band, horizon. Three hard bands,
 *  no gradient, so the pane stays crisp. */
export const SKY: Record<Phase, [string, string, string]> = {
  night:   ['#141a33', '#1d2647', '#2a3358'],
  dawn:    ['#4a4f7c', '#c97a7e', '#f2b880'],
  morning: ['#7fb6d9', '#a3cde3', '#d8ecef'],
  day:     ['#5d9fd6', '#7fb6e3', '#b4d8ec'],
  evening: ['#e0925a', '#f0b26a', '#f8d68a'],
  dusk:    ['#2e2c5a', '#6b4472', '#c0645a'],
}

/** Where the sun (by day) or moon (by night) sits along its arc, 0 rising on
 *  the left to 1 setting on the right. */
export function arc(d = new Date()): { body: 'sun' | 'moon'; t: number } {
  const h = d.getHours() + d.getMinutes() / 60
  if (h >= 6 && h < 20) return { body: 'sun', t: (h - 6) / 14 }
  const nightH = h >= 20 ? h - 20 : h + 4
  return { body: 'moon', t: nightH / 10 }
}

/** A stepped arc height: 0 at either end, 1 overhead. */
export const arcHeight = (t: number) => Math.sin(Math.PI * Math.max(0, Math.min(1, t)))

export const GREETING: Record<Phase, string> = {
  night: 'Late one', dawn: 'Early start', morning: 'Morning',
  day: 'Afternoon', evening: 'Evening', dusk: 'Evening',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export function clockText(d = new Date()): { day: string; time: string } {
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const h12 = h % 12 === 0 ? 12 : h % 12
  return { day: `${DAYS[d.getDay()]}. ${d.getDate()}`, time: `${h12}:${m} ${h < 12 ? 'am' : 'pm'}` }
}
