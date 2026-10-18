import { useCallback, useEffect, useState } from 'react'
import { ROOM, fitScale } from './lib/room'
import { Room } from './scene/Room'
import { DebugManifest } from './scene/DebugManifest'
import { Toast } from './ui/Toast'
import { AddBar } from './ui/AddBar'
import { ItemCard } from './ui/ItemCard'
import { useStore } from './lib/useStore'
import { aiStatus, parseText, type ParseOutcome } from './lib/ai'
import { ParsePreview } from './ui/ParsePreview'
import { addItems, moveItem, removeItem, setAmount, topQuickAdd } from './lib/inventory'
import { useItemDrag, type DropTarget } from './lib/useItemDrag'
import { boardItems, cook, emptyBoard, book, type Board } from './lib/craft'
import { judgeCraft, suggestMeals, type Meal, type Verdict } from './lib/ai'
import { CraftBoard } from './scene/CraftBoard'
import { CraftPanel } from './ui/CraftPanel'
import { RecipeBook } from './ui/RecipeBook'
import { Credits } from './ui/Credits'
import { lighting, nightLevel } from './lib/daylight'
import { fetchSky, type Sky } from './lib/weather'
import { sound } from './lib/sound'
import type { Mood } from './scene/Bubble'
import { spriteSize, spriteUrl } from './lib/sprites'
import type { Item, Location } from './lib/schema'

