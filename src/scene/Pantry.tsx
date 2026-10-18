import type { ReactNode } from 'react'
import { PANTRY } from '../lib/room'
import { Sprite } from './Sprite'

export const PANTRY_FRAMES = 4

type Props = { frame: number; open: boolean; onToggle: () => void; children?: ReactNode }

/** The base cabinet under the left of the worktop. It is a base unit rather
 *  than a wall cupboard because the fridge door sweeps the wall above the
 *  counter, which would leave a wall unit hidden and unclickable. */
export function Pantry({ frame, open, onToggle, children }: Props) {
  const { x, y, w, h } = PANTRY

  return (
    <>
      <Sprite k="room/pantry-carcass" x={x} y={y} />
      <Sprite k={`room/pantry-door-${frame}`} x={x + 6} y={y + 12} />
      <button
        className="hit"
        onClick={onToggle}
        aria-label={open ? 'Close the cupboard' : 'Open the cupboard'}
        aria-expanded={open}
        data-drop={open ? 'cupboard' : undefined}
        style={{ left: x, top: y + 8, width: w, height: h - 8 }}
      />
      {children}
    </>
  )
}
