"""Turn docs/frames into the README's demo GIF, the season strip and the
link-preview image. Run after `npm run screenshots`:  python3 -I tools/gif.py"""
import glob, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "docs")
F = os.path.join(D, "frames")

def half(im):
    # exactly half: every 2x2 block becomes one pixel, so nothing smears
    return im.convert("RGB").resize((im.width // 2, im.height // 2), Image.NEAREST)

frames = [half(Image.open(p)) for p in sorted(glob.glob(os.path.join(F, "demo-*.png")))]
pal = frames[len(frames) // 2].quantize(colors=255, method=Image.Quantize.MEDIANCUT)
gif = [f.quantize(palette=pal, dither=Image.Dither.NONE) for f in frames]
gif[0].save(os.path.join(D, "demo.gif"), save_all=True, append_images=gif[1:], duration=110, loop=0, optimize=True)

seasons = [half(Image.open(os.path.join(F, f"season-{s}.png"))) for s in ("spring", "summer", "autumn", "winter")]
w, h = seasons[0].size
grid = Image.new("RGB", (w * 2, h * 2))
for i, im in enumerate(seasons): grid.paste(im, ((i % 2) * w, (i // 2) * h))
grid.save(os.path.join(D, "seasons.png"))

# link preview, 1200 x 630: the kitchen without the menus, with the title on
# the bare wall top left, drawn in the game's own font and colours
OUTLINE, WOOD, WOOD_LIGHT, WOOD_DARK, WOOD_DEEP = "#3b1d0e", "#c56b2e", "#e8964a", "#8f431b", "#6b3014"
CREAM, LEAF = "#fff1cf", "#a9d36a"
FONT = os.path.join(ROOT, "src", "assets", "fonts", "TinyRPG-FineFantasyStrategies.ttf")

k = Image.open(os.path.join(F, "og-kitchen.png")).convert("RGB")
# the left edge of the shot is bare wall: room for the title beside Basil
og = k.crop((0, 135, 1200, 765))
d = ImageDraw.Draw(og)


def outlined(xy, text, font, fill, edge=6, shadow=0):
    x, y = xy
    if shadow:
        for dx in (-edge, 0, edge):
            for dy in (-edge, 0, edge):
                d.text((x + dx, y + dy + shadow), text, font=font, fill=OUTLINE)
        d.text((x, y + shadow), text, font=font, fill=WOOD_DEEP)
    for dx in (-edge, 0, edge):
        for dy in (-edge, 0, edge):
            d.text((x + dx, y + dy), text, font=font, fill=OUTLINE)
    d.text((x, y), text, font=font, fill=fill)


big, small = ImageFont.truetype(FONT, 120), ImageFont.truetype(FONT, 24)
x, y = 44, 70
outlined((x, y), "Basil", big, CREAM, shadow=12)
bw = d.textlength("B", font=big)
d.text((x + bw, y), "a", font=big, fill=LEAF)     # the green a, as on the title screen

lines = ["a cosy kitchen,", "and the cat who runs it"]
tw = max(d.textlength(t, font=small) for t in lines)
bx, by, bw2, bh = x - 6, y + 160, tw + 36, 84
d.rectangle([bx - 3, by - 3, bx + bw2 + 3, by + bh + 3], fill=OUTLINE)
d.rectangle([bx, by, bx + bw2, by + bh], fill=WOOD)
d.rectangle([bx, by, bx + bw2, by + 2], fill=WOOD_LIGHT)
d.rectangle([bx, by, bx + 2, by + bh], fill=WOOD_LIGHT)
d.rectangle([bx, by + bh - 2, bx + bw2, by + bh], fill=WOOD_DARK)
for n, t in enumerate(lines):
    ty = by + 15 + n * 33
    d.text((bx + 20, ty + 2), t, font=small, fill=WOOD_DEEP)
    d.text((bx + 18, ty), t, font=small, fill="#fbe2b0")
og.save(os.path.join(ROOT, "public", "og.png"))
print("demo.gif", len(gif), "frames,", os.path.getsize(os.path.join(D, "demo.gif")) // 1024, "KB")