export function App() {
  const [scale, setScale] = useState(() => fitScale(window.innerWidth, window.innerHeight))
  const [fridgeOpen, setFridgeOpen] = useState(false)
  const [cupboardOpen, setCupboardOpen] = useState(false)
  const [picked, setPicked] = useState<Item | null>(null)
  const [pending, setPending] = useState<ParseOutcome | null>(null)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | undefined>(undefined)
  const [board, setBoard] = useState<Board>(emptyBoard)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [craftWhy, setCraftWhy] = useState<string | undefined>()
  const [suggestWhy, setSuggestWhy] = useState<string | undefined>()
  const [thinking, setThinking] = useState(false)
  const [bookOpen, setBookOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<Meal[]>([])
  const [suggestLine, setSuggestLine] = useState<string | undefined>()
  const [suggesting, setSuggesting] = useState(false)
  const [clock, setClock] = useState(() => nightLevel())
  const [sky, setSky] = useState<Sky>('clear')
  const [say, setSay] = useState<Mood | null>(null)
  const [creditsOpen, setCreditsOpen] = useState(false)
  const debug = new URLSearchParams(window.location.search).has('debug')
  const { state, loaded, apply, applyQuiet, undo, undoable, dismissUndo } = useStore()

  // the room's light follows the real clock unless the switch says otherwise
  useEffect(() => {
    const id = window.setInterval(() => setClock(nightLevel()), 60_000)
    return () => window.clearInterval(id)
  }, [])
  useEffect(() => { void fetchSky(state.settings.lat, state.settings.lon).then(setSky) },
    [state.settings.lat, state.settings.lon])
  useEffect(() => { sound.setEnabled(state.settings.sound) }, [state.settings.sound])

  const override = state.settings.lightOverride
  const night = override === null ? clock : override
  const { sky: skyColour } = lighting(night)
  const lampOn = night > 0.15 ? override !== 1 : override === 1

  useEffect(() => {
    const onResize = () => setScale(fitScale(window.innerWidth, window.innerHeight))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Nothing is written until the preview is accepted.
  const add = useCallback(async (text: string) => {
    setBusy(true)
    try {
      const outcome = await parseText(text)
      if (outcome.drafts.length) setPending(outcome)
    } finally {
      setBusy(false)
    }
  }, [])

  const commit = useCallback(() => {
    if (!pending?.drafts.length) return
    const what = pending.drafts.length === 1
      ? pending.drafts[0].displayName
      : `${pending.drafts.length} things`
    apply(`Put ${what} away.`, addItems(pending.drafts))
    setPending(null)
  }, [pending, apply])

  useEffect(() => {
    void aiStatus().then(s => {
      if (!s.configured) setHint('No model key set — using the simple parser.')
    })
  }, [])

  const change = (fn: (s: ReturnType<typeof useStore>['state']) => typeof state, label: string) =>
    apply(label, fn)

  const onDrop = useCallback((item: Item, t: DropTarget) => {
    if (t.type === 'move') {
      change(moveItem(item.id, t.to), `Moved ${item.displayName} to the ${t.to}.`)
      return
    }
    setBoard(b => {
      const next = b.map(id => (id === item.id ? null : id))
      next[t.slot] = item.id
      return next
    })
  }, [apply])

  const { drag, handlers } = useItemDrag(onDrop, setPicked)

  const used = boardItems(board, state.items)

  // live preview as the board fills; debounced so a quick rearrange is one ask
  useEffect(() => {
    if (!used.length) { setVerdict(null); return }
    let cancelled = false
    setThinking(true)
    const t = window.setTimeout(() => {
      void judgeCraft(used).then(({ verdict, why }) => {
        if (!cancelled) { setVerdict(verdict); setCraftWhy(why); setThinking(false) }
      })
    }, 500)
    return () => { cancelled = true; window.clearTimeout(t); window.clearTimeout(t) }
    // the ids on the board are what matters, not the array identity
  }, [board.join(','), state.items.length])

  const doCook = useCallback(() => {
    if (!verdict?.ok || !used.length) return
    sound.play('cook')
    apply(`Cooked ${verdict.name}.`, cook(verdict.name, used, verdict.steps, verdict.minutes))
    setBoard(emptyBoard())
    setVerdict(null)
    setSay('ok')
    window.setTimeout(() => setSay(null), 2600)
  }, [verdict, used, apply])

  const openBook = useCallback(() => {
    setBookOpen(true)
    setSuggesting(true)
    void suggestMeals(state.items, state.settings.dietary).then(r => {
      setSuggestions(r.meals)
      setSuggestLine(r.line)
      setSuggestWhy(r.why)
      setSuggesting(false)
      setSay('idea')
      window.setTimeout(() => setSay(null), 3200)
    })
  }, [state.items, state.settings.dietary])

  if (!loaded) return <div className="stage" />

  return (
    <div className="app" style={{ ['--scale' as string]: scale }}>
      <div className="stage">
        <div className="stage__scaler" style={{ width: ROOM.w, height: ROOM.h }}>
          <Room
            fridgeOpen={fridgeOpen}
            cupboardOpen={cupboardOpen}
            onFridge={() => setFridgeOpen(o => { sound.play(o ? 'fridgeClose' : 'fridgeOpen'); return !o })}
            onCupboard={() => setCupboardOpen(o => { sound.play('cupboard'); return !o })}
            items={state.items}
            itemHandlers={handlers}
            draggingId={drag?.item.id}
            crafting={used.length > 0}
            onBoard={board}
            night={night}
            sky={sky}
            skyColour={skyColour}
            lampOn={lampOn}
            onLamp={() => {
              sound.play('toggle')
              applyQuiet(s => ({
                ...s,
                settings: { ...s.settings, lightOverride: lampOn ? 1 : 0 },
              }))
            }}
            onPet={() => sound.play('place', 0.35)}
            say={say}
          >
            {/* the board only exists while it is wanted: either something is
                on it, or something is being dragged and needs a target */}
            {(used.length > 0 || drag) && (
              <CraftBoard
                board={board}
                items={state.items}
                onClear={n => setBoard(b => b.map((id, i) => (i === n ? null : id)))}
              />
            )}
          </Room>
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
        <div className="dock__craft">
          <CraftPanel
            used={used}
            verdict={verdict}
            why={craftWhy}
            thinking={thinking}
            onCook={doCook}
            onClear={() => setBoard(emptyBoard())}
          />
          <button className="chip chip--quiet" onClick={openBook}>book</button>
          <button
            className="chip chip--quiet"
            onClick={() => applyQuiet(s => ({ ...s, settings: { ...s.settings, sound: !s.settings.sound } }))}
            aria-label={state.settings.sound ? 'Mute' : 'Unmute'}
          >{state.settings.sound ? '♪ on' : '♪ off'}</button>
        </div>
        <AddBar
          onSubmit={t => void add(t)}
          quick={topQuickAdd(state)}
          onQuick={name => void add(name)}
          busy={busy}
          hint={hint}
        />
      </div>

      {pending && (
        <ParsePreview
          outcome={pending}
          onConfirm={commit}
          onCancel={() => setPending(null)}
          onDrop={i => setPending(p => {
            if (!p) return p
            const drafts = p.drafts.filter((_, n) => n !== i)
            return drafts.length ? { ...p, drafts } : null
          })}
        />
      )}

      {picked && (
        <ItemCard
          item={picked}
          onClose={() => setPicked(null)}
          onAmount={a => { change(setAmount(picked.id, a), `${picked.displayName} is ${a}.`); setPicked(null) }}
          onMove={(l: Location) => { change(moveItem(picked.id, l), `Moved ${picked.displayName} to the ${l}.`); setPicked(null) }}
          onRemove={() => { change(removeItem(picked.id), `${picked.displayName} is gone.`); setPicked(null) }}
        />
      )}

      {bookOpen && (
        <RecipeBook
          entries={book(state)}
          suggestions={suggestions}
          line={suggestLine}
          why={suggestWhy}
          loading={suggesting}
          onClose={() => setBookOpen(false)}
        />
      )}

      {creditsOpen && <Credits onClose={() => setCreditsOpen(false)} />}
      <button className="credits__link u-small" onClick={() => setCreditsOpen(true)}>credits</button>

      {debug && <DebugManifest />}
    </div>
  )
}
