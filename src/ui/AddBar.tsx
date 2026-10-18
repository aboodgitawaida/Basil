import { useState } from 'react'

type Props = {
  onSubmit: (text: string) => void
  quick: string[]
  onQuick: (name: string) => void
  busy?: boolean
  placeholder?: string
  hint?: string
}

/** One box. Type anything; nothing here is a required field. */
export function AddBar({ onSubmit, quick, onQuick, busy, placeholder, hint }: Props) {
  const [text, setText] = useState('')

  const send = () => {
    const t = text.trim()
    if (!t || busy) return
    onSubmit(t)
    setText('')
  }

  return (
    <div className="addbar">
      {quick.length > 0 && (
        <div className="addbar__quick">
          {quick.map(name => (
            <button key={name} className="chip chip--quiet" onClick={() => onQuick(name)}>
              + {name}
            </button>
          ))}
        </div>
      )}
      <div className="addbar__row">
        <input
          className="addbar__input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send() }}
          placeholder={placeholder ?? 'bread, two bags of milk, half a block of cheddar'}
          aria-label="Add to the kitchen"
          disabled={busy}
        />
        <button className="addbar__go" onClick={send} disabled={busy}>
          {busy ? '…' : 'put away'}
        </button>
      </div>
      {hint && <p className="addbar__hint u-small">{hint}</p>}
    </div>
  )
}
