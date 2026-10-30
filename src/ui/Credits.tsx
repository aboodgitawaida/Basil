import { Modal } from './kit'

type Pack = { name: string; by: string; use: string; licence: string }

/** Who made what. Mirrors CREDITS.md. */
const PACKS: Pack[] = [
  { name: 'Pixel Art Fridge Pack', by: 'used with permission', use: 'the fridge and freezer', licence: 'with permission' },
  { name: 'Pixel Art — Food Pack 2', by: 'used with permission', use: 'groceries', licence: 'with permission' },
  { name: 'Pixel Art — Food Icons (free)', by: 'Frostwindz', use: 'cooked dishes in the cookbook', licence: 'with permission' },
  { name: 'Sleeping Cat (free)', by: 'used with permission', use: 'Basil', licence: 'with permission' },
  { name: 'Restaurant pixel art', by: 'used with permission', use: 'pots, pans and bowls', licence: 'with permission' },
  { name: 'Item Pack', by: 'used with permission', use: 'jars and bags', licence: 'with permission' },
  { name: 'Cozy lofi music', by: 'Redlight_Chill', use: 'the music', licence: 'with permission' },
  { name: 'Tiny RPG — Emoji Pack I', by: "Gabriel 'tiopalada' Lima", use: "Basil's bubbles", licence: 'CC0' },
  { name: 'Tiny RPG — Font Kit I', by: "Gabriel 'tiopalada' Lima", use: 'all the text', licence: 'CC0' },
  { name: 'Interface Sounds', by: 'Kenney (kenney.nl)', use: 'clicks and clunks', licence: 'CC0' },
]

export function Credits({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Credits" onClose={onClose} foot={<button className="sv-btn" onClick={onClose}>close</button>}>
      <p className="sv-dim" style={{ marginBottom: 15 }}>Made with other people's work.</p>
      <ul className="sv-list">
        {PACKS.map(p => (
          <li key={p.name} className="sv-row">
            <span className="sv-row__text">
              <span>{p.name}</span>
              <span className="sv-small sv-dim">{p.by} · {p.use}</span>
            </span>
            <span className="sv-tag sv-tag--green">{p.licence}</span>
          </li>
        ))}
      </ul>
      <p className="sv-small sv-dim" style={{ marginTop: 15 }}>
        The kitchen itself — walls, cabinets, window, table, lamps — the title landscape, the
        open doors and Basil's awake poses are drawn for this project. Full credits are in
        CREDITS.md in the repository.
      </p>
    </Modal>
  )
}
