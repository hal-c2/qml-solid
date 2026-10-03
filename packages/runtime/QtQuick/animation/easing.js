// Qt's easing curves: `easing.type: Easing.OutBounce` and the rest. The
// functions are Robert Penner's, with the constants Qt gives them, so that an
// animation is where Qt's would be at every frame.
import { defineType } from "../../object.js";

const NAMES = [
  "Linear",
  "InQuad",
  "OutQuad",
  "InOutQuad",
  "OutInQuad",
  "InCubic",
  "OutCubic",
  "InOutCubic",
  "OutInCubic",
  "InQuart",
  "OutQuart",
  "InOutQuart",
  "OutInQuart",
  "InQuint",
  "OutQuint",
  "InOutQuint",
  "OutInQuint",
  "InSine",
  "OutSine",
  "InOutSine",
  "OutInSine",
  "InExpo",
  "OutExpo",
  "InOutExpo",
  "OutInExpo",
  "InCirc",
  "OutCirc",
  "InOutCirc",
  "OutInCirc",
  "InElastic",
  "OutElastic",
  "InOutElastic",
  "OutInElastic",
  "InBack",
  "OutBack",
  "InOutBack",
  "OutInBack",
  "InBounce",
  "OutBounce",
  "InOutBounce",
  "OutInBounce",
  "InCurve",
  "OutCurve",
  "SineCurve",
  "CosineCurve",
  "BezierSpline",
  "TCBSpline",
  "Custom",
  "NCurveTypes",
];

// `Easing.InOutQuad`: only the names, numbered as Qt numbers them.
export const Easing = defineType("Easing", null, {
  enums: Object.fromEntries(NAMES.map((name, index) => [name, index])),
});

const { PI, sin, cos, asin, sqrt, abs, pow } = Math;

// An "out then in" curve is its two halves swapped.
const outIn = (easeOut, easeIn) => (t) => (t < 0.5 ? easeOut(2 * t) / 2 : easeIn(2 * t - 1) / 2 + 0.5);

const inQuad = (t) => t * t;
const outQuad = (t) => -t * (t - 2);
const inCubic = (t) => t * t * t;
const outCubic = (t) => (t -= 1) * t * t + 1;
const inQuart = (t) => t * t * t * t;
const outQuart = (t) => -((t -= 1) * t * t * t - 1);
const inQuint = (t) => t * t * t * t * t;
const outQuint = (t) => (t -= 1) * t * t * t * t + 1;
const inSine = (t) => (t === 1 ? 1 : -cos((t * PI) / 2) + 1);
const outSine = (t) => sin((t * PI) / 2);
const inExpo = (t) => (t === 0 || t === 1 ? t : pow(2, 10 * (t - 1)) - 0.001);
const outExpo = (t) => (t === 1 ? 1 : 1.001 * (-pow(2, -10 * t) + 1));
const inCirc = (t) => -(sqrt(1 - t * t) - 1);
const outCirc = (t) => sqrt(1 - (t -= 1) * t);

const plain = [
  (t) => t,
  inQuad,
  outQuad,
  (t) => ((t *= 2) < 1 ? (t * t) / 2 : -0.5 * (--t * (t - 2) - 1)),
  outIn(outQuad, inQuad),
  inCubic,
  outCubic,
  (t) => ((t *= 2) < 1 ? 0.5 * t * t * t : 0.5 * ((t -= 2) * t * t + 2)),
  outIn(outCubic, inCubic),
  inQuart,
  outQuart,
  (t) => ((t *= 2) < 1 ? 0.5 * t * t * t * t : -0.5 * ((t -= 2) * t * t * t - 2)),
  outIn(outQuart, inQuart),
  inQuint,
  outQuint,
  (t) => ((t *= 2) < 1 ? 0.5 * t * t * t * t * t : 0.5 * ((t -= 2) * t * t * t * t + 2)),
  outIn(outQuint, inQuint),
  inSine,
  outSine,
  (t) => -0.5 * (cos(PI * t) - 1),
  outIn(outSine, inSine),
  inExpo,
  outExpo,
  (t) => {
    if (t === 0 || t === 1) return t;
    t *= 2;
    return t < 1 ? 0.5 * pow(2, 10 * (t - 1)) - 0.0005 : 0.5 * 1.0005 * (-pow(2, -10 * (t - 1)) + 2);
  },
  outIn(outExpo, inExpo),
  inCirc,
  outCirc,
  (t) => ((t *= 2) < 1 ? -0.5 * (sqrt(1 - t * t) - 1) : 0.5 * (sqrt(1 - (t -= 2) * t) + 1)),
  outIn(outCirc, inCirc),
];

// `b` to `b + c` over `d`, with amplitude `a` and period `p`.
function inElastic(t, b, c, d, a, p) {
  if (t === 0) return b;
  let adjusted = t / d;
  if (adjusted === 1) return b + c;
  let s;
  if (a < abs(c)) {
    a = c;
    s = p / 4;
  } else {
    s = (p / (2 * PI)) * asin(c / a);
  }
  adjusted -= 1;
  return -(a * pow(2, 10 * adjusted) * sin(((adjusted * d - s) * (2 * PI)) / p)) + b;
}

function outElastic(t, c, a, p) {
  if (t === 0) return 0;
  if (t === 1) return c;
  let s;
  if (a < c) {
    a = c;
    s = p / 4;
  } else {
    s = (p / (2 * PI)) * asin(c / a);
  }
  return a * pow(2, -10 * t) * sin(((t - s) * (2 * PI)) / p) + c;
}

