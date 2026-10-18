import { WINDOW } from '../lib/room'
import { Sprite } from './Sprite'

/** A proper window: frame, mullions, a view out, a sill and curtains.
 *  Everything but the clouds is drawn, so it sizes to whatever we want. */
export function Window() {
  const { x, y, w, h } = WINDOW
  return (
    <>
      <i className="win__rod" style={{ left: x - 6, top: y - 4, width: w + 12 }} />

      <div className="win" style={{ left: x, top: y, width: w, height: h }}>
        <div className="win__pane">
          <Sprite k="sky/cloud-2" x={4} y={6} />
          <Sprite k="sky/cloud-5" x={30} y={2} />
          <i className="win__hill" />
          <i className="win__field" />
        </div>
        <i className="win__mullion-v" />
        <i className="win__mullion-h" />
      </div>

      <i className="win__sill" style={{ left: x - 4, top: y + h, width: w + 8 }} />
      <i className="win__curtain" style={{ left: x - 6, top: y - 2, height: h - 4 }} />
      <i
        className="win__curtain win__curtain--r"
        style={{ left: x + w - 7, top: y - 2, height: h - 4 }}
      />
    </>
  )
}
