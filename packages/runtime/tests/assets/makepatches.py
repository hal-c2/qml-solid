# Writes the pictures the tests of NinePatchImage read, into `patches/`: each
# has a frame a pixel wide around it, clear but for its marks, and inside it
# one colour for each piece the black marks at its top and left cut it into,
# so that what is painted says which piece was put where.
import os
from PIL import Image

here = os.path.join(os.path.dirname(os.path.abspath(__file__)), "patches")
os.makedirs(here, exist_ok=True)

BLACK = (0, 0, 0, 255)
RED = (255, 0, 0, 255)

# Which piece a pixel is in, along a line cut at the ends of the marks.
def piece(at, marks):
    return sum(1 for start, end in marks for edge in (start, end) if 0 < edge <= at)

# A picture `wide` by `tall` inside its frame. Each mark is from a pixel up
# to another, counted inside the frame: `across` and `down` are what
# stretches, `padded` where the content goes (along the bottom, then the
# right), `inset` what is outside (the same).
def patch(name, wide, tall, across=(), down=(), padded=((), ()), inset=((), ()), colour=None):
    picture = Image.new("RGBA", (wide + 2, tall + 2), (0, 0, 0, 0))
    for x in range(wide):
        for y in range(tall):
            shade = colour(x, y) if colour else (60 + 60 * piece(x, across), 60 + 60 * piece(y, down), 200, 255)
            picture.putpixel((x + 1, y + 1), shade)
    for start, end in across:
        for x in range(start, end):
            picture.putpixel((x + 1, 0), BLACK)
    for start, end in down:
        for y in range(start, end):
            picture.putpixel((0, y + 1), BLACK)
    for marks, shade in ((padded, BLACK), (inset, RED)):
        for start, end in marks[0]:
            for x in range(start, end):
                picture.putpixel((x + 1, tall + 1), shade)
        for start, end in marks[1]:
            for y in range(start, end):
                picture.putpixel((wide + 1, y + 1), shade)
    picture.save(os.path.join(here, name), "PNG")

# The middle stretches, both ways.
patch("stretch.9.png", 10, 8, across=[(3, 7)], down=[(2, 6)])
# The same to Qt, which does not mind how the end of a name is written.
patch("Shout.9.PNG", 10, 8, across=[(3, 7)], down=[(2, 6)])
# Content goes inside 2 from the left, 3 from the right, 1 from the top and
# 3 from the bottom.
patch("padded.9.png", 10, 8, across=[(4, 6)], down=[(3, 5)], padded=([(2, 7)], [(1, 5)]))
# 2, 1, 1 and 2 of it are outside, and the content goes inside what is left.
patch("inset.9.png", 12, 10, across=[(4, 8)], down=[(3, 7)], padded=([(6, 10)], [(3, 6)]), inset=([(0, 2), (11, 12)], [(0, 1), (8, 10)]))
# Outside at the far ends only, and at the near ends only.
patch("far.9.png", 8, 6, across=[(3, 5)], down=[(2, 4)], inset=([(6, 8)], [(5, 6)]))
patch("near.9.png", 8, 6, across=[(3, 5)], down=[(2, 4)], padded=([(4, 6)], [(3, 5)]), inset=([(0, 3)], [(0, 2)]))
# Marks that start at the first pixel, and that reach the last.
patch("edge.9.png", 8, 6, across=[(0, 3)], down=[(3, 6)], padded=([(5, 8)], [(0, 2)]))
# Two pieces stretch across, and share what there is to fill.
patch("several.9.png", 11, 8, across=[(2, 4), (7, 9)], down=[(3, 5)])
# No marks at all: four squares.
patch("bare.9.png", 6, 6, colour=lambda x, y: (60 + 120 * (x // 3), 60 + 120 * (y // 3), 200, 255))
# What stretches is of two colours, side by side.
patch("halves.9.png", 6, 4, across=[(2, 4)], down=[(0, 4)], colour=lambda x, y: (255, 255, 0, 255) if x == 2 else (0, 0, 255, 255) if x == 3 else (0, 128, 0, 255))
# Not one with marks, by its name: the frame is part of the picture.
patch("not.a.9.png", 6, 6, across=[(2, 4)], down=[(2, 4)], padded=([(1, 5)], [(1, 5)]))
# A picture with no frame.
Image.new("RGBA", (6, 6), (0, 128, 255, 255)).save(os.path.join(here, "whole.png"))

# The pictures the tests of the selectors choose among, into `chosen/`: what
# is in one says nothing, its name says which states it is for.
there = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chosen")
os.makedirs(there, exist_ok=True)

names = [
    # A state each, and none.
    "one.png", "one-a.png", "one-b.png",
    # Two states, in either order.
    "two.png", "two-a.png", "two-b.png", "two-a-b.png", "two-b-a.png",
    # States that are not next to each other among four.
    "skip.png", "skip-a-c.png", "skip-b-d.png", "skip-c.png", "skip-d.png",
    "gap.png", "gap-a-b-d.png", "gap-a.png",
    # The first and the last of them, which are.
    "wrap.png", "wrap-a-d.png", "wrap-b.png",
    # Nothing for no state.
    "only-a.png",
    # What a name may end in.
    "ext.png", "ext-a.png", "flat.png", "late.png", "spin.gif", "spin.webp", "turn.gif",
    # Another separator.
    "sep.png", "sep_a.png", "sep_a_b.png",
]
for index, name in enumerate(names):
    shade = (40 + 7 * index, 250 - 7 * index, 128, 255)
    Image.new("RGBA", (4, 4), shade).convert("RGB" if name.endswith(".gif") else "RGBA").save(os.path.join(there, name))
for name in ("ext.9.png", "flat.9.png"):
    Image.open(os.path.join(here, "stretch.9.png")).save(os.path.join(there, name), "PNG")
