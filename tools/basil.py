"""Basil's awake poses, drawn from his sleeping sprite.

Run from the project root after tools/extract.py:  python3 -I tools/basil.py

The cat pack only has him asleep, so the rest is drawn here, on the sprite's
own 2px grid (all edits happen at half size, then it is doubled back):

  cat/awake      eyes open, head still down
  cat/up         eyes open, head lifted one block: sat up and paying attention
  cat/blink      head lifted, eyes shut for a moment
  cat/happy      head lifted, eyes squeezed into ^ ^
  cat/stretch-1  a long stretch, happy eyes
  cat/stretch-2  longer

Every frame is the same 52 x 38 canvas, drawn standing on the bottom edge, so
the scene can swap them without him jumping about.
"""
import json, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = os.path.join(ROOT, "src", "assets", "sprites")
index = json.load(open(os.path.join(S, "index.json")))

base = Image.open(os.path.join(S, "cat/sleep-0.png")).convert("RGBA")
half = base.resize((base.width // 2, base.height // 2), Image.NEAREST)   # 24 x 18

CREAM = (240, 224, 189, 255)
INK = (29, 22, 32, 255)
SOFT = (47, 36, 48, 255)
LID = (141, 146, 113, 255)

def put(im, cells, colour):
    for x, y in cells: im.putpixel((x, y), colour)

def eyes_open(im, dy=0):
    # the closed lids are row 8: cols 2-4 on the left, 7-9 on the right
    put(im, [(2, 8 + dy), (3, 8 + dy), (4, 8 + dy), (7, 8 + dy), (9, 8 + dy)], CREAM)
    put(im, [(3, 7 + dy), (3, 8 + dy), (8, 7 + dy), (8, 8 + dy)], INK)

def eyes_happy(im, dy=0):
    put(im, [(2, 8 + dy), (3, 8 + dy), (4, 8 + dy), (7, 8 + dy), (8, 8 + dy), (9, 8 + dy)], CREAM)
    put(im, [(2, 8 + dy), (3, 7 + dy), (4, 8 + dy), (7, 8 + dy), (8, 7 + dy), (9, 8 + dy)], SOFT)

def lifted(src):
    """Head up by one block: the head's columns move up a row on a canvas
    one row taller, and the row under the chin is kept, which reads as a
    stretched neck rather than a gap."""
    out = Image.new("RGBA", (src.width, src.height + 1))
    out.paste(src, (0, 1))
    for x in range(0, 12):
        for y in range(0, 12):
            out.putpixel((x, y), src.getpixel((x, y)))
    return out

def taller(src):
    out = Image.new("RGBA", (src.width, src.height + 1))
    out.paste(src, (0, 1))
    return out

def stretch(src, n):
    """Longer through the middle of his back."""
    out = Image.new("RGBA", (src.width + n, src.height))
    out.paste(src.crop((0, 0, 16, src.height)), (0, 0))
    for i in range(n): out.paste(src.crop((15, 0, 16, src.height)), (16 + i, 0))
    out.paste(src.crop((16, 0, src.width, src.height)), (16 + n, 0))
    return out

def save(h, key):
    canvas = Image.new("RGBA", (26, 19))
    canvas.paste(h, (0, 19 - h.height), h)
    im = canvas.resize((52, 38), Image.NEAREST)
    im.save(os.path.join(S, key + ".png"))
    index[key] = {"w": im.width, "h": im.height}

a = half.copy(); eyes_open(a); save(taller(a), "cat/awake")
up = lifted(half); eyes_open(up, dy=-1); save(up, "cat/up")
save(lifted(half), "cat/blink")
hp = lifted(half); eyes_happy(hp, dy=-1); save(hp, "cat/happy")
s = half.copy(); eyes_happy(s)
save(taller(stretch(s, 1)), "cat/stretch-1")
save(taller(stretch(s, 2)), "cat/stretch-2")

with open(os.path.join(S, "index.json"), "w") as f:
    json.dump(dict(sorted(index.items())), f, indent=1)
print("drew 6 poses")
