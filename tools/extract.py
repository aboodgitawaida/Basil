"""One-shot asset pipeline: crops the packs into app-ready sprites.
Run from the project root:  python3 -I tools/extract.py
Re-runnable; always rewrites src/assets/sprites/ from the originals in assets/.
"""
import json, os, shutil
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "assets")
OUT = os.path.join(ROOT, "src", "assets", "sprites")
INTERIORS = os.path.join(A, "sprites/modern-tiles-free/Interiors_free/16x16/Interiors_free_16x16.png")
ROOMBUILD = os.path.join(A, "sprites/modern-tiles-free/Interiors_free/16x16/Room_Builder_free_16x16.png")
SHEETS = os.path.join(A, "sprites/restaurant/spritesheets")
ITEMPACK = os.path.join(A, "sprites/items/item-pack/No_Outline")
WEATHER = os.path.join(A, "sprites/unknown-single-spritesheet.png")

index = {}

def save(img, name, trim=True):
    if trim:
        bbox = img.getbbox()
        if bbox: img = img.crop(bbox)
    path = os.path.join(OUT, name + ".png")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)
    index[name] = {"w": img.width, "h": img.height}
    return img

def crop(src, box, name, trim=True):
    return save(Image.open(src).convert("RGBA").crop(box), name, trim)

def slice_sheet(src, names, size=32, trim=True):
    im = Image.open(src).convert("RGBA")
    for i, n in enumerate(names):
        if n is None: continue
        save(im.crop((i*size, 0, (i+1)*size, im.height)), n, trim)

def quantize_alpha(img, cut=25):
    """Hard-edge an anti-aliased sprite: alpha becomes 0 or 255. Keeps pixel art crisp."""
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, 255 if a >= cut else 0)
    return img

if os.path.isdir(OUT): shutil.rmtree(OUT)
os.makedirs(OUT, exist_ok=True)

# ---- room shell (tiling, so never trimmed) ----
# Room Builder stacks eight wall variants in 25px bands: 23px of wall, 2px of
# skirting. Butter-yellow plaster up top, wood paneling as the dado.
# Column 0 of every band is the atlas backdrop, so each crop starts at x=1 —
# including it puts a dark seam at every tile join.
WALL_BANDS = {"terracotta": 86, "plaster": 118, "mint": 150, "panel": 182}
for name, top in WALL_BANDS.items():
    crop(ROOMBUILD, (1, top, 15, top + 23), f"room/wall-{name}", trim=False)
# The striped lower third of the plaster band, used once as a picture rail
# rather than repeated up the whole wall.
crop(ROOMBUILD, (1, 130, 15, 142), "room/wall-trim", trim=False)
crop(ROOMBUILD, (1, 205, 15, 207), "room/skirting", trim=False)
crop(ROOMBUILD, (176, 208, 192, 224), "room/floor", trim=False)

# ---- furniture ----
crop(INTERIORS, (112, 783, 144, 812), "room/cupboard")
crop(INTERIORS, (114, 772, 141, 790), "room/wall-cabinet")
crop(INTERIORS, (52, 949, 77, 971), "room/counter")
crop(INTERIORS, (115, 391, 140, 411), "room/window")
crop(INTERIORS, (160, 1088, 192, 1129), "room/shelf-stocked")
crop(INTERIORS, (160, 704, 181, 742), "room/plant")
crop(INTERIORS, (208, 904, 223, 924), "room/lamp")

# ---- food ----
slice_sheet(f"{SHEETS}/Fruit.png",
            ["food/grapes","food/orange","food/apple","food/lime","food/lemon",
             "food/pear","food/cherry","food/banana"])
slice_sheet(f"{SHEETS}/Vegetables.png",
            ["food/corn","food/garlic","food/pumpkin","food/carrot","food/radish",
             "food/pepper","food/mushroom","food/chilli","food/aubergine","food/pea"])
slice_sheet(f"{SHEETS}/Meat.png",
            ["food/roast-chicken","food/chicken","food/bacon","food/steak","food/ham"])
slice_sheet(f"{SHEETS}/Silverware.png",
            ["kit/fork","kit/spoon","kit/knife","kit/bowl","kit/plate-stack",
             "kit/plate-small","kit/plate","kit/plate-large","food/egg"])
slice_sheet(f"{SHEETS}/ChefTools.png",
            ["kit/masher","kit/knife-small","kit/chef-knife","kit/cleaver","kit/pan",
             "kit/pot","kit/mixing-bowl","kit/ladle","kit/rolling-pin","kit/spatula"])

# ---- generic fallbacks (Item Pack, outline-free so it matches the food style) ----
for src_i, name in [(3, "generic/bottle"), (2, "generic/jar"), (8, "generic/cheese"),
                    (16, "generic/bag"), (13, "generic/meat"), (5, "generic/produce"),
                    (9, "generic/fungus"), (10, "generic/herb")]:
    save(Image.open(f"{ITEMPACK}/Item{src_i}.png").convert("RGBA"), name)

