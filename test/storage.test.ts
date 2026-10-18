import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocalRepository } from '../src/lib/storage'
import { EMPTY_STATE, SCHEMA_VERSION } from '../src/lib/schema'
import { item, state } from './helpers'

const KEY = 'basil.state.v1'

function fakeStorage() {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  }
}

let store: ReturnType<typeof fakeStorage>
beforeEach(() => {
  store = fakeStorage()
  vi.stubGlobal('localStorage', store)
})
afterEach(() => vi.unstubAllGlobals())

describe('LocalRepository', () => {
  const repo = new LocalRepository()

  it('starts empty when nothing is saved', async () => {
    expect(await repo.load()).toEqual(EMPTY_STATE)
  })

  it('round-trips what it saved', async () => {
    const s = state({ items: [item()], quickAdd: { milk: 2 } })
    await repo.save(s)
    expect(await repo.load()).toEqual(s)
  })

  it('hands out a fresh empty state, not a shared one', async () => {
    const a = await repo.load()
    a.items.push(item())
    expect((await repo.load()).items).toEqual([])
    expect(EMPTY_STATE.items).toEqual([])
  })

  it('fills in settings added since the save was written', async () => {
    store.setItem(KEY, JSON.stringify({ version: SCHEMA_VERSION, items: [], history: [], quickAdd: {}, settings: { sound: true } }))
    const s = await repo.load()
    expect(s.settings).toEqual({ ...EMPTY_STATE.settings, sound: true })
  })

  it('keeps items from a save with no version number', async () => {
    const saved = item()
    store.setItem(KEY, JSON.stringify({ items: [saved] }))
    const s = await repo.load()
    expect(s.version).toBe(SCHEMA_VERSION)
    expect(s.items).toEqual([saved])
  })

  it('discards a save from a newer version rather than guessing at it', async () => {
    store.setItem(KEY, JSON.stringify({ version: SCHEMA_VERSION + 1, items: [item()] }))
    expect(await repo.load()).toEqual(EMPTY_STATE)
  })

  it('opens clean on corrupt data instead of failing', async () => {
    store.setItem(KEY, '{not json')
    expect(await repo.load()).toEqual(EMPTY_STATE)
    store.setItem(KEY, '"a string"')
    expect(await repo.load()).toEqual(EMPTY_STATE)
  })

  it('survives storage that throws (private mode, full disk)', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('quota') },
    })
    expect(await repo.load()).toEqual(EMPTY_STATE)
    await expect(repo.save(state())).resolves.toBeUndefined()
  })
})
