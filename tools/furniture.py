"""Furniture and architecture, drawn at the project's world scale.

The packs split into two groups four times apart in world scale: the room art
(Modern Interiors, the restaurant pack's chairs) is about 0.25 px/cm, while the
handheld objects (food, containers, the cat) are about 1.0 px/cm. Upscaling the
room art 4x would put 4x4 blocks next to 1x1 detail, so the architecture is
drawn here instead, at 1 art pixel = 1 cm, to match the objects that sit on it.

Light comes from the upper left, always. Highlights on top and left edges,
shadow on bottom and right, contact shadow cast to the right.
"""
from PIL import Image, ImageDraw
from palette import rgba

INK = rgba("ink")


def box(d, x0, y0, x1, y1, base, light=None, dark=None, ink=True):
    """A lit solid: highlight on the top and left, shadow on the bottom right."""
    d.rectangle([x0, y0, x1, y1], fill=base)
    if dark:
        d.line([(x0, y1), (x1, y1)], fill=dark)
        d.line([(x1, y0), (x1, y1)], fill=dark)
    if light:
        d.line([(x0, y0), (x1 - 1, y0)], fill=light)
        d.line([(x0, y0), (x0, y1 - 1)], fill=light)
    if ink:
        d.rectangle([x0, y0, x1, y1], outline=INK)


def recess(d, x0, y0, x1, y1, base, light, dark, grain=None):
    """An inset panel — the opposite lighting to `box`, so it reads as a hollow.
    `grain` adds a couple of short strokes; it belongs on wood, not on enamel,
    and it has to be close in value to the base or the panel reads as slatted."""
    d.rectangle([x0, y0, x1, y1], fill=base)
    if grain and x1 - x0 > 16 and y1 - y0 > 14:
        for i, gx in enumerate(range(x0 + 5, x1 - 4, 11)):
            top = y0 + 3 + (i % 3) * 2
            d.line([(gx, top), (gx, y1 - 4 - (i % 2) * 3)], fill=grain)
    d.line([(x0, y0), (x1, y0)], fill=dark)
    d.line([(x0, y0), (x0, y1)], fill=dark)
    d.line([(x0, y1), (x1, y1)], fill=light)
    d.line([(x1, y0), (x1, y1)], fill=light)


def new(w, h):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


# ---------------------------------------------------------------- counter ---
COUNTER_W, COUNTER_H = 64, 90          # 64cm wide, 90cm tall — the room's ruler

