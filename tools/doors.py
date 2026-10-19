"""Build the fridge, freezer, cupboard and clock pieces the scene animates.

Run from the project root after tools/extract.py:  python3 -I tools/doors.py

The fridge pack ships five frames of one door swinging, but the last frame is
a different drawing: two pixels wider and taller, outlined differently, so the
whole fridge jumps when it opens. Its freezer door never opens at all. So the
fridge is rebuilt here from the closed frame:

  fridge/shell        the body with both compartments open and empty, with
                      shelves where the scene expects them (see room.ts)
  fridge/fridge-N     the main door, N = 0 closed ... 4 wide open
  fridge/freezer-N    the freezer door, same frames
  room/cupboard-inside  the cupboard carcass with one shelf instead of two,
                      so a loaf or a bag of rice fits
  room/clock-face     the clock with its hands taken off; the scene draws
                      them from the real time

Frames 1-2 are the closed door squashed toward its hinge (left edge); frames
3-4 are the inside of the door opening out to the left of the hinge. Every
width is even: the art is drawn on a 2px grid.
"""
import json, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = os.path.join(ROOT, "src", "assets", "sprites")

def load(k): return Image.open(os.path.join(S, k + ".png")).convert("RGBA")
def save(im, k):
    im.save(os.path.join(S, k + ".png"))
    index[k] = {"w": im.width, "h": im.height}

index = json.load(open(os.path.join(S, "index.json")))
closed = load("fridge/door-0")   # 76 x 166
opened = load("fridge/door-4")   # 146 x 170, body drawn 70px in and 2px down

# where things are on the closed body (all even, the art is 2x)
FREEZER = (0, 60)    # rows of the freezer door
FRIDGE = (62, 154)   # rows of the main door
DOOR_W = 70          # the door front; cols 70-75 are the body's side

px = lambda im, x, y: im.getpixel((x, y))

# --- the inside, taken from the open frame and cleaned ----------------------
# interior colours, sampled from the open frame's main compartment
WALL = px(opened, 74, 90)     # the lit side wall, left
BACK = px(opened, 100, 90)    # the back
SHADOW = px(opened, 100, 84)  # the dark line under a shelf
FRAME = px(opened, 70, 90)    # the compartment's rim
GLASS = px(opened, 100, 82)   # a shelf's lit front edge

def compartment(h, shelves):
    """An empty compartment DOOR_W wide and h tall: a 4px rim, a lit left
    wall, the back, and glass shelves whose top surface is at each row in
    `shelves` (2px lit edge, then 2px shadow beneath)."""
    im = Image.new("RGBA", (DOOR_W, h), FRAME)
    for y in range(4, h - 4):
        for x in range(4, DOOR_W - 4):
            im.putpixel((x, y), WALL if x < 10 else BACK)
    for s in shelves:
        for y in range(s, s + 2):
            for x in range(4, DOOR_W - 4): im.putpixel((x, y), GLASS)
        for y in range(s + 2, s + 4):
            for x in range(10, DOOR_W - 4): im.putpixel((x, y), SHADOW)
    return im

def icy(im):
    out = im.copy()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = out.getpixel((x, y))
            out.putpixel((x, y), (int(r * 0.7 + 222 * 0.3), int(g * 0.7 + 244 * 0.3), int(b * 0.7 + 246 * 0.3), a))
    return out

# shelf rows are relative to the compartment's own top; room.ts mirrors these
FRIDGE_SHELVES = [34, 62]          # surfaces at 34, 62 and the floor at 88
FREEZER_SHELVES = [30]             # surfaces at 30 and the floor at 56

shell = closed.copy()
shell.paste(compartment(FRIDGE[1] - FRIDGE[0], FRIDGE_SHELVES), (0, FRIDGE[0]))
shell.paste(icy(compartment(FREEZER[1] - FREEZER[0], FREEZER_SHELVES)), (0, FREEZER[0]))
save(shell, "fridge/shell")

# --- the doors ---------------------------------------------------------------
def squash(im, w):
    """Nearest-neighbour narrowing on the 2px grid, so pixels stay square."""
    half = im.resize((im.width // 2, im.height // 2), Image.NEAREST)
    return half.resize((max(1, w // 2), half.height), Image.NEAREST).resize((w, im.height), Image.NEAREST)

# the inside of the door, from the open frame: cols 0-67, rows 62-157 there
panel_src = opened.crop((0, 62, 68, 158))   # 68 x 96

def door_inside(h):
    """The inside of a door h tall: the open frame's panel with its bins
    taken out (they are drawn by the scene), stretched or cut to height."""
    p = panel_src.copy()
    # clear the bins: rows with the dark bin colour become the plain panel
    plain = [px(p, x, 30) for x in range(p.width)]
    bin_c = px(p, 20, 12)
    for y in range(4, p.height - 4):
        if px(p, 20, y) == bin_c:
            for x in range(p.width): p.putpixel((x, y), plain[x])
    if h == p.height: return p
    # keep the top and bottom edges, take the middle from the plain section
    top, bottom = p.crop((0, 0, p.width, 12)), p.crop((0, p.height - 12, p.width, p.height))
    mid = p.crop((0, 30, p.width, 32))
    out = Image.new("RGBA", (p.width, h))
    out.paste(top, (0, 0))
    for y in range(12, h - 12, 2): out.paste(mid, (0, y))
    out.paste(bottom, (0, h - 12))
    return out

def frames(rows, name):
    front = closed.crop((0, rows[0], DOOR_W, rows[1]))
    inside = door_inside(rows[1] - rows[0] + 4)   # the panel stands a little proud
    edge = Image.new("RGBA", (6, front.height), px(closed, 72, rows[0] + 10))
    for y in range(front.height):
        edge.putpixel((0, y), (29, 22, 32, 255)); edge.putpixel((1, y), (29, 22, 32, 255))
    save(front, f"fridge/{name}-0")
    save(squash(front, 46), f"fridge/{name}-1")
    save(squash(front, 18), f"fridge/{name}-2")
    save(squash(inside, 34), f"fridge/{name}-3")
    save(inside, f"fridge/{name}-4")

frames(FRIDGE, "fridge")
frames(FREEZER, "freezer")

# --- cupboard with one tall shelf instead of two short ones -----------------
car = load("room/pantry-carcass")   # 52 x 90; old shelves at rows 32-37, 54-59
row = [px(car, x, 40) for x in range(car.width)]
shelf = [[px(car, x, y) for x in range(car.width)] for y in range(32, 38)]
inside = car.copy()
for y in list(range(32, 38)) + list(range(54, 60)):
    for x in range(car.width): inside.putpixel((x, y), row[x])
for i, y in enumerate(range(44, 50)):
    for x in range(car.width): inside.putpixel((x, y), shelf[i][x])
save(inside, "room/cupboard-inside")

# --- the clock without its hands ---------------------------------------------
clock = load("room/clock")
face = px(clock, 8, 12)
ink = px(clock, 12, 6)
hub = px(clock, 12, 12)
# only the face itself: rows 6-17, cols 6-19; the rim outside is ink too
for y in range(6, 18):
    for x in range(6, 20):
        if px(clock, x, y) in (ink, hub):
            clock.putpixel((x, y), face)
save(clock, "room/clock-face")

with open(os.path.join(S, "index.json"), "w") as f:
    json.dump(dict(sorted(index.items())), f, indent=1)
print("built", sum(1 for k in index if k.startswith(("fridge/", "room/cupboard-inside", "room/clock-face"))), "sprites")