# ---- weather particles (anti-aliased in the source, so hard-edged here) ----
w = Image.open(WEATHER).convert("RGBA")
# cut is per-sprite: the source particles sit at very different opacities,
# and one global threshold either erases the faint ones or blobs the flake.
for box, name, cut in [((5,5,11,10), "weather/leaf-1", 25), ((21,5,27,10), "weather/leaf-2", 25),
                       ((37,5,42,11), "weather/leaf-3", 25), ((54,5,59,11), "weather/leaf-4", 25),
                       ((83,3,93,13), "weather/snowflake", 95), ((214,3,217,30), "weather/rain-1", 25),
                       ((246,3,249,30), "weather/rain-2", 25), ((131,3,141,13), "weather/splash-1", 25),
                       ((146,2,158,14), "weather/splash-2", 25)]:
    save(quantize_alpha(w.crop(box), cut), name)

with open(os.path.join(OUT, "index.json"), "w") as f:
    json.dump(index, f, indent=1, sort_keys=True)
print(f"{len(index)} sprites -> src/assets/sprites/")

# ---- authored containers -------------------------------------------------
# The packs have no milk carton, cardboard box or tin can, and those are the
# three shapes a fridge most needs. Drawn here from the locked palette so they
# sit in the same colour world as the rest of the art.
from PIL import ImageDraw
INK, SHADE = (60, 50, 62, 255), (0, 0, 0, 0)

def authored(name, w, h, draw_fn):
    img = Image.new("RGBA", (w, h), SHADE)
    draw_fn(ImageDraw.Draw(img))
    save(img, name)

def carton(d):           # gable-top milk carton, 14x20
    body, shade, cap = (208, 190, 156, 255), (185, 158, 134, 255), (219, 136, 35, 255)
    d.polygon([(2, 5), (7, 1), (12, 5)], fill=body)          # gable
    d.rectangle([2, 5, 12, 19], fill=body)
    d.rectangle([9, 5, 12, 19], fill=shade)                  # right shade face
    d.rectangle([5, 7, 9, 9], fill=cap)                      # label band
    d.rectangle([6, 1, 8, 3], fill=shade)                    # spout crease
    for x, y in [(2,5),(12,5),(2,19),(12,19)]: d.point((x, y), fill=INK)

def box(d):              # cardboard box, 16x14
    top, front, side = (199, 140, 89, 255), (176, 122, 76, 255), (148, 100, 62, 255)
    d.rectangle([1, 4, 14, 13], fill=front)
    d.rectangle([10, 4, 14, 13], fill=side)
    d.polygon([(1, 4), (4, 1), (14, 1), (14, 4)], fill=top)
    d.line([(7, 4), (7, 13)], fill=side)                     # tape seam

def can(d):              # tin can, 11x16
    tin, shine, label = (167, 151, 150, 255), (216, 208, 224, 255), (194, 27, 35, 255)
    d.rectangle([1, 2, 9, 14], fill=tin)
    d.rectangle([2, 2, 3, 14], fill=shine)                   # highlight stripe
    d.rectangle([1, 5, 9, 11], fill=label)
    d.rectangle([2, 5, 3, 11], fill=(222, 70, 78, 255))
    d.rectangle([1, 0, 9, 2], fill=shine)                    # lid
    d.rectangle([1, 14, 9, 15], fill=(120, 108, 110, 255))   # base rim

authored("generic/carton", 14, 20, carton)
authored("generic/box", 16, 14, box)
authored("generic/can", 11, 16, can)

with open(os.path.join(OUT, "index.json"), "w") as f:
    json.dump(index, f, indent=1, sort_keys=True)
print(f"{len(index)} sprites total")

# ---- favicon: a sprig of basil, in the palette ---------------------------
def basil_sprig():
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    stem, leaf, leaf_lit = (49, 122, 27, 255), (66, 161, 40, 255), (120, 190, 70, 255)
    d.line([(8, 15), (8, 4)], fill=stem)
    for y, spread in ((11, 5), (8, 4), (5, 3)):
        d.ellipse([8 - spread, y - 2, 7, y + 1], fill=leaf)       # left leaf
        d.ellipse([9, y - 2, 8 + spread, y + 1], fill=leaf)       # right leaf
        d.point((8 - spread + 1, y - 1), fill=leaf_lit)
        d.point((8 + spread - 1, y - 1), fill=leaf_lit)
    d.ellipse([6, 1, 10, 4], fill=leaf)
    d.point((7, 2), fill=leaf_lit)
    return img

basil_sprig().save(os.path.join(ROOT, "public", "basil.png"))
print("favicon -> public/basil.png")
