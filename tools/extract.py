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
import glob, json, os, shutil, sys
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
FOOD2 = os.path.join(A, "Pixel Art - Food Pack 2")
ICONS = os.path.join(A, "Pixel Art - Food Icons - FREE Version/Transparent PNG Files")
FRIDGE_PACK = os.path.join(A, "Pixel Art Fridge Pack/Fridges - Green/Fridge 5 - Empty_sprites")

# World centimetres per source pixel for the packs that are drawn at roughly
# half the world scale. Everything is emitted already upscaled, so the scene
# code only ever deals in centimetres.
UNIT = 2

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


def up(img, n=UNIT):
    return img.resize((img.width * n, img.height * n), Image.NEAREST)


def chunk(img):
    """Halve, then double. Leaves the sprite the same size on the world ruler
    but on the same 2px grid as the packs, so one object isn't twice as finely
    drawn as the thing it sits on."""
    small = img.resize((max(1, img.width // 2), max(1, img.height // 2)), Image.BOX)
    return small


def save(img, name, trim=True, process=True, scale=1, chunky=False):
    if chunky:
        img = chunk(img)
    if process:
        img = quantize(img)
        img = outline(img)
    if scale > 1:
        img = up(img, scale)
    if trim:
        b = img.getbbox()
        if b:
            img = img.crop(b)
    path = os.path.join(OUT, name + ".png")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)
    index[name] = {"w": img.width, "h": img.height}


def frames(src, names, size=32, **kw):
    im = Image.open(src).convert("RGBA")
    for i, n in enumerate(names):
        if n:
            save(im.crop((i * size, 0, (i + 1) * size, im.height)), n, **kw)


if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT, exist_ok=True)

# --------------------------------------------------- architecture (drawn) ---
for name, fn in F.AUTHORED.items():
    save(fn(), name, trim=False, process=False, scale=UNIT)
for i, sw in enumerate(F.PANTRY_SWING):
    save(F.pantry_door(F.COUNTER_W // F.H - 4 - sw), f"room/pantry-door-{i}",
         trim=False, process=False, scale=UNIT)
for kind in ("floor", "skirting"):
    save(F.tile(kind), f"room/{kind}", trim=False, process=False, scale=UNIT)

# --- fridge: the pack's own five-frame door swing, mirrored so the door opens
# into the room rather than off the right edge of the scene.
#
# The pack draws the interior as a mid teal, darker than our wall. An open
# fridge should be the brightest thing on screen, so the interior teals are
# lifted towards a warm white before they are quantised.
INTERIOR_TEALS = {
    (0x4d, 0x7c, 0x8a), (0x68, 0x9a, 0xa6), (0x69, 0x97, 0xa2),
    (0x94, 0xc4, 0xcc), (0x98, 0xbd, 0xbf), (0xad, 0xd9, 0xdb), (0xad, 0xd8, 0xda),
}

def light_interior(img, amount=0.32, towards=(255, 248, 224)):
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a >= 128 and (r, g, b) in INTERIOR_TEALS:
                px[x, y] = (
                    int(r + (towards[0] - r) * amount),
                    int(g + (towards[1] - g) * amount),
                    int(b + (towards[2] - b) * amount),
                    255,
                )
    return img

for i, f in enumerate(sorted(glob.glob(f"{FRIDGE_PACK}/*.png"))):
    im = Image.open(f).convert("RGBA").transpose(Image.FLIP_LEFT_RIGHT)
    im = light_interior(im)
    b = im.getbbox()
    save(im.crop((b[0], 0, b[2], im.height)), f"fridge/door-{i}", trim=False, scale=UNIT)

# ------------------------------------------------- objects, at world scale ---
# These are all ~1 px per cm in their source art, so they go in untouched.
# Food Pack 2 is real groceries at ~0.5 px/cm, so it goes in at x2. It
# replaces the restaurant pack's fruit, which is drawn as collectible icons and
# runs about six times oversized inside its own pack.
FOOD2_MAP = {
    "Carton of Milk": "food/milk", "Milk Bottle": "food/milk-bottle",
    "Blue Tetrapack": "food/tetrapak", "Orange  Tetrapack 2": "food/juice-carton",
    "Cheese": "food/cheese", "Cheese Wedge": "food/cheese-wedge",
    "Ketchup": "food/ketchup", "Mustard": "food/mustard", "Hot Sauce": "food/hot-sauce",
    "Olive Oil": "food/oil", "Green Wine Bottle": "food/wine",
    "Orange Juice Bottle": "food/juice", "Water Bottle": "food/water",
    "Soda Can 1": "food/can-1", "Soda Can 2": "food/can-2", "Soda Can 3": "food/can-3",
    "Soda Can 4": "food/can-4", "Red Apple": "food/apple", "Green Apple": "food/apple-green",
    "Pear": "food/pear", "Broccoli": "food/broccoli", "Pumpkin": "food/pumpkin",
    "Watermelon": "food/watermelon", "Meat Cut": "food/steak",
    "Chicken Drumstick": "food/drumstick", "Turkey Leg": "food/turkey-leg",
    "Paper Bag": "food/paper-bag",
}
for src, name in FOOD2_MAP.items():
    p = f"{FOOD2}/{src}.png"
    if os.path.exists(p):
        save(Image.open(p).convert("RGBA"), name, scale=UNIT)

# Kept from the restaurant pack: cookware, which is correctly sized at 1x.
# Chunked so it sits on the same 2px grid as everything else.
frames(f"{SHEETS}/Silverware.png",
       ["kit/fork", None, None, "kit/bowl", "kit/plate-stack",
        None, "kit/plate", None, "food/egg"], chunky=True, scale=UNIT)
frames(f"{SHEETS}/ChefTools.png",
       [None, None, None, None, "kit/pan",
        "kit/pot", "kit/mixing-bowl", None, None, None], chunky=True, scale=UNIT)

for n, name in [(2, "generic/jar"), (16, "generic/bag")]:
    save(Image.open(f"{ITEMPACK}/Item{n}.png").convert("RGBA"), name,
         chunky=True, scale=UNIT)

# Cooked dishes, for the recipe book in phase 4. UI icons, not world objects,
# so they are left at their own scale.
for cat_dir in sorted(glob.glob(f"{ICONS}/*")):
    for f in sorted(glob.glob(f"{cat_dir}/*.png")):
        save(Image.open(f).convert("RGBA"), f"dish/{os.path.basename(f)[:-4]}")

# Basil, asleep. Placeholder for phase 5 — one frame of the idle loop.
cat = Image.open(f"{CAT}/sleepingcat1.png").convert("RGBA")
for i in range(6):
    save(cat.crop((i * 64, 0, (i + 1) * 64, 64)), f"cat/sleep-{i}",
         chunky=True, scale=UNIT)

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

for name, w, h, fn in (("generic/box", 17, 16, boxy),):
    img, d = F.new(w, h)
    fn(d)
    save(img, name, chunky=True, scale=UNIT)

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
