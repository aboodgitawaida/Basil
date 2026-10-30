# Basil

**A cosy pixel-art kitchen that knows what's in your fridge.** Type what you
bought, watch it land on the shelves, and let Basil the cat tell you what you
can cook with it.

**[Play it → basil-cat.vercel.app](https://basil-cat.vercel.app)**

![Typing groceries, watching them land in the fridge, and opening Basil's cookbook](docs/demo.gif)

| | |
|---|---|
| ![The title screen](docs/title.png) | ![The kitchen with the fridge and cupboards open](docs/kitchen.png) |
| ![Basil's cookbook with filters](docs/cookbook.png) | ![A full recipe with calories and protein](docs/recipe.png) |

## What it does

- **One-line shopping entry.** Type `two eggs, 2 bags of milk, half a block of
  cheddar` and press Enter. Each thing is read into a clean label, a quantity
  and a kind ("Cheddar, half, a cheese"), put on the right shelf, and the door
  swings open so you see it land. There's no form and no confirm step: every
  change has an undo.
- **A real kitchen to look in.** The fridge, freezer and both cupboards open.
  Food is laid out on actual shelves: bottles in the door, tall things on the
  tall shelf, never stacked on top of each other.
- **Basil's cookbook.** Click the cat. He wakes, stretches and shows everything
  you can make right now, plus what you're one or two things short of. You can
  filter by high protein, low calorie, quick, vegetarian, vegan or "uses food
  going off". Every recipe has a full method, calories and protein per serving.
  With an AI key, Basil adds ideas of his own; without one, the 46 built-in
  recipes still work.
- **A shopping list that fills itself.** Anything that runs out goes on it.
  Recipes you're short for add their missing ingredients in one click. Tick
  something off in the shop and it goes straight into the kitchen.
- **A world that follows yours.** The window shows your real time of day (sun,
  moon, stars, dawn and dusk), the current season, and optionally your local
  weather. The wall clock tells the real time.

![The same kitchen in spring, summer, autumn and winter](docs/seasons.png)

## Tech

- **React 18 + TypeScript + Vite.** No game engine: the room is DOM elements
  placed in "art pixels" (1 px = 1 cm) and scaled by one whole number, so pixel
  art never blurs.
- **AI behind a serverless function.** `/api/parse` and `/api/suggest` run in
  one Vercel function (`api/[...path].ts`); locally the same handlers run
  inside Vite or Express. The model key is read server-side only and never
  reaches the browser bundle. Supports Gemini or Groq, with JSON-schema
  output, strict validation, a per-visitor rate limit, and an 8-second client
  timeout.
- **Works without AI.** A keyword parser and a built-in recipe book are the
  fallback for a missing key, a slow model, a bad reply or no network. The
  app never blocks on the model.
- **Local-first.** Everything is saved in `localStorage` behind a `Repository`
  interface, with versioned migrations. No accounts.
- **Pure logic, well tested.** Parsing, shelf layout (`src/lib/arrange.ts`),
  recipe matching, the shopping list, storage migrations and the API
  validators are pure functions with 166 unit tests (Vitest), plus a
  Playwright smoke test that plays through the main loop at desktop and phone
  sizes. CI runs typecheck, tests, build and the smoke test on every push.
- **Art pipeline in Python.** `tools/` remaps every sprite onto one 24-colour
  palette, and builds the fridge doors, Basil's awake poses and the site icon
  from the source packs.

```
src/
  scene/   the room: fridge, cupboards, window, Basil, clock
  ui/      menus: cookbook, shopping list, settings, title screen
  lib/     pure logic: parsing, recipes, layout, storage, time and seasons
server/    API handlers, providers, schemas, rate limit (shared by Vercel and Express)
tools/     sprite pipeline (Python)
scripts/   Playwright smoke test and README screenshots
```

## Running it

```sh
npm install
cp .env.example .env     # optional: add GROQ_API_KEY or GEMINI_API_KEY
npm run dev              # http://localhost:5173
```

Without a key, everything works on the built-in reader and cookbook.

```sh
npm test            # unit tests
npm run typecheck   # client, server and tests
npm run build && npm run smoke         # end-to-end smoke test
npm run build && npm run screenshots   # regenerate docs/ (then python3 -I tools/gif.py)
```

Add `?season=winter` (or spring, summer, autumn) to the URL to preview a
season, or `?debug` to check the sprite manifest.

### The AI key

One line in `.env` (or in the host's environment variables):

```
BASIL_PROVIDER=groq        # or gemini
GROQ_API_KEY=...           # or GEMINI_API_KEY
```

`BASIL_MODEL` pins a model name. `BASIL_RATE_PER_MIN` and `BASIL_RATE_PER_DAY`
cap model calls per visitor (default 20 a minute, 300 a day). The counts live
in memory per serverless instance, so also set a spending limit in your
provider's dashboard.

### Deploying

Import the repo on Vercel; it detects Vite. Add the variables above under
Environment Variables and deploy. `/api/*` runs as one serverless function.

## Credits

The art and sound come from free asset packs, used with their creators'
permission; see [CREDITS.md](CREDITS.md). The code is MIT-licensed; the art
and audio are not covered by that licence and may not be reused.
