type Pack = { name: string; by: string; use: string; licence: string; warn?: boolean }

/** Who made what. Several packs shipped without a licence file at all, which
 *  is worth saying out loud rather than quietly leaving blank. */
const PACKS: Pack[] = [
  { name: 'Pixel Art Fridge Pack', by: 'unnamed in the download', use: 'the fridge and its door swing', licence: 'no licence file included', warn: true },
  { name: 'Pixel Art — Food Pack 2', by: 'unnamed in the download', use: 'groceries', licence: 'no licence file included', warn: true },
  { name: 'Pixel Art — Food Icons (free)', by: 'Frostwindz', use: 'cooked dishes in the recipe book', licence: 'see the agreement in the pack folder', warn: true },
  { name: 'Sleeping Cat (free)', by: 'unnamed in the download', use: 'Basil', licence: 'no licence file included', warn: true },
  { name: 'Restaurant pixel art', by: 'unnamed in the download', use: 'pots, pans and bowls', licence: 'no licence file included', warn: true },
  { name: 'Item Pack', by: 'unnamed in the download', use: 'jars and bags', licence: 'no licence file included', warn: true },
  { name: 'Tiny RPG — Emoji Pack I', by: "Gabriel 'tiopalada' Lima", use: "Basil's bubbles", licence: 'CC0' },
  { name: 'Tiny RPG — Font Kit I', by: "Gabriel 'tiopalada' Lima", use: 'all the text', licence: 'CC0' },
  { name: 'Interface Sounds', by: 'Kenney (kenney.nl)', use: 'clicks and clunks', licence: 'CC0' },
  { name: 'Modern Tiles (free)', by: 'LimeZu', use: 'not used — see below', licence: 'non-commercial only' },
]

type Props = { onClose: () => void }

export function Credits({ onClose }: Props) {
  return (
    <div className="sheet" onClick={onClose}>
      <div className="sheet__panel sheet__panel--tall" onClick={e => e.stopPropagation()}>
        <div className="sheet__head sheet__head--between">
          <p>Made with other people's work</p>
          <button className="chip chip--quiet" onClick={onClose}>shut it</button>
        </div>

        <ul className="credits">
          {PACKS.map(p => (
            <li key={p.name} className="credits__row">
              <span>{p.name}</span>
              <span className="u-small sheet__dim">{p.by} · {p.use}</span>
              <span className={`u-small ${p.warn ? 'credits__warn' : 'sheet__dim'}`}>{p.licence}</span>
            </li>
          ))}
        </ul>

        <p className="u-small sheet__dim">
          The kitchen itself — cabinets, window, clock, lamp, floor — is drawn in
          this project. Modern Tiles is non-commercial and is not used by the app;
          it stays in assets/ for reference only.
        </p>
        <p className="u-small credits__warn">
          Several packs arrived with no licence file. Those need chasing down
          before this goes anywhere public.
        </p>
      </div>
    </div>
  )
}
