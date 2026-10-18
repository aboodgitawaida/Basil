"""Build src/assets/sprites/ from the packs in assets/.

Run from the project root:  python3 -I tools/extract.py

Two things happen here that matter more than the cropping:

1. WORLD SCALE. The packs disagree about how many pixels a centimetre is
   worth. Measured against a 90cm counter and a 170cm person, the room art
   (Modern Interiors, the restaurant pack's chairs) is ~0.25 px/cm while the
   handheld objects (food, containers, the cat) are ~1.0 px/cm — four times
   finer. Rather than upscale the room art and put 4x4 blocks next to 1x1
   detail, the architecture is drawn in tools/furniture.py at 1px = 1cm and the
   room art is dropped. Objects are then placed at the size the thing really
   is, not the size its source frame happened to be.

2. ONE HAND. Every sprite is remapped onto the palette in tools/palette.py and
   given the same outline treatment, so six artists' work reads as one.
"""
import json, os, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
from palette import nearest, rgba, css_vars
import furniture as F

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "assets")
OUT = os.path.join(ROOT, "src", "assets", "sprites")
SHEETS = os.path.join(A, "sprites/restaurant/spritesheets")
ITEMPACK = os.path.join(A, "sprites/items/item-pack/No_Outline")
WEATHER = os.path.join(A, "sprites/unknown-single-spritesheet.png")
CAT = os.path.join(A, "sprites/sleeping-cat-free")

index = {}
INK = rgba("ink")


# ------------------------------------------------------------- processing ---
def quantize(img):
    """Remap onto the project palette. This is the single biggest thing making
    the packs look related."""
    px = img.load()
    cache = {}
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a < 128:
                px[x, y] = (0, 0, 0, 0)
                continue
            key = (r, g, b)
            if key not in cache:
                cache[key] = nearest(key)
            c = cache[key]
            px[x, y] = (c[0], c[1], c[2], 255)
    return img


def _edge_pixels(img):
    """Opaque pixels with at least one transparent (or off-canvas) neighbour."""
    px = img.load()
    out = []
    for y in range(img.height):
        for x in range(img.width):
            if px[x, y][3] < 128:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < img.width and 0 <= ny < img.height) or px[nx, ny][3] < 128:
                    out.append((x, y))
                    break
    return out


def outline(img):
    """Give everything the same 1px ink edge: recolour the artist's own outline
    where there is one, add a ring where there isn't.

    Only boundary pixels are touched. Recolouring every dark pixel would eat
    the inside of anything dark — a red apple quantises to values as dark as
    an outline, and the whole fruit turns to ink.
    """
    px = img.load()
    edges = _edge_pixels(img)
    if edges:
        dark = sum(1 for x, y in edges if sum(px[x, y][:3]) < 260)
        if dark / len(edges) > 0.45:
            for x, y in edges:
                if sum(px[x, y][:3]) < 320:
                    px[x, y] = INK
            return img

    out = Image.new("RGBA", (img.width + 2, img.height + 2), (0, 0, 0, 0))
    out.paste(img, (1, 1))
    opx = out.load()
    ring = [
        (x, y)
        for y in range(out.height)
        for x in range(out.width)
        if opx[x, y][3] < 128
        and any(
            0 <= x + dx < out.width and 0 <= y + dy < out.height
            and opx[x + dx, y + dy][3] >= 128
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
        )
    ]
    for x, y in ring:
        opx[x, y] = INK
    return out


def save(img, name, trim=True, process=True):
    if process:
        img = quantize(img)
        img = outline(img)
    if trim:
        b = img.getbbox()
        if b:
            img = img.crop(b)
    path = os.path.join(OUT, name + ".png")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)
    index[name] = {"w": img.width, "h": img.height}


def frames(src, names, size=32):
    im = Image.open(src).convert("RGBA")
    for i, n in enumerate(names):
        if n:
            save(im.crop((i * size, 0, (i + 1) * size, im.height)), n)


if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT, exist_ok=True)

# --------------------------------------------------- architecture (drawn) ---
for name, fn in F.AUTHORED.items():
    save(fn(), name, trim=False, process=False)
for i, dw in enumerate(F.DOOR_WIDTHS):
    save(F.fridge_door(dw, F.FREEZER_H, True), f"fridge/freezer-{i}", trim=False, process=False)
    save(F.fridge_door(dw, F.FRIDGE_H - F.FREEZER_H, False), f"fridge/door-{i}", trim=False, process=False)
for i, sw in enumerate(F.CUP_SWING):
    half = F.CUP_W // 2
    save(F.cupboard_door(half - sw, "l"), f"room/cup-l-{i}", trim=False, process=False)
    save(F.cupboard_door(half - sw, "r"), f"room/cup-r-{i}", trim=False, process=False)
for kind in ("floor", "skirting"):
    save(F.tile(kind), f"room/{kind}", trim=False, process=False)

# ------------------------------------------------- objects, at world scale ---
# These are all ~1 px per cm in their source art, so they go in untouched.
frames(f"{SHEETS}/Fruit.png",
       ["food/grapes", "food/orange", "food/apple", "food/lime", "food/lemon",
        "food/pear", "food/cherry", "food/banana"])
frames(f"{SHEETS}/Vegetables.png",
       ["food/corn", "food/garlic", "food/pumpkin", "food/carrot", "food/radish",
        "food/pepper", "food/mushroom", "food/chilli", "food/aubergine", "food/pea"])
frames(f"{SHEETS}/Meat.png",
       ["food/roast-chicken", "food/chicken", "food/bacon", "food/steak", "food/ham"])
