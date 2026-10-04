// What a View3D draws of a particle system besides its models: the sprites,
// each a square of `particleScale` times the particle's size with the
// picture on it, and the lines, each a ribbon along the way a particle
// came. They are drawn among what is seen through in the view, a system
// as far away as it is itself, with a program of their own: behind what is
// nearer, and in front of nothing as far as what is drawn later can tell.
//
// As Qt draws a sprite: where the particle is in the system is where the
// middle of the square is, and the square itself is turned as the particle
// is and no other way, in the scene (`billboard` not set: it lies in the
// scene's own plane whichever way the system is turned and however big it
// is) or before the eye (`billboard`). Its colour is taken as it is for
// light and goes through the view's tone mapping.
//
// Unlike Qt: a line is not kept from one moment to the next but found
// again each time from where its particle was, a point for each 16 ms of
// its way that is `lengthDeltaMin` from the last; it is the same line
// however the system came to its time, where Qt's has a point for each
// time the system was brought to.
import * as math from "../math.js";
import { LENGTH, random, spread, TABLE, FRAME } from "./core.js";
import { moved } from "./particles.js";

const VERTEX = `#version 300 es
layout(location = 0) in vec2 a_corner;
layout(location = 1) in vec3 a_place;
layout(location = 2) in vec4 a_turn;
layout(location = 3) in vec4 a_color;
layout(location = 4) in vec4 a_look;
uniform mat4 u_world;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform int u_mode;
out vec2 v_at;
out vec4 v_color;
out vec4 v_look;

vec3 turned(vec4 q, vec3 v) {
  return v + 2.0 * cross(q.yzw, cross(q.yzw, v) + q.x * v);
}

void main() {
  v_color = a_color;
  v_look = a_look;
  if (u_mode == 2) {
    // A ribbon's corners are where the eye sees them already.
    v_at = a_corner;
    gl_Position = u_projection * vec4(a_place, 1.0);
    return;
  }
  v_at = a_corner + 0.5;
  // Which row of the colour table is its: Qt's own sum, of how many are
  // drawn before it.
  v_look.z = fract(sin(float(gl_InstanceID) * 12.9898) * 43758.5453);
  vec3 across = vec3(a_corner * a_look.x, 0.0);
  vec4 place = u_world * vec4(a_place, 1.0);
  if (u_mode == 0) place.xyz += turned(a_turn, across);
  place = u_view * place;
  // Before the eye it is turned the other way round, as Qt has it.
  if (u_mode == 1) place.xyz += turned(vec4(a_turn.x, -a_turn.yzw), across);
  gl_Position = u_projection * place;
}`;

// The sums of tone mapping are those of the program models are drawn with.
const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D u_picture;
uniform sampler2D u_table;
uniform bool u_pictured;
uniform bool u_tabled;
uniform bool u_straight;
uniform float u_frames;
uniform float u_blend;
uniform float u_opacity;
uniform int u_tonemap;
in vec2 v_at;
in vec4 v_color;
in vec4 v_look;
out vec4 color;

vec3 toLinear(vec3 c) {
  return c * (c * (c * 0.305306011 + 0.682171111) + 0.012522878);
}

vec3 toScreen(vec3 c) {
  vec3 s1 = sqrt(c);
  vec3 s2 = sqrt(s1);
  vec3 s3 = sqrt(s2);
  return 0.585122381 * s1 + 0.783140355 * s2 - 0.368262736 * s3;
}

vec3 filmic(vec3 c) {
  return ((c * (0.15 * c + 0.05) + 0.004) / (c * (0.15 * c + 0.5) + 0.06)) - 0.02 / 0.3;
}

