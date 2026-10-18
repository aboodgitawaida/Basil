import index from '../assets/sprites/index.json'

const urls = import.meta.glob('../assets/sprites/**/*.png', { eager: true, as: 'url' }) as Record<string, string>

const byKey: Record<string, string> = {}
for (const [path, url] of Object.entries(urls)) {
  const key = path.replace('../assets/sprites/', '').replace(/\.png$/, '')
  byKey[key] = url
}

export type SpriteKey = keyof typeof index & string
export type SpriteSize = { w: number; h: number }

const sizes = index as Record<string, SpriteSize>

export const hasSprite = (key: string): boolean => key in byKey
export const spriteUrl = (key: string): string | undefined => byKey[key]
export const spriteSize = (key: string): SpriteSize => sizes[key] ?? { w: 16, h: 16 }
export const allSpriteKeys = (): string[] => Object.keys(byKey).sort()
