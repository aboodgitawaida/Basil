"""Basil's face as the site icon.

Run from the project root after tools/basil.py:  python3 -I tools/favicon.py

Cuts his head (eyes open, head up) out of cat/up at its true half-size, so
each block of the art is one pixel, then sizes it up by whole numbers only.
Writes favicon-16 (his face), favicon-32 and -64 and apple-touch-icon (all of
him, curled up and awake), basil-512, and basil.png under the old name.
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = os.path.join(ROOT, "src", "assets", "sprites")
P = os.path.join(ROOT, "public")

up = Image.open(os.path.join(S, "cat/up.png")).convert("RGBA")
half = up.resize((up.width // 2, up.height // 2), Image.NEAREST)    # 26 x 19
bbox = half.getbbox()
# the head is the left part of him: from his nose to just past his ears
head = half.crop((bbox[0], bbox[1], bbox[0] + 14, bbox[1] + 14))
# where the cut goes through his back, finish it with his own ink outline
INK = (29, 22, 32, 255)
W, H = head.size
for y in range(H):
    if head.getpixel((W - 1, y))[3]: head.putpixel((W - 1, y), INK)
for x in range(W):
    if head.getpixel((x, H - 1))[3]: head.putpixel((x, H - 1), INK)
# and the whole of him, curled up and awake, for the big icon
whole = half.crop(bbox)

def icon(px, scale, pad_colour=None, art=None):
    art = art or head
    art = art.resize((art.width * scale, art.height * scale), Image.NEAREST)
    out = Image.new("RGBA", (px, px), pad_colour or (0, 0, 0, 0))
    out.paste(art, ((px - art.width) // 2, (px - art.height) // 2), art)
    return out

icon(16, 1).save(os.path.join(P, "favicon-16.png"))
icon(32, 1, None, whole).save(os.path.join(P, "favicon-32.png"))
icon(64, 2, None, whole).save(os.path.join(P, "favicon-64.png"))
icon(32, 1, None, whole).save(os.path.join(P, "basil.png"))
# iOS ignores transparency, so the home-screen icon sits on the wall colour
icon(180, 6, (201, 166, 124, 255), whole).save(os.path.join(P, "apple-touch-icon.png"))
icon(512, 18, None, whole).save(os.path.join(P, "basil-512.png"))
print("icons written", head.size)
