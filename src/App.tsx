import { useEffect, useState } from 'react'
import { ROOM, fitScale } from './lib/room'
import { Room } from './scene/Room'
import { DebugManifest } from './scene/DebugManifest'

export function App() {
  const [scale, setScale] = useState(() => fitScale(window.innerWidth, window.innerHeight))
  const [fridgeOpen, setFridgeOpen] = useState(false)
  const [cupboardOpen, setCupboardOpen] = useState(false)
  const debug = new URLSearchParams(window.location.search).has('debug')

  useEffect(() => {
    const onResize = () => setScale(fitScale(window.innerWidth, window.innerHeight))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className="stage" style={{ ['--scale' as string]: scale }}>
      <div className="stage__scaler" style={{ width: ROOM.w, height: ROOM.h }}>
        <Room
          fridgeOpen={fridgeOpen}
          cupboardOpen={cupboardOpen}
          onFridge={() => setFridgeOpen(o => !o)}
          onCupboard={() => setCupboardOpen(o => !o)}
        />
      </div>
      {debug && <DebugManifest />}
    </div>
  )
}
