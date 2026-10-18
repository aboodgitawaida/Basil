import { WINDOW } from '../lib/room'
import { Sprite } from './Sprite'

/** The frame is a sprite with the pane knocked out, so the view behind it can
 *  change with the weather and the time of day later. */
export function Window() {
  const { x, y, w, paneH } = WINDOW
  return (
    <>
      <div className="win__view" style={{ left: x + 5, top: y + 5, width: w - 10, height: paneH - 14 }}>
        <Sprite k="sky/cloud-2" x={3} y={8} />
        <Sprite k="sky/cloud-4" x={30} y={2} />
        <i className="win__far" />
        <i className="win__near" />
      </div>
      <Sprite k="room/window" x={x} y={y} />
    </>
  )
}
