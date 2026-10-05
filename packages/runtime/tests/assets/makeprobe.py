# Writes the surroundings a test of a light probe Qt baked reads: a KTX file
# as Qt's baker (`balsam`) writes one, a cube of six sides in halves, each
# level of it half as far across as the one before, with a note that Qt
# baked it. Every side has a colour of its own and every level a brightness,
# and the first level is brightest in the corner each side begins at: so
# what is drawn says which side was read, which way up, and at which level.
import os
import struct

here = os.path.dirname(os.path.abspath(__file__))

ACROSS = 16
LEVELS = 5
# In the order of the file: right, left, up, down, behind the eye, ahead.
SIDES = [(1, 0.1, 0.1), (0.1, 1, 1), (0.1, 1, 0.1), (1, 0.1, 1), (0.1, 0.1, 1), (1, 1, 0.1)]

def side(colour, level):
    across = ACROSS >> level
    # What lights from all round, the last level, is the other way about.
    shown = colour if level < LEVELS - 1 else tuple(0.6 - 0.5 * channel for channel in colour)
    out = b""
    for row in range(across):
        for column in range(across):
            if level == 0:
                # The quarter a side begins with, the one beside it, the one
                # below, and the last.
                by = [[2, 1], [0.5, 0.25]][row * 2 // across][column * 2 // across]
            elif level < LEVELS - 1:
                by = 1 - 0.25 * level
            else:
                by = 1
            out += struct.pack("<4e", *(channel * by for channel in shown), 1)
    return out

note = b"QT_IBL_BAKER_VERSION\x001\x00"
kept = struct.pack("<I", len(note)) + note + b"\x00" * (-len(note) % 4)
# Halves (0x140B), two bytes each; four to a pixel (0x1908), kept as halves
# (0x881A); no depth, not an array, six sides.
head = b"\xabKTX 11\xbb\r\n\x1a\n" + struct.pack("<13I", 0x04030201, 0x140B, 2, 0x1908, 0x881A, 0x1908, ACROSS, ACROSS, 0, 0, 6, LEVELS, len(kept))
body = b""
for level in range(LEVELS):
    sides = [side(colour, level) for colour in SIDES]
    # The size is one side's, and each is a whole number of fours already.
    body += struct.pack("<I", len(sides[0])) + b"".join(sides)
with open(os.path.join(here, "baked.ktx"), "wb") as out:
    out.write(head + kept + body)
