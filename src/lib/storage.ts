import { EMPTY_STATE, SCHEMA_VERSION, type AppState } from './schema'

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
const MIGRATIONS: Array<(s: any) => any> = []

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
