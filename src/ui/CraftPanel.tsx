import type { Verdict } from '../lib/ai'
import { spriteSize, spriteUrl } from '../lib/sprites'
import { dishSprite } from '../lib/craft'
import type { Item } from '../lib/schema'

type Props = {
  used: Item[]
  verdict: Verdict | null
  /** set when the model failed and this is the built-in guess */
  why?: string
  thinking: boolean
  onCook: () => void
  onClear: () => void
}

/** The output slot. It previews as the board fills, and only offers to cook
 *  when the result is something worth eating. */
export function CraftPanel({ used, verdict, why, thinking, onCook, onClear }: Props) {
  if (!used.length) {
    return <p className="craftpanel__idle u-small">Drag something onto the board.</p>
  }
  const key = verdict?.ok ? dishSprite(verdict.name) : null
  const size = key ? spriteSize(key) : null

  return (
    <div className="craftpanel">
      <span className="craftpanel__slot">
        {key && size && (
          <img src={spriteUrl(key)} alt="" width={size.w} height={size.h} />
        )}
      </span>
      <div className="craftpanel__text">
        <p>{thinking ? 'Basil is thinking…' : verdict?.name ?? '…'}</p>
        <p className="u-small craftpanel__dim">
          {thinking ? ' '
            : why ? `${why} Built-in guess.`
            : verdict?.line ?? (verdict?.ok
              ? `${verdict.minutes} min · ${used.length} ingredient${used.length > 1 ? 's' : ''}`
              : 'Not really a meal.')}
        </p>
      </div>
      <div className="craftpanel__acts">
        <button className="chip chip--quiet" onClick={onClear}>clear</button>
        <button className="chip chip--on" onClick={onCook} disabled={!verdict?.ok || thinking}>
          cook
        </button>
      </div>
    </div>
  )
}
