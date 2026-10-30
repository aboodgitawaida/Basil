const urls = import.meta.glob('../assets/audio/*.ogg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

const byName: Record<string, string> = {}
for (const [path, url] of Object.entries(urls)) {
  byName[path.replace('../assets/audio/', '').replace('.ogg', '')] = url
}

export const CUES = {
  fridgeOpen: 'ui-open_001',
  fridgeClose: 'ui-close_001',
  cupboard: 'ui-drop_003',
  place: 'ui-click_001',
  cook: 'ui-confirmation_001',
  toggle: 'ui-switch_002',
  nope: 'ui-error_002',
} as const

/**
 * Muted by default and never autoplays: the first sound only ever happens
 * after a click, which is also what browsers require. Effects and music are
 * switched separately.
 */
class Sound {
  private enabled = false
  private musicOn = false
  private track = 'music-drink-and-chill'
  private music?: HTMLAudioElement
  private cache = new Map<string, HTMLAudioElement>()

  setEnabled(on: boolean) {
    this.enabled = on
  }

  setMusic(on: boolean, track?: 'title' | 'kitchen') {
    const want = track === 'title' ? 'music-autumn' : track === 'kitchen' ? 'music-drink-and-chill' : this.track
    if (want !== this.track) {
      this.music?.pause()
      this.music = undefined
      this.track = want
    }
    this.musicOn = on
    if (!on) { this.music?.pause(); return }
    void this.startMusic()
  }

  private async startMusic() {
    this.music ??= Object.assign(new Audio(byName[this.track]), { loop: true, volume: 0.25 })
    try {
      await this.music.play()
    } catch {
      /* the browser said no; the next click will take */
    }
  }

  /** Call from a click: browsers only allow audio to start inside one. */
  nudge() {
    if (this.musicOn && this.music?.paused) void this.startMusic()
  }

  play(cue: keyof typeof CUES, volume = 0.5) {
    if (!this.enabled) return
    const name = CUES[cue]
    const url = byName[name]
    if (!url) return
    let el = this.cache.get(name)
    if (!el) {
      el = new Audio(url)
      this.cache.set(name, el)
    }
    el.volume = volume
    el.currentTime = 0
    void el.play().catch(() => {})
  }
}

export const sound = new Sound()
