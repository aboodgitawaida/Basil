import { describe, expect, it } from 'vitest'
import { seasonAt, seasonOverride, tint } from '../src/lib/seasons'

describe('seasonAt', () => {
  it.each([
    ['2026-01-15', 'winter'], ['2026-03-01', 'spring'], ['2026-05-31', 'spring'],
    ['2026-06-01', 'summer'], ['2026-10-19', 'autumn'], ['2026-12-25', 'winter'],
  ])('%s is %s up north', (d, s) => expect(seasonAt(new Date(`${d}T12:00:00`))).toBe(s))

  it('flips for the southern hemisphere', () => {
    expect(seasonAt(new Date('2026-12-25T12:00:00'), true)).toBe('summer')
    expect(seasonAt(new Date('2026-10-19T12:00:00'), true)).toBe('spring')
  })
})

it('?season= previews a season, and ignores nonsense', () => {
  expect(seasonOverride('?season=winter')).toBe('winter')
  expect(seasonOverride('?season=monsoon')).toBeNull()
  expect(seasonOverride('')).toBeNull()
})

it('tint darkens without going out of range', () => {
  expect(tint('#ffffff', 0.5)).toBe('#808080')
  expect(tint('#102030', 1)).toBe('#102030')
})
