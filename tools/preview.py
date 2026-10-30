"""A contact sheet of built sprites, for checking art changes by eye.

    python3 -I tools/preview.py out.png dish/,food/ [scale]

The second argument is a comma-separated list of sprite-key prefixes.
"""
import json, os, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "assets", "sprites")

names = sorted(n for n in json.load(open(os.path.join(OUT, "index.json")))
               if any(n.startswith(p) for p in sys.argv[2].split(",")))
scale = int(sys.argv[3]) if len(sys.argv) > 3 else 4
CELL = max(max(Image.open(f"{OUT}/{n}.png").size) for n in names) * scale + 22
COLS = 8
rows = (len(names) + COLS - 1) // COLS

sheet = Image.new("RGB", (COLS * CELL, rows * CELL), (38, 28, 46))
d = ImageDraw.Draw(sheet)
for i, n in enumerate(names):
    im = Image.open(f"{OUT}/{n}.png").convert("RGBA")
    im = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
    cx, cy = (i % COLS) * CELL, (i // COLS) * CELL
    sheet.paste(im, (cx + 4, cy + 14), im)
    d.text((cx + 3, cy + 2), n.split("/")[-1], fill=(255, 220, 120))
sheet.save(sys.argv[1])
print(sys.argv[1], len(names))
