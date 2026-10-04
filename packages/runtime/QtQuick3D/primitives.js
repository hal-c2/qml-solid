// The shapes Qt has of its own, which a Model names as `#Cube`: a cube, a
// sphere, a cylinder, a cone and a rectangle, each about a hundred across
// and about the middle of its own space, but for the cone, which stands on
// it.
//
// Qt keeps them as mesh files; here each is worked out when it is first
// asked for, in the form a mesh file is read into (`mesh.js`), with the
// sizes, the number of sides and the places in a picture that Qt's file
// has. A round one of Qt's is a little under a hundred across.
//
// Not here: which way a picture's across and up lie at each corner, which
// Qt's files say and is worked out here where a shape is drawn. Near its
// poles Qt's sphere has its squares cut either way with no rule to it;
// here they are cut everywhere as Qt cuts them further from the poles.
import { Triangles } from "./mesh.js";

const Float32 = 10;

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

// Where a step of `steps` round the upright is: Qt goes from the back by
// the left to the front and the right.
function round(step, steps) {
  const turn = (step / steps) * 2 * Math.PI;
  return [-Math.sin(turn), -Math.cos(turn)];
}

// A sphere is fifty slices of fifty rings, a picture going once round it
// from the back and from its foot to its top. Each pole is a corner to a
// slice, at the middle of the slice in the picture.
const BALL = 49.475608825683594;
const SLICES = 50;

function sphere() {
  const corners = [];
  const order = [];
  for (let step = 0; step < SLICES; step++) corners.push(0, -BALL, 0, 0, -1, 0, (step + 0.5) / SLICES, 0);
  for (let ring = 1; ring < SLICES; ring++) {
    const up = (ring / SLICES) * Math.PI;
    const out = Math.sin(up);
    const y = -Math.cos(up);
    for (let step = 0; step <= SLICES; step++) {
      const [x, z] = round(step, SLICES);
      corners.push(x * out * BALL, y * BALL, z * out * BALL, x * out, y, z * out, step / SLICES, ring / SLICES);
    }
  }
  const top = corners.length / 8;
  for (let step = 0; step < SLICES; step++) corners.push(0, BALL, 0, 0, 1, 0, (step + 0.5) / SLICES, 1);
  const at = (ring, step) => SLICES + (ring - 1) * (SLICES + 1) + step;
  for (let step = 0; step < SLICES; step++) order.push(at(1, step), step, at(1, step + 1));
  for (let ring = 1; ring < SLICES - 1; ring++) {
    for (let step = 0; step < SLICES; step++) {
      const [a, b, c, d] = [at(ring, step), at(ring, step + 1), at(ring + 1, step + 1), at(ring + 1, step)];
      // A square is cut one way in every other eighth of the way round,
      // and the other way above the middle.
      const even = Math.floor((step + 0.5) / (SLICES / 8)) % 2 === 0;
      if (even === ring < SLICES / 2) order.push(d, b, c, a, b, d);
      else order.push(a, b, c, a, c, d);
    }
  }
  for (let step = 0; step < SLICES; step++) order.push(at(SLICES - 1, step), at(SLICES - 1, step + 1), top + step);
  return mesh(corners, order);
}

const SIDES = 40;

// A round end of `sides` corners at height `y`, facing up or down, each
// corner where `pictured` says it is in the picture.
function disc(corners, order, y, radius, up, pictured) {
  const first = corners.length / 8;
  for (let step = 0; step < SIDES; step++) {
    const [x, z] = round(step, SIDES);
    corners.push(x * radius, y, z * radius, 0, up, 0, ...pictured(x, z));
  }
  for (let step = 1; step < SIDES - 1; step++) {
    if (up > 0) order.push(first, first + step, first + step + 1);
    else order.push(first, first + step + 1, first + step);
  }
}

// A cylinder's side takes a strip of a picture, from the left of the
// shape round by its front, and each end a round piece of the picture's
// upper left quarter, turned by half a side; the top's is the other way
// across.
const TUBE = 49.97998046875;
const HEIGHTS = [-49.97998046875, -16.659912109375, 16.659912109375, 49.97998046875];
const STRIP = [0.06625, 0.18875, 0.31125, 0.43375];
const HALF = Math.PI / SIDES;

function cylinder() {
  const corners = [];
  const order = [];
  for (let ring = 0; ring < HEIGHTS.length; ring++) {
    for (let step = 0; step <= SIDES; step++) {
      const [x, z] = round(step + SIDES / 4, SIDES);
      corners.push(x * TUBE, HEIGHTS[ring], z * TUBE, x, 0, z, step / SIDES, STRIP[ring]);
    }
  }
  for (let ring = 0; ring + 1 < HEIGHTS.length; ring++) {
    for (let step = 0; step < SIDES; step++) {
      const at = ring * (SIDES + 1) + step;
      order.push(at + 1, at + SIDES + 2, at + SIDES + 1, at + 1, at + SIDES + 1, at);
    }
  }
  const end = (across) => (x, z) => [0.25 + 0.25 * across * (x * Math.cos(HALF) + z * Math.sin(HALF)), 0.75 + 0.25 * (z * Math.cos(HALF) - x * Math.sin(HALF))];
  disc(corners, order, TUBE, TUBE, 1, end(-1));
  disc(corners, order, -TUBE, TUBE, -1, end(1));
  return mesh(corners, order);
}

// A cone has a picture laid on it from above, on its side as on its foot,
// and one corner at its point, which faces up.
const FOOT = 49.974609375;
const GROUND = 0.025390625;
const POINT = 99.943359375;

function cone() {
  const corners = [];
  const order = [];
  const pictured = (x, z) => [0.5 + x / 2, 0.5 - z / 2];
  disc(corners, order, GROUND, FOOT, -1, pictured);
  const first = corners.length / 8;
  const lean = FOOT / (POINT - GROUND);
  const length = Math.hypot(1, lean);
  for (let step = 0; step < SIDES; step++) {
    const [x, z] = round(step, SIDES);
    corners.push(x * FOOT, GROUND, z * FOOT, x / length, lean / length, z / length, ...pictured(x, z));
  }
  const point = corners.length / 8;
  corners.push(0, POINT, 0, 0, 1, 0, 0.5, 0.5);
  for (let step = 0; step < SIDES; step++) order.push(first + step, first + ((step + 1) % SIDES), point);
  return mesh(corners, order);
}

const MAKERS = { Cube: cube, Rectangle: rectangle, Sphere: sphere, Cylinder: cylinder, Cone: cone };
const made = new Map();

export function primitive(name) {
  let shape = made.get(name);
  if (!shape) made.set(name, (shape = MAKERS[name]()));
  return shape;
}
