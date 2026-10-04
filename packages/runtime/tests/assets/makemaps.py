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
