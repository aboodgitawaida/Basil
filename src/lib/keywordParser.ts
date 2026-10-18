import { normalise } from '../assets/manifest'
import { guessCategory, type Amount } from './schema'
import type { Draft } from './inventory'

/** The offline parser. It is the fallback when the model is unreachable or
 *  returns something that doesn't fit the schema, and it is what phase 2 ran
 *  on before there was a model at all. Deliberately dumb and never throws. */

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, dozen: 12,
}

const AMOUNT_WORDS: Array<[RegExp, Amount]> = [
  [/\bhalf\b|\bhalf a\b/, 'half'],
  [/\bnearly out\b|\blast\b|\bdregs\b|\balmost gone\b|\bbit of\b/, 'low'],
  [/\bfull\b|\bnew\b|\bunopened\b/, 'full'],
]

const COUNTABLE = /\begg|\bapple|\bbanana|\bonion|\bpotato|\blemon|\blime|\borange|\bpear|\bcan\b|\btin\b|\byoghurt|\byogurt/

export function splitPhrases(text: string): string[] {
  return text
    .split(/,|;|\band\b|\bplus\b|\n/gi)
    .map(s => s.trim())
    .filter(Boolean)
}

export function keywordParse(text: string): Draft[] {
  return splitPhrases(text).map(phrase => {
    const lower = phrase.toLowerCase()

    let count: number | undefined
    const digits = lower.match(/\b(\d+)\b/)
    if (digits) count = parseInt(digits[1], 10)
    if (count === undefined) {
      const said = (w: string) => new RegExp(`\\b${w}\\b`).test(lower)
      // a real number word wins over an article: "a dozen eggs" is 12, not 1
      const word = Object.keys(NUMBER_WORDS).find(w => w !== 'a' && w !== 'an' && said(w))
      if (word) count = NUMBER_WORDS[word]
      // "a" and "an" are articles far more often than counts, so they only
      // count when the phrase also names something countable
      else if ((said('a') || said('an')) && COUNTABLE.test(lower)) count = 1
    }

    let amount: Amount | undefined
    for (const [re, a] of AMOUNT_WORDS) if (re.test(lower)) { amount = a; break }

    const name = normalise(phrase) || lower
    return {
      displayName: phrase,
      name,
      category: guessCategory(name, phrase),
      amount: amount ?? 'full',
      count: count && COUNTABLE.test(lower) ? count : undefined,
    }
  })
}
