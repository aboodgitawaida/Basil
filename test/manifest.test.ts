import { describe, expect, it } from 'vitest'
import { normalise, resolveSprite } from '../src/assets/manifest'
import { checkManifest } from '../src/lib/checkManifest'
import { hasSprite } from '../src/lib/sprites'

it('every route through the manifest lands on a sprite that exists', () => {
  expect(checkManifest()).toEqual([])
})

describe('normalise', () => {
  it.each([
    ['2 Bags of Mature Cheddar', 'cheddar'],
    ['half a block of cheese', 'cheese'],
    ['Free-range eggs', 'egg'],
    ['berries', 'berry'],
    ['peaches', 'peach'],
    ['glass', 'glass'],
  ])('%s -> %s', (input, out) => expect(normalise(input)).toBe(out))
})

describe('resolveSprite', () => {
  it('finds a direct match, then a word in the name, then a category fallback', () => {
    expect(resolveSprite('milk')).toEqual({ key: 'food/milk', exact: true })
    expect(resolveSprite('chicken stock', 'other').exact).toBe(true)
    const unknown = resolveSprite('dragonfruit', 'produce')
    expect(unknown.exact).toBe(false)
    expect(hasSprite(unknown.key)).toBe(true)
  })

  it('never returns a missing sprite, even for nonsense', () => {
    for (const s of ['', 'zzz', '123', 'a the of']) expect(hasSprite(resolveSprite(s).key)).toBe(true)
  })
})
