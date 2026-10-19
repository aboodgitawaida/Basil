import { useState } from 'react'
import type { Settings as S } from '../lib/schema'
import { Check, Modal } from './kit'

const DIETS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'no pork', 'no nuts']

type Props = {
  settings: S
  onChange: (next: S) => void
  /** only offered in game, where there is a kitchen to empty */
  onReset?: () => void
  aiNote?: string
  onClose: () => void
}

export function Settings({ settings, onChange, onReset, aiNote, onClose }: Props) {
  const [sure, setSure] = useState(false)
  const set = (patch: Partial<S>) => onChange({ ...settings, ...patch })
  const diet = (d: string, on: boolean) =>
    set({ dietary: on ? [...settings.dietary, d] : settings.dietary.filter(x => x !== d) })

  return (
    <Modal title="Settings" onClose={onClose} size="narrow"
      foot={<button className="sv-btn" onClick={onClose}>done</button>}>
      <p className="sv-section sv-h2">Sound</p>
      <div className="sv-field">
        <Check on={settings.sound} onChange={v => set({ sound: v })} label="Sound effects" />
        <Check on={settings.music} onChange={v => set({ music: v })} label="Music" />
      </div>

      <p className="sv-section sv-h2">Outside</p>
      <div className="sv-field">
        <Check on={settings.weather} onChange={v => set({ weather: v })} label="Real weather in the window" hint="asks your browser where you are" />
        <Check on={!!settings.south} onChange={v => set({ south: v })} label="Southern hemisphere" hint="summer in December" />
        <p className="sv-small sv-dim">The sky follows your own clock and the seasons follow the date. The switch by the window only works the lamp.</p>
      </div>

      <p className="sv-section sv-h2">What you eat</p>
      <div className="sv-grid" style={{ marginBottom: 9 }}>
        {DIETS.map(d => <Check key={d} on={settings.dietary.includes(d)} onChange={v => diet(d, v)} label={d} />)}
      </div>
      <p className="sv-small sv-dim">Basil keeps to these when he suggests his own recipes. Vegetarian and vegan also tick those boxes in the cookbook.</p>

      {aiNote && <><hr className="sv-rule" /><p className="sv-small sv-dim">{aiNote}</p></>}

      {onReset && (
        <>
          <hr className="sv-rule" />
          <div className="sv-field">
            {sure ? (
              <div className="sv-grid">
                <button className="sv-btn sv-btn--danger" onClick={() => { onReset(); setSure(false) }}>yes, empty it</button>
                <button className="sv-btn sv-btn--quiet" onClick={() => setSure(false)}>keep it</button>
              </div>
            ) : (
              <button className="sv-btn sv-btn--quiet" onClick={() => setSure(true)} style={{ alignSelf: 'flex-start' }}>empty the kitchen…</button>
            )}
            <p className="sv-small sv-dim">Clears every item and the list of things you have cooked. You can undo it straight after.</p>
          </div>
        </>
      )}
    </Modal>
  )
}
