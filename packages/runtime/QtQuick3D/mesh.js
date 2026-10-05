// A `.mesh` file: the shape of a Model, as Qt's tools write one out of what
// a modelling program made.
//
// At the end of the file is a list of where the meshes in it are; a Model
// draws the first. A mesh is its corners, each a row of numbers (where it
// is, which way it faces, where in a picture it is), the order the corners
// are joined into triangles in, and its subsets: each a run of that order
// drawn with one material.
//
// A mesh may have targets besides: other shapes of the same corners, which
// a Model goes towards by the weights of its MorphTargets. They are kept as
// Qt hands them to a shader, as layers of a picture each as many numbers
// wide as high: four numbers to a corner, a layer for each target of what
// is first said of the corners (where they are), then one for each of what
// is said next (which way they face).
//
// Not here: the targets of a file older than version 7, which has them
// among what is said of each corner.

const FILE = 555777497;
const MESH = 3365961549;

// What a number is kept as: how many bytes, and how it is read.
const KINDS = {
  1: [1, "getUint8"],
  2: [1, "getInt8"],
  3: [2, "getUint16"],
  4: [2, "getInt16"],
  5: [4, "getUint32"],
  6: [4, "getInt32"],
  9: [2, "getFloat16"],
  10: [4, "getFloat32"],
  11: [8, "getFloat64"],
};

export const Triangles = 7;

// Reads the first mesh of a file: `{ entries, stride, vertices, indices,
// subsets, drawMode, winding, targets }`, or what is wrong with it as `{
// error }`. `entries` are by name (`attr_pos`, `attr_norm`, `attr_uv0`),
// each `{ offset, count, type }` into a row of `stride` bytes; `vertices`
// is the rows as bytes, `indices` a typed array or null. `targets` is null,
// or `{ count, width, names, data }`: how many targets, how wide a layer
// is, what each run of `count` layers is of (`attr_pos`, `attr_norm`), and
// the numbers of them all.
export function read(buffer) {
  const view = new DataView(buffer);
  const size = view.byteLength;
  if (size < 16 || view.getUint32(size - 16, true) !== FILE) return { error: "it is not a mesh file" };
  const meshes = view.getUint32(size - 4, true);
  if (meshes === 0) return { error: "it has no mesh in it" };
  const start = Number(view.getBigUint64(size - 16 - meshes * 16, true));
  if (start + 68 > size || view.getUint32(start, true) !== MESH) return { error: "it is not a mesh file" };
  const version = view.getUint16(start + 4, true);
  if (version < 3 || version > 7) return { error: `it is a mesh file of a version, ${version}, that is not known` };

  // What comes after the header is counted from there, and after each part
  // Qt goes on to the next multiple of four: by four when it is at one.
  const base = start + 12;
  let at = 0;
  const u32 = () => {
    const value = view.getUint32(base + at, true);
    at += 4;
    return value;
  };
  const f32 = () => {
    const value = view.getFloat32(base + at, true);
    at += 4;
    return value;
  };
  const align = () => void (at += 4 - (at % 4));

  const targetEntries = u32();
  const entryCount = u32();
  const stride = u32();
  const targetSize = u32();
  const vertexSize = u32();
  const indexType = u32();
  u32(); // where the indices are, which the format has anyway
  const indexSize = u32();
  const targetCount = u32();
  const subsetCount = u32();
  u32(); // joints
  u32();
  const drawMode = u32();
  const winding = u32();

  const listed = [];
  for (let index = 0; index < entryCount; index++) {
    u32(); // name
    listed.push({ type: u32(), count: u32(), offset: u32() });
  }
  align();
  const entries = {};
  for (const entry of listed) {
    const length = u32();
    let name = "";
    for (let index = 0; index < length; index++) {
      const code = view.getUint8(base + at + index);
      if (code === 0) break;
      name += String.fromCharCode(code);
    }
    at += length;
    align();
    if (!KINDS[entry.type]) return { error: `its ${name} is kept as a number of a kind, ${entry.type}, that is not known` };
    entries[name] = entry;
  }
  if (base + at + vertexSize > size) return { error: "it ends before its corners do" };
  const vertices = new Uint8Array(buffer, base + at, vertexSize);
  at += vertexSize;
  align();
  if (base + at + indexSize > size) return { error: "it ends before its triangles do" };
  let indices = null;
  if (indexSize > 0) {
    const bytes = buffer.slice(base + at, base + at + indexSize);
    indices = indexType === 3 ? new Uint16Array(bytes) : indexType === 5 ? new Uint32Array(bytes) : new Uint8Array(bytes);
  }
  at += indexSize;
  align();
  const subsets = [];
  const named = [];
  let simpler = 0;
  for (let index = 0; index < subsetCount; index++) {
    const subset = { count: u32(), offset: u32(), min: [f32(), f32(), f32()], max: [f32(), f32(), f32()] };
    u32(); // name
    named.push(u32());
    if (version >= 5) at += 8; // the size of its light map
    if (version >= 6) simpler += u32(); // how many simpler ones there are of it
    subsets.push(subset);
  }
  let targets = null;
  if (version >= 7 && targetEntries > 0 && targetCount > 0 && targetSize > 0) {
    // After the subsets are their names, two bytes to a letter, and the
    // simpler ones of each, three numbers to one.
    align();
    for (const length of named) {
      at += length * 2;
      align();
    }
    at += simpler * 12;
    align();
    at += targetEntries * 16;
    align();
    const names = [];
    for (let index = 0; index < targetEntries; index++) {
      const length = u32();
      if (base + at + length > size) return { error: "it ends before its targets do" };
      let name = "";
      for (let letter = 0; letter < length; letter++) {
        const code = view.getUint8(base + at + letter);
        if (code === 0) break;
        name += String.fromCharCode(code);
      }
      at += length;
      align();
      names.push(name);
    }
    if (base + at + targetSize > size) return { error: "it ends before its targets do" };
    const layers = targetEntries * targetCount;
    const width = Math.ceil(Math.sqrt(Math.floor(targetSize / layers) >> 4));
    if (width * width * 16 * layers > targetSize) return { error: "it ends before its targets do" };
    targets = { count: targetCount, width, names, data: new Float32Array(buffer.slice(base + at, base + at + width * width * 16 * layers)) };
  }
  return { entries, stride: stride || 1, vertices, indices, subsets, drawMode, winding, targets };
}

// One entry of every corner as numbers, `width` to a corner: what is not in
// the file is 0.
export function column(mesh, name, width) {
  const entry = mesh.entries[name];
  if (!entry) return null;
  const { vertices, stride } = mesh;
  const [bytes, get] = KINDS[entry.type];
  const view = new DataView(vertices.buffer, vertices.byteOffset, vertices.byteLength);
  const rows = Math.floor(vertices.byteLength / stride);
  const numbers = new Float32Array(rows * width);
  const count = Math.min(width, entry.count);
  for (let row = 0; row < rows; row++) {
    for (let index = 0; index < count; index++) {
      numbers[row * width + index] = view[get](row * stride + entry.offset + index * bytes, true);
    }
  }
  return numbers;
}
