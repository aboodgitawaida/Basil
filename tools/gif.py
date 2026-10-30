"""Turn docs/frames into the README's demo GIF, the season strip and the
link-preview image. Run after `npm run screenshots`:  python3 -I tools/gif.py"""
import glob, os
from PIL import Image

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

# link preview, 1200 x 630, cropped from the kitchen shot
k = Image.open(os.path.join(D, "kitchen.png")).convert("RGB")
left, top = (k.width - 1200) // 2, max(0, (k.height - 630) // 2)
k.crop((left, top, left + 1200, top + 630)).save(os.path.join(ROOT, "public", "og.png"))
print("demo.gif", len(gif), "frames,", os.path.getsize(os.path.join(D, "demo.gif")) // 1024, "KB")
