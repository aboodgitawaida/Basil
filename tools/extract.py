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
# floor candidates, same 16px grid as the walls
for name, top in {"brick": 86, "tile": 118, "mint": 150, "stone": 182, "herring": 214}.items():
    crop(ROOMBUILD, (176, top, 192, top + 16), f"room/floor-{name}", trim=False)

# ---- furniture ----
crop(INTERIORS, (112, 783, 144, 812), "room/cupboard")
crop(INTERIORS, (114, 772, 141, 790), "room/wall-cabinet")
crop(INTERIORS, (52, 949, 77, 971), "room/counter")
crop(INTERIORS, (115, 391, 140, 411), "room/window")
crop(INTERIORS, (160, 1088, 192, 1129), "room/shelf-stocked")
crop(INTERIORS, (160, 704, 181, 742), "room/plant")
crop(INTERIORS, (184, 712, 205, 741), "room/plant-small")
crop(INTERIORS, (6, 362, 27, 376), "room/picture-wide")
crop(INTERIORS, (32, 350, 48, 367), "room/picture-1")
crop(INTERIORS, (48, 350, 64, 367), "room/picture-2")
crop(INTERIORS, (114, 244, 174, 284), "room/rug")
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
slice_sheet(f"{SHEETS}/Furniture.png",
            ["kit/chair", "kit/table", "kit/stool", "kit/board"])
slice_sheet(f"{SHEETS}/Clouds.png",
            ["sky/cloud-1", "sky/cloud-2", "sky/cloud-3", "sky/cloud-4",
             "sky/cloud-5", "sky/cloud-6", "sky/cloud-7", "sky/cloud-8"])
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


# ---- fridge, drawn properly ---------------------------------------------
# No pack has a fridge, and a flat CSS box reads as a hole next to the sprites.
# Drawing it here means it gets the same treatment as the rest of the art:
# moulded door panels, a dithered sheen, a vent grille and a few magnets.
PAPER   = (242, 228, 196, 255)
# A retro mint fridge: it reads as an object against the butter wall, where a
# white slab just read as a hole, and it picks up the mint in the window.
MIST    = (206, 233, 224, 255)
SHADE   = (184, 216, 206, 255)
EDGE    = (120, 160, 152, 255)
STEEL   = (167, 151, 150, 255)
DEEP    = (107, 80, 82, 255)
SLATE   = (58, 58, 80, 255)
SLATE_L = (70, 70, 94, 255)
INKC    = (27, 23, 38, 255)

FRIDGE_W, FRIDGE_H, FREEZER_H = 44, 116, 36
DOOR_WIDTHS = [FRIDGE_W, 32, 20, 9]

