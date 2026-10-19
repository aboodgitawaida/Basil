import { EMPTY_STATE, SCHEMA_VERSION, prettyName, type AppState } from './schema'

/** The whole persistence surface. Swapping localStorage for an API later means
 *  writing one more implementation of this and changing `repository` below —
 *  nothing in the UI touches storage directly. */
export interface Repository {
  load(): Promise<AppState>
  save(state: AppState): Promise<void>
}

const KEY = 'basil.state.v1'

/** Migrations run oldest-first. Each takes the previous shape and returns the
 *  next one; unknown future versions are discarded rather than guessed at. */
const MIGRATIONS: Array<(s: any) => any> = [
  // 0 -> 1: nothing changed shape
  s => s,
  // 1 -> 2: labels lose their quantities ("two eggs" -> "Eggs"), and the
  // light switch stops pretending to be the time of day
  s => {
    const { lightOverride: _gone, ...settings } = s.settings ?? {}
    return {
      ...s,
      settings: { ...settings, lamp: null },
      items: Array.isArray(s.items)
        ? s.items.map((i: any) => (typeof i?.displayName === 'string' && typeof i?.name === 'string' && QUANTITY.test(i.displayName)
          ? { ...i, displayName: prettyName(i.name, i.count, i.unit) }
          : i))
        : [],
    }
  },
]

const QUANTITY = /\d|\b(a|an|one|two|three|four|five|six|seven|eight|nine|ten|dozen|half|bags?|bottles?|blocks?|of)\b/i

function migrate(raw: any): AppState {
  if (!raw || typeof raw !== 'object') return structuredClone(EMPTY_STATE)
  let state = raw
  let v: number = typeof state.version === 'number' ? state.version : 0
  if (v > SCHEMA_VERSION) return structuredClone(EMPTY_STATE)
  while (v < SCHEMA_VERSION) {
    const step = MIGRATIONS[v]
    state = step ? step(state) : state
    v += 1
  }
  return {
    ...structuredClone(EMPTY_STATE),
    ...state,
    version: SCHEMA_VERSION,
    settings: { ...EMPTY_STATE.settings, ...(state.settings ?? {}) },
  }
}

export class LocalRepository implements Repository {
  async load(): Promise<AppState> {
    try {
      const raw = localStorage.getItem(KEY)
      return migrate(raw ? JSON.parse(raw) : null)
    } catch {
      // private mode, blocked site data, corrupt JSON — start clean rather
      // than refusing to open the app
      return structuredClone(EMPTY_STATE)
    }
  }

  async save(state: AppState): Promise<void> {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* nothing we can do, and nothing the cook needs to hear about */
    }
  }
}

export const repository: Repository = new LocalRepository()
