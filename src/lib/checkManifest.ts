import { allSpriteKeys, hasSprite } from './sprites'
import { CATEGORY_FALLBACK, resolveSprite, type Category } from '../assets/manifest'

/** Dev-only: proves every route through the manifest lands on a real sprite. */
export function checkManifest(): string[] {
  const problems: string[] = []
  for (const [cat, key] of Object.entries(CATEGORY_FALLBACK)) {
    if (!hasSprite(key)) problems.push(`category "${cat}" falls back to missing sprite "${key}"`)
  }
  const probes = [
    '2 bags of milk', 'bread', 'peanut butter', 'half a block of mature cheddar',
    'eggs', 'chicken thighs', 'frozen peas', 'tin of chopped tomatoes',
    'quinoa', 'sriracha', 'oat milk', 'bramley apples', 'tofu', 'marmite',
  ]
  for (const p of probes) {
    const { key } = resolveSprite(p, 'other' as Category)
    if (!hasSprite(key)) problems.push(`"${p}" resolved to missing sprite "${key}"`)
  }
  if (allSpriteKeys().length === 0) problems.push('no sprites loaded at all')
  return problems
}
