import sys, json
from PIL import Image, ImageDraw
# usage: grid.py src out scale  "x0,y0,x1,y1;x0,y0,x1,y1"
src, out, scale, regions = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
im = Image.open(src).convert("RGBA")
regs = [tuple(int(v) for v in r.split(",")) for r in regions.split(";")]
pads = []
for (x0,y0,x1,y1) in regs:
    sub = im.crop((x0,y0,x1,y1))
    bg = Image.new("RGBA", sub.size, (38,28,46,255)); bg.alpha_composite(sub)
    sub = bg.convert("RGB").resize(((x1-x0)*scale,(y1-y0)*scale), Image.NEAREST)
    canvas = Image.new("RGB", (sub.width+44, sub.height+16), (20,16,26))
    canvas.paste(sub, (44,16))
    d = ImageDraw.Draw(canvas)
    for gx in range(x0 - x0%16, x1+1, 16):
        X = 44 + (gx-x0)*scale
        d.line([(X,16),(X,canvas.height)], fill=(120,90,150))
        d.text((X+1,3), str(gx), fill=(255,220,120))
    for gy in range(y0 - y0%16, y1+1, 16):
        Y = 16 + (gy-y0)*scale
        d.line([(44,Y),(canvas.width,Y)], fill=(120,90,150))
        d.text((2,Y+1), str(gy), fill=(255,220,120))
    pads.append(canvas)
W = max(p.width for p in pads); H = sum(p.height+8 for p in pads)
sheet = Image.new("RGB",(W,H),(20,16,26)); y=0
for p in pads: sheet.paste(p,(0,y)); y += p.height+8
sheet.save(out); print(out, sheet.size)
