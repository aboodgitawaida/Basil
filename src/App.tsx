import { useCallback, useEffect, useState } from 'react'
import { ROOM, fitScale } from './lib/room'
import { Room } from './scene/Room'
import { DebugManifest } from './scene/DebugManifest'
import { Toast } from './ui/Toast'
import { AddBar } from './ui/AddBar'
import { ItemCard } from './ui/ItemCard'
import { useStore } from './lib/useStore'
import { keywordParse } from './lib/keywordParser'
import { addItems, moveItem, removeItem, setAmount, topQuickAdd } from './lib/inventory'
import { useItemDrag } from './lib/useItemDrag'
import { spriteSize, spriteUrl } from './lib/sprites'
import type { Item, Location } from './lib/schema'

export function App() {
  const [scale, setScale] = useState(() => fitScale(window.innerWidth, window.innerHeight))
  const [fridgeOpen, setFridgeOpen] = useState(false)
  const [cupboardOpen, setCupboardOpen] = useState(false)
  const [picked, setPicked] = useState<Item | null>(null)
  const debug = new URLSearchParams(window.location.search).has('debug')
  const { state, loaded, apply, undo, undoable, dismissUndo } = useStore()

  useEffect(() => {
    const onResize = () => setScale(fitScale(window.innerWidth, window.innerHeight))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const add = useCallback((text: string) => {
    const drafts = keywordParse(text)
    if (!drafts.length) return
    const what = drafts.length === 1 ? drafts[0].displayName : `${drafts.length} things`
    apply(`Put ${what} away.`, addItems(drafts))
  }, [apply])

  const change = (fn: (s: ReturnType<typeof useStore>['state']) => typeof state, label: string) =>
    apply(label, fn)

  const { drag, handlers } = useItemDrag(
    (item, to) => change(moveItem(item.id, to), `Moved ${item.displayName} to the ${to}.`),
    setPicked,
  )

  if (!loaded) return <div className="stage" />

  return (
    <div className="app" style={{ ['--scale' as string]: scale }}>
      <div className="stage">
        <div className="stage__scaler" style={{ width: ROOM.w, height: ROOM.h }}>
          <Room
            fridgeOpen={fridgeOpen}
            cupboardOpen={cupboardOpen}
            onFridge={() => setFridgeOpen(o => !o)}
            onCupboard={() => setCupboardOpen(o => !o)}
            items={state.items}
            itemHandlers={handlers}
            draggingId={drag?.item.id}
          />
        </div>
      </div>

      {drag && (
        <span
          className="drag-ghost"
          style={{
            left: drag.x, top: drag.y,
            width: spriteSize(drag.item.spriteKey).w * scale,
            height: spriteSize(drag.item.spriteKey).h * scale,
          }}
        >
          <img src={spriteUrl(drag.item.spriteKey)} alt="" />
        </span>
      )}

      <div className="dock">
        <Toast undoable={undoable} onUndo={undo} onDismiss={dismissUndo} />
        <AddBar
          onSubmit={add}
          quick={topQuickAdd(state)}
          onQuick={name => add(name)}
        />
      </div>

      {picked && (
        <ItemCard
          item={picked}
          onClose={() => setPicked(null)}
          onAmount={a => { change(setAmount(picked.id, a), `${picked.displayName} is ${a}.`); setPicked(null) }}
          onMove={(l: Location) => { change(moveItem(picked.id, l), `Moved ${picked.displayName} to the ${l}.`); setPicked(null) }}
          onRemove={() => { change(removeItem(picked.id), `${picked.displayName} is gone.`); setPicked(null) }}
        />
      )}

      {debug && <DebugManifest />}
    </div>
  )
}
