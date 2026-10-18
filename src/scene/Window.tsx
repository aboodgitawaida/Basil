import { WINDOW } from '../lib/room'
import type { Sky } from '../lib/weather'
import { Sprite } from './Sprite'
import { Weather } from './Weather'

type Props = { sky: Sky; skyColour: string }

/** The frame is a sprite with the pane knocked out, so the view behind it
 *  changes with the weather and the time of day. */
export function Window({ sky, skyColour }: Props) {
  const { x, y, w, paneH } = WINDOW
  const viewW = w - 10
  const viewH = paneH - 14
  return (
    <>
      <div
        className="win__view"
        style={{ left: x + 5, top: y + 5, width: viewW, height: viewH, background: skyColour }}
      >
        {sky === 'clear' && (
          <>
            <Sprite k="sky/cloud-2" x={3} y={8} />
            <Sprite k="sky/cloud-4" x={30} y={2} />
          </>
        )}
        <i className="win__far" />
        <i className="win__near" />
        <Weather sky={sky} w={viewW} h={viewH} />
      </div>
      <Sprite k="room/window" x={x} y={y} />
    </>
  )
}
