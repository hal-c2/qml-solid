# Writes Qt Quick 3D mesh files as Qt's own writer does (version 7), for the
# tests: shapes small enough to say what is drawn of them.
import struct, sys, os

FLOAT, INT = 10, 6

def mesh(path, entries, rows, order, targets=None):
    # entries: [(name, type, count)], rows: one tuple of numbers per corner.
    out = bytearray()
    at = [0]
    def put(data):
        out.extend(data)
    def aligned(amount):
        at[0] += amount
        pad = 4 - (at[0] % 4)
        at[0] += pad
        put(b"\0" * pad)
    offsets = []
    stride = 0
    for name, kind, count in entries:
        offsets.append(stride)
        stride += 4 * count
    data = bytearray()
    for row in rows:
        index = 0
        for name, kind, count in entries:
            data += struct.pack("<%d%s" % (count, "f" if kind == FLOAT else "i"), *row[index:index + count])
            index += count
    indices = struct.pack("<%dH" % len(order), *order)
    tentries, tdata, tcount = targets or ([], b"", 0)
    put(struct.pack("<5I", len(tentries), len(entries), stride, len(tdata), len(data)))
    put(struct.pack("<3I", 3, 0, len(indices)))
    put(struct.pack("<2I", tcount, 1))
    put(struct.pack("<2I", 0, 0))
    put(struct.pack("<2I", 7, 2))
    at[0] += 56
    size = 0
    for (name, kind, count), offset in zip(entries, offsets):
        put(struct.pack("<4I", 0, kind, count, offset))
        size += 16
    aligned(size)
    for name, kind, count in entries:
        text = name.encode() + b"\0"
        put(struct.pack("<I", len(text)) + text)
        aligned(4 + len(text))
    put(data)
    aligned(len(data))
    put(indices)
    aligned(len(indices))
    lo = [min(row[axis] for row in rows) for axis in range(3)]
    hi = [max(row[axis] for row in rows) for axis in range(3)]
    put(struct.pack("<2I6f2I2II", len(order), 0, *lo, *hi, 0, 1, 0, 0, 0))
    aligned(52)
    put(b"\0\0")
    aligned(2)
    aligned(0)
    for name, kind, count, offset in tentries:
        put(struct.pack("<4I", 0, kind, count, offset))
        size += 16
    aligned(size)
    for name, kind, count, offset in tentries:
        text = name.encode() + b"\0"
        put(struct.pack("<I", len(text)) + text)
        aligned(4 + len(text))
    put(tdata)
    body = bytes(out)
    header = struct.pack("<IHHI", 3365961549, 7, 0, len(body))
    whole = header + body
    whole += struct.pack("<QII", 0, 1, 0)
    whole += struct.pack("<4I", 555777497, 1, len(header) + len(body), 1)
    open(path, "wb").write(whole)

def bar(path):
    # A strip 40 wide and 200 tall, in four parts, facing +z: the lower two
    # rows of corners are of the first joint, the upper two of the second,
    # the middle row of both alike.
    rows, order = [], []
    for r in range(5):
        y = r * 50.0
        for x in (-20.0, 20.0):
            if r < 2: joints, weights = (0, 0, 0, 0), (1.0, 0.0, 0.0, 0.0)
            elif r == 2: joints, weights = (0, 1, 0, 0), (0.5, 0.5, 0.0, 0.0)
            else: joints, weights = (1, 0, 0, 0), (1.0, 0.0, 0.0, 0.0)
            rows.append((x, y, 0.0, 0.0, 0.0, 1.0, (x + 20) / 40, y / 200) + joints + weights)
    for r in range(4):
        a = r * 2
        order += [a, a + 1, a + 3, a, a + 3, a + 2]
    mesh(path, [("attr_pos", FLOAT, 3), ("attr_norm", FLOAT, 3), ("attr_uv0", FLOAT, 2), ("attr_joints", INT, 4), ("attr_weights", FLOAT, 4)], rows, order)

if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    bar(os.path.join(here, "bar.mesh"))
