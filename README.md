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

- **One art pixel = one centimetre.** The room is authored in centimetres
  (192 × 240, see `src/lib/room.ts`): a 90cm counter is 90px tall, a cat is
  43px long, a wall clock is 26px. Objects are sized by what they *are*, not
  by whatever their source frame happened to be. The whole scene is then
  scaled by a single integer to fit the viewport, never below 2×.
- **World scale beats pixel density.** The packs disagree about how many
  pixels a centimetre is worth — see "Why the room is drawn, not cropped".
  Where the two conflict, correct size wins; a slightly chunkier apple is
  fine, an apple the size of a stool is not.
- **One palette.** 24 colours in `tools/palette.py`. Every sprite is remapped
  onto it at build time, which is the single biggest thing making six
  artists' work read as one. `src/styles/palette.css` is generated from it —
  don't edit it by hand.
- **One light source,** up and to the left. Highlights on top and left edges,
  shadow on bottom and right, contact shadows cast right. Everything drawn in
  `tools/furniture.py` follows it.
- **One outline treatment.** Every object sprite gets a 1px ink edge: the
  artist's own outline is recoloured where there is one, a ring is added where
  there isn't.
- **One font**, TinyRPG Fine Fantasy Strategies, at **12px or 24px only**. Its
  design grid is 12px; any other size renders blurry.
- No anti-aliasing, blur, soft shadows, or CSS-rounded corners. Gradients use
  hard colour stops; tapered shapes are built from stepped rectangles, because
  a diagonal `clip-path` would anti-alias.
- Animation is whole frames only (`src/lib/useSteps.ts`). A CSS transition
  would interpolate to fractional pixels and the sprite would shimmer.

## Why the room is drawn, not cropped

Measured against a 90cm counter and a 170cm person, the packs fall into two
groups about four times apart:

| Source | px per cm | measured from |
|---|---|---|
| Modern Interiors | 0.23 | counter 21px = 90cm |
| Restaurant pack, furniture | 0.27 | chair 24px, chef 47px |
| Item Pack | ~1.0 | jar 15px = 15cm |
| Sleeping cat | 0.96 | 43px = 45cm |
| Restaurant pack, **food** | ~1.5 | apple 12px — 6× oversized *in its own pack* |

Rendering both groups at 1× is why an apple used to be the size of a stool.
Upscaling the room art 4× instead would put 4×4 blocks next to 1×1 detail, so
the architecture is **drawn** in `tools/furniture.py` at 1px = 1cm and the room
art is not used at all. The restaurant pack's food is drawn as collectible
icons rather than world objects and is still ~1.5× large at 1×; that is the
one knowing compromise.

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

- **Modern Tiles Free** is **non-commercial only**. It is no longer used by
  the app — the room is drawn rather than cropped, for the scale reasons above
  — so that restriction no longer binds anything that ships. The files stay in
  `assets/` for reference.
- Kenney Interface Sounds, the TinyRPG font kit and the TinyRPG emoji pack are
  CC0.
- Several packs — the Restaurant food sprites, the cat, Item Pack, Cozy Cute UI
  and all four audio tracks — shipped with **no licence file at all**. Their
  sources need confirming before this goes anywhere public.

Attribution for every pack lands on the credits screen in phase 5.
