import { WINDOW } from '../lib/room'
import { SKY, arc, arcHeight, phaseAt } from '../lib/daylight'
import type { Sky } from '../lib/weather'
import { Sprite } from './Sprite'
import { Weather } from './Weather'

type Props = { sky: Sky; now: Date }

/** Fixed star positions inside the pane, in art pixels. */
const STARS: Array<[number, number]> = [[4, 4], [14, 9], [23, 3], [33, 12], [41, 5], [49, 10], [8, 17], [28, 20], [45, 22], [18, 26]]

/** The frame is a sprite with the pane knocked out. Behind it is the real
 *  time of day where you are: dawn, a blue noon, a gold evening, a night with
 *  stars and a moon. The light switch indoors has nothing to do with it. */
export function Window({ sky, now }: Props) {
  const { x, y, w, paneH } = WINDOW
  const viewW = w - 10
  const viewH = paneH - 14
  const phase = phaseAt(now)
  const [top, mid, low] = SKY[phase]
  const { body, t } = arc(now)
  const night = phase === 'night' || phase === 'dusk'
  const overcast = sky !== 'clear'

  // the sun or moon travels left to right, high at midday; whole pixels only
  const size = body === 'sun' ? 8 : 6
  const bodyX = Math.round(t * (viewW - size))
  const bodyY = Math.round(viewH - 16 - arcHeight(t) * (viewH - 26))

  return (
    <>
      <div className="win__view" style={{ left: x + 5, top: y + 5, width: viewW, height: viewH, background: top }}>
        <i className="win__band" style={{ top: Math.round(viewH * 0.38), background: mid }} />
        <i className="win__band" style={{ top: Math.round(viewH * 0.62), background: low }} />

        {night && !overcast && STARS.map(([sx, sy], n) => (
          <i key={n} className={`win__star${n % 3 === 0 ? ' win__star--twinkle' : ''}`} style={{ left: sx, top: sy }} />
        ))}

        {!(overcast && body === 'moon') && (
          <i
            className={body === 'sun' ? `win__sun win__sun--${phase}` : 'win__moon'}
            style={{ left: bodyX, top: bodyY, width: size, height: size }}
          />
        )}

        {!night && (
          <>
            <Sprite k="sky/cloud-2" x={3} y={8} className="win__cloud win__cloud--a" />
            <Sprite k="sky/cloud-4" x={30} y={2} className="win__cloud win__cloud--b" />
          </>
        )}

        <i className={`win__far win__far--${phase}`} />
        <i className={`win__near win__near--${phase}`} />
        {/* a lit window in the far house, after dark */}
        <i className="win__house" />
        {night && <i className="win__house-light" />}
        <Weather sky={sky} w={viewW} h={viewH} />
      </div>
      <Sprite k="room/window" x={x} y={y} />
    </>
  )
}
