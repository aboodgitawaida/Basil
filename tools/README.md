# Art pipeline

The sprites the app uses are already built and committed in
`src/assets/sprites/`, so you only need this folder to change the art.

```sh
npm run assets
```

That runs, in order:

| Script | What it does | Needs the source packs |
|---|---|---|
| `extract.py` | Crops every sprite out of the packs, remaps it onto the 27-colour palette in `palette.py`, gives it the same ink outline and scales it to world size (1 px = 1 cm). Draws the room itself from `furniture.py`. | yes |
| `doors.py` | Rebuilds the fridge and freezer doors frame by frame, and the cupboard and clock pieces. | no |
| `basil.py` | Draws Basil's awake, stretching and happy poses from the sleeping frames. | no |
| `drawn.py` | Draws the egg and the egg, pasta, rice and salad dishes. | no |
| `favicon.py` | Makes the site icons in `public/` from Basil's pose. | no |

`gif.py` builds the README GIF and the link preview image from the frames
`npm run screenshots` takes, and `preview.py` makes a contact sheet of built
sprites for checking changes by eye.

## The source packs

The packs are not in the repository: several of their licences don't allow
passing the files on. To run `extract.py`, download each one and unzip it to
the path shown.

| Pack | Creator | Unzip to |
|---|---|---|
| [FREE Pixel Art - Fridge Pack - Animated](https://karsiori.itch.io/free-pixel-art-fridge-pack-animated) | KARSIORI | `assets/Pixel Art Fridge Pack/` |
| [FREE Pixel Art - Food Pack 2](https://karsiori.itch.io/free-pixel-art-food-pack-2) | KARSIORI | `assets/Pixel Art - Food Pack 2/` |
| [Pixel Art - Food Icons - FREE Version](https://frostwindz.itch.io/pixel-art-food-icons-free-version) | Frostwindz | `assets/Pixel Art - Food Icons - FREE Version/` |
| [Restaurant Character and Tileset](https://rkuhlf-assets.itch.io/restaurant-pixel-art) | Riley (rkuhlf-assets) | `assets/sprites/restaurant/spritesheets/` |
| [Cat Sleeping Animation FREE](https://toffeecraft.itch.io/cat-sleeping-animation-free) | ToffeeCraft | `assets/sprites/sleeping-cat-free/` |
| [Pixel Item Pack](https://stealthix.itch.io/pixel-item-pack) | Stealthix | `assets/sprites/items/item-pack/` |
| [Weather particle sprites](https://emiemigames.itch.io/weather-particle-sprites) | Emi Emi Games | `assets/sprites/unknown-single-spritesheet.png` (the single spritesheet) |
| Tiny RPG Emoji Pack I | Gabriel "tiopalada" Lima | `assets/ui/emoji-pack-i/` |

The fonts, sounds and music in `src/assets/` are used as they come and are
not part of the pipeline. See [CREDITS.md](../CREDITS.md) for every licence.
