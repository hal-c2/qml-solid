// The shapes Qt has of its own, which a Model names as `#Cube`: a cube, a
// sphere, a cylinder, a cone and a rectangle, each a hundred across and
// about the middle of its own space, but for the cone, which stands on it.
//
// Qt keeps them as mesh files; here each is worked out when it is first
// asked for, in the form a mesh file is read into (`mesh.js`). A round one
// is of fewer or more triangles than Qt's, so its edge is not Qt's to the
// pixel.
import { Triangles } from "./mesh.js";

const Float32 = 10;
const ROUND = 64;

// A mesh of corners `[x, y, z, nx, ny, nz, u, v]` and the order they are
// joined in.
function mesh(corners, order) {
  const numbers = new Float32Array(corners);
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let at = 0; at < numbers.length; at += 8) {
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], numbers[at + axis]);
      max[axis] = Math.max(max[axis], numbers[at + axis]);
    }
  }
  return {
    entries: {
      attr_pos: { type: Float32, count: 3, offset: 0 },
      attr_norm: { type: Float32, count: 3, offset: 12 },
      attr_uv0: { type: Float32, count: 2, offset: 24 },
    },
    stride: 32,
    vertices: new Uint8Array(numbers.buffer),
    indices: new Uint16Array(order),
    subsets: [{ count: order.length, offset: 0, min, max }],
    drawMode: Triangles,
    winding: 2,
  };
}

// A face is the square at the end of `n`, with the picture's across along
// `u` and its up along `v`.
const FACES = [
  [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
  [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
  [[1, 0, 0], [0, 0, -1], [0, 1, 0]],
  [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
  [[0, 1, 0], [-1, 0, 0], [0, 0, 1]],
  [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
];

function square(corners, order, [n, u, v], out) {
  const first = corners.length / 8;
  for (const [s, t] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    for (let axis = 0; axis < 3; axis++) corners.push(n[axis] * out + (u[axis] * s + v[axis] * t) * 50);
    corners.push(...n, (s + 1) / 2, (t + 1) / 2);
  }
  order.push(first, first + 1, first + 2, first, first + 2, first + 3);
}

function cube() {
  const corners = [];
  const order = [];
  for (const face of FACES) square(corners, order, face, 50);
  return mesh(corners, order);
}

function rectangle() {
  const corners = [];
  const order = [];
  square(corners, order, FACES[0], 0);
  return mesh(corners, order);
}

function sphere() {
  const corners = [];
  const order = [];
  const rings = ROUND / 2;
  for (let ring = 0; ring <= rings; ring++) {
    const down = (ring / rings) * Math.PI;
    for (let step = 0; step <= ROUND; step++) {
      const round = (step / ROUND) * 2 * Math.PI;
      const x = Math.sin(down) * Math.sin(round);
      const y = Math.cos(down);
      const z = Math.sin(down) * Math.cos(round);
      corners.push(x * 50, y * 50, z * 50, x, y, z, step / ROUND, 1 - ring / rings);
    }
  }
  for (let ring = 0; ring < rings; ring++) {
    for (let step = 0; step < ROUND; step++) {
      const at = ring * (ROUND + 1) + step;
      order.push(at, at + ROUND + 1, at + 1, at + 1, at + ROUND + 1, at + ROUND + 2);
    }
  }
  return mesh(corners, order);
}

// A round end at height `y`, facing up or down.
function disc(corners, order, y, up) {
  const middle = corners.length / 8;
  corners.push(0, y, 0, 0, up, 0, 0.5, 0.5);
  for (let step = 0; step <= ROUND; step++) {
    const round = (step / ROUND) * 2 * Math.PI;
    const x = Math.sin(round);
    const z = Math.cos(round);
    corners.push(x * 50, y, z * 50, 0, up, 0, 0.5 + x / 2, 0.5 + (z * up) / 2);
  }
  for (let step = 0; step < ROUND; step++) {
    if (up > 0) order.push(middle, middle + 1 + step, middle + 2 + step);
    else order.push(middle, middle + 2 + step, middle + 1 + step);
  }
}

// The side between a ring of radius `below` at `bottom` and one of `above`
// at `top`.
function side(corners, order, bottom, top, below, above) {
  const first = corners.length / 8;
  const lean = (below - above) / (top - bottom);
  const length = Math.hypot(1, lean);
  for (let step = 0; step <= ROUND; step++) {
    const round = (step / ROUND) * 2 * Math.PI;
    const x = Math.sin(round);
    const z = Math.cos(round);
    corners.push(x * below, bottom, z * below, x / length, lean / length, z / length, step / ROUND, 0);
    corners.push(x * above, top, z * above, x / length, lean / length, z / length, step / ROUND, 1);
  }
  for (let step = 0; step < ROUND; step++) {
    const at = first + step * 2;
    order.push(at, at + 2, at + 1, at + 1, at + 2, at + 3);
  }
}

function cylinder() {
  const corners = [];
  const order = [];
  side(corners, order, -50, 50, 50, 50);
  disc(corners, order, 50, 1);
  disc(corners, order, -50, -1);
  return mesh(corners, order);
}

function cone() {
  const corners = [];
  const order = [];
  side(corners, order, 0, 100, 50, 0);
  disc(corners, order, 0, -1);
  return mesh(corners, order);
}

const MAKERS = { Cube: cube, Rectangle: rectangle, Sphere: sphere, Cylinder: cylinder, Cone: cone };
const made = new Map();

export function primitive(name) {
  let shape = made.get(name);
  if (!shape) made.set(name, (shape = MAKERS[name]()));
  return shape;
}
