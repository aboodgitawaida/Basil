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
      expect.objectContaining({ displayName: 'Milk', name: 'milk', category: 'dairy', amount: 'full', count: 2, unit: 'bag' }),
      expect.objectContaining({ displayName: 'Cheddar', name: 'cheddar', kind: 'cheese', category: 'dairy', amount: 'half', unit: 'block' }),
      expect.objectContaining({ displayName: 'Eggs', name: 'egg', count: 12 }),
    ])
  })

  it('labels the thing and keeps the number apart: "two eggs" is Eggs, two of them', () => {
    expect(keywordParse('two eggs')[0]).toMatchObject({ displayName: 'Eggs', name: 'egg', count: 2 })
    expect(keywordParse('3 apples')[0]).toMatchObject({ displayName: 'Apples', count: 3 })
    expect(keywordParse('half a dozen eggs')[0].count).toBe(6)
    expect(keywordParse('chicken breasts x2')[0]).toMatchObject({ displayName: 'Chicken Breasts', count: 2 })
  })

  it('treats sizes as a measure, not a count', () => {
    expect(keywordParse('2 litres of milk')[0]).toMatchObject({ name: 'milk', measure: '2 litres', count: undefined })
    expect(keywordParse('500g beef mince')[0]).toMatchObject({ name: 'beef mince', measure: '500g' })
  })

  it('reads "a" as one when there is a container or a countable thing', () => {
    expect(keywordParse('a lemon')[0].count).toBe(1)
    expect(keywordParse('a bag of rice')[0]).toMatchObject({ count: 1, unit: 'bag', displayName: 'Rice' })
    expect(keywordParse('the rice')[0].count).toBeUndefined()
  })

  it('knows what kind of thing a specific one is', () => {
    expect(keywordParse('sourdough loaf')[0]).toMatchObject({ kind: 'bread', category: 'grain' })
    expect(keywordParse('basmati')[0].kind).toBe('rice')
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
