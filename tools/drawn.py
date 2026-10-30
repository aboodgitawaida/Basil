"""Sprites drawn for this project rather than cut from a pack.

Run from the project root after tools/extract.py:  python3 -I tools/drawn.py

Needs nothing but the sprites already in src/assets/sprites, so it runs on a
fresh clone without the source packs.

  food/egg        a single egg, on the 2px world grid. Counted things are
                  drawn up to three in a row, so six eggs read as eggs.
  dish/eggs       a fried egg on a plate
  dish/pasta      spaghetti with tomato sauce
  dish/rice       a bowl of rice
  dish/salad      a bowl of leaves and tomatoes

The icon pack has soups, meat, fish, fruit, nuts and pastry but nothing for
the egg, pasta, rice and salad dishes the cookbook is mostly made of. The new
bowls reuse the pack's own soup bowl and only repaint what is in it, so they
sit next to the originals as one set.
"""
import json, os, random, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
from palette import rgba

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = os.path.join(ROOT, "src", "assets", "sprites")
index = json.load(open(os.path.join(S, "index.json")))


def save(im, k):
    im.save(os.path.join(S, k + ".png"))
    index[k] = {"w": im.width, "h": im.height}


def paint(rows, colours, scale=1):
    """A sprite from a picture made of characters. '.' is transparent."""
    h, w = len(rows), max(len(r) for r in rows)
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = im.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch != ".":
                px[x, y] = colours[ch]
    return im.resize((w * scale, h * scale), Image.NEAREST) if scale > 1 else im


# ------------------------------------------------------------------- egg ---
# 5 x 6 at 2cm a pixel: about the size of a real egg next to the 12cm apple.
EGG = [
    ".ooo.",
    "ohcco",
    "occco",
    "occto",
    "octto",
    ".ooo.",
]
save(paint(EGG, {
    "o": rgba("ink"), "h": rgba("highlight"), "c": rgba("cream-light"), "t": rgba("cream"),
}, scale=2), "food/egg")


# --------------------------------------------------------------- dishes ---
bowl = Image.open(os.path.join(S, "dish/soup_1.png")).convert("RGBA")
BOWL = {rgba(n)[:3] for n in ("ink", "mint", "wood-dark", "sage", "tan", "wood")}


def inside(img):
    """The pixels that are soup: everything that is not the bowl itself."""
    px = img.load()
    return [(x, y) for y in range(img.height) for x in range(img.width)
            if px[x, y][3] and px[x, y][:3] not in BOWL]


def filled(fill):
    img = bowl.copy()
    px = img.load()
    cells = inside(img)
    cx = sum(x for x, _ in cells) / len(cells)
    cy = sum(y for _, y in cells) / len(cells)
    rnd = random.Random(7)
    for x, y in cells:
        px[x, y] = fill(x - cx, y - cy, rnd)
    return img


def pasta(dx, dy, rnd):
    r2 = dx * dx + (dy * 1.3) ** 2
    if r2 < 14:                              # the sauce on top
        return rgba("red-dark") if rnd.random() < 0.25 else rgba("red")
    if r2 < 22 and rnd.random() < 0.5:
        return rgba("terracotta")
    if abs(dx - 3) + abs(dy + 4) < 2:         # a basil leaf
        return rgba("green-light")
    # strands: diagonal stripes, broken up so they curl
    band = int(dx + dy * 1.6 + rnd.random() * 1.5) % 4
    return [rgba("gold"), rgba("cream"), rgba("gold"), rgba("gold-dark")][band]


def rice(dx, dy, rnd):
    v = rnd.random()
    if v < 0.07:
        return rgba("green-light")           # peas
    if v < 0.12:
        return rgba("terracotta")            # carrot
    return rgba("cream") if (int(dx) + int(dy * 2)) % 3 == 0 else rgba("highlight") if v > 0.7 else rgba("cream-light")


def salad(dx, dy, rnd):
    v = rnd.random()
    if (round(dx) - 4) ** 2 + (round(dy) + 3) ** 2 < 4 or (round(dx) + 5) ** 2 + (round(dy) - 2) ** 2 < 4:
        return rgba("red")                   # tomato halves
    if v < 0.08:
        return rgba("cream-light")           # cheese
    return rgba("green-light") if (int(dx * 0.8) + int(dy)) % 3 else rgba("green") if v > 0.35 else rgba("green-dark")


def fried_egg(dx, dy, rnd):
    dx, dy = dx + 1, dy + 1                  # the yolk sits a little off centre
    d = (dx * dx + (dy * 1.15) ** 2) ** 0.5
    wobble = 1.6 * ((round(dx) * 3 + round(dy) * 5) % 4) / 4
    if d < 5.2:                              # the yolk
        if -4 < dx < -1 and -4 < dy < -1:
            return rgba("highlight") if dx < -2 and dy < -2 else rgba("cream-light")
        return rgba("gold") if d < 4.2 else rgba("gold-dark")
    if d < 8.5 + wobble:                     # the white
        return rgba("highlight") if dy < -3 and rnd.random() < 0.4 else rgba("cream-light")
    return rgba("mint")                      # the plate showing round it


save(filled(pasta), "dish/pasta")
save(filled(rice), "dish/rice")
save(filled(salad), "dish/salad")
save(filled(fried_egg), "dish/eggs")

with open(os.path.join(S, "index.json"), "w") as f:
    json.dump(index, f, indent=1, sort_keys=True)
print("drew food/egg, dish/eggs, dish/pasta, dish/rice, dish/salad")
