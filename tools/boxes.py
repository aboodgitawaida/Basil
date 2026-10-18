import sys, collections
from PIL import Image
src=sys.argv[1]; x0,y0,x1,y1=[int(v) for v in sys.argv[2].split(",")]
minarea=int(sys.argv[3]) if len(sys.argv)>3 else 60
im=Image.open(src).convert("RGBA").crop((x0,y0,x1,y1)); W,H=im.size; px=im.load()
seen=set()
for y in range(H):
    for x in range(W):
        if px[x,y][3]>8 and (x,y) not in seen:
            q=collections.deque([(x,y)]); seen.add((x,y)); xs=[];ys=[]
            while q:
                cx,cy=q.popleft(); xs.append(cx); ys.append(cy)
                for dx in(-1,0,1):
                    for dy in(-1,0,1):
                        nx,ny=cx+dx,cy+dy
                        if 0<=nx<W and 0<=ny<H and px[nx,ny][3]>8 and (nx,ny) not in seen:
                            seen.add((nx,ny)); q.append((nx,ny))
            bx=(min(xs)+x0,min(ys)+y0,max(xs)+1+x0,max(ys)+1+y0)
            if (bx[2]-bx[0])*(bx[3]-bx[1])>=minarea:
                print(f"({bx[0]},{bx[1]},{bx[2]},{bx[3]})  {bx[2]-bx[0]}x{bx[3]-bx[1]}  px={len(xs)}")
