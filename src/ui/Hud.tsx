import { useState, type RefObject } from 'react'
import { SKY, arc, arcHeight, clockText, phaseAt, GREETING } from '../lib/daylight'
import type { Sky } from '../lib/weather'

const WEATHER: Record<Sky, string> = { clear: 'clear', cloud: 'cloudy', rain: 'raining', snow: 'snowing' }

/** The date-and-time box in the top corner, from the real clock. */
export function Clock({ now, sky }: { now: Date; sky: Sky }) {
  const { day, time } = clockText(now)
  const phase = phaseAt(now)
  const { body, t } = arc(now)
  const x = Math.round(t * 36)
  const y = Math.round(18 - arcHeight(t) * 15)
  return (
    <div className="hud__clock sv-frame" aria-label={`${day}, ${time}`}>
      <div className="hud__clock-day">
        <span>{day}</span>
        <span className="hud__dial" aria-hidden>
          <i className="hud__dial-sky" style={{ background: SKY[phase][1] }} />
          <i className="hud__dial-body" style={{ left: x, top: y, background: body === 'sun' ? '#ffe27a' : '#eef0dc' }} />
        </span>
      </div>
      <div className="hud__clock-time">{time}</div>
      <div className="hud__clock-phase sv-small">{GREETING[phase]} · {WEATHER[sky]}</div>
    </div>
  )
}

type BarProps = {
  onSubmit: (text: string) => void
  quick: string[]
  onQuick: (name: string) => void
  busy?: boolean
  hint?: string
  barRef?: RefObject<HTMLDivElement>
}

/** What did you bring home? One box; type it however you like. */
export function AddBar({ onSubmit, quick, onQuick, busy, hint, barRef }: BarProps) {
  const [text, setText] = useState('')
  const send = () => {
    const t = text.trim()
    if (!t || busy) return
    onSubmit(t)
    setText('')
  }
  return (
    <div className="hud__bar sv-frame" ref={barRef} title={hint}>
      <div className="hud__bar-row">
        {quick.length > 0 && (
          <div className="hud__quick" aria-label="Buy again">
            {quick.slice(0, 4).map(name => (
              <button key={name} className="sv-btn sv-btn--quiet sv-btn--small" onClick={() => onQuick(name)} disabled={busy} title={`Add ${name} again`}>+ {name}</button>
            ))}
          </div>
        )}
        <input
          className="hud__input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send() }}
          placeholder={quick.length ? 'What else did you buy?' : 'What did you buy? two eggs, a bag of rice, half a block of cheddar…'}
          aria-label="Add to the kitchen"
          disabled={busy}
        />
        <button className="sv-btn sv-btn--go" onClick={send} disabled={busy || !text.trim()}>
          {busy ? 'reading…' : 'put away'}
        </button>
      </div>
    </div>
  )
}
