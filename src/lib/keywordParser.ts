import { normalise } from '../assets/manifest'
import { COUNTABLE, guessCategory, kindOf, prettyName, type Amount } from './schema'
import type { Draft } from './inventory'

/** The offline parser. It is the fallback when the model is unreachable or
 *  returns something that doesn't fit the schema. Deliberately simple and
 *  never throws.
 *
 *  "two eggs"              -> Eggs, count 2
 *  "2 bags of milk"        -> Milk, count 2, unit bag
 *  "half a block of cheddar" -> Cheddar, half, unit block, kind cheese
 *  "2 litres of milk"      -> Milk, measure "2 litres"
 */

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, dozen: 12, couple: 2, pair: 2,
}

/** Containers: these are what a count is counted in. */
const UNITS: Record<string, string> = {
  bag: 'bag', bags: 'bag', bottle: 'bottle', bottles: 'bottle', block: 'block', blocks: 'block',
  carton: 'carton', cartons: 'carton', tin: 'tin', tins: 'tin', can: 'can', cans: 'can',
  jar: 'jar', jars: 'jar', pack: 'pack', packs: 'pack', packet: 'packet', packets: 'packet',
  box: 'box', boxes: 'box', loaf: 'loaf', loaves: 'loaf', bunch: 'bunch', bunches: 'bunch',
  tub: 'tub', tubs: 'tub', punnet: 'punnet', punnets: 'punnet', head: 'head', heads: 'head',
  pot: 'pot', pots: 'pot', tray: 'tray', trays: 'tray', slice: 'slice', slices: 'slice',
}

/** Sizes, which are not counts: "2 litres of milk" is one lot of milk. */
const MEASURE = /\b(\d+(?:\.\d+)?)\s*(l|litres?|liters?|ml|kg|g|grams?|lbs?|pounds?|oz|pints?)\b/

const AMOUNT_WORDS: Array<[RegExp, Amount]> = [
  [/\bhalf\b(?!\s+(a\s+)?dozen)/, 'half'],
  [/\bnearly out\b|\blast\b|\bdregs\b|\balmost gone\b|\bbit of\b|\bnearly empty\b/, 'low'],
  [/\bfull\b|\bnew\b|\bunopened\b/, 'full'],
]

export function splitPhrases(text: string): string[] {
  return text
    .split(/,|;|\band\b|\bplus\b|&|\n/gi)
    .map(s => s.trim())
    .filter(Boolean)
}

const said = (lower: string, w: string) => new RegExp(`\\b${w}\\b`).test(lower)

function readCount(lower: string): number | undefined {
  if (/\bhalf (a )?dozen\b/.test(lower)) return 6
  const times = lower.match(/\bx\s*(\d+)\b|\b(\d+)\s*x\b/)
  if (times) return parseInt(times[1] ?? times[2], 10)
  const digits = lower.match(/\b(\d+)\b(?!\s*(?:\.\d|l\b|litres?|liters?|ml|kg|g\b|grams?|lbs?|pounds?|oz|pints?))/)
  if (digits) return parseInt(digits[1], 10)
  const word = Object.keys(NUMBER_WORDS).find(w => said(lower, w))
  if (word) {
    // "two dozen eggs" is 24
    if (word !== 'dozen' && said(lower, 'dozen')) return NUMBER_WORDS[word] * 12
    return NUMBER_WORDS[word]
  }
  return undefined
}

function readUnit(lower: string): string | undefined {
  for (const w of lower.split(/[^a-z]+/)) if (UNITS[w]) return UNITS[w]
  return undefined
}

export function keywordParse(text: string): Draft[] {
  return splitPhrases(text).flatMap(phrase => {
    const lower = phrase.toLowerCase()
    const name = normalise(phrase)
    if (!name) return []

    const measureHit = lower.match(MEASURE)
    const measure = measureHit ? measureHit[0].replace(/\s+/g, ' ') : undefined
    const unit = readUnit(lower)
    let count = readCount(lower)
    // "a bag of rice" and "an apple" are one of something
    if (count === undefined && (said(lower, 'a') || said(lower, 'an')) && (unit || COUNTABLE.test(name))) count = 1

    let amount: Amount | undefined
    for (const [re, a] of AMOUNT_WORDS) if (re.test(lower)) { amount = a; break }

    return [{
      displayName: prettyName(name, count, unit),
      name,
      kind: kindOf(name),
      category: guessCategory(name, phrase),
      amount: amount ?? 'full',
      count: count && count > 0 ? Math.min(count, 999) : undefined,
      unit,
      measure,
    }]
  })
}
