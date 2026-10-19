import { cookable } from './recipes'
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

  const make = cookable(items, undefined, 0).find(m => m.uses.filter(u => u.item).length > 1)
  if (make) {
    const name = make.recipe.name
    return { key: `make:${name}`, text: `You could make ${name.toLowerCase()}. It's all in there. Just saying.` }
  }
  return null
}

/** What he says when the cookbook opens, by how much the kitchen can do. */
export function cookbookLine(ready: number, almost: number, empty: boolean): string {
  if (empty) return 'Nothing in there. Impressive. Go shopping, I will be here.'
  if (ready === 0 && almost === 0) return 'Nothing I would put my name to. Shop. Then wake me.'
  if (ready === 0) return 'Close. A thing or two short. Story of your life.'
  if (ready === 1) return 'One thing you can make. I would make it.'
  if (ready > 8) return `${ready} things. You are spoilt. Pick one.`
  return `${ready} things you can make right now. I have opinions.`
}

export type Spoken = {
  title: string
  detail?: string
}
