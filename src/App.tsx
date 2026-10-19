import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ROOM, layout } from './lib/room'
import { Room } from './scene/Room'
import { DebugManifest } from './scene/DebugManifest'
import { Toast } from './ui/Toast'
import { AddBar, Clock } from './ui/Hud'
import { ItemCard } from './ui/ItemCard'
import { useStore } from './lib/useStore'
import { aiStatus, parseText, type ParseOutcome } from './lib/ai'
import { useBasil } from './lib/useBasil'
import { ParsePreview } from './ui/ParsePreview'
import { addItems, allGone, moveItem, setAmount, setCount, topQuickAdd } from './lib/inventory'
import { addToList, clearTicked, missingFor, readList, tick, toBuy, unlist } from './lib/shopping'
import { ShoppingList } from './ui/ShoppingList'
import { useItemDrag, type DropTarget } from './lib/useItemDrag'
import { cook } from './lib/craft'
import type { Filter, Match } from './lib/recipes'
import { Cookbook } from './ui/Cookbook'
import { Credits } from './ui/Credits'
import { Settings } from './ui/Settings'
import { PantryList } from './ui/PantryList'
import { TitleScreen } from './ui/TitleScreen'
import { Modal } from './ui/kit'
import { nightLevel } from './lib/daylight'
import { seasonAt, seasonOverride } from './lib/seasons'
import { fetchSky, type Sky } from './lib/weather'
import { sound } from './lib/sound'
import { spriteSize, spriteUrl } from './lib/sprites'
import { prettyName, type Item, type Location, type Settings as SettingsT } from './lib/schema'

type Overlay = 'settings' | 'credits' | 'cookbook' | 'pantry' | 'shopping' | 'menu' | null