def fridge_carcass():
    w, h = FRIDGE_W, FRIDGE_H
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w - 1, h - 1], fill=SHADE)
    d.rectangle([0, 0, w - 1, h - 1], outline=DEEP)
    for top, bottom in ((2, FREEZER_H - 3), (FREEZER_H + 1, h - 3)):
        d.rectangle([2, top, w - 3, bottom], fill=SLATE_L)
        # light falls off towards the hinge side
        d.rectangle([2, top, 5, bottom], fill=SLATE)
        for y in range(top, bottom + 1, 2):
            d.point((6, y), fill=SLATE)
    for y in (FREEZER_H // 2 + 2, 14 + FREEZER_H, 32 + FREEZER_H, 50 + FREEZER_H, 66 + FREEZER_H):
        if y >= h - 4: continue
        d.line([(3, y), (w - 4, y)], fill=STEEL)
        d.line([(3, y + 1), (w - 4, y + 1)], fill=INKC)
    d.rectangle([0, FREEZER_H - 2, w - 1, FREEZER_H], fill=STEEL)
    d.rectangle([1, h - 3, w - 2, h - 1], fill=DEEP)
    return img

def fridge_door(w, h, freezer):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w - 1, h - 1], fill=MIST)
    # the door is curved, so the far third sits in shade
    edge = max(2, w - w // 4)
    d.rectangle([edge, 0, w - 1, h - 1], fill=SHADE)
    for off, step in ((1, 2), (2, 3), (3, 4)):        # dithered falloff
        for y in range(off % step, h - 1, step):
            d.point((edge - off, y), fill=SHADE)
    d.line([(1, 0), (1, h - 1)], fill=PAPER)          # hinge-side highlight
    d.line([(0, 0), (w - 1, 0)], fill=EDGE)
    d.line([(0, 0), (0, h - 1)], fill=EDGE)
    d.line([(w - 1, 0), (w - 1, h - 1)], fill=DEEP)   # shut line
    d.line([(0, h - 1), (w - 1, h - 1)], fill=DEEP)
    d.line([(0, h - 2), (w - 1, h - 2)], fill=EDGE)
    if w >= 16:
        d.rectangle([3, 3, w - 5, h - 4], outline=EDGE)    # moulded panel
        d.line([(4, 4), (w - 6, 4)], fill=PAPER)
        for y in range(5, h - 5, 2):                        # dithered sheen
            d.point((5, y), fill=PAPER)
        hy = (h - 6, h - 6 + 1) if freezer else (5, 6)
        d.rectangle([w - 9, hy[0] - (14 if freezer else 0), w - 8, hy[1] + (0 if freezer else 14)], fill=DEEP)
        d.line([(w - 7, hy[0] - (14 if freezer else 0)), (w - 7, hy[1] + (0 if freezer else 14))], fill=PAPER)
        if not freezer:
            for i, c in enumerate(((219, 136, 35, 255), (194, 27, 35, 255), (66, 161, 40, 255))):
                d.rectangle([7 + i * 5, h - 30, 8 + i * 5, h - 29], fill=c)
            for gy in range(h - 9, h - 4, 2):               # vent grille
                d.line([(5, gy), (w - 7, gy)], fill=STEEL)
    else:
        for y in range(2, h - 2, 2):
            d.point((max(1, w - 3), y), fill=STEEL)
    return img

save(fridge_carcass(), "fridge/carcass", trim=False)
for i, dw in enumerate(DOOR_WIDTHS):
    save(fridge_door(dw, FREEZER_H, True), f"fridge/freezer-{i}", trim=False)
    save(fridge_door(dw, FRIDGE_H - FREEZER_H, False), f"fridge/door-{i}", trim=False)

# ---- authored fittings ---------------------------------------------------
WOOD_L, WOOD_M, CREAM = (199, 140, 89, 255), (184, 132, 81, 255), (208, 190, 156, 255)
AMBER, RUST = (219, 136, 35, 255), (171, 74, 54, 255)

def shelf(d):            # wall shelf, 52x7
    d.rectangle([0, 0, 51, 0], fill=PAPER)
    d.rectangle([0, 1, 51, 2], fill=WOOD_L)
    d.rectangle([0, 3, 51, 3], fill=DEEP)
    for bx in (5, 44):   # brackets
        d.polygon([(bx, 4), (bx + 3, 4), (bx, 6)], fill=WOOD_M)

def clock(d):            # wall clock, 11x11
    d.ellipse([0, 0, 10, 10], fill=DEEP)
    d.ellipse([1, 1, 9, 9], fill=CREAM)
    d.line([(5, 5), (5, 2)], fill=INKC)
    d.line([(5, 5), (7, 6)], fill=INKC)
    d.point((5, 5), fill=RUST)

def pendant(d):          # hanging shade, 15x9
    d.polygon([(6, 0), (8, 0), (14, 7), (0, 7)], fill=AMBER)
    d.polygon([(6, 0), (7, 0), (3, 7), (0, 7)], fill=(235, 173, 103, 255))
    d.line([(0, 8), (14, 8)], fill=PAPER)
    d.line([(0, 7), (14, 7)], fill=DEEP)

def mat(d):              # side-on rug, 58x9
    CRM = (228, 193, 129, 255)
    d.rectangle([3, 1, 54, 1], fill=CRM)
    d.rectangle([3, 2, 54, 4], fill=RUST)
    d.rectangle([3, 5, 54, 6], fill=(156, 17, 24, 255))
    d.rectangle([3, 7, 54, 7], fill=(107, 80, 82, 255))
    for x in range(5, 54, 7):
        d.rectangle([x, 2, x + 2, 4], fill=CRM)
        d.rectangle([x + 1, 5, x + 2, 6], fill=RUST)
    for x in (0, 1, 2, 55, 56, 57):      # fringe
        d.line([(x, 3), (x, 6)], fill=CRM)

def towel(d):            # tea towel hung over the counter edge, 10x17
    T, TD, TL = (194, 27, 35, 255), (156, 17, 24, 255), (242, 228, 196, 255)
    d.rectangle([3, 0, 6, 2], fill=TD)                # over the rail
    d.polygon([(2, 2), (7, 2), (9, 15), (0, 15)], fill=T)
    d.polygon([(2, 2), (4, 2), (3, 15), (0, 15)], fill=TD)   # fold shadow
    d.rectangle([1, 5, 8, 6], fill=TL)                # woven stripe
    d.rectangle([0, 14, 9, 14], fill=TD)
    for x in (1, 4, 7): d.point((x, 16), fill=T)      # frayed hem

def herbs(d):            # a bunch hung upside down to dry, 11x18
    ST, LF, LD = (107, 80, 82, 255), (66, 161, 40, 255), (49, 122, 27, 255)
    d.line([(5, 0), (5, 3)], fill=ST)
    d.rectangle([3, 3, 7, 4], fill=(184, 132, 81, 255))   # twine
    # widest at the top, tapering to the tips — the opposite of a shrub
    for i, (y, w) in enumerate(((5, 5), (9, 4), (12, 2))):
        d.polygon([(5 - w, y), (5 + w, y), (5 + w - 1, y + 4), (5 - w + 1, y + 4)], fill=LF)
        d.polygon([(5 - w, y), (5, y), (5 - w + 1, y + 4)], fill=LD)
        if i < 2: d.line([(5, y), (5, y + 4)], fill=LD)
    d.polygon([(4, 16), (6, 16), (5, 17)], fill=LF)

def cornice(d):          # 16x7 ceiling band, caps the top of the wall
    d.rectangle([0, 0, 15, 2], fill=CREAM)
    d.rectangle([0, 3, 15, 3], fill=PAPER)
    d.rectangle([0, 4, 15, 4], fill=WOOD_M)
    d.rectangle([0, 5, 15, 6], fill=DEEP)

def tiles(d):            # 16x16 splashback, four tiles and grout
    d.rectangle([0, 0, 15, 15], fill=(185, 158, 134, 255))
    for tx in (0, 8):
        for ty in (0, 8):
            d.rectangle([tx, ty, tx + 6, ty + 6], fill=(242, 228, 196, 255))
            d.line([(tx, ty), (tx + 6, ty)], fill=(255, 255, 255, 255))

for name, w, h, fn in [("room/cornice", 16, 7, cornice), ("room/shelf", 52, 7, shelf),
                       ("room/clock", 11, 11, clock), ("room/pendant", 15, 9, pendant),
                       ("room/mat", 58, 9, mat), ("room/towel", 9, 16, towel),
                       ("room/herbs", 11, 18, herbs), ("room/tiles", 16, 16, tiles)]:
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fn(ImageDraw.Draw(img))
    save(img, name, trim=False)

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

with open(os.path.join(OUT, "index.json"), "w") as f:
    json.dump(index, f, indent=1, sort_keys=True)
print(f"{len(index)} sprites -> src/assets/sprites/")