def counter_unit():
    img, d = new(COUNTER_W, COUNTER_H)
    w = COUNTER_W - 1
    # carcass
    box(d, 2, 7, w - 2, 81, rgba("wood"), rgba("wood-light"), rgba("wood-darkest"))
    # door, inset
    recess(d, 7, 14, w - 7, 74, rgba("wood-dark"), rgba("wood-light"),
           rgba("wood-darkest"), grain=rgba("wood-darkest"))
    d.rectangle([11, 18, w - 11, 70], outline=rgba("wood"))
    # handle
    d.rectangle([w // 2 - 7, 22, w // 2 + 7, 24], fill=rgba("gold-dark"))
    d.line([(w // 2 - 7, 22), (w // 2 + 7, 22)], fill=rgba("gold"))
    # toe kick, in shadow
    d.rectangle([0, 82, w, 89], fill=rgba("shadow"))
    # worktop, overhanging
    box(d, 0, 0, w, 7, rgba("tan"), rgba("cream"), rgba("wood-dark"))
    d.line([(1, 1), (w - 2, 1)], fill=rgba("cream-light"))
    return img


# ------------------------------------------------------------------ fridge ---
FRIDGE_W, FRIDGE_H, FREEZER_H = 60, 170, 52
DOOR_WIDTHS = [FRIDGE_W, 42, 26, 11]

def fridge_carcass():
    """The lit interior. When the door is open this is the brightest thing on
    screen, which is what a fridge actually looks like in a dim kitchen."""
    img, d = new(FRIDGE_W, FRIDGE_H)
    w, h = FRIDGE_W - 1, FRIDGE_H - 1
    d.rectangle([0, 0, w, h], fill=rgba("blue-light"), outline=INK)
    for top, bot in ((3, FREEZER_H - 4), (FREEZER_H + 3, h - 4)):
        d.rectangle([3, top, w - 3, bot], fill=rgba("cream-light"))
        # light pools at the top of each compartment and falls off downwards
        d.rectangle([4, top + 1, w - 4, top + 7], fill=rgba("highlight"))
        for i, y in enumerate(range(top + 8, top + 14, 2)):
            for x in range(4 + (i % 2) * 2, w - 4, 4):
                d.point((x, y), fill=rgba("highlight"))
        d.rectangle([3, bot - 3, w - 3, bot], fill=rgba("cream"))
        d.rectangle([3, top, 5, bot], fill=rgba("cream"))      # side walls turn
        d.rectangle([w - 5, top, w - 3, bot], fill=rgba("cream"))
    for y in (FREEZER_H - 22, 84, 112, 140):
        if y < 4 or y > h - 8: continue
        d.rectangle([4, y, w - 4, y + 1], fill=rgba("highlight"))
        d.line([(4, y + 2), (w - 4, y + 2)], fill=rgba("tan"))
    d.rectangle([0, FREEZER_H - 2, w, FREEZER_H + 1], fill=rgba("blue-light"),
                outline=rgba("blue"))
    return img


def fridge_door(dw, dh, freezer):
    img, d = new(dw, dh)
    w, h = dw - 1, dh - 1
    base, light, dark = rgba("mint"), rgba("cream-light"), rgba("blue")
    box(d, 0, 0, w, h, base, light, dark)
    if dw >= 20:
        recess(d, 5, 5, w - 5, h - 5, base, light, dark)
        # the door's far edge curves away from the window light
        # the door curves away from the window, so its far edge sits in shade
        d.rectangle([w - 4, 2, w - 3, h - 2], fill=rgba("blue-light"))
        hx = w - 11
        d.rectangle([hx, 10 if not freezer else h - 26, hx + 2,
                     h - 10 if not freezer else h - 8], fill=rgba("umber"))
        d.line([(hx, 10 if not freezer else h - 26), (hx,
                 h - 10 if not freezer else h - 8)], fill=rgba("wood-light"))
        if not freezer:
            for i, c in enumerate(("red", "gold", "green")):
                d.rectangle([11 + i * 7, 30, 14 + i * 7, 34], fill=rgba(c), outline=INK)
    return img


# ---------------------------------------------------------------- cupboard ---
CUP_W, CUP_H = 44, 62
CUP_SWING = [0, 4, 8, 13]

def cupboard_carcass():
    img, d = new(CUP_W, CUP_H)
    w, h = CUP_W - 1, CUP_H - 1
    d.rectangle([0, 0, w, h], fill=rgba("wood-dark"), outline=INK)
    d.rectangle([3, 3, w - 3, h - 3], fill=rgba("wood-darkest"))
    d.rectangle([3, 3, w - 3, 5], fill=rgba("umber"))           # shaded at the top
    d.rectangle([3, 3, 6, h - 3], fill=rgba("wood-dark"))       # lit from the left
    for y in (22, 41):
        d.rectangle([4, y, w - 4, y + 1], fill=rgba("tan"))
        d.line([(4, y - 1), (w - 4, y - 1)], fill=rgba("cream"))
        d.line([(4, y + 2), (w - 4, y + 2)], fill=rgba("umber"))
    box(d, 0, h - 4, w, h, rgba("wood"), rgba("wood-light"), rgba("wood-darkest"))
    return img


def cupboard_door(dw, side):
    img, d = new(max(dw, 1), CUP_H)
    if dw < 2:
        return img
    w, h = dw - 1, CUP_H - 1
    box(d, 0, 0, w, h, rgba("wood"), rgba("wood-light"), rgba("wood-darkest"))
    if dw >= 12:
        recess(d, 4, 5, w - 4, h - 5, rgba("wood-dark"), rgba("wood-light"),
               rgba("wood-darkest"))
        hx = w - 4 if side == "l" else 3
        d.rectangle([hx - 1, h // 2 - 4, hx, h // 2 + 4], fill=rgba("gold-dark"))
        d.point((hx - 1, h // 2 - 4), fill=rgba("gold"))
    return img


# ------------------------------------------------------------------ window ---
WIN_W, WIN_H = 64, 72

def window_frame():
    """Frame only — the pane is transparent so the view behind it can change
    with the weather and the time of day."""
    img, d = new(WIN_W, WIN_H + 8)
    w, h = WIN_W - 1, WIN_H - 1
    d.rectangle([0, 0, w, h], fill=rgba("wood"), outline=INK)
    d.line([(1, 1), (w - 1, 1)], fill=rgba("wood-light"))
    d.line([(1, 1), (1, h - 1)], fill=rgba("wood-light"))
    d.line([(1, h - 1), (w - 1, h - 1)], fill=rgba("wood-darkest"))
    d.line([(w - 1, 1), (w - 1, h - 1)], fill=rgba("wood-darkest"))
    # knock the pane through
    for x0, y0, x1, y1 in ((6, 6, w // 2 - 2, h - 10), (w // 2 + 2, 6, w - 6, h - 10)):
        d.rectangle([x0, y0, x1, y1], fill=(0, 0, 0, 0))
        d.line([(x0 - 1, y0 - 1), (x1 + 1, y0 - 1)], fill=rgba("wood-darkest"))
        d.line([(x0 - 1, y1 + 1), (x1 + 1, y1 + 1)], fill=rgba("wood-light"))
    # sill, overhanging both sides
    box(d, 0, h - 8, w, h - 2, rgba("wood-light"), rgba("cream"), rgba("wood-darkest"))
    d.rectangle([2, h - 1, w - 2, h + 6], fill=rgba("wood-dark"), outline=INK)
    return img


# --------------------------------------------------------------- fittings ---
def clock():
    img, d = new(26, 26)                       # 26cm across — bigger than an apple
    d.ellipse([0, 0, 25, 25], fill=rgba("wood-dark"), outline=INK)
    d.ellipse([3, 3, 22, 22], fill=rgba("cream-light"), outline=rgba("umber"))
    d.ellipse([4, 4, 21, 21], outline=rgba("highlight"))
    for a in (4, 9, 13, 17, 21):
        d.point((a, 4 if a in (9, 17) else 5), fill=rgba("umber"))
    d.line([(13, 13), (13, 7)], fill=rgba("ink"))
    d.line([(13, 13), (17, 15)], fill=rgba("ink"))
    d.ellipse([12, 12, 14, 14], fill=rgba("red"))
    return img


def pendant():
    img, d = new(22, 15)
    d.polygon([(9, 0), (12, 0), (21, 12), (0, 12)], fill=rgba("red"))
    d.polygon([(9, 0), (10, 0), (5, 12), (0, 12)], fill=rgba("terracotta"))
    d.polygon([(11, 0), (12, 0), (21, 12), (16, 12)], fill=rgba("red-dark"))
    d.line([(0, 12), (21, 12)], fill=INK)
    d.rectangle([7, 13, 14, 14], fill=rgba("gold"))
    return img


def tile(kind):
    """Floor and wall tiles. One treatment each — the scene had three."""
    img, d = new(32, 32)
    if kind == "floor":
        # Boards run away from the viewer, so we only ever see their long
        # edges. Vertical joints would read as brickwork.
        for i, y in enumerate(range(0, 32, 8)):
            d.rectangle([0, y, 31, y + 7], fill=rgba("wood"))
            d.line([(0, y), (31, y)], fill=rgba("wood-light"))
            d.line([(0, y + 7), (31, y + 7)], fill=rgba("wood-dark"))
    else:                                      # skirting board
        d.rectangle([0, 0, 31, 31], fill=rgba("wood-dark"))
        d.line([(0, 0), (31, 0)], fill=rgba("tan"))
        d.line([(0, 1), (31, 1)], fill=rgba("wood-light"))
        d.line([(0, 6), (31, 6)], fill=rgba("ink"))
    return img


def counter_drawers():
    img, d = new(COUNTER_W, COUNTER_H)
    w = COUNTER_W - 1
    box(d, 2, 7, w - 2, 81, rgba("wood"), rgba("wood-light"), rgba("wood-darkest"))
    for i, top in enumerate((14, 36, 58)):
        h = 18 if i < 2 else 14
        recess(d, 7, top, w - 7, top + h, rgba("wood-dark"), rgba("wood-light"),
               rgba("wood-darkest"), grain=rgba("wood-darkest") if i == 1 else None)
        d.rectangle([w // 2 - 8, top + h // 2 - 1, w // 2 + 8, top + h // 2],
                    fill=rgba("gold-dark"))
        d.line([(w // 2 - 8, top + h // 2 - 1), (w // 2 + 8, top + h // 2 - 1)],
               fill=rgba("gold"))
    d.rectangle([0, 82, w, 89], fill=rgba("shadow"))
    box(d, 0, 0, w, 7, rgba("tan"), rgba("cream"), rgba("wood-dark"))
    d.line([(1, 1), (w - 2, 1)], fill=rgba("cream-light"))
    return img


AUTHORED = {
    "room/counter-drawers": counter_drawers,
    "room/counter": counter_unit,
    "room/cupboard-carcass": cupboard_carcass,
    "room/window": window_frame,
    "room/clock": clock,
    "room/pendant": pendant,
    "fridge/carcass": fridge_carcass,
}
