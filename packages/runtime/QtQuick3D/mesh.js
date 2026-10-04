// A `.mesh` file: the shape of a Model, as Qt's tools write one out of what
// a modelling program made.
//
// At the end of the file is a list of where the meshes in it are; a Model
// draws the first. A mesh is its corners, each a row of numbers (where it
// is, which way it faces, where in a picture it is), the order the corners
// are joined into triangles in, and its subsets: each a run of that order
// drawn with one material.

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
// subsets, drawMode, winding }`, or what is wrong with it as `{ error }`.
// `entries` are by name (`attr_pos`, `attr_norm`, `attr_uv0`), each `{
// offset, count, type }` into a row of `stride` bytes; `vertices` is the
// rows as bytes, `indices` a typed array or null.
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

  u32(); // target entries
  const entryCount = u32();
  const stride = u32();
  u32(); // target data
  const vertexSize = u32();
  const indexType = u32();
  u32(); // where the indices are, which the format has anyway
  const indexSize = u32();
  u32(); // targets
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
  for (let index = 0; index < subsetCount; index++) {
    const subset = { count: u32(), offset: u32(), min: [f32(), f32(), f32()], max: [f32(), f32(), f32()] };
    u32(); // name
    u32();
    if (version >= 5) at += 8; // the size of its light map
    if (version >= 6) at += 4; // how many simpler ones there are of it
    subsets.push(subset);
  }
  return { entries, stride: stride || 1, vertices, indices, subsets, drawMode, winding };
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
