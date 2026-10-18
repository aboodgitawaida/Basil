"""Architecture and fittings, drawn at HALF the world scale.

Everything here is drawn at 1 source pixel = 2cm and upscaled x2 at build
time. That is deliberate: the new fridge and food packs sit at roughly 0.5
px/cm, so upscaling them x2 lands them on the 1px = 1cm world ruler with a
2x2 apparent pixel. Drawing the cabinetry at full resolution would put 1x1
detail next to them and the room would look like two different games again.

Light comes from the upper left, always. Highlights on top and left edges,
shadow on bottom and right, contact shadows cast to the right.
"""
from PIL import Image, ImageDraw
from palette import rgba

INK = rgba("ink")

# World sizes in centimetres; sources are drawn at half these.
COUNTER_W, COUNTER_H = 52, 90
CUP_W, CUP_H = 44, 62
WIN_W, WIN_H = 64, 72

H = 2  # world centimetres per source pixel


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


def recess(d, x0, y0, x1, y1, base, light, dark):
    """An inset panel — the opposite lighting to `box`, so it reads as a hollow."""
    d.rectangle([x0, y0, x1, y1], fill=base)
    d.line([(x0, y0), (x1, y0)], fill=dark)
    d.line([(x0, y0), (x0, y1)], fill=dark)
    d.line([(x0, y1), (x1, y1)], fill=light)
    d.line([(x1, y0), (x1, y1)], fill=light)


