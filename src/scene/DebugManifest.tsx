import { resolveSprite, type Category } from '../assets/manifest'
import { checkManifest } from '../lib/checkManifest'
import { spriteSize, spriteUrl } from '../lib/sprites'

const PROBES: Array<[string, Category]> = [
  ['2 bags of milk', 'dairy'], ['bread', 'grain'], ['peanut butter', 'condiment'],
  ['half a block of mature cheddar', 'dairy'], ['eggs', 'dairy'],
  ['chicken thighs', 'meat'], ['frozen peas', 'frozen'],
  ['tin of chopped tomatoes', 'tinned'], ['quinoa', 'grain'],
  ['sriracha', 'condiment'], ['oat milk', 'drink'], ['bramley apples', 'produce'],
  ['tofu', 'other'], ['marmite', 'condiment'],
]

/** Dev-only strip: proves the manifest resolves real names to real sprites,
 *  including the ones with no sprite of their own. Open with ?debug */
export function DebugManifest() {
  const problems = checkManifest()
  return (
    <aside className="debug">
      <p className="debug__head u-small">
        manifest {problems.length ? `— ${problems.length} problem(s)` : '— all routes land'}
      </p>
      {problems.map(p => <p key={p} className="debug__bad u-small">{p}</p>)}
      <ul className="debug__grid">
        {PROBES.map(([name, cat]) => {
          const { key, exact } = resolveSprite(name, cat)
          const { w, h } = spriteSize(key)
          return (
            <li key={name} className="debug__cell">
              <span style={{ width: w * 2, height: h * 2 }}>
                <span className="debug__thumb">
                  <img src={spriteUrl(key)} alt="" width={w} height={h} />
                </span>
              </span>
              <span className="u-small">{name}</span>
              <span className="u-small debug__key">{exact ? key : `${key} (fallback)`}</span>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