const useNow = () => {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 20_000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

export function App() {
  const [screen, setScreen] = useState<'title' | 'game'>('title')
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [view, setView] = useState(() => layout(window.innerWidth, window.innerHeight))
  const [fridgeOpen, setFridgeOpen] = useState(false)
  const [freezerOpen, setFreezerOpen] = useState(false)
  const [cupboardOpen, setCupboardOpen] = useState<readonly [boolean, boolean]>([false, false])
  const [picked, setPicked] = useState<string | null>(null)
  const [pending, setPending] = useState<ParseOutcome | null>(null)
  const [busy, setBusy] = useState(false)
  const [aiReady, setAiReady] = useState(false)
  const [sky, setSky] = useState<Sky>('clear')
  const [happy, setHappy] = useState(false)
  const [filters, setFilters] = useState<Filter[] | null>(null)
  const [barH, setBarH] = useState(120)
  const bar = useRef<HTMLDivElement>(null)
  const now = useNow()
  const debug = new URLSearchParams(window.location.search).has('debug')
  const { state, loaded, apply, applyQuiet, undo, undoable, dismissUndo } = useStore()
  const basil = useBasil(state.items, fridgeOpen || freezerOpen)
  const settings = state.settings

  useEffect(() => {
    const onResize = () => setView(layout(window.innerWidth, window.innerHeight, barH + 15))
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [barH])

  useEffect(() => { void aiStatus().then(s => setAiReady(s.configured)) }, [])
  useEffect(() => { sound.setEnabled(settings.sound) }, [settings.sound])
  useEffect(() => { sound.setMusic(settings.music, screen === 'title' ? 'title' : 'kitchen') }, [settings.music, screen])
  // browsers only start audio inside a click
  useEffect(() => {
    const go = () => sound.nudge()
    window.addEventListener('pointerdown', go)
    return () => window.removeEventListener('pointerdown', go)
  }, [])
  useEffect(() => {
    if (screen !== 'game' || !settings.weather) { setSky('clear'); return }
    void fetchSky(settings.lat, settings.lon).then(setSky)
  }, [screen, settings.weather, settings.lat, settings.lon])

  useEffect(() => {
    if (!bar.current) return
    const ro = new ResizeObserver(() => setBarH(bar.current?.offsetHeight ?? 120))
    ro.observe(bar.current)
    return () => ro.disconnect()
  }, [screen])

  // the sky is the real clock; the lamp switches itself on after dark unless told
  const night = nightLevel(now)
  const season = seasonOverride() ?? seasonAt(now, settings.south)
  const lampOn = settings.lamp ?? night > 0.3

  const setSettings = (next: SettingsT) => applyQuiet(s => ({ ...s, settings: next }))

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
    const what = pending.drafts.length === 1 ? pending.drafts[0].displayName : `${pending.drafts.length} things`
    sound.play('place')
    apply(`Put ${what} away.`, addItems(pending.drafts))
    setPending(null)
  }, [pending, apply])

  const onDrop = useCallback((item: Item, t: DropTarget) => {
    apply(`Moved ${item.displayName} to the ${t.to}.`, moveItem(item.id, t.to))
  }, [apply])
  const { drag, handlers } = useItemDrag(onDrop, i => setPicked(i.id))

  const pickedItem = picked ? state.items.find(i => i.id === picked) : undefined

  const doCook = useCallback((m: Match) => {
    sound.play('cook')
    apply(`Cooked ${m.recipe.name.toLowerCase()}.`, cook(m))
    setOverlay(null)
    setHappy(true)
    window.setTimeout(() => setHappy(false), 4500)
    basil.say({ title: `${m.recipe.name}. Acceptable. I'll have the leftovers.` }, 5000)
  }, [apply, basil])

  const cookFilters = useMemo<Filter[]>(() => filters ?? [
    ...(settings.dietary.includes('vegan') ? ['vegan' as const] : settings.dietary.includes('vegetarian') ? ['vegetarian' as const] : []),
  ], [filters, settings.dietary])

  if (!loaded) return <div className="stage" />

  const hasSave = state.items.length > 0 || state.history.length > 0
  const firstRun = state.items.length === 0 && state.history.length === 0

  if (screen === 'title') {
    return (
      <>
        <TitleScreen
          hasSave={hasSave}
          season={season}
          onStart={() => { sound.play('cook', 0.35); setScreen('game') }}
          onSettings={() => setOverlay('settings')}
          onCredits={() => setOverlay('credits')}
        />
        {overlay === 'settings' && <Settings settings={settings} onChange={setSettings} onClose={() => setOverlay(null)} />}
        {overlay === 'credits' && <Credits onClose={() => setOverlay(null)} />}
      </>
    )
  }

  return (
    <div className="app">
      <div className="stage">
        <div
          className="stage__scaler"
          style={{ left: view.left, top: view.top, width: ROOM.w, height: ROOM.h, transform: `scale(${view.scale})` }}
        >
          <Room
            fridgeOpen={fridgeOpen}
            cupboardOpen={cupboardOpen}
            onFridge={() => setFridgeOpen(o => { sound.play(o ? 'fridgeClose' : 'fridgeOpen'); return !o })}
            freezerOpen={freezerOpen}
            onFreezer={() => setFreezerOpen(o => { sound.play(o ? 'fridgeClose' : 'fridgeOpen'); return !o })}
            onCupboard={n => { sound.play('cupboard'); setCupboardOpen(o => (n === 0 ? [!o[0], o[1]] : [o[0], !o[1]])) }}
            onMore={() => setOverlay('pantry')}
            items={state.items}
            itemHandlers={handlers}
            draggingId={drag?.item.id}
            now={now}
            night={night}
            sky={sky}
            season={season}
            lampOn={lampOn}
            onLamp={() => { sound.play('toggle'); setSettings({ ...settings, lamp: !lampOn }) }}
            onAskBasil={() => { sound.play('place', 0.35); basil.hush(); setOverlay('cookbook') }}
            onHushBasil={basil.hush}
            basilSpeech={basil.speech}
            basilMode={happy ? 'happy' : overlay === 'cookbook' ? 'attentive' : fridgeOpen || freezerOpen ? 'alert' : 'sleep'}
          />
        </div>
      </div>

      {drag && (
        <span
          className="drag-ghost"
          style={{
            left: drag.x, top: drag.y,
            width: spriteSize(drag.item.spriteKey).w * view.scale,
            height: spriteSize(drag.item.spriteKey).h * view.scale,
          }}
        >
          <img src={spriteUrl(drag.item.spriteKey)} alt="" />
        </span>
      )}

      <div className="hud">
        <nav className="hud__menu">
          <button className="sv-btn" onClick={() => setOverlay('menu')}>menu</button>
          <button className="sv-btn" onClick={() => setOverlay('pantry')}>kitchen{state.items.length ? ` (${state.items.length})` : ''}</button>
          <button className="sv-btn" onClick={() => setOverlay('shopping')}>list{toBuy(state.shopping).length ? ` (${toBuy(state.shopping).length})` : ''}</button>
          <button className="sv-btn sv-btn--go" onClick={() => setOverlay('cookbook')}>cookbook</button>
        </nav>
        <Clock now={now} sky={sky} season={season} />

        {firstRun && !overlay && !pending && (
          <p className="hud__tip sv-frame sv-small" style={{ top: 18 }}>
            type what you bought below · click Basil the cat for recipes · click the fridge to open it
          </p>
        )}

        <AddBar
          barRef={bar}
          onSubmit={t => void add(t)}
          quick={topQuickAdd(state, 6).map(n => prettyName(n))}
          onQuick={name => void add(name)}
          busy={busy}
          hint={aiReady ? undefined : 'No model key set — Basil reads your list himself and uses his built-in cookbook.'}
        />
      </div>

      <Toast undoable={undoable} onUndo={undo} onDismiss={dismissUndo} />

      {pending && (
        <ParsePreview
          outcome={pending}
          have={state.items}
          onConfirm={commit}
          onCancel={() => setPending(null)}
          onCount={(i, n) => setPending(p => p && ({
            ...p,
            drafts: p.drafts.map((d, k) => (k === i ? { ...d, count: n, displayName: d.name ? prettyName(d.name, n, d.unit) : d.displayName } : d)),
          }))}
          onDrop={i => setPending(p => {
            if (!p) return p
            const drafts = p.drafts.filter((_, n) => n !== i)
            return drafts.length ? { ...p, drafts } : null
          })}
        />
      )}

      {pickedItem && (
        <ItemCard
          item={pickedItem}
          onClose={() => setPicked(null)}
          onAmount={a => apply(`${pickedItem.displayName} is ${a}.`, setAmount(pickedItem.id, a))}
          onCount={n => {
            apply(n <= 0 ? `${pickedItem.displayName} is gone.` : `${pickedItem.displayName}: ${n}.`, setCount(pickedItem.id, n))
            if (n <= 0) setPicked(null)
          }}
          onMove={(l: Location) => apply(`Moved ${pickedItem.displayName} to the ${l}.`, moveItem(pickedItem.id, l))}
          onRemove={() => { apply(`${pickedItem.displayName} is gone. It's on your list.`, allGone(pickedItem.id)); setPicked(null) }}
        />
      )}

      {overlay === 'cookbook' && (
        <Cookbook
          items={state.items}
          history={state.history}
          dietary={settings.dietary}
          aiReady={aiReady}
          filters={cookFilters}
          onFilters={setFilters}
          onCook={doCook}
          listed={new Set(toBuy(state.shopping).map(x => x.name))}
          onList={m => {
            const add = missingFor(m)
            sound.play('place')
            apply(`Added ${add.length === 1 ? add[0].name : `${add.length} things`} to your list.`, addToList(add, 'ensure'))
          }}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === 'shopping' && (
        <ShoppingList
          list={state.shopping}
          onAdd={text => apply('Added to your list.', addToList(readList(text)))}
          onTick={id => {
            const it = state.shopping.find(x => x.id === id)
            sound.play('place')
            apply(`Put ${it?.label ?? 'it'} away.`, tick(id))
          }}
          onRemove={id => apply('Taken off your list.', unlist(id))}
          onClearTicked={() => apply('Cleared the ticked things.', clearTicked)}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === 'pantry' && <PantryList items={state.items} onPick={i => setPicked(i.id)} onClose={() => setOverlay(null)} />}

      {overlay === 'menu' && (
        <Modal title="Menu" onClose={() => setOverlay(null)} size="narrow">
          <div className="title__menu" style={{ marginTop: 6, alignItems: 'center' }}>
            <button className="sv-btn sv-btn--big sv-btn--go" onClick={() => setOverlay(null)} autoFocus>Back to the kitchen</button>
            <button className="sv-btn sv-btn--big" onClick={() => setOverlay('settings')}>Settings</button>
            <button className="sv-btn sv-btn--big" onClick={() => setOverlay('credits')}>Credits</button>
            <button className="sv-btn sv-btn--big sv-btn--quiet" onClick={() => { setOverlay(null); setScreen('title') }}>Title screen</button>
          </div>
        </Modal>
      )}

      {overlay === 'settings' && (
        <Settings
          settings={settings}
          onChange={setSettings}
          aiNote={aiReady ? 'A model is connected: Basil reads your shopping and adds recipe ideas of his own.' : 'No model key is set. Everything still works: a built-in reader and a built-in cookbook of about forty recipes.'}
          onReset={() => { apply('Emptied the kitchen.', s => ({ ...s, items: [], history: [], quickAdd: {} })); setOverlay(null) }}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay === 'credits' && <Credits onClose={() => setOverlay(null)} />}

      {debug && <DebugManifest />}
    </div>
  )
}
