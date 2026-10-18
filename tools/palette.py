"""The one palette. Every sprite in the game is remapped onto it at build time,
which is what makes six artists' work read as one hand."""

# Warm, muted, low-contrast. Deliberately no pure white and no pure black:
# both read as clinical next to this kind of art.
PALETTE = [
    (0x1d, 0x16, 0x20),  # 0  ink          outlines, deepest shadow
    (0x2f, 0x24, 0x30),  # 1  shadow
    (0x46, 0x33, 0x3a),  # 2  umber
    (0x5e, 0x44, 0x40),  # 3  wood-darkest
    (0x7a, 0x57, 0x42),  # 4  wood-dark
    (0x96, 0x70, 0x4f),  # 5  wood
    (0xb0, 0x8a, 0x5f),  # 6  wood-light
    (0xc9, 0xa6, 0x7c),  # 7  tan
    (0xdd, 0xc4, 0x9a),  # 8  cream
    (0xf0, 0xe0, 0xbd),  # 9  cream-light
    (0xfb, 0xf3, 0xdc),  # 10 highlight
    (0x7a, 0x3b, 0x36),  # 11 red-dark
    (0xa8, 0x55, 0x46),  # 12 red
    (0xc8, 0x7a, 0x56),  # 13 terracotta
    (0x3c, 0x4a, 0x36),  # 14 green-dark
    (0x5a, 0x72, 0x44),  # 15 green
    (0x86, 0xa1, 0x58),  # 16 green-light
    (0x2e, 0x44, 0x50),  # 17 blue-dark
    (0x4d, 0x6b, 0x74),  # 18 blue
    (0x7f, 0xa0, 0xa0),  # 19 blue-light
    (0xb7, 0xcf, 0xc4),  # 20 mint
    (0x8a, 0x6a, 0x2e),  # 21 gold-dark
    (0xc4, 0x9a, 0x3c),  # 22 gold
    (0x6b, 0x5a, 0x6b),  # 23 mauve
    (0x8d, 0x92, 0x71),  # 24 sage        the fridge's enamel
    (0xc8, 0xc7, 0x96),  # 25 sage-light
    (0xcf, 0xe8, 0xe4),  # 26 ice         lit fridge interior
]

NAMES = [
    "ink", "shadow", "umber", "wood-darkest", "wood-dark", "wood", "wood-light",
    "tan", "cream", "cream-light", "highlight", "red-dark", "red", "terracotta",
    "green-dark", "green", "green-light", "blue-dark", "blue", "blue-light",
    "mint", "gold-dark", "gold", "mauve", "sage", "sage-light", "ice",
]

P = {n: c for n, c in zip(NAMES, PALETTE)}


def rgba(name, a=255):
    r, g, b = P[name]
    return (r, g, b, a)


def nearest(rgb):
    """Closest palette entry, weighted towards how the eye reads the channels."""
    r, g, b = rgb[:3]
    best, bd = PALETTE[0], None
    for c in PALETTE:
        dr, dg, db = r - c[0], g - c[1], b - c[2]
        d = 2 * dr * dr + 4 * dg * dg + 3 * db * db
        if bd is None or d < bd:
            best, bd = c, d
    return best


def css_vars():
    out = []
    for n, c in zip(NAMES, PALETTE):
        out.append(f"  --{n}: #{c[0]:02x}{c[1]:02x}{c[2]:02x};")
    return "\n".join(out)
