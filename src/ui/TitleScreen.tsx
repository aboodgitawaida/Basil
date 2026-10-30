import { useEffect, useRef, useState } from 'react'
import { SKY, arc, arcHeight, phaseAt, type Phase } from '../lib/daylight'
import { spriteUrl } from '../lib/sprites'
import { useLoop } from '../lib/useLoop'
import { Zoom } from './kit'
import { LAND, SEASON_LABEL, type Season } from '../lib/seasons'

type Props = {
  hasSave: boolean
  season: Season
  onStart: () => void
  onSettings: () => void
  onCredits: () => void
}

const W = 240
const H = 135

/** Hills, trees and a cottage, drawn once at a tiny size and scaled up with
 *  nearest-neighbour so every pixel is a hard square. The sky is the real
 *  time of day, the same as the kitchen window. */
function paint(c: HTMLCanvasElement, phase: Phase, now: Date, season: Season) {
  const land = LAND[season]
  const winter = season === 'winter'
  const g = c.getContext('2d')!
  const [top, mid, low] = SKY[phase]
  const night = phase === 'night' || phase === 'dusk'
  g.fillStyle = top; g.fillRect(0, 0, W, H)
  g.fillStyle = mid; g.fillRect(0, 40, W, H)
  g.fillStyle = low; g.fillRect(0, 66, W, H)

  if (night) {
    g.fillStyle = '#f4f0d8'
    for (let i = 0; i < 60; i++) g.fillRect((i * 97) % W, (i * 53) % 70, 1, 1)
  }
  const { body, t } = arc(now)
  const bx = Math.round(20 + t * (W - 40)), by = Math.round(80 - arcHeight(t) * 64)
  g.fillStyle = body === 'sun' ? (phase === 'evening' || phase === 'dawn' ? '#ffd28a' : '#fff1b8') : '#eef0dc'
  g.fillRect(bx - 5, by - 5, 10, 10)
  g.fillRect(bx - 6, by - 3, 12, 6)
  g.fillRect(bx - 3, by - 6, 6, 12)

  const hill = (base: number, amp: number, freq: number, off: number, colour: string) => {
    g.fillStyle = colour
    for (let x = 0; x < W; x++) {
      const y = Math.round(base - amp * Math.sin(x / freq + off) - amp * 0.4 * Math.sin(x / (freq * 0.37) + off * 2))
      g.fillRect(x, y, 1, H - y)
    }
  }
  const dim = night ? 0.45 : phase === 'evening' || phase === 'dawn' ? 0.8 : 1
  const shade = (hex: string) => {
    const n = parseInt(hex.slice(1), 16)
    const f = (v: number) => Math.round(v * dim).toString(16).padStart(2, '0')
    return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`
  }
  hill(86, 8, 30, 1, shade(land.far))
  hill(98, 6, 22, 3, shade(land.near))

  // trees along the back ridge, dressed for the season
  for (let i = 0; i < 14; i++) {
    const x = (i * 41 + 7) % W, y = 92 - ((i * 7) % 6)
    g.fillStyle = shade(i % 3 === 0 && season === 'autumn' ? '#d8a23a' : land.tree)
    g.fillRect(x - 3, y - 9, 7, 9); g.fillRect(x - 2, y - 12, 5, 3); g.fillRect(x - 1, y - 14, 3, 2)
    if (winter) { g.fillStyle = shade('#ffffff'); g.fillRect(x - 1, y - 14, 3, 1); g.fillRect(x - 2, y - 12, 5, 1); g.fillRect(x - 3, y - 9, 7, 1) }
    if (season === 'spring') { g.fillStyle = shade(land.dot); g.fillRect(x - 2, y - 8, 1, 1); g.fillRect(x + 1, y - 11, 1, 1); g.fillRect(x + 2, y - 5, 1, 1) }
    g.fillStyle = shade(land.trunk); g.fillRect(x, y, 1, 3)
  }
  hill(112, 5, 18, 5, shade(winter ? '#f2f6f7' : season === 'autumn' ? '#a8823a' : season === 'summer' ? '#5f9a3e' : '#7cba4e'))
  // flowers in the meadow, leaves on the ground, or glints in the snow
  for (let i = 0; i < 70; i++) {
    g.fillStyle = shade(i % 2 ? land.dot : land.dot2)
    g.fillRect((i * 67) % W, 108 + ((i * 29) % 26), 1, 1)
  }

  // the cottage the kitchen is in
  const cx = 150, cy = 104
  g.fillStyle = shade('#e8c99a'); g.fillRect(cx, cy, 30, 16)
  g.fillStyle = shade(winter ? '#f4f8f9' : '#a8452f'); for (let r = 0; r < 9; r++) g.fillRect(cx - 3 + r, cy - 1 - r, 36 - r * 2, 1)
  g.fillStyle = shade('#7a5742'); g.fillRect(cx + 4, cy + 6, 6, 10)
  g.fillStyle = night ? '#f2c14e' : shade('#7fb6d9'); g.fillRect(cx + 17, cy + 5, 8, 6)
  g.fillStyle = shade('#5e4440'); g.fillRect(cx + 24, cy - 12, 4, 6)

  // a path and a fence
  g.fillStyle = shade('#d9b77e')
  for (let y = cy + 16; y < H; y++) g.fillRect(cx + 5 - Math.round((y - cy - 16) * 0.8), y, 6 + Math.round((y - cy - 16) * 0.5), 1)
  g.fillStyle = shade('#8f6a45')
  for (let x = 0; x < 120; x += 6) g.fillRect(x, 118, 1, 6)
  g.fillRect(0, 120, 120, 1)
  hill(132, 2, 12, 2, shade(winter ? '#dfe9ec' : season === 'autumn' ? '#8a6a2e' : '#4f8a2a'))
}

/** Things drifting across the title: blossom, autumn leaves or snow. */
function Drift({ season }: { season: Season }) {
  if (season === 'summer') return null
  return (
    <>
      {Array.from({ length: 16 }, (_, n) => (
        <i key={n} className="title__drift" style={{
          left: `${(n * 37) % 100}%`,
          animationDuration: `${9 + (n * 7) % 9}s`,
          animationDelay: `-${(n * 13) % 17}s`,
        }}>
          {season === 'autumn'
            ? <img src={spriteUrl(`weather/leaf-${(n % 4) + 1}`)} alt="" style={{ width: 24 }} />
            : season === 'winter'
              ? <img src={spriteUrl('weather/snowflake')} alt="" style={{ width: n % 2 ? 18 : 12 }} />
              : <i className="title__petal" style={{ background: n % 2 ? '#f4b6c8' : '#fff4f0' }} />}
        </i>
      ))}
    </>
  )
}

export function TitleScreen({ hasSave, season, onStart, onSettings, onCredits }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  // a whole-number zoom big enough to cover the screen, so every pixel is the
  // same size; the overflow is cropped, keeping the hills on the bottom edge
  const cover = () => Math.max(1, Math.ceil(Math.max(window.innerWidth / W, window.innerHeight / H)))
  const [zoom, setZoom] = useState(cover)
  useEffect(() => {
    const onResize = () => setZoom(cover())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const now = new Date()
  const phase = phaseAt(now)
  const frame = useLoop(6, 420)

  useEffect(() => {
    if (canvas.current) paint(canvas.current, phase, new Date(), season)
  }, [phase, season])

  const night = phase === 'night' || phase === 'dusk'

  return (
    <div className="title">
      <canvas ref={canvas} className="title__land" width={W} height={H} style={{ width: W * zoom, height: H * zoom, left: Math.round((window.innerWidth - W * zoom) / 2) }} />
      {!night && [1, 2, 3, 4].map(n => (
        <img key={n} className="title__cloud" src={spriteUrl(`sky/cloud-${n}`)} alt=""
          style={{ top: `${6 + n * 7}%`, width: 27 * (n % 2 ? 6 : 4), animationDuration: `${70 + n * 23}s`, animationDelay: `-${n * 19}s` }} />
      ))}

      <Drift season={season} />

      <div className="title__inner">
        <div className="title__sign">
          <span className="title__cat"><Zoom k={`cat/sleep-${frame}`} scale={3} /></span>
          <h1 className="title__logo">B<span>a</span>sil</h1>
          <p className="title__tag sv-wood">a cosy kitchen, and the cat who runs it<span className="title__season">{SEASON_LABEL[season].toLowerCase()}</span></p>
        </div>
        <nav className="title__menu">
          <button className="sv-btn sv-btn--big sv-btn--go" onClick={onStart} autoFocus>{hasSave ? 'Continue' : 'Start'}</button>
          <button className="sv-btn sv-btn--big" onClick={onSettings}>Settings</button>
          <button className="sv-btn sv-btn--big" onClick={onCredits}>Credits</button>
        </nav>
      </div>
      <p className="title__foot sv-small">click Basil for recipes · click the fridge to open it · type what you bought</p>
    </div>
  )
}
