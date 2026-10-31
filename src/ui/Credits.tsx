import { Modal } from './kit'

type Pack = { name: string; by: string; use: string; licence: string }

/** Who made what. Mirrors CREDITS.md. */
const PACKS: Pack[] = [
  { name: 'Fridge Pack', by: 'KARSIORI', use: 'the fridge and freezer', licence: 'CC0' },
  { name: 'Food Pack 2', by: 'KARSIORI', use: 'groceries', licence: 'CC0' },
  { name: 'Food Icons', by: 'Frostwindz', use: 'dishes in the cookbook', licence: 'licensed' },
  { name: 'Cat Sleeping Animation', by: 'ToffeeCraft', use: 'Basil', licence: 'licensed' },
  { name: 'Restaurant Character and Tileset', by: 'Riley (rkuhlf-assets)', use: 'pots, pans and clouds', licence: 'CC0' },
  { name: 'Pixel Item Pack', by: 'Stealthix', use: 'jars and bags', licence: 'CC0' },
  { name: 'Weather particle sprites', by: 'Emi Emi Games', use: 'rain, snow and leaves', licence: 'free' },
  { name: 'Drink & Chill, Autumn', by: 'Music by Redlight_Chill', use: 'the music', licence: 'free' },
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
        open doors, Basil's awake poses and a few of the dishes are drawn for this project.
        Links and full licences are in CREDITS.md in the repository.
      </p>
      <p className="sv-small sv-dim" style={{ marginTop: 15 }}>
        Basil is made by Abood Awaida ·{' '}
        <a className="sv-link" href="https://www.linkedin.com/in/abood-awaida/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </p>
    </Modal>
  )
}
