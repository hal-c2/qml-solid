# Writes the fonts the tests measure text in: every printable ASCII glyph,
# and the ellipsis, is one box of the same advance, a space half of it, so
# that a test knows how wide any string is on any machine. An em is 2048
# units and everything a multiple of 128, a whole pixel at 16 pixels: Qt and
# the browser then agree on every number, however either rounds.
#
#     python3 makefont.py .
import struct, sys

def font(family, weight, advance, path):
    upm, asc, desc = 2048, 1664, 384
    codes = list(range(33, 127)) + [0x2026]
    count = 2 + len(codes)
    box = struct.pack(">hhhhh", 1, 128, 0, advance - 128, 1408) + struct.pack(">HH", 3, 0) + b"\x01" * 4
    box += struct.pack(">hhhh", 128, 0, advance - 256, 0) + struct.pack(">hhhh", 0, 1408, 0, -1408)
    box += b"\0" * (-len(box) % 4)
    glyf, loca = b"", [0, 0, 0]
    for _ in codes:
        glyf += box
        loca.append(len(glyf))
    head = struct.pack(">IIIIHHqqhhhhHHhhh", 0x00010000, 0x00010000, 0, 0x5F0F3CF5, 3, upm, 0, 0, 128, 0, advance - 128, 1408,
                       1 if weight >= 600 else 0, 8, 2, 1, 0)
    hhea = struct.pack(">IhhhHhhhhhhhhhhhH", 0x00010000, asc, -desc, 0, advance, 0, 0, advance, 1, 0, 0, 0, 0, 0, 0, 0, count)
    maxp = struct.pack(">IHHHHHHHHHHHHHH", 0x00010000, count, 4, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0)
    os2 = struct.pack(">HhHHH", 4, advance, weight, 5, 0) + struct.pack(">10h", 1331, 1229, 0, 154, 1331, 1229, 0, 717, 102, 614)
    os2 += struct.pack(">h", 0) + b"\0" * 10 + struct.pack(">IIII", 1, 0, 0, 0) + b"QMLS"
    os2 += struct.pack(">HHH", 0x20 if weight >= 600 else 0x40, 32, 0x2026) + struct.pack(">hhhHH", asc, -desc, 0, asc, desc)
    os2 += struct.pack(">II", 1, 0) + struct.pack(">hhHHH", 1024, 1408, 0, 32, 0)
    hmtx = struct.pack(">Hh", advance, 0) + struct.pack(">Hh", advance // 2, 0) + struct.pack(">Hh", advance, 128) * len(codes)
    sub = struct.pack(">HHHHHHH", 4, 40, 0, 6, 4, 1, 2) + struct.pack(">HHH", 126, 0x2026, 0xFFFF) + struct.pack(">H", 0)
    sub += struct.pack(">HHH", 32, 0x2026, 0xFFFF) + struct.pack(">hhh", 1 - 32, count - 1 - 0x2026, 1)
    sub += struct.pack(">HHH", 0, 0, 0)
    cmap = struct.pack(">HHHHI", 0, 1, 3, 1, 12) + sub
    style = "Bold" if weight >= 600 else "Regular"
    names = {1: family, 2: style, 3: f"{family} {style} 1.0", 4: f"{family} {style}".replace(" Regular", ""), 5: "Version 1.0",
             6: (family + "-" + style).replace(" ", "")}
    strings, records = b"", b""
    for name_id, text in sorted(names.items()):
        data = text.encode("utf-16-be")
        records += struct.pack(">HHHHHH", 3, 1, 0x409, name_id, len(data), len(strings))
        strings += data
    name = struct.pack(">HHH", 0, len(names), 6 + len(records)) + records + strings
    post = struct.pack(">IIhhIIIII", 0x00030000, 0, -256, 128, 0, 0, 0, 0, 0)
    tables = {b"OS/2": os2, b"cmap": cmap, b"glyf": glyf, b"head": head, b"hhea": hhea, b"hmtx": hmtx,
              b"loca": struct.pack(f">{len(loca)}I", *loca), b"maxp": maxp, b"name": name, b"post": post}
    def checksum(data):
        data += b"\0" * (-len(data) % 4)
        return sum(struct.unpack(f">{len(data) // 4}I", data)) & 0xFFFFFFFF
    n = len(tables)
    out = struct.pack(">IHHHH", 0x00010000, n, 128, 3, n * 16 - 128)
    offset = 12 + 16 * n
    body = b""
    for tag in sorted(tables):
        data = tables[tag]
        out += struct.pack(">4sIII", tag, checksum(data), offset + len(body), len(data))
        body += data + b"\0" * (-len(data) % 4)
    open(path, "wb").write(out + body)

font("Qml Solid Test", 400, 1024, sys.argv[1] + "/boxes.ttf")
font("Qml Solid Test", 700, 1280, sys.argv[1] + "/boxes-bold.ttf")
