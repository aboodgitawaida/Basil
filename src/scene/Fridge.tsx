import type { ReactNode } from 'react'
import { FRIDGE } from '../lib/room'
import { Sprite } from './Sprite'

/** The pack ships five frames of door swing. */
export const FRIDGE_FRAMES = 5

type Props = { frame: number; open: boolean; onToggle: () => void; children?: ReactNode }

export function Fridge({ frame, open, onToggle, children }: Props) {
  const { right, y, w, h } = FRIDGE

  return (
    <>
      {/* the lit interior, washed over the open compartment */}
      {frame > 0 && (
        <i
          className="fridge__glow"
          style={{ left: right - w + 6, top: y + 44, width: w - 14, height: h - 56, opacity: frame * 0.06 }}
        />
      )}
      <Sprite k={`fridge/door-${frame}`} rightAlign={right} y={y} />
      <button
        className="hit"
        onClick={onToggle}
        aria-label={open ? 'Close the fridge' : 'Open the fridge'}
        aria-expanded={open}
        data-drop={open ? 'fridge' : undefined}
        style={{ left: right - w, top: y, width: w, height: h }}
      />
      {children}
    </>
  )
}
