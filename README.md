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
`/api/parse` and `/api/suggest` on its own origin, and the build
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

## Deploying to Vercel

1. Import the repo at vercel.com/new and pick this branch (or merge it first).
   Vercel detects Vite; the defaults are right.
2. Before the first deploy, open **Environment Variables** and add the same
   lines you would put in `.env`:
   - `BASIL_PROVIDER` = `groq` (or `gemini`)
   - `GROQ_API_KEY` = your key (or `GEMINI_API_KEY`)
   - optional: `BASIL_MODEL`
3. Deploy. `/api/*` runs as one serverless function (`api/[...path].ts`) using
   the same handlers as local dev. Changing a variable needs a redeploy.

Anyone with the URL can use the app and spend your key's quota, so the API
caps each visitor at 20 model calls a minute and 300 a day. Change that with
`BASIL_RATE_PER_MIN` / `BASIL_RATE_PER_DAY` (0 turns a limit off). The counts
are kept in memory per serverless instance, so treat it as a speed bump, not a
hard quota. For a hard lock, turn on Deployment Protection in the Vercel
project settings.

## Tests

```sh
npm test            # unit tests, once
npm run test:watch  # re-run on save
npm run typecheck   # client, server and tests
```

The tests cover the logic that can lose or misfile your food: storage and its
recovery from bad saves, shelf placement, cooking, the keyword parser, sprite
lookup, the model reply validators, and the API routes including the rate
limit. They never call a real model. GitHub Actions runs typecheck, tests and
the build on every push and pull request.

## Build status

- [x] **1 — Scene + assets.** Room, palette, font, sprite manifest, fridge and
      cupboard open and close.
- [x] **2 — Inventory.** Items on real shelves, localStorage behind a
      Repository interface, drag between fridge and cupboard, undo on
      everything.
- [x] **3 — Model parsing.** Gemini (or Groq) behind a server-side proxy,
      strict JSON validation, keyword fallback, preview before anything saves.
- [x] **4 — Crafting.** A 3x3 board on the worktop (replaced in phase 6 by
      Basil's cookbook).
- [x] **5 — Atmosphere.** Basil, day/night lighting on a real clock with a
      wall switch, live weather in the window, sound (muted by default),
      emotion bubbles, credits.
- [x] **6 — A proper game.** Title screen (start / settings / credits) and
      wooden, parchment menus throughout. The room is wider, with a dining
      nook, and its wall and floor run to the screen edges. The crafting board
      is gone: clicking Basil opens his cookbook, about forty built-in
      recipes with calories and protein, tick boxes for high protein, low
      calorie, quick, vegetarian, vegan and food going off, and the full method
      a click away. Cooking from it uses up the right amount (three eggs, not
      one). Shopping reads as "Eggs, ×2" rather than "two eggs"; buying more
      tops up what is there. The sky always follows your own clock; the switch
      only works the lamp.
- [x] **7 — Seasons.** The real date picks the season (flip it in Settings
      for the southern hemisphere). The window and title landscape change:
      spring blossom, deep summer green, orange trees and falling leaves in
      autumn, snow in winter. Fairy lights go up along the ceiling in winter. Add
      `?season=winter` (or spring, summer, autumn) to the address to preview.
- [x] **8 — A working kitchen.** Fridge and freezer doors both open, built
      by `tools/doors.py` from the closed frame so the body never jumps. Both
      cupboards open. Food is laid out on real shelves by `src/lib/arrange.ts`
      (bottles in the door, tall things on the tall shelf, never on top of
      each other; anything that doesn't fit shows as "+N"). Everything you can
      click glows a soft yellow. The wall clock tells the real time.

## The art rules

These are enforced, not aspirational:

- **One art pixel = one centimetre.** The room is authored in centimetres
  (296 × 240, see `src/lib/room.ts`): a 90cm counter is 90px tall, a cat is
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
- **One font**, TinyRPG Fine Fantasy Strategies, at **multiples of 12px only** (12, 24, 36, 48…).
  Its design grid is 12px; any other size renders blurry.
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
