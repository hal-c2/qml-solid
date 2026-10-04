# Writes the pictures the tests of a material's maps read: each one colour
# all over, so that what a surface is drawn as says which channel was read.
import os
from PIL import Image

here = os.path.dirname(os.path.abspath(__file__))

def plain(name, colour):
    Image.new("RGBA", (8, 8), colour).save(os.path.join(here, name))

# A way of facing, leaning to the right: (0.569, 0.004, 0.725) once read.
plain("tilt.png", (200, 128, 220, 255))
# A fifth of red, three fifths of green, four fifths of blue.
plain("parts.png", (51, 153, 204, 255))
# The same, half seen through.
plain("faint.png", (51, 153, 204, 128))
# Heights rising to the right, a sixteenth of the way at each step.
slope = Image.new("RGBA", (16, 16))
for x in range(16):
    for y in range(16):
        slope.putpixel((x, y), (x * 16, x * 16, x * 16, 255))
slope.save(os.path.join(here, "slope.png"))
# Everything round a place, as a map of the world is laid out: four colours
# round the upper half and four round the lower, a quarter of the way each.
sky = Image.new("RGB", (64, 32))
above = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0)]
below = [(128, 128, 128), (255, 255, 255), (0, 255, 255), (255, 0, 255)]
for x in range(64):
    for y in range(32):
        sky.putpixel((x, y), (above if y < 16 else below)[x // 16])
sky.save(os.path.join(here, "sky.png"))
# The same laid out, brighter than a screen can show and darker: a Radiance
# picture, sixteen by eight, its rows packed channel by channel, in runs
# where a channel stays the same and one by one where the row is short of a
# run.
def packed(row):
    out = bytes([2, 2, len(row) >> 8, len(row) & 255])
    for channel in range(4):
        values = [pixel[channel] for pixel in row]
        at = 0
        while at < len(values):
            run = 1
            while at + run < len(values) and run < 127 and values[at + run] == values[at]:
                run += 1
            if run > 2:
                out += bytes([128 + run, values[at]])
                at += run
            else:
                out += bytes([1, values[at]])
                at += 1
    return out

# A colour as three numbers and the power of two they are all times.
def rgbe(r, g, b):
    import math
    most = max(r, g, b)
    if most < 1e-32:
        return (0, 0, 0, 0)
    mantissa, exponent = math.frexp(most)
    scale = mantissa * 256.0 / most
    return (int(r * scale), int(g * scale), int(b * scale), exponent + 128)

above = [(4, 0.25, 0.25), (0.25, 4, 0.25), (0.25, 0.25, 4), (2, 2, 0.125)]
below = [(0.25, 0.25, 0.25), (1, 1, 1), (0.125, 2, 2), (2, 0.125, 2)]
with open(os.path.join(here, "bright.hdr"), "wb") as out:
    out.write(b"#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y 8 +X 16\n")
    for y in range(8):
        out.write(packed([rgbe(*(above if y < 4 else below)[x // 4]) for x in range(16)]))