function inOutElastic(t, a, p) {
  if (t === 0) return 0;
  t *= 2;
  if (t === 2) return 1;
  let s;
  if (a < 1) {
    a = 1;
    s = p / 4;
  } else {
    s = (p / (2 * PI)) * asin(1 / a);
  }
  if (t < 1) return -0.5 * (a * pow(2, 10 * (t - 1)) * sin(((t - 1 - s) * (2 * PI)) / p));
  return a * pow(2, -10 * (t - 1)) * sin(((t - 1 - s) * (2 * PI)) / p) * 0.5 + 1;
}

const elastic = [
  (t, a, p) => inElastic(t, 0, 1, 1, a, p),
  (t, a, p) => outElastic(t, 1, a, p),
  inOutElastic,
  (t, a, p) => (t < 0.5 ? outElastic(t * 2, 0.5, a, p) : inElastic(2 * t - 1, 0.5, 0.5, 1, a, p)),
];

const inBack = (t, s) => t * t * ((s + 1) * t - s);
const outBack = (t, s) => (t -= 1) * t * ((s + 1) * t + s) + 1;

const back = [
  inBack,
  outBack,
  (t, s) => {
    t *= 2;
    s *= 1.525;
    return t < 1 ? 0.5 * (t * t * ((s + 1) * t - s)) : 0.5 * ((t -= 2) * t * ((s + 1) * t + s) + 2);
  },
  (t, s) => (t < 0.5 ? outBack(2 * t, s) / 2 : inBack(2 * t - 1, s) / 2 + 0.5),
];

// To `c`, falling back by `a` at each bounce.
function bounced(t, c, a) {
  if (t === 1) return c;
  if (t < 4 / 11) return c * (7.5625 * t * t);
  if (t < 8 / 11) {
    t -= 6 / 11;
    return -a * (1 - (7.5625 * t * t + 0.75)) + c;
  }
  if (t < 10 / 11) {
    t -= 9 / 11;
    return -a * (1 - (7.5625 * t * t + 0.9375)) + c;
  }
  t -= 21 / 22;
  return -a * (1 - (7.5625 * t * t + 0.984375)) + c;
}

const outBounce = (t, a) => bounced(t, 1, a);
const inBounce = (t, a) => 1 - bounced(1 - t, 1, a);

const bounce = [
  inBounce,
  outBounce,
  (t, a) => (t < 0.5 ? inBounce(2 * t, a) / 2 : t === 1 ? 1 : outBounce(2 * t - 1, a) / 2 + 0.5),
  (t, a) => (t < 0.5 ? bounced(t * 2, 0.5, a) : 1 - bounced(2 - 2 * t, 0.5, a)),
];

const sinProgress = (value) => sin(value * PI - PI / 2) / 2 + 0.5;
const mixFactor = (value) => Math.min(Math.max(1 - value * 2 + 0.3, 0), 1);
const mixed = (t, mix) => sinProgress(t) * mix + t * (1 - mix);

const curves = [
  (t) => mixed(t, mixFactor(t)),
  (t) => mixed(t, mixFactor(1 - t)),
  (t) => (sin(t * 2 * PI - PI / 2) + 1) / 2,
  (t) => (cos(t * 2 * PI - PI / 2) + 1) / 2,
];

const cubic = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
};

// `easing.bezierCurve`: cubic segments, each two control points and an end
// point, from (0, 0) to (1, 1). The curve gives y for x, so the segment's
// parameter at that x is found first; x rises along a valid curve.
function bezier(points) {
  const count = Math.floor(points.length / 6);
  if (!count) return plain[0];
  return (x) => {
    if (!(x > 0)) return 0;
    if (!(x < 1)) return 1;
    let x0 = 0;
    let y0 = 0;
    let at = 0;
    while (at < count - 1 && x > points[at * 6 + 4]) {
      x0 = points[at * 6 + 4];
      y0 = points[at * 6 + 5];
      at++;
    }
    const base = at * 6;
    const x1 = points[base];
    const x2 = points[base + 2];
    const x3 = points[base + 4];
    let low = 0;
    let high = 1;
    let t = 0.5;
    for (let pass = 0; pass < 40; pass++) {
      t = (low + high) / 2;
      const found = cubic(x0, x1, x2, x3, t);
      if (abs(found - x) < 1e-7) break;
      if (found < x) low = t;
      else high = t;
    }
    return cubic(y0, points[base + 1], points[base + 3], points[base + 5], t);
  };
}

// The curve an `easing` group describes: progress in [0, 1] to how far along
// the animation is, which may go below 0 or above 1 on the way.
export function curve(type, amplitude, overshoot, period, bezierCurve) {
  if (type >= 29 && type <= 32) {
    const run = elastic[type - 29];
    const a = amplitude < 0 ? 1 : amplitude;
    const p = period < 0 ? 0.3 : period;
    return (t) => run(t, a, p);
  }
  if (type >= 33 && type <= 36) {
    const run = back[type - 33];
    const s = overshoot < 0 ? 1.70158 : overshoot;
    // These are not exact at the ends, and an animation has to end where
    // it was told to.
    return (t) => (!(t > 0) ? 0 : !(t < 1) ? 1 : run(t, s));
  }
  if (type >= 37 && type <= 40) {
    const run = bounce[type - 37];
    const a = amplitude < 0 ? 1 : amplitude;
    return (t) => run(t, a);
  }
  if (type >= 41 && type <= 44) return curves[type - 41];
  if (type === 45) return bezier(bezierCurve ?? []);
  return plain[type] ?? plain[0];
}

export const linear = plain[0];