vec3 tonemap(vec3 c) {
  if (u_tonemap == 1) return toScreen(c);
  if (u_tonemap == 2) return toScreen(clamp((c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14), 0.0, 1.0));
  if (u_tonemap == 3) {
    c = max(vec3(0.0), c - 0.004);
    return (c * (6.2 * c + 0.5)) / (c * (6.2 * c + 1.7) + 0.06);
  }
  if (u_tonemap == 4) return toScreen(filmic(c * 2.0) / filmic(vec3(11.2)));
  return c;
}

vec4 pictured(float frame) {
  vec4 texel = texture(u_picture, vec2(clamp(frame / u_frames, 0.0, 1.0) + v_at.x / u_frames, v_at.y));
  return vec4(toLinear(texel.rgb), texel.a);
}

void main() {
  vec4 tint = v_color;
  if (u_tabled) {
    vec4 texel = texture(u_table, vec2(fract(v_look.y), v_look.z));
    tint *= vec4(toLinear(texel.rgb), texel.a);
  }
  if (u_pictured) {
    // How far through the frames it is, as Qt works it out: through one
    // fewer when one frame goes over into the next, so that the last is
    // reached and nothing after it.
    float frame = (u_frames - u_blend) * v_look.w;
    float between = fract(frame);
    tint *= mix(pictured(frame - between), pictured(frame - between + 1.0), between * u_blend);
  }
  float alpha = tint.a * u_opacity;
  color = vec4(tonemap(tint.rgb) * (u_straight ? 1.0 : alpha), alpha);
}`;

const UNIFORMS = ["u_world", "u_view", "u_projection", "u_mode", "u_picture", "u_table", "u_pictured", "u_tabled", "u_straight", "u_frames", "u_blend", "u_opacity", "u_tonemap"];

// What one particle is in the row of numbers a sprite is drawn from: where
// it is, its turn, its colour, and its size with how far through its life
// it is, a place for the row of the colour table that is its own and how
// far through the frames of its picture it is.
const EACH = 15;
// And one corner of a ribbon: where in the picture, where before the eye,
// the colour, and how far through its life the particle is with its row.
const CORNER = 13;

// The program and what it draws from, once for each context there is.
const made = new WeakMap();
function tools(gl) {
  let own = made.get(gl);
  if (own !== undefined) return own;
  const program = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, VERTEX],
    [gl.FRAGMENT_SHADER, FRAGMENT],
  ]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.warn(`ParticleSystem3D: ${gl.getShaderInfoLog(shader)}`);
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(`ParticleSystem3D: ${gl.getProgramInfoLog(program)}`);
    made.set(gl, null);
    return null;
  }
  const at = {};
  for (const name of UNIFORMS) at[name] = gl.getUniformLocation(program, name);
  const FLOAT = 4;

  // A square, drawn once for each particle from a row of its own.
  const squares = gl.createVertexArray();
  gl.bindVertexArray(squares);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const rows = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, rows);
  [
    [1, 3, 0],
    [2, 4, 3],
    [3, 4, 7],
    [4, 4, 11],
  ].forEach(([location, count, offset]) => {
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, count, gl.FLOAT, false, EACH * FLOAT, offset * FLOAT);
    gl.vertexAttribDivisor(location, 1);
  });

  // Ribbons: three corners to a triangle, each with all that is its own.
  const ribbons = gl.createVertexArray();
  gl.bindVertexArray(ribbons);
  const corners = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, corners);
  [
    [0, 2, 0],
    [1, 3, 2],
    [3, 4, 5],
    [4, 4, 9],
  ].forEach(([location, count, offset]) => {
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, count, gl.FLOAT, false, CORNER * FLOAT, offset * FLOAT);
  });
  gl.bindVertexArray(null);

  // What is sampled where there is no picture: a white one.
  const blank = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, blank);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

  made.set(gl, (own = { program, at, squares, rows, ribbons, corners, blank }));
  return own;
}

const SourceOver = 0;
const Screen = 1;
const Multiply = 2;
const SortNewest = 1;
const SortOldest = 2;
const SortDistance = 3;
const Reverse = 1;
const Alternate = 2;
const AlternateReverse = 3;
const SingleFrame = 4;
const Relative = 1;
const Fill = 2;

const single = Math.fround;

// How far through the frames of a sequence a particle is when it has been
// for `seconds`: from nought, the beginning of the first, up to one, the
// end of the last. The sums are Qt's, in numbers of 32 bits as its are.
function frame(sequence, seed, datum, seconds) {
  const count = Math.max(1, Math.floor(sequence.frameCount));
  const direction = sequence.animationDirection;
  let first = 0;
  if (sequence.randomStart) first = single(random(seed, datum.index, FRAME));
  else if (count > 1 && sequence.frameIndex > 0) {
    const index = Math.min(Math.floor(sequence.frameIndex), count - 1);
    first = direction === SingleFrame ? single(index / single(count - 1 + 0.0001)) : single(index / count);
  }
  // All of them once in the sequence's time, or in the particle's life.
  let whole = single(datum.life / 1000);
  if (sequence.duration > 0) {
    const varied = single(sequence.durationVariation / 1000);
    whole = Math.max(single(0.001), single(single(sequence.duration / 1000) + single(varied - single(2 * random(seed, datum.index, FRAME + 1) * varied))));
  }
  const gone = single(single(seconds) / whole);
  const nearly = single(0.9999);
  let through = first;
  if (direction === Reverse) through = single(single(first + nearly - (gone % 1)) % 1);
  else if (direction === Alternate) through = Math.abs(single(single(1 + single(first + gone)) % 2) - 1);
  else if (direction === AlternateReverse) through = Math.abs(single(Math.abs(single(1 + single((single(first + nearly) % 1) - gone))) % 2) - 1);
  else if (direction !== SingleFrame) through = single(single(first + gone) % 1);
  return Math.min(nearly, Math.max(0, through));
}

// The order the particles of a kind are drawn in, the last on top. As Qt
// has it: unsorted they are in the order of their places in the table; the
// newest first is from the place that was written last back through the
// table; and the oldest first is from that same place on through it, which
// has the newest of all first and the oldest after it.
function ordered(kind, alive) {
  const { sortMode } = kind;
  if (sortMode !== SortNewest && sortMode !== SortOldest) return alive;
  const most = Math.max(1, Math.floor(kind.maxAmount));
  const from = kind.$last;
  const after = sortMode === SortNewest ? (one) => (from - one.place + most) % most : (one) => (one.place - from + most) % most;
  return [...alive].sort((a, b) => after(a) - after(b));
}

// The sprites there are of a kind, as the numbers they are drawn from.
function sprites(kind, system) {
  const picture = kind.sprite;
  const map = picture?.$texture?.() ?? null;
  // A picture that is not here yet is waited for.
  if (picture && !map) return null;
  const table = kind.colorTable?.$texture?.() ?? null;
  const alive = kind.$alive();
  if (!alive.length) return null;
  const sequence = map ? kind.spriteSequence : null;
  const seed = system.$seed();
  const size = Number(kind.particleScale) || 0;
  const aside = [Number(kind.offsetX) || 0, Number(kind.offsetY) || 0];
  const order = ordered(kind, alive);
  const rows = new Float32Array(order.length * EACH);
  order.forEach((one, index) => {
    const { datum } = one;
    const at = index * EACH;
    // `offsetX` and `offsetY` move it in the system, by so many times its
    // own size.
    rows[at] = one.x + aside[0] * one.scale;
    rows[at + 1] = one.y + aside[1] * one.scale;
    rows[at + 2] = one.z;
    rows.set(one.turn, at + 3);
    rows[at + 7] = datum.r / 255;
    rows[at + 8] = datum.g / 255;
    rows[at + 9] = datum.b / 255;
    rows[at + 10] = one.a / 255;
    rows[at + 11] = one.scale * size;
    rows[at + 12] = datum.life > 0 ? Math.min(1, Math.max(0, (one.seconds * 1000) / datum.life)) : 0;
    rows[at + 14] = sequence ? frame(sequence, seed, datum, one.seconds) : 0;
  });
  return {
    rows,
    count: order.length,
    map,
    table,
    frames: sequence ? Math.max(1, Math.floor(sequence.frameCount)) : 1,
    blended: Boolean(sequence?.interpolate),
    blend: kind.blendMode,
    mode: kind.billboard ? 1 : 0,
    far: kind.sortMode === SortDistance,
  };
}

const STEP = 0.016;

// The lines there are of a kind: for each particle the points of its way,
// from where it is back to where it was, with how wide the ribbon is and
// how much of it is seen at each.
function lines(kind, system, now) {
  const picture = kind.sprite;
  const map = picture?.$texture?.() ?? null;
  if (picture && !map) return null;
  const table = kind.colorTable?.$texture?.() ?? null;
  const alive = kind.$alive();
  const seed = system.$seed();
  const affecting = system.$affecting(kind);
  const width = Number(kind.particleScale) || 0;
  const most = Math.max(1, Math.floor(kind.segmentCount));
  const apart = Math.max(0, Number(kind.lengthDeltaMin) || 0);
  const { length, lengthVariation, alphaFade, scaleMultiplier, texcoordMode, eolFadeOutDuration } = kind;
  const multiplier = Number(kind.texcoordMultiplier) || 0;
  const found = [];
  const one = (datum, seconds, size, alpha) => {
    // How long it may be at most.
    const limit = length > 0 ? Math.max(0, length + lengthVariation * spread(seed, datum.index, LENGTH)) : Infinity;
    const current = {};
    moved(datum, seconds, affecting, current);
    const points = [[current.x, current.y, current.z]];
    let last = points[0];
    let whole = 0;
    // A particle that goes backwards came the other way.
    const back = datum.reversed ? STEP : -STEP;
    for (let then = seconds + back; points.length <= most && whole < limit; then += back) {
      const first = then <= 0 || then * 1000 >= datum.life;
      moved(datum, first ? (datum.reversed ? datum.life / 1000 : 0) : then, affecting, current);
      const far = Math.hypot(current.x - last[0], current.y - last[1], current.z - last[2]);
      if (far >= apart || (first && far > 0)) {
        let next = [current.x, current.y, current.z];
        // No further than it may be long: the last piece is cut short.
        if (whole + far > limit) {
          const share = (limit - whole) / far;
          next = next.map((value, axis) => last[axis] + (value - last[axis]) * share);
        }
        whole += Math.min(far, limit - whole);
        points.push((last = next));
      }
      if (first) break;
    }
    if (points.length < 2) return;
    found.push({
      datum,
      points,
      whole,
      size,
      color: [datum.r / 255, datum.g / 255, datum.b / 255, alpha],
      through: datum.life > 0 ? Math.min(1, (seconds * 1000) / datum.life) : 0,
      row: table ? random(seed, datum.index, TABLE) : 0,
    });
  };
  for (const each of ordered(kind, alive)) one(each.datum, (each.datum.reversed ? each.datum.life - each.age : each.age) / 1000, each.scale * width, each.a / 255);
  // One whose life is over is still to be seen for a while, going.
  if (eolFadeOutDuration > 0) {
    const time = Math.fround(now / 1000);
    for (const datum of kind.$data) {
      if (!datum || time <= datum.end) continue;
      const over = (time - datum.end) * 1000;
      if (over >= eolFadeOutDuration) continue;
      const scale = datum.reversed ? datum.from : datum.to;
      one(datum, datum.reversed ? 0 : datum.life / 1000, scale * width, (datum.a / 255) * (1 - over / eolFadeOutDuration));
    }
  }
  if (!found.length) return null;
  return {
    lines: found,
    map,
    table,
    blend: kind.blendMode,
    fade: 1 - Math.min(1, Math.max(0, Number(alphaFade) || 0)),
    grow: Number(scaleMultiplier) || 0,
    texcoord: texcoordMode,
    multiplier,
    far: kind.sortMode === SortDistance,
  };
}

// The corners of the ribbons of a kind as the eye sees them: each piece of
// a line two triangles, as wide as the line is there and across both the
// way the line goes and the way the eye looks.
function ribbons(kind, world, view, flat) {
  const all = math.multiply(view, world);
  let total = 0;
  for (const line of kind.lines) total += line.points.length - 1;
  const corners = new Float32Array(total * 6 * CORNER);
  let at = 0;
  const way = kind.far ? away(world, view) : null;
  const far = (line) => way[0] * line.points[0][0] + way[1] * line.points[0][1] + way[2] * line.points[0][2];
  const lines = way ? [...kind.lines].sort((a, b) => far(b) - far(a)) : kind.lines;
  for (const line of lines) {
    const seen = line.points.map((point) => math.point(all, ...point));
    const count = seen.length;
    const sides = [];
    let along = 0;
    let size = line.size;
    let alpha = line.color[3];
    for (let index = 0; index < count; index++) {
      const here = seen[index];
      const before = seen[Math.max(0, index - 1)];
      const after = seen[Math.min(count - 1, index + 1)];
      const way = [after[0] - before[0], after[1] - before[1], after[2] - before[2]];
      // The eye looks down its z, or from where it is at the point.
      const look = flat ? [0, 0, -1] : here;
      let across = [way[1] * look[2] - way[2] * look[1], way[2] * look[0] - way[0] * look[2], way[0] * look[1] - way[1] * look[0]];
      const wide = Math.hypot(...across);
      across = wide > 0 ? across.map((value) => (value / wide) * size * 0.5) : [0, 0, 0];
      if (index > 0) along += Math.hypot(here[0] - seen[index - 1][0], here[1] - seen[index - 1][1], here[2] - seen[index - 1][2]);
      const where = kind.texcoord === Fill ? (index / (count - 1)) * kind.multiplier : kind.texcoord === Relative ? (line.size > 0 ? along / line.size : 0) * kind.multiplier : along * kind.multiplier;
      sides.push({ left: [here[0] + across[0], here[1] + across[1], here[2] + across[2]], right: [here[0] - across[0], here[1] - across[1], here[2] - across[2]], where, alpha });
      size *= kind.grow;
      alpha *= kind.fade;
    }
    const corner = (side, edge) => {
      corners[at] = side.where;
      corners[at + 1] = edge;
      corners.set(edge ? side.left : side.right, at + 2);
      corners[at + 5] = line.color[0];
      corners[at + 6] = line.color[1];
      corners[at + 7] = line.color[2];
      corners[at + 8] = side.alpha;
      corners[at + 9] = 0;
      corners[at + 10] = line.through;
      corners[at + 11] = line.row;
      corners[at + 12] = 0;
      at += CORNER;
    };
    for (let index = 0; index + 1 < count; index++) {
      const a = sides[index];
      const b = sides[index + 1];
      corner(a, 0);
      corner(a, 1);
      corner(b, 0);
      corner(b, 0);
      corner(a, 1);
      corner(b, 1);
    }
  }
  return corners;
}

// The way particles are sorted by how far they are: the way the eye looks,
// as it is in the system. Qt takes that way through the system's matrix as
// if it were a place, so a system that is not where the scene begins sorts
// its particles along a way that is not quite the eye's, and so is it here.
function away(world, view) {
  const way = math.point(math.inverse(world), -view[2], -view[6], -view[10]);
  const long = Math.hypot(...way);
  return long > 0 ? way.map((value) => value / long) : [0, 0, 0];
}

// The rows of a kind's sprites with the farthest that way first.
function farthest(kind, way) {
  const { rows, count } = kind;
  const far = new Float32Array(count);
  for (let index = 0; index < count; index++) {
    const at = index * EACH;
    far[index] = way[0] * rows[at] + way[1] * rows[at + 1] + way[2] * rows[at + 2];
  }
  const order = Array.from(far.keys()).sort((a, b) => far[b] - far[a]);
  const sorted = new Float32Array(rows.length);
  order.forEach((from, to) => sorted.set(rows.subarray(from * EACH, (from + 1) * EACH), to * EACH));
  return sorted;
}

// What a View3D calls to have a system's sprites and lines drawn, with
// what the renderer has: null when there is none of either. Found while
// the view looks at what it is to draw, so that the view draws again when
// any of it is otherwise; the drawing itself asks nothing.
export function painted(system, opacity) {
  const kinds = [];
  let now = null;
  for (const kind of system.$members().particles) {
    if (!kind.$sprite) continue;
    if (kind.$line) now ??= system.$upTo();
    const drawn = kind.$line ? lines(kind, system, now) : sprites(kind, system);
    if (drawn) kinds.push(drawn);
  }
  if (!kinds.length) return null;
  const world = system.$world();
  const paint = ({ gl, view, projection, tonemap, bound }) => {
    const own = tools(gl);
    if (!own) return;
    const { at } = own;
    gl.useProgram(own.program);
    gl.uniformMatrix4fv(at.u_world, false, world);
    gl.uniformMatrix4fv(at.u_view, false, view);
    gl.uniformMatrix4fv(at.u_projection, false, projection);
    gl.uniform1i(at.u_tonemap, tonemap);
    gl.uniform1f(at.u_opacity, opacity);
    gl.uniform1i(at.u_picture, 0);
    gl.uniform1i(at.u_table, 1);
    gl.disable(gl.CULL_FACE);
    for (const kind of kinds) {
      // A colour table is the second picture, the sprite's own the first.
      gl.uniform1i(at.u_tabled, kind.table ? 1 : 0);
      if (kind.table) bound(kind.table);
      const table = kind.table ? gl.getParameter(gl.TEXTURE_BINDING_2D) : own.blank;
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, table);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(at.u_pictured, kind.map ? 1 : 0);
      if (kind.map) bound(kind.map);
      else gl.bindTexture(gl.TEXTURE_2D, own.blank);
      // What is drawn is already times its own alpha, but for what
      // multiplies: that darkens by its colour however much of it there is.
      gl.uniform1i(at.u_straight, kind.blend === Multiply ? 1 : 0);
      if (kind.blend === Screen) gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE);
      else if (kind.blend === Multiply) gl.blendFuncSeparate(gl.DST_COLOR, gl.ZERO, gl.ONE, gl.ONE);
      else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      if (kind.lines) {
        const corners = ribbons(kind, world, view, projection[11] === 0);
        gl.uniform1i(at.u_mode, 2);
        gl.uniform1f(at.u_frames, 1);
        gl.uniform1f(at.u_blend, 0);
        gl.bindVertexArray(own.ribbons);
        gl.bindBuffer(gl.ARRAY_BUFFER, own.corners);
        gl.bufferData(gl.ARRAY_BUFFER, corners, gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, corners.length / CORNER);
      } else {
        gl.uniform1i(at.u_mode, kind.mode);
        gl.uniform1f(at.u_frames, kind.frames);
        gl.uniform1f(at.u_blend, kind.blended ? 1 : 0);
        gl.bindVertexArray(own.squares);
        gl.bindBuffer(gl.ARRAY_BUFFER, own.rows);
        gl.bufferData(gl.ARRAY_BUFFER, kind.far ? farthest(kind, away(world, view)) : kind.rows, gl.DYNAMIC_DRAW);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, kind.count);
      }
    }
  };
  // Where it is, for the view to draw it after what is farther away.
  paint.at = world.slice(12, 15);
  return paint;
}
