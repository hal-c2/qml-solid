// The shapes a graph in space is drawn with, each made as a mesh the scene's
// renderer takes: the walls behind the data, the lines of the grid, a
// surface, bars, points and the squares the labels are on.
//
// A corner here has a colour of its own besides what a mesh file's has, in
// linear light: a shape of many colours is one shape.
import { Triangles } from "../QtQuick3D/mesh.js";

const Float32 = 10;
const Lines = 4;
// What a corner is: where, facing what, where in a picture, what colour.
const ROW = 12;
const WHITE = Object.freeze([1, 1, 1, 1]);
const WHOLE = Object.freeze([0, 0, 1, 1]);

// A shape being made. Its corners are joined into parts, each drawn with a
// paint of its own: `part(paint)` ends one, and `mesh()` is all of them, or
// nothing when nothing was made.
export function shaping(mode = Triangles) {
  const numbers = [];
  const order = [];
  const subsets = [];
  const paints = [];
  let count = 0;
  let from = 0;
  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];
  const made = {
    corner(place, normal, colour = WHITE, u = 0, v = 0) {
      numbers.push(place[0], place[1], place[2], normal[0], normal[1], normal[2], u, v, colour[0], colour[1], colour[2], colour[3] ?? 1);
      for (let axis = 0; axis < 3; axis++) {
        if (place[axis] < min[axis]) min[axis] = place[axis];
        if (place[axis] > max[axis]) max[axis] = place[axis];
      }
      return count++;
    },
    join(...corners) {
      order.push(...corners);
    },
    // Four corners in turn, anticlockwise as seen from where `normal`
    // points. `picture` is where in a picture the first and the third are.
    quad(a, b, c, d, normal, colour = WHITE, picture = WHOLE) {
      const [u0, v0, u1, v1] = picture;
      const first = made.corner(a, normal, colour, u0, v0);
      made.corner(b, normal, colour, u1, v0);
      made.corner(c, normal, colour, u1, v1);
      made.corner(d, normal, colour, u0, v1);
      order.push(first, first + 1, first + 2, first, first + 2, first + 3);
    },
    // A line from one place to another.
    line(a, b, colour = WHITE) {
      order.push(made.corner(a, UP, colour), made.corner(b, UP, colour));
    },
    part(paint) {
      if (order.length === from) return;
      subsets.push({ count: order.length - from, offset: from, min, max });
      paints.push(paint);
      from = order.length;
      min = [Infinity, Infinity, Infinity];
      max = [-Infinity, -Infinity, -Infinity];
    },
    mesh(paint) {
      made.part(paint);
      if (!subsets.length) return NOTHING;
      return {
        paints,
        mesh: {
          entries: {
            attr_pos: { type: Float32, count: 3, offset: 0 },
            attr_norm: { type: Float32, count: 3, offset: 12 },
            attr_uv0: { type: Float32, count: 2, offset: 24 },
            attr_color: { type: Float32, count: 4, offset: 32 },
          },
          stride: ROW * 4,
          vertices: new Uint8Array(new Float32Array(numbers).buffer),
          indices: new Uint32Array(order),
          subsets,
          drawMode: mode,
          winding: 2,
        },
      };
    },
  };
  return made;
}

export const lines = () => shaping(Lines);

const UP = Object.freeze([0, 1, 0]);
const NOTHING = Object.freeze({ mesh: null, paints: Object.freeze([]) });

const minus = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function unit(v) {
  const length = Math.hypot(v[0], v[1], v[2]);
  return length > 0 ? [v[0] / length, v[1] / length, v[2] / length] : [0, 1, 0];
}

// What a triangle faces: the side its corners go anticlockwise on.
export const facing = (a, b, c) => unit(cross(minus(b, a), minus(c, a)));

// A box between two corners, without the side it stands on when `open`
// names one: `-1` its bottom, `1` its top.
export function box(shape, low, high, colour, open = 0) {
  const [x0, y0, z0] = low;
  const [x1, y1, z1] = high;
  shape.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], colour);
  shape.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], colour);
  shape.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], colour);
  shape.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], colour);
  if (open <= 0) shape.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], colour);
  if (open >= 0) shape.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], colour);
}

