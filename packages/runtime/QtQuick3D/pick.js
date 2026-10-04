// Picking: what a ray through a scene meets. A model is met where the ray
// first comes to one of its triangles from the front, once for a model and
// once for each entry of a table it is drawn by; what is told of the place
// is where it is in the scene and in the model's own space, which way the
// triangle faces in both, how far along the ray it is, and where it is in
// the shape's picture.
//
// Qt works the triangles out only for a shape that something it shows is
// picked by; a model of any other shape is met at the box round each of
// its parts, where no triangle faces any way. So it is here (`exact`).
import { ENTRY } from "./instancing.js";
import * as math from "./math.js";
import { column, Triangles } from "./mesh.js";

const TINY = 2 ** -23;
const LEAST = 2 ** -126;
const MOST = 3.4028234663852886e38;

// A shape's corners and where each is in the picture, as numbers.
const read = new WeakMap();
function corners(shape) {
  let made = read.get(shape);
  if (!made) read.set(shape, (made = { at: column(shape, "attr_pos", 3), uv: column(shape, "attr_uv0", 2) ?? column(shape, "attr_uv1", 2) }));
  return made;
}

// How far along a ray a box is come to and left, or null where it is
// missed. A ray that goes along a side of the box has to start between
// the two sides.
function boxed(from, way, back, min, max) {
  let near = LEAST;
  let far = MOST;
  for (let axis = 0; axis < 3; axis++) {
    if (back[axis] === 0) {
      if (from[axis] < min[axis] || from[axis] > max[axis]) return null;
      continue;
    }
    const [first, last] = way[axis] < 0 ? [max[axis], min[axis]] : [min[axis], max[axis]];
    near = Math.max((first - from[axis]) * back[axis], near);
    far = Math.min((last - from[axis]) * back[axis], far);
  }
  return far >= Math.max(near, 0) ? near : null;
}

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// Where a ray first meets a run of a shape's triangles from the front:
// `{ along, local, uv, normal }`, or null.
function nearest(shape, { count, offset }, from, way) {
  const { at, uv } = corners(shape);
  const { indices } = shape;
  const corner = (index) => {
    const row = (indices ? indices[index] : index) * 3;
    return [at[row], at[row + 1], at[row + 2]];
  };
  let best = null;
  for (let index = offset; index + 2 < offset + count; index += 3) {
    const a = corner(index);
    const b = corner(index + 1);
    const c = corner(index + 2);
    const one = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const other = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const p = cross(way, other);
    const whole = dot(one, p);
    if (!(whole > TINY)) continue;
    const t = [from[0] - a[0], from[1] - a[1], from[2] - a[2]];
    const u = dot(t, p);
    if (u < 0 || u > whole) continue;
    const q = cross(t, one);
    const v = dot(way, q);
    if (v < 0 || u + v > whole) continue;
    const along = dot(other, q) / whole;
    if (!(along > TINY) || (best && along >= best.along)) continue;
    best = { along, index, u: u / whole, v: v / whole, a, b, c, one, other };
  }
  if (!best) return null;
  const { u, v, a, b, c } = best;
  const w = 1 - u - v;
  const pictured = (index) => {
    const row = (indices ? indices[index] : index) * 2;
    return uv ? [uv[row], uv[row + 1]] : [0, 0];
  };
  const [ua, ub, uc] = [pictured(best.index), pictured(best.index + 1), pictured(best.index + 2)];
  return {
    local: [0, 1, 2].map((axis) => w * a[axis] + u * b[axis] + v * c[axis]),
    uv: [w * ua[0] + u * ub[0] + v * uc[0], w * ua[1] + u * ub[1] + v * uc[1]],
    normal: math.normalized(cross(best.one, best.other)),
  };
}

// Where a ray comes to the box round a part of a shape: where it is in the
// picture is how far across and up the box it is.
function atBox(subset, from, way, back) {
  const near = boxed(from, way, back, subset.min, subset.max);
  if (near === null) return null;
  const local = [0, 1, 2].map((axis) => from[axis] + way[axis] * near);
  const { min, max } = subset;
  return { local, uv: [(local[0] - min[0]) / (max[0] - min[0]), (local[1] - min[1]) / (max[1] - min[1])], normal: [0, 0, 0] };
}

// What a ray from `origin` along `direction` meets of a shape that is
// placed by `placed`: the nearest of what it meets of each part.
function meeting(shape, exact, placed, origin, direction) {
  const back = math.inverse(placed) ?? math.IDENTITY;
  const from = math.point(back, ...origin);
  const way = math.normalized(math.transform(back, ...direction, 0).slice(0, 3));
  const inverse = way.map((part) => (Math.abs(part) <= 0.00001 ? 0 : 1 / part));
  const whole = shape.subsets.reduce((box, { min, max }) => ({ min: box.min.map((least, axis) => Math.min(least, min[axis])), max: box.max.map((most, axis) => Math.max(most, max[axis])) }));
  if (whole.min.some((least, axis) => least > whole.max[axis]) || boxed(from, way, inverse, whole.min, whole.max) === null) return null;
  const turn = math.normal(placed);
  let best = null;
  for (const subset of shape.subsets) {
    const met = exact ? boxed(from, way, inverse, subset.min, subset.max) !== null && nearest(shape, subset, from, way) : atBox(subset, from, way, inverse);
    if (!met) continue;
    const scene = math.point(placed, ...met.local);
    const distance = Math.fround((origin[0] - scene[0]) ** 2 + (origin[1] - scene[1]) ** 2 + (origin[2] - scene[2]) ** 2);
    if (!best || distance < best.distance) best = { ...met, scene, distance, sceneNormal: math.turned(turn, ...met.normal) };
  }
  return best;
}

// Everything a ray meets of the models given, the nearest first; of those
// as near as each other, the one that is later in the scene. A model is `{
// node, shape, exact, placed, instances }`: `exact` says its triangles are
// what is met, and `instances` is the table it is drawn by, as it draws.
export function met(models, origin, direction) {
  const all = [];
  for (let index = models.length - 1; index >= 0; index--) {
    const { node, shape, exact, placed, instances } = models[index];
    if (!shape.subsets.length) continue;
    const triangles = exact && shape.drawMode === Triangles;
    const count = instances ? instances.count : 1;
    for (let instance = 0; instance < count; instance++) {
      const hit = meeting(shape, triangles, instances ? entry(instances, instance) : placed, origin, direction);
      if (hit) all.push({ ...hit, node, instance });
    }
  }
  return all.sort((a, b) => a.distance - b.distance);
}

// Where one entry of a table puts a model.
function entry({ data, local, above }, index) {
  const at = index * ENTRY;
  const own = [data[at], data[at + 4], data[at + 8], 0, data[at + 1], data[at + 5], data[at + 9], 0, data[at + 2], data[at + 6], data[at + 10], 0, data[at + 3], data[at + 7], data[at + 11], 1];
  return math.multiply(above, math.multiply(own, local));
}
