// Where one item is in another's coordinates: Qt's `itemTransform`, worked
// out from the items' properties so that nothing asks the DOM to lay out.
// A matrix is [a, b, c, d, e, f]: x' = a x + c y + e, y' = b x + d y + f.

// The point `rotation` and `scale` are about, as Item has it.
export const ORIGINS = [
  [0, 0],
  [0.5, 0],
  [1, 0],
  [0, 0.5],
  [0.5, 0.5],
  [1, 0.5],
  [0, 1],
  [0.5, 1],
  [1, 1],
];

// `m` becomes the given matrix times `m`: what `m` did, then this.
function then(m, a, b, c, d, e, f) {
  const m0 = m[0];
  const m1 = m[1];
  const m2 = m[2];
  const m3 = m[3];
  const m4 = m[4];
  const m5 = m[5];
  m[0] = a * m0 + c * m1;
  m[1] = b * m0 + d * m1;
  m[2] = a * m2 + c * m3;
  m[3] = b * m2 + d * m3;
  m[4] = a * m4 + c * m5 + e;
  m[5] = b * m4 + d * m5 + f;
}

// From an item's coordinates to its parent's, in the order Item puts them in
// its CSS: scale and rotation about the origin, the `transform` list from
// its first to its last, the position.
function lift(item, m) {
  const scale = item.scale;
  // An ImageParticle's `rotation` is its particles', not its own.
  const rotation = item.$upright ? 0 : item.rotation;
  if (scale !== 1 || rotation !== 0) {
    const [fx, fy] = ORIGINS[item.transformOrigin] ?? ORIGINS[4];
    const x = fx * item.width;
    const y = fy * item.height;
    const angle = (rotation * Math.PI) / 180;
    const cos = Math.cos(angle) * scale;
    const sin = Math.sin(angle) * scale;
    then(m, cos, sin, -sin, cos, x - cos * x + sin * y, y - sin * x - cos * y);
  }
  const list = item.transform;
  if (list) {
    // Rare enough to let the browser read what each one says it does.
    for (const each of Array.isArray(list) ? list : [list]) {
      const { a, b, c, d, e, f } = new DOMMatrix(each.$css());
      then(m, a, b, c, d, e, f);
    }
  }
  m[4] += item.x;
  m[5] += item.y;
}

// From an item's coordinates to those of the outermost item around it,
// which is returned.
function toRoot(item, m) {
  m[0] = m[3] = 1;
  m[1] = m[2] = m[4] = m[5] = 0;
  for (;;) {
    lift(item, m);
    const parent = item.parent;
    if (!parent?.$node) return item;
    item = parent;
  }
}

// The outermost item around one: the scene's.
export function outermost(item) {
  while (item.parent?.$node) item = item.parent;
  return item;
}

const FROM = new Float64Array(6);
const TO = new Float64Array(6);

// Fills `out` with the matrix from `from`'s coordinates to `to`'s; false if
// they are not in the same tree, or `to` is squashed flat.
export function between(from, to, out) {
  if (toRoot(from, FROM) !== toRoot(to, TO)) return false;
  const a = TO[0];
  const b = TO[1];
  const c = TO[2];
  const d = TO[3];
  const e = TO[4];
  const f = TO[5];
  const det = a * d - b * c;
  if (!det) return false;
  out.set(FROM);
  then(out, d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det);
  return true;
}