// A ball about a place, of so many steps round and half as many down.
export function ball(shape, [x, y, z], radius, colour, round) {
  const rings = round / 2;
  const first = shape.corner([x, y + radius, z], [0, 1, 0], colour);
  for (let ring = 1; ring < rings; ring++) {
    const down = (ring / rings) * Math.PI;
    const wide = Math.sin(down);
    const high = Math.cos(down);
    for (let step = 0; step < round; step++) {
      const turn = (step / round) * 2 * Math.PI;
      const n = [wide * Math.sin(turn), high, wide * Math.cos(turn)];
      shape.corner([x + n[0] * radius, y + n[1] * radius, z + n[2] * radius], n, colour);
    }
  }
  const last = shape.corner([x, y - radius, z], [0, -1, 0], colour);
  const at = (ring, step) => first + 1 + (ring - 1) * round + (step % round);
  for (let step = 0; step < round; step++) {
    shape.join(first, at(1, step), at(1, step + 1));
    shape.join(last, at(rings - 1, step + 1), at(rings - 1, step));
    for (let ring = 1; ring < rings - 1; ring++) {
      shape.join(at(ring, step), at(ring + 1, step), at(ring, step + 1));
      shape.join(at(ring, step + 1), at(ring + 1, step), at(ring + 1, step + 1));
    }
  }
}

// A surface through rows of places, the same number in each. A face is lit
// as one when the surface is `flat`, and else as it rounds into the ones
// about it.
export function sheet(shape, rows, colour, flat) {
  const deep = rows.length;
  const wide = rows[0]?.length ?? 0;
  if (deep < 2 || wide < 2) return;
  if (flat) {
    for (let row = 0; row + 1 < deep; row++) {
      for (let column = 0; column + 1 < wide; column++) {
        const a = rows[row][column];
        const b = rows[row][column + 1];
        const c = rows[row + 1][column + 1];
        const d = rows[row + 1][column];
        for (const [p, q, r] of [[a, b, c], [a, c, d]]) {
          const normal = facing(p, q, r);
          const first = shape.corner(p, normal, colour);
          shape.corner(q, normal, colour);
          shape.corner(r, normal, colour);
          shape.join(first, first + 1, first + 2);
        }
      }
    }
    return;
  }
  // What a corner faces is what the faces about it do, together.
  const normals = rows.map((row) => row.map(() => [0, 0, 0]));
  const add = (row, column, normal) => {
    for (let axis = 0; axis < 3; axis++) normals[row][column][axis] += normal[axis];
  };
  for (let row = 0; row + 1 < deep; row++) {
    for (let column = 0; column + 1 < wide; column++) {
      const upper = facing(rows[row][column], rows[row][column + 1], rows[row + 1][column + 1]);
      const lower = facing(rows[row][column], rows[row + 1][column + 1], rows[row + 1][column]);
      add(row, column, upper);
      add(row, column + 1, upper);
      add(row + 1, column + 1, upper);
      add(row, column, lower);
      add(row + 1, column + 1, lower);
      add(row + 1, column, lower);
    }
  }
  const first = [];
  for (let row = 0; row < deep; row++) {
    for (let column = 0; column < wide; column++) {
      const corner = shape.corner(rows[row][column], unit(normals[row][column]), colour);
      if (column === 0) first.push(corner);
    }
  }
  for (let row = 0; row + 1 < deep; row++) {
    for (let column = 0; column + 1 < wide; column++) {
      const a = first[row] + column;
      const d = first[row + 1] + column;
      shape.join(a, a + 1, d + 1, a, d + 1, d);
    }
  }
}

// A square about `middle` with a picture on it: `across` is the way the
// picture's lines are read and `up` where their tops are, each as long as
// half the square is that way.
export function sign(shape, middle, across, up, picture) {
  const at = (s, t) => [middle[0] + across[0] * s + up[0] * t, middle[1] + across[1] * s + up[1] * t, middle[2] + across[2] * s + up[2] * t];
  shape.quad(at(-1, -1), at(1, -1), at(1, 1), at(-1, 1), unit(cross(across, up)), WHITE, picture);
}