frames(f"{SHEETS}/Silverware.png",
       ["kit/fork", "kit/spoon", "kit/knife", "kit/bowl", "kit/plate-stack",
        "kit/plate-small", "kit/plate", "kit/plate-large", "food/egg"])
frames(f"{SHEETS}/ChefTools.png",
       ["kit/masher", None, "kit/chef-knife", None, "kit/pan",
        "kit/pot", "kit/mixing-bowl", "kit/ladle", "kit/rolling-pin", "kit/spatula"])

for n, name in [(3, "generic/bottle"), (2, "generic/jar"), (8, "generic/cheese"),
                (16, "generic/bag"), (13, "generic/meat"), (5, "generic/produce"),
                (9, "generic/fungus"), (10, "generic/herb")]:
    save(Image.open(f"{ITEMPACK}/Item{n}.png").convert("RGBA"), name)

# Basil, asleep. Placeholder for phase 5 — one frame of the idle loop.
cat = Image.open(f"{CAT}/sleepingcat1.png").convert("RGBA")
for i in range(6):
    save(cat.crop((i * 64, 0, (i + 1) * 64, 64)), f"cat/sleep-{i}")

# --------------------------------------------- authored containers + sky ---
def carton(d):
    body, shade, cap = rgba("cream"), rgba("tan"), rgba("red")
    d.polygon([(2, 5), (7, 1), (12, 5)], fill=body)
    d.rectangle([2, 5, 12, 21], fill=body)
    d.rectangle([9, 5, 12, 21], fill=shade)
    d.rectangle([5, 9, 9, 12], fill=cap)
    d.rectangle([6, 1, 8, 3], fill=shade)

def boxy(d):
    top, front, side = rgba("tan"), rgba("wood-light"), rgba("wood"),
    d.rectangle([1, 5, 15, 15], fill=front)
    d.rectangle([11, 5, 15, 15], fill=side)
    d.polygon([(1, 5), (4, 1), (15, 1), (15, 5)], fill=top)
    d.line([(8, 5), (8, 15)], fill=side)

def can(d):
    tin, shine, label = rgba("mauve"), rgba("cream-light"), rgba("red")
    d.rectangle([1, 2, 9, 14], fill=tin)
    d.rectangle([2, 2, 3, 14], fill=shine)
    d.rectangle([1, 5, 9, 11], fill=label)
    d.rectangle([2, 5, 3, 11], fill=rgba("terracotta"))
    d.rectangle([1, 0, 9, 2], fill=shine)

for name, w, h, fn in (("generic/carton", 14, 22, carton),
                       ("generic/box", 17, 16, boxy),
                       ("generic/can", 11, 16, can)):
    img, d = F.new(w, h)
    fn(d)
    save(img, name)

frames(f"{SHEETS}/Clouds.png",
       ["sky/cloud-1", "sky/cloud-2", None, None, "sky/cloud-3", None, None, "sky/cloud-4"])

w = Image.open(WEATHER).convert("RGBA")
def harden(img, cut):
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, 255) if a >= cut else (0, 0, 0, 0)
    return img

for bx, name, cut in (((5, 5, 11, 10), "weather/leaf-1", 25), ((21, 5, 27, 10), "weather/leaf-2", 25),
                      ((37, 5, 42, 11), "weather/leaf-3", 25), ((54, 5, 59, 11), "weather/leaf-4", 25),
                      ((83, 3, 93, 13), "weather/snowflake", 95), ((214, 3, 217, 30), "weather/rain-1", 25),
                      ((246, 3, 249, 30), "weather/rain-2", 25), ((131, 3, 141, 13), "weather/splash-1", 25),
                      ((146, 2, 158, 14), "weather/splash-2", 25)):
    save(harden(w.crop(bx), cut), name, process=False)

# ------------------------------------------------------------------ chrome ---
def basil_sprig():
    img, d = F.new(16, 16)
    stem, leaf, lit = rgba("green-dark"), rgba("green"), rgba("green-light")
    d.line([(8, 15), (8, 4)], fill=stem)
    for y, spread in ((11, 5), (8, 4), (5, 3)):
        d.ellipse([8 - spread, y - 2, 7, y + 1], fill=leaf)
        d.ellipse([9, y - 2, 8 + spread, y + 1], fill=leaf)
        d.point((8 - spread + 1, y - 1), fill=lit)
        d.point((8 + spread - 1, y - 1), fill=lit)
    d.ellipse([6, 1, 10, 4], fill=leaf)
    d.point((7, 2), fill=lit)
    return img

basil_sprig().save(os.path.join(ROOT, "public", "basil.png"))

with open(os.path.join(OUT, "index.json"), "w") as f:
    json.dump(index, f, indent=1, sort_keys=True)

with open(os.path.join(ROOT, "src", "styles", "palette.css"), "w") as f:
    f.write("/* GENERATED by tools/extract.py — edit tools/palette.py instead. */\n")
    f.write(":root {\n" + css_vars() + "\n\n")
    f.write("""  /* roles — components read these, never the raw names above */
  --room-wall:   var(--tan);
  --room-air:    var(--shadow);
  --ceiling:     var(--umber);
  --text:        var(--cream-light);
  --text-dim:    var(--wood-light);
  --panel:       var(--wood-dark);
  --panel-edge:  var(--wood-light);
  --sky:         var(--blue-light);
  --sun:         var(--cream-light);
}
""")

print(f"{len(index)} sprites -> src/assets/sprites/")
