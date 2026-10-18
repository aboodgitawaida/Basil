import sys, collections
from PIL import Image, ImageDraw
src, out, minarea, scale = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
im = Image.open(src).convert("RGBA"); W,H = im.size; px = im.load()
# mask dilated by GAP so parts of one object merge
GAP = int(sys.argv[5]) if len(sys.argv)>5 else 3
mask = [[px[x,y][3] > 8 for x in range(W)] for y in range(H)]
dil = [[False]*W for _ in range(H)]
for y in range(H):
    for x in range(W):
        if mask[y][x]:
            for dy in range(-GAP, GAP+1):
                for dx in range(-GAP, GAP+1):
                    ny, nx = y+dy, x+dx
                    if 0 <= ny < H and 0 <= nx < W: dil[ny][nx] = True
seen=set(); comps=[]
for y in range(H):
    for x in range(W):
        if dil[y][x] and (x,y) not in seen:
            q=collections.deque([(x,y)]); seen.add((x,y)); xs=[];ys=[]
            while q:
                cx,cy=q.popleft(); xs.append(cx); ys.append(cy)
                for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx,ny=cx+dx,cy+dy
                    if 0<=nx<W and 0<=ny<H and dil[ny][nx] and (nx,ny) not in seen:
                        seen.add((nx,ny)); q.append((nx,ny))
            x0,y0,x1,y1 = max(0,min(xs)+GAP), max(0,min(ys)+GAP), min(W,max(xs)-GAP+1), min(H,max(ys)-GAP+1)
            if x1>x0 and y1>y0 and (x1-x0)*(y1-y0) >= minarea: comps.append((x0,y0,x1,y1))
comps.sort(key=lambda c:(c[1]//16, c[0]))
CELL = max(max(c[2]-c[0] for c in comps), max(c[3]-c[1] for c in comps)) + 2
COLS = 10
rows = (len(comps)+COLS-1)//COLS
sheet = Image.new("RGB", (COLS*CELL*scale, rows*CELL*scale), (38,28,46))
d = ImageDraw.Draw(sheet)
for i,(x0,y0,x1,y1) in enumerate(comps):
    sub = im.crop((x0,y0,x1,y1))
    sub = sub.resize(((x1-x0)*scale,(y1-y0)*scale), Image.NEAREST)
    cx, cy = (i%COLS)*CELL*scale, (i//COLS)*CELL*scale
    sheet.paste(sub, (cx+2, cy+10), sub)
    d.text((cx+2, cy), str(i), fill=(255,230,120))
sheet.save(out)
print(f"{len(comps)} components -> {out}")
for i,c in enumerate(comps): print(i, c, f"{c[2]-c[0]}x{c[3]-c[1]}")
