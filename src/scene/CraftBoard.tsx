import { CRAFT } from '../lib/room'
import type { Board } from '../lib/craft'
import type { Item } from '../lib/schema'
import { spriteSize } from '../lib/sprites'
import { Sprite } from './Sprite'

type Props = {
  board: Board
  items: Item[]
  onClear: (slot: number) => void
}

/** The 3x3 on the worktop. Cells are drawn as corner marks rather than boxes,
 *  because an ingredient is often wider than its cell and a hard border would
 *  cut it in half. */
export function CraftBoard({ board, items, onClear }: Props) {
  const { x, cell, cols, rows, bottom } = CRAFT
  const top = bottom - rows * cell

  return (
    <div className="craft" style={{ left: x, top, width: cols * cell, height: rows * cell }}>
      {board.map((id, n) => {
        const cx = (n % cols) * cell
        const cy = Math.floor(n / cols) * cell
        const item = id ? items.find(i => i.id === id) : undefined
        return (
          <button
            key={n}
            className="craft__cell"
            data-craft-slot={n}
            style={{ left: cx, top: cy, width: cell, height: cell }}
            onClick={() => item && onClear(n)}
            aria-label={item ? `Take ${item.displayName} off the board` : `Empty slot ${n + 1}`}
          >
            {item && (
              <Sprite
                k={item.spriteKey}
                x={Math.floor((cell - spriteSize(item.spriteKey).w) / 2)}
                bottom={cell - 1}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
