import { Modal } from './kit'

type Pack = { name: string; by: string; use: string; licence: string; warn?: boolean }

/** Who made what. Several packs shipped without a licence file at all, which
 *  is worth saying out loud rather than quietly leaving blank. */
const PACKS: Pack[] = [
  { name: 'Pixel Art Fridge Pack', by: 'unnamed in the download', use: 'the fridge and its door swing', licence: 'no licence file included', warn: true },
  { name: 'Pixel Art — Food Pack 2', by: 'unnamed in the download', use: 'groceries', licence: 'no licence file included', warn: true },
  { name: 'Pixel Art — Food Icons (free)', by: 'Frostwindz', use: 'cooked dishes in the cookbook', licence: 'see the agreement in the pack folder', warn: true },
  { name: 'Sleeping Cat (free)', by: 'unnamed in the download', use: 'Basil', licence: 'no licence file included', warn: true },
  { name: 'Restaurant pixel art', by: 'unnamed in the download', use: 'pots, pans and bowls', licence: 'no licence file included', warn: true },
  { name: 'Item Pack', by: 'unnamed in the download', use: 'jars and bags', licence: 'no licence file included', warn: true },
  { name: 'Tiny RPG — Emoji Pack I', by: "Gabriel 'tiopalada' Lima", use: "Basil's bubbles", licence: 'CC0' },
  { name: 'Tiny RPG — Font Kit I', by: "Gabriel 'tiopalada' Lima", use: 'all the text', licence: 'CC0' },
  { name: 'Interface Sounds', by: 'Kenney (kenney.nl)', use: 'clicks and clunks', licence: 'CC0' },
  { name: 'Modern Tiles (free)', by: 'LimeZu', use: 'not used — see below', licence: 'non-commercial only' },
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
            <span className={`sv-tag${p.warn ? ' sv-tag--gold' : ' sv-tag--green'}`}>{p.licence}</span>
          </li>
        ))}
      </ul>
      <p className="sv-small sv-dim" style={{ marginTop: 15 }}>
        The kitchen itself — cabinets, window, table, clock, lamp, floor — and the title
        landscape are drawn in this project. Modern Tiles is non-commercial and is not used
        by the app; it stays in assets/ for reference only.
      </p>
      <p className="sv-small" style={{ marginTop: 9, color: '#9a5a10' }}>
        Several packs arrived with no licence file. Those need chasing down before this goes anywhere public.
      </p>
    </Modal>
  )
}
