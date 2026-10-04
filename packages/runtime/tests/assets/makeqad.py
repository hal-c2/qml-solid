# Writes the keyframe files of the timeline tests: what Qt Design Studio
# stores a group's keyframes in, for `KeyframeGroup.keyframeSource`. A file
# is CBOR: ["QTimelineKeyframes", 1, the QMetaType of the values, [frame,
# easing type, the numbers of the value, ...]].
#
#     python3 makeqad.py
import os
import struct

HERE = os.path.dirname(os.path.abspath(__file__))

DOUBLE, BOOL = 6, 1
COLOUR, VECTOR3D, QUATERNION = 0x1003, 0x1013, 0x1015


def head(major, n):
    if n < 24:
        return bytes([major << 5 | n])
    if n < 256:
        return bytes([major << 5 | 24, n])
    if n < 65536:
        return bytes([major << 5 | 25]) + struct.pack(">H", n)
    return bytes([major << 5 | 26]) + struct.pack(">I", n)


def integer(n):
    return head(0, n) if n >= 0 else head(1, -1 - n)


def text(s):
    return head(3, len(s.encode())) + s.encode()


def single(x):
    return b"\xfa" + struct.pack(">f", x)


def double(x):
    return b"\xfb" + struct.pack(">d", x)


def member(value, real):
    if isinstance(value, bool):
        return bytes([0xF5 if value else 0xF4])
    return integer(value) if isinstance(value, int) else real(value)


def qad(kind, frames, real=single):
    out = b"\x9f" + text("QTimelineKeyframes") + integer(1) + integer(kind) + b"\x9f"
    for frame, easing, values in frames:
        out += double(frame) + integer(easing)
        for value in values:
            out += member(value, real)
    return out + b"\xff\xff"


FILES = {
    # Out of order, and the way to the second one is InQuad.
    "number.qad": qad(DOUBLE, [(50, 1, [100.0]), (0, 0, [10.5]), (100, 0, [0.25])], double),
    "vector.qad": qad(VECTOR3D, [(0, 0, [1.5, 2.5, 3.5]), (100, 2, [11.5, 22.5, 33.5])]),
    "turn.qad": qad(QUATERNION, [(0, 0, [1.0, 0.0, 0.0, 0.0]), (100, 0, [0.707107, 0.0, 0.707107, 0.0])]),
    "colour.qad": qad(COLOUR, [(0, 0, [0, 0, 255, 255]), (100, 0, [255, 255, 0, 128])]),
    "flag.qad": qad(BOOL, [(40, 0, [True]), (80, 0, [False])]),
    # Not a keyframe file: three things where there should be four.
    "bad.qad": b"\x83" + text("nothing") + integer(1) + integer(DOUBLE),
}

for name, data in FILES.items():
    with open(os.path.join(HERE, name), "wb") as out:
        out.write(data)