def new(w, h):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def _counter(drawers):
    w, h = COUNTER_W // H, COUNTER_H // H          # 26 x 45
    img, d = new(w, h)
    e = w - 1
    box(d, 1, 4, e - 1, h - 5, rgba("wood"), rgba("wood-light"), rgba("wood-darkest"))
    if drawers:
        for top, dh in ((7, 10), (18, 10), (29, 8)):
            recess(d, 4, top, e - 4, top + dh, rgba("wood-dark"),
                   rgba("wood-light"), rgba("wood-darkest"))
            d.line([(w // 2 - 4, top + dh // 2), (w // 2 + 4, top + dh // 2)],
                   fill=rgba("gold-dark"))
    else:
        recess(d, 4, 7, e - 4, h - 11, rgba("wood-dark"), rgba("wood-light"),
               rgba("wood-darkest"))
        d.rectangle([6, 9, e - 6, h - 13], outline=rgba("wood"))
        d.line([(w // 2 - 4, 11), (w // 2 + 4, 11)], fill=rgba("gold-dark"))
    d.rectangle([0, h - 4, e, h - 1], fill=rgba("shadow"))      # toe kick
    box(d, 0, 0, e, 3, rgba("tan"), rgba("cream"), rgba("wood-dark"))  # worktop
    return img


def counter_unit():
    return _counter(False)


def counter_drawers():
    return _counter(True)


# The pantry is a base cabinet rather than a wall unit: the fridge door sweeps
# a 70cm arc across the wall above the counter, and anything mounted there is
# both hidden and unclickable while the fridge is open.
PANTRY_SWING = [0, 5, 9, 12]


def pantry_carcass():
    """The counter's left unit with its door off: shelves and a dark interior."""
    w, h = COUNTER_W // H, COUNTER_H // H
    img, d = new(w, h)
    e = w - 1
    box(d, 1, 4, e - 1, h - 5, rgba("wood"), rgba("wood-light"), rgba("wood-darkest"))
    d.rectangle([3, 6, e - 3, h - 7], fill=rgba("wood-darkest"))
    d.rectangle([3, 6, e - 3, 7], fill=rgba("umber"))
    d.rectangle([3, 6, 4, h - 7], fill=rgba("wood-dark"))        # lit from the left
    for y in (17, 28):
        d.line([(4, y), (e - 4, y)], fill=rgba("tan"))
        d.line([(4, y - 1), (e - 4, y - 1)], fill=rgba("cream"))
        d.line([(4, y + 1), (e - 4, y + 1)], fill=rgba("umber"))
    d.rectangle([0, h - 4, e, h - 1], fill=rgba("shadow"))
    box(d, 0, 0, e, 3, rgba("tan"), rgba("cream"), rgba("wood-dark"))
    return img


def pantry_door(dw):
    h = COUNTER_H // H
    img, d = new(max(dw, 1), h - 11)
    if dw < 2:
        return img
    e, b = dw - 1, h - 12
    box(d, 0, 0, e, b, rgba("wood"), rgba("wood-light"), rgba("wood-darkest"))
    if dw >= 8:
        recess(d, 2, 2, e - 2, b - 2, rgba("wood-dark"), rgba("wood-light"),
               rgba("wood-darkest"))
        d.line([(e - 3, 4), (e - 3, 8)], fill=rgba("gold-dark"))
    return img


CUP_SWING = [0, 2, 4, 7]                           # source pixels, so 0-14cm


def cupboard_carcass():
    w, h = CUP_W // H, CUP_H // H                  # 22 x 31
    img, d = new(w, h)
    e, b = w - 1, h - 1
    d.rectangle([0, 0, e, b], fill=rgba("wood-dark"), outline=INK)
    d.rectangle([2, 2, e - 2, b - 2], fill=rgba("wood-darkest"))
    d.rectangle([2, 2, e - 2, 3], fill=rgba("umber"))
    d.rectangle([2, 2, 3, b - 2], fill=rgba("wood-dark"))       # lit from the left
    for y in (11, 20):
        d.line([(3, y), (e - 3, y)], fill=rgba("tan"))
        d.line([(3, y - 1), (e - 3, y - 1)], fill=rgba("cream"))
        d.line([(3, y + 1), (e - 3, y + 1)], fill=rgba("umber"))
    box(d, 0, b - 2, e, b, rgba("wood"), rgba("wood-light"), rgba("wood-darkest"))
    return img


def cupboard_door(dw, side):
    h = CUP_H // H
    img, d = new(max(dw, 1), h)
    if dw < 2:
        return img
    e, b = dw - 1, h - 1
    box(d, 0, 0, e, b, rgba("wood"), rgba("wood-light"), rgba("wood-darkest"))
    if dw >= 6:
        recess(d, 2, 2, e - 2, b - 2, rgba("wood-dark"), rgba("wood-light"),
               rgba("wood-darkest"))
        hx = e - 2 if side == "l" else 2
        d.line([(hx, b // 2 - 2), (hx, b // 2 + 2)], fill=rgba("gold-dark"))
    return img


def window_frame():
    w, h = WIN_W // H, WIN_H // H                  # 32 x 36
    img, d = new(w, h + 4)
    e, b = w - 1, h - 1
    d.rectangle([0, 0, e, b], fill=rgba("wood"), outline=INK)
    d.line([(1, 1), (e - 1, 1)], fill=rgba("wood-light"))
    d.line([(1, 1), (1, b - 1)], fill=rgba("wood-light"))
    d.line([(1, b - 1), (e - 1, b - 1)], fill=rgba("wood-darkest"))
    d.line([(e - 1, 1), (e - 1, b - 1)], fill=rgba("wood-darkest"))
    for x0, y0, x1, y1 in ((3, 3, w // 2 - 2, b - 6), (w // 2 + 1, 3, e - 3, b - 6)):
        d.rectangle([x0, y0, x1, y1], fill=(0, 0, 0, 0))
        d.line([(x0 - 1, y0 - 1), (x1 + 1, y0 - 1)], fill=rgba("wood-darkest"))
        d.line([(x0 - 1, y1 + 1), (x1 + 1, y1 + 1)], fill=rgba("wood-light"))
    box(d, 0, b - 4, e, b - 1, rgba("wood-light"), rgba("cream"), rgba("wood-darkest"))
    d.rectangle([1, b, e - 1, b + 3], fill=rgba("wood-dark"), outline=INK)
    return img


def clock():
    img, d = new(13, 13)                           # 26cm across
    d.ellipse([0, 0, 12, 12], fill=rgba("wood-dark"), outline=INK)
    d.ellipse([2, 2, 10, 10], fill=rgba("cream-light"), outline=rgba("umber"))
    d.line([(6, 6), (6, 3)], fill=rgba("ink"))
    d.line([(6, 6), (8, 7)], fill=rgba("ink"))
    d.point((6, 6), fill=rgba("red"))
    return img


def pendant():
    img, d = new(11, 8)
    d.polygon([(4, 0), (6, 0), (10, 6), (0, 6)], fill=rgba("red"))
    d.polygon([(4, 0), (5, 0), (2, 6), (0, 6)], fill=rgba("terracotta"))
    d.line([(0, 6), (10, 6)], fill=INK)
    d.line([(3, 7), (7, 7)], fill=rgba("gold"))
    return img


def tile(kind):
    img, d = new(16, 16)
    if kind == "floor":
        # Boards run away from the viewer, so we only see their long edges.
        # Vertical joints would read as brickwork.
        for y in range(0, 16, 4):
            d.rectangle([0, y, 15, y + 3], fill=rgba("wood"))
            d.line([(0, y), (15, y)], fill=rgba("wood-light"))
            d.line([(0, y + 3), (15, y + 3)], fill=rgba("wood-dark"))
    else:
        d.rectangle([0, 0, 15, 15], fill=rgba("wood-dark"))
        d.line([(0, 0), (15, 0)], fill=rgba("tan"))
        d.line([(0, 3), (15, 3)], fill=rgba("ink"))
    return img


AUTHORED = {
    "room/pantry-carcass": pantry_carcass,
    "room/counter": counter_unit,
    "room/counter-drawers": counter_drawers,
    "room/cupboard-carcass": cupboard_carcass,
    "room/window": window_frame,
    "room/clock": clock,
    "room/pendant": pendant,
}
