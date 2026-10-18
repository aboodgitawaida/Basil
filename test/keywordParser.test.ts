import { describe, expect, it } from 'vitest'
import { keywordParse, splitPhrases } from '../src/lib/keywordParser'

it('splits on commas, "and", "plus", semicolons and new lines', () => {
  expect(splitPhrases('milk, bread and eggs; jam plus butter\ncheese')).toEqual([
    'milk', 'bread', 'eggs', 'jam', 'butter', 'cheese',
  ])
})

describe('keywordParse', () => {
  it('turns a typed list into drafts', () => {
    const drafts = keywordParse('2 bags of milk, half a block of cheddar, a dozen eggs')
    expect(drafts).toEqual([
      expect.objectContaining({ displayName: '2 bags of milk', name: 'milk', category: 'dairy', amount: 'full' }),
      expect.objectContaining({ name: 'cheddar', category: 'dairy', amount: 'half' }),
      expect.objectContaining({ name: 'egg', count: 12 }),
    ])
  })

  it('counts only countable things', () => {
    expect(keywordParse('3 apples')[0].count).toBe(3)
    expect(keywordParse('2 litres of milk')[0].count).toBeUndefined()
  })

  it('reads "a" as an article unless the thing is countable', () => {
    expect(keywordParse('a lemon')[0].count).toBe(1)
    expect(keywordParse('a bag of rice')[0].count).toBeUndefined()
  })

  it('notices when something is nearly gone', () => {
    expect(keywordParse('the last of the ketchup')[0].amount).toBe('low')
    expect(keywordParse('ketchup nearly out')[0].amount).toBe('low')
  })

  it('never throws and ignores empty input', () => {
    expect(keywordParse('')).toEqual([])
    expect(keywordParse(' , ,, and ')).toEqual([])
    expect(() => keywordParse('!!! ??? 123')).not.toThrow()
  })
})
