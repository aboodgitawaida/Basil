# Basil

A pixel-art kitchen you can click around in. Open the fridge, see what you
actually have, and get told what you could cook. Basil is also the cat asleep
on the counter.

Personal app — no accounts, no backend. Everything lives in `localStorage`.

## Running it

```sh
npm install
npm run dev
```

Open http://localhost:5173. Add `?debug` to the URL to see the sprite manifest
resolve a list of typed food names — useful when adding new art.

The AI features arrive in phase 3 and will need an Anthropic API key in `.env`,
routed through a local proxy so the key never reaches the browser. Nothing in
the app depends on it; without a key everything else still works.

## Build status

- [x] **1 — Scene + assets.** Room, palette, font, sprite manifest, fridge and
      cupboard open and close.
- [ ] 2 — Inventory, no AI
- [ ] 3 — AI parsing
- [ ] 4 — Crafting + recipe book
- [ ] 5 — Atmosphere (Basil, day/night, weather, sound)

## The art rules

These are enforced, not aspirational:

- **One whole-number scale.** The room is authored in art pixels
  (192 × 200, see `src/lib/room.ts`) and the whole scene is scaled by a single
  integer to fit the viewport, never below 2×. Nothing is scaled individually,
  so every pack renders at the same apparent pixel size.
- **One palette.** `src/styles/palette.css`, sampled from the packs themselves.
  Anything drawn in code — the fridge, shelves, shadows — uses only these.
- **One font**, TinyRPG Fine Fantasy Strategies, at **12px or 24px only**. Its
  design grid is 12px; any other size renders blurry.
- No anti-aliasing, blur, soft shadows, or CSS-rounded corners.
- Animation is whole frames only (`src/lib/useSteps.ts`). A CSS transition
  would interpolate to fractional pixels and the sprite would shimmer.

## Adding sprites

Drop new packs in `assets/`, then crop what you need in `tools/extract.py` and
run:

```sh
npm run assets
```

That rewrites `src/assets/sprites/` from the originals — it is the only thing
that writes there, so never edit those files by hand. Then map names to the new
sprite keys in `src/assets/manifest.ts`.

`resolveSprite()` falls back through category sprites to a generic box, so a
food with no art of its own still renders as something sensible rather than a
blank square.

## Asset licences

Full inventory in [`assets/README.md`](assets/README.md). The important ones:

- **Modern Tiles Free** (the room, furniture, window) is **non-commercial only**
  and may not be used or edited in a commercial project. Fine for a personal
  app; it would have to be replaced or licensed before this ever ships.
- Kenney Interface Sounds, the TinyRPG font kit and the TinyRPG emoji pack are
  CC0.
- Several packs — the Restaurant food sprites, the cat, Item Pack, Cozy Cute UI
  and all four audio tracks — shipped with **no licence file at all**. Their
  sources need confirming before this goes anywhere public.

Attribution for every pack lands on the credits screen in phase 5.
