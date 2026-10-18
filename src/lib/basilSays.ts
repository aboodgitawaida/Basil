import { localMakings, type Meal } from './ai'
import { daysLeft, isGoingOff, type Item } from './schema'

/** Basil's copy. Smug, sleepy, dry: he is right and he is not going to
 *  get up about it. No exclamation marks, no apologies. */

export type Remark = {
  /** same key = same remark; used so he doesn't nag about the same thing */
  key: string
  text: string
}

const joinNames = (names: string[]) =>
  names.length <= 1 ? names[0] ?? '' : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** What he says unprompted when the fridge opens, or null to stay asleep. */
export function fridgeRemark(items: Item[], now = new Date()): Remark | null {
  const going = items
    .filter(i => i.amount !== 'out' && isGoingOff(i, now))
    .sort((a, b) => (daysLeft(a, now) ?? 0) - (daysLeft(b, now) ?? 0))

  if (going.length) {
    const names = going.slice(0, 3).map(i => i.name)
    const gone = going.filter(i => (daysLeft(i, now) ?? 1) <= 0)
    const key = `off:${going.map(i => i.id).sort().join(',')}`
    if (gone.length) {
      return {
        key,
        text: gone.length === 1
          ? `The ${gone[0].name} has gone. I noticed. Eyes shut, and I noticed.`
          : `${cap(joinNames(gone.slice(0, 3).map(i => i.name)))} have gone. I noticed. I always notice.`,
      }
    }
    return {
      key,
      text: going.length === 1
        ? `The ${names[0]} is on its way out. Use it. Or don't. I'll watch.`
        : `${cap(joinNames(names))} are about to turn. Bold of you to leave them.`,
    }
  }

  const make = localMakings(items)[0]
  if (make) {
    return { key: `make:${make.name}`, text: `You could make ${make.name.toLowerCase()}. It's all in there. Just saying.` }
  }
  return null
}

export const THINKING = 'Mm. Hold on.'
export const EMPTY = 'Nothing in there. Impressive. Go shopping, I will be here.'
export const NOTHING = 'Nothing I would put my name to. Shop. Then wake me.'

export type Spoken = {
  title: string
  detail?: string
  quip?: string
  /** why the model failed, when it did */
  note?: string
}

/** Best first: fewest things missing, then the ones using food that is going. */
export function ranked(meals: Meal[]): Meal[] {
  return [...meals].sort(
    (a, b) => a.missing.length - b.missing.length || b.usesSoon.length - a.usesSoon.length,
  )
}

export function speakMeal(meal: Meal, index: number, line?: string, why?: string): Spoken {
  return {
    title: meal.name,
    detail: meal.missing.length ? `short of ${meal.missing.join(', ')}` : `${meal.minutes} min`,
    // the model's line is about its best option, so only the first meal gets it
    quip: index === 0 ? line : undefined,
    note: why,
  }
}
