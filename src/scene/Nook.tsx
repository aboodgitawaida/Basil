import { FLOOR_Y, CEILING_H, NOOK, ROOM } from '../lib/room'
import { LAND, type Season } from '../lib/seasons'
import { spriteSize } from '../lib/sprites'
import { Sprite } from './Sprite'
import { Shadow } from './Room'

/** Plates and pans on the open shelf: [sprite, x from the shelf's left, shelf]. */
const ON_SHELF: Array<[string, number, number]> = [
  ['kit/plate-stack', 6, 0],
  ['kit/bowl', 26, 0],
  ['kit/mixing-bowl', 6, 1],
  ['kit/pot', 22, 1],
  ['kit/plate', 6, 2],
  ['kit/fork', 28, 2],
]

/** The dining nook to the left of the kitchen: a shelf of crockery, a small
 *  framed picture, a lamp over a table for two. Drawn in art pixels like the
 *  rest of the room; the table and chairs are plain blocks of the palette. */
export function Nook({ season, night }: { season: Season; night: number }) {
  const { shelf, table, lamp, picture } = NOOK
  const tableTop = FLOOR_Y - table.h
  const bowl = spriteSize('kit/bowl')
  return (
    <>
      {/* picture: a little landscape in a wooden frame */}
      <div className="nook__picture" style={{ left: picture.x, top: picture.y, width: picture.w, height: picture.h }}>
        <i className="nook__picture-sky" />
        <i className="nook__picture-sun" />
        <i className="nook__picture-hill" style={{ background: LAND[season].far }} />
        <i className="nook__picture-field" style={{ background: LAND[season].near }} />
      </div>

      <Sprite k="room/cupboard-carcass" x={shelf.x} y={shelf.y} />
      {ON_SHELF.map(([k, dx, n]) => (
        <Sprite key={k} k={k} x={shelf.x + dx} bottom={shelf.y + shelf.surfaces[n]} />
      ))}

      <i className="room__cord" style={{ left: lamp.cordX, top: CEILING_H, height: lamp.shadeY - CEILING_H }} />
      <Sprite k="room/pendant" x={lamp.x} y={lamp.shadeY} />

      {/* chairs, one each side, tucked in */}
      {[['', table.x - 6], [' nook__chair--r', table.x + table.w - 8]].map(([mod, left]) => (
        <div key={left} className={`nook__chair${mod}`} style={{ left, top: tableTop - 18 }}>
          <i className="nook__chair-back" />
          <i className="nook__chair-rail" />
          <i className="nook__chair-seat" />
          <i className="nook__chair-leg" />
        </div>
      ))}

      {/* table */}
      <Shadow x={table.x + 2} w={table.w - 4} y={FLOOR_Y} />
      <div className="nook__table" style={{ left: table.x, top: tableTop, width: table.w, height: table.h }}>
        <i className="nook__table-top" />
        <i className="nook__table-apron" />
        <i className="nook__leg" style={{ left: 4 }} />
        <i className="nook__leg" style={{ right: 4 }} />
      </div>

      {/* laid for one, with something for the season in the middle */}
      <Sprite k="kit/plate" x={table.x + 6} bottom={tableTop + 1} />
      <Sprite k="kit/fork" x={table.x + 27} bottom={tableTop + 1} />
      {season === 'autumn' && <Sprite k="food/pumpkin" x={table.x + 38} bottom={tableTop + 1} />}
      {season === 'summer' && <Sprite k="food/watermelon" x={table.x + 38} bottom={tableTop + 1} />}
      {(season === 'spring' || season === 'winter') && (
        <>
          <Sprite k="food/apple" x={table.x + 52} bottom={tableTop - bowl.h + 5} />
          <Sprite k="food/pear" x={table.x + 58} bottom={tableTop - bowl.h + 6} />
          <Sprite k="kit/bowl" x={table.x + 50} bottom={tableTop + 1} />
        </>
      )}
      {season === 'spring' && (
        // a jam jar of flowers
        <span className="nook__vase" style={{ left: table.x + 40, top: tableTop - 14 }}>
          <i className="nook__stem" style={{ left: 1, height: 8 }} />
          <i className="nook__stem" style={{ left: 3, height: 10 }} />
          <i className="nook__stem" style={{ left: 5, height: 7 }} />
          <i className="nook__bloom" style={{ left: 0, top: 4, background: '#f4b6c8' }} />
          <i className="nook__bloom" style={{ left: 2, top: 1, background: '#f2d64e' }} />
          <i className="nook__bloom" style={{ left: 4, top: 5, background: '#fff4f0' }} />
          <i className="nook__jar" />
        </span>
      )}
      {season === 'winter' && (
        // fairy lights strung along the ceiling, brighter after dark
        <span className="lights" style={{ left: 0, top: CEILING_H, width: ROOM.w, opacity: 0.55 + night * 0.45 }}>
          {Array.from({ length: Math.floor(ROOM.w / 9) }, (_, n) => (
            <i key={n} className={`lights__bulb lights__bulb--${n % 4}`} style={{ left: 4 + n * 9, top: n % 2 ? 3 : 4 }} />
          ))}
        </span>
      )}
    </>
  )
}
