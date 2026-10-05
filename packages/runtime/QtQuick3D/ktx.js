// A `.ktx` file: a picture as a graphics card takes one, with every level
// of it that is read when it is seen small, and of a cube the six sides of
// each. What is read here is what Qt's own tool for baking surroundings
// (`balsam`) writes: a cube of halves, four to a pixel, with a note that Qt
// baked it. Its levels are then the ones Qt would have made of a picture of
// everything round a place: the picture, what surfaces of more and more
// roughness give back of it, and last what one takes from all round.
//
// The first row of each side is its top one, as Qt hands it to the card.
//
// Not here: the second version of the format (KTX 2), numbers of any other
// kind (bytes, whole fractions, or packed as `BC6H` and the like), and a
// file written with its bytes the other way round.
const SIGN = [0xab, 0x4b, 0x54, 0x58, 0x20, 0x31, 0x31, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a];
const ORDER = 0x04030201;
const HALVES = 0x140b;
const RGBA16F = 0x881a;

// Reads one: `{ width, height, sides, levels, baked, format, linear, sheer }`
// or what is wrong with it as `{ error }`. `levels` are the sides of each
// level, each side its numbers as they are in the file; `baked` is whether
// Qt baked it. `pixels` is the first side of the first level as a
// TextureData's numbers are, the bottom row first, for where the file is a
// material's picture. `spent()` lets go of the file, once a card has it.
export function ktx(buffer) {
  const view = new DataView(buffer);
  const size = view.byteLength;
  if (size < 64 || SIGN.some((byte, index) => view.getUint8(index) !== byte)) return { error: "it is not a KTX file of the first version" };
  if (view.getUint32(12, true) !== ORDER) return { error: "its bytes are the other way round" };
  const word = (index) => view.getUint32(16 + index * 4, true);
  if (word(0) !== HALVES || word(3) !== RGBA16F) return { error: `it is kept as numbers of a kind, 0x${word(3).toString(16)}, that is not read` };
  const width = word(5);
  const height = Math.max(1, word(6));
  const sides = Math.max(1, word(9));
  const count = Math.max(1, word(10));
  if (word(7) > 1 || word(8) > 0 || (sides !== 1 && sides !== 6)) return { error: "it is neither a picture nor a cube" };

  // What is noted in it: a name, a nought, and what is said of it.
  let baked = false;
  const noted = word(11);
  for (let at = 64; at + 4 <= 64 + noted; ) {
    const length = view.getUint32(at, true);
    let name = "";
    for (let index = 0; index < length && view.getUint8(at + 4 + index) !== 0; index++) name += String.fromCharCode(view.getUint8(at + 4 + index));
    if (name === "QT_IBL_BAKER_VERSION") baked = true;
    at += 4 + length + ((4 - (length % 4)) % 4);
  }

  // Each level says how many bytes one side of it is.
  let levels = [];
  let at = 64 + noted;
  for (let level = 0; level < count; level++) {
    const across = Math.max(1, width >> level);
    const high = Math.max(1, height >> level);
    const bytes = at + 4 <= size ? view.getUint32(at, true) : 0;
    at += 4;
    if (bytes !== across * high * 8 || at + bytes * sides > size) return { error: "it ends before its levels do" };
    const row = [];
    for (let side = 0; side < sides; side++) {
      row.push(at % 2 ? new Uint16Array(buffer.slice(at, at + bytes)) : new Uint16Array(buffer, at, bytes / 2));
      at += bytes;
    }
    levels.push(row);
  }

  let pixels;
  return {
    width,
    height,
    sides,
    baked,
    format: "RGBA16F",
    linear: true,
    sheer: false,
    get levels() {
      return levels;
    },
    get pixels() {
      if (pixels === undefined && levels) {
        const from = levels[0][0];
        const length = width * 4;
        pixels = new Uint16Array(from.length);
        for (let row = 0; row < height; row++) pixels.set(from.subarray(row * length, (row + 1) * length), (height - 1 - row) * length);
      }
      return pixels ?? null;
    },
    spent() {
      levels = null;
    },
  };
}
