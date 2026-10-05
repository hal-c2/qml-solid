// Particles that give more light than they cover.
//
// Qt's shader multiplies the picture by the particle's colour, alpha and
// all, and what comes of it is taken as premultiplied: `picture × colour` is
// added to what is behind, of which `1 − picture × alpha` is kept. A colour
// brighter than its alpha, which is most of them (`color: "yellow"; alpha:
// 0.1`), so lights up what is behind far more than it covers it, and a
// hundred of them on one spot are a pale yellow, not a wall of it.
//
// A 2D canvas cannot be told to draw so. WebGL can, and a 2D canvas keeps
// what it is given of one, brighter than its alpha or not. So such particles
// are drawn here, on one surface for every painter, and copied from it to
// the painter's own canvas.

// A particle is where its middle is, the two sides of its square, and its
// colour, all in the canvas' pixels and Qt's premultiplied numbers.
const FLOATS = 10;

const VERTEX = `#version 300 es
layout(location = 0) in vec2 corner;
layout(location = 1) in vec2 middle;
layout(location = 2) in vec4 sides;
layout(location = 3) in vec4 colour;
uniform vec2 extent;
out vec2 at;
out vec4 tint;
void main() {
  vec2 pixel = middle + sides.xy * (corner.x - 0.5) + sides.zw * (corner.y - 0.5);
  gl_Position = vec4(pixel.x / extent.x * 2.0 - 1.0, 1.0 - pixel.y / extent.y * 2.0, 0.0, 1.0);
  at = corner;
  tint = colour;
}`;

const FRAGMENT = `#version 300 es
precision mediump float;
uniform sampler2D picture;
in vec2 at;
in vec4 tint;
out vec4 lit;
void main() {
  lit = texture(picture, at) * tint;
}`;

let surface = null;
let gl = null;
let failed = false;
let extent = null;
let particles = null;
let pending = new Float32Array(FLOATS * 256);
let count = 0;
// The texture of each picture, or nothing for one that may not be read.
const textures = new WeakMap();

function shader(kind, source) {
  const made = gl.createShader(kind);
  gl.shaderSource(made, source);
  gl.compileShader(made);
  return made;
}

function start() {
  if (gl || failed) return gl;
  try {
    surface = typeof OffscreenCanvas === "function" ? new OffscreenCanvas(1, 1) : document.createElement("canvas");
    gl = surface.getContext("webgl2", { antialias: false, depth: false, stencil: false });
  } catch {
    gl = null;
  }
  if (!gl) {
    failed = true;
    return null;
  }
  // A context that is lost is not asked for again: the painters draw as
  // well as a 2D canvas lets them.
  surface.addEventListener("webglcontextlost", () => {
    gl = null;
    failed = true;
  });
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl = null;
    failed = true;
    return null;
  }
  gl.useProgram(program);
  extent = gl.getUniformLocation(program, "extent");
  gl.uniform1i(gl.getUniformLocation(program, "picture"), 0);
  gl.bindVertexArray(gl.createVertexArray());
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  particles = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, particles);
  for (const [place, size, offset] of [[1, 2, 0], [2, 4, 2], [3, 4, 6]]) {
    gl.enableVertexAttribArray(place);
    gl.vertexAttribPointer(place, size, gl.FLOAT, false, FLOATS * 4, offset * 4);
    gl.vertexAttribDivisor(place, 1);
  }
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.SCISSOR_TEST);
  gl.clearColor(0, 0, 0, 0);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.activeTexture(gl.TEXTURE0);
  return gl;
}

function pictured(image) {
  let texture = textures.get(image);
  if (texture !== undefined) return texture;
  texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  try {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  } catch {
    // A picture from elsewhere, which a page may show but not look into.
    gl.deleteTexture(texture);
    texture = null;
  }
  textures.set(image, texture);
  return texture;
}

// Whether the particles of this picture can be drawn here.
export function lights(image) {
  return Boolean(start() && pictured(image));
}

// A particle of the frame being drawn: its middle, the sides of its square
// as two vectors, and its colour as Qt's shader has it.
export function lit(x, y, ax, ay, bx, by, red, green, blue, alpha) {
  if ((count + 1) * FLOATS > pending.length) {
    const more = new Float32Array(pending.length * 2);
    more.set(pending);
    pending = more;
  }
  const at = count++ * FLOATS;
  pending[at] = x;
  pending[at + 1] = y;
  pending[at + 2] = ax;
  pending[at + 3] = ay;
  pending[at + 4] = bx;
  pending[at + 5] = by;
  pending[at + 6] = red;
  pending[at + 7] = green;
  pending[at + 8] = blue;
  pending[at + 9] = alpha;
}

// Draws the particles given since the last time, and copies them to a
// canvas of `width` by `height` pixels that has nothing on it.
export function shine(context, image, width, height) {
  const drawn = count;
  count = 0;
  if (!drawn || !gl) return;
  // The surface only grows: a painter draws in the corner it needs.
  if (surface.width < width) surface.width = width;
  if (surface.height < height) surface.height = height;
  gl.viewport(0, 0, width, height);
  gl.scissor(0, 0, width, height);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform2f(extent, width, height);
  gl.bindTexture(gl.TEXTURE_2D, pictured(image));
  gl.bindBuffer(gl.ARRAY_BUFFER, particles);
  gl.bufferData(gl.ARRAY_BUFFER, pending.subarray(0, drawn * FLOATS), gl.DYNAMIC_DRAW);
  gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, drawn);
  // WebGL's first row is its lowest.
  context.drawImage(surface, 0, surface.height - height, width, height, 0, 0, width, height);
}
