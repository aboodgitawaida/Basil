# Basil

A pixel-art kitchen you can click around in. Open the fridge, see what you
actually have, and get told what you could cook. Basil is also the cat asleep
on the counter.

Personal app — no accounts, no backend. Everything lives in `localStorage`.

## Running it

```sh
npm install
cp .env.example .env     # then put your key in it
npm run dev
```

Open http://localhost:5173. Add `?debug` to the URL to see the sprite manifest
resolve a list of typed food names — useful when adding new art.

For a production run, `npm run build` then `npm start`, which serves `dist/`
and the same API routes from Express on :8787.

### The model key

One line in `.env`:

```
GEMINI_API_KEY=...
```

That is the whole setup. The key is read in `server/config.ts`, used only in
`server/providers.ts`, and never reaches the browser — the client talks to
`/api/parse`, `/api/suggest` and `/api/craft` on its own origin, and the build
output contains no mention of it.

**To switch provider**, edit `server/config.ts` — it is the only file that
knows about providers. Groq is already wired up:

```
BASIL_PROVIDER=groq
GROQ_API_KEY=...
```

`BASIL_MODEL` pins a model name without touching code, and
`BASIL_GEMINI_URL` / `BASIL_GROQ_URL` point the proxy at a gateway or a stub.

**Without a key, everything still works.** A missing key, an unreachable
model and an unparseable reply all land on the same keyword matcher, and the
preview says which parser produced what you are looking at.

## Build status

- [x] **1 — Scene + assets.** Room, palette, font, sprite manifest, fridge and
      cupboard open and close.
- [x] **2 — Inventory.** Items on real shelves, localStorage behind a
      Repository interface, drag between fridge and cupboard, undo on
      everything.
- [x] **3 — Model parsing.** Gemini (or Groq) behind a server-side proxy,
      strict JSON validation, keyword fallback, preview before anything saves.
- [x] **4 — Crafting.** A 3x3 board on the worktop, live output preview,
      cooking spends ingredients, recipe book of what you have made and what
      you could.
- [x] **5 — Atmosphere.** Basil, day/night lighting on a real clock with a
      wall switch, live weather in the window, sound (muted by default),
      emotion bubbles, credits.

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

| Source | px per cm | measured from | used |
|---|---|---|---|
| Pixel Art Fridge Pack | ~0.5 | fridge 83px = 166cm | **yes, ×2** |
| Food Pack 2 | ~0.5–0.6 | milk carton 14px = 28cm | **yes, ×2** |
| Sleeping cat | 0.96 | 43px = 45cm | yes, halved then ×2 |
| Restaurant pack, cookware | ~1.0 | pot 19px = 20cm | yes, halved then ×2 |
| Item Pack | ~1.0 | jar 15px = 15cm | yes, halved then ×2 |
| Modern Interiors | 0.23 | counter 21px = 90cm | no |
| Restaurant pack, **food** | ~1.5 | apple 12px — 6× oversized *in its own pack* | no |
| Gritty Kitchen | — | — | no — wrong mood |

Everything lands on one **2px grid**: the half-scale packs are upscaled ×2, the
full-scale ones are halved and then upscaled ×2, and the architecture in
`tools/furniture.py` is drawn at half scale for the same reason. Mixing 1×1 and
2×2 detail in one frame is what made the scene read as six artists' work.

Modern Interiors is four times coarser than the object sprites and is not used.
The restaurant pack's fruit is drawn as collectible icons rather than world
objects — six times oversized against its own chef — and is replaced by Food
Pack 2's groceries. Gritty Kitchen is an industrial horror kitchen: stained
steel, pipes, grey-green palette. It would fight everything.

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
- **Pixel Art Fridge Pack**, **Food Pack 2** and **Food Icons** are now the
  main object sources. Food Icons ships a licence agreement in its folder that
  needs reading before release; the other two shipped without one.
- Kenney Interface Sounds, the TinyRPG font kit and the TinyRPG emoji pack are
  CC0.
- Several packs — the Restaurant food sprites, the cat, Item Pack, Cozy Cute UI
  and all four audio tracks — shipped with **no licence file at all**. Their
  sources need confirming before this goes anywhere public.

Attribution for every pack lands on the credits screen in phase 5.
