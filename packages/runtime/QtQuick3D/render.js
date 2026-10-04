// Draws a scene in space, as a View3D found it, with WebGL.
//
// Every view is drawn by one context, of which a page may have few, and what
// was drawn is handed to the view's own canvas, as a ShaderEffect's is.
//
// What is drawn is lit as Qt lights it: each light's share of a surface's
// colour by how far the surface faces it, the shine of it by Qt's own sums,
// and the whole brought from linear light to the screen's by Qt's tone
// mapping. What nothing is seen through is drawn first, nearest first; what
// something is, after, farthest first.
import * as math from "./math.js";
import { Triangles } from "./mesh.js";

// As many lights as Qt lets a surface have.
const LIGHTS = 15;

const VERTEX = `#version 300 es
layout(location = 0) in vec3 attr_pos;
layout(location = 1) in vec3 attr_norm;
layout(location = 2) in vec2 attr_uv0;
layout(location = 3) in vec4 attr_color;
uniform mat4 u_all;
uniform mat4 u_world;
uniform mat3 u_facing;
uniform mat3 u_picture;
uniform float u_point;
out vec3 v_position;
out vec3 v_normal;
out vec2 v_uv;
out vec4 v_color;
void main() {
    v_position = (u_world * vec4(attr_pos, 1.0)).xyz;
    v_normal = u_facing * attr_norm;
    v_uv = (u_picture * vec3(attr_uv0, 1.0)).xy;
    v_color = attr_color;
    gl_Position = u_all * vec4(attr_pos, 1.0);
    gl_PointSize = u_point;
}
`;

const FRAGMENT = `#version 300 es
precision highp float;
const int LIGHTS = ${LIGHTS};
const float PI = 3.14159265359;
in vec3 v_position;
in vec3 v_normal;
in vec2 v_uv;
in vec4 v_color;
uniform vec4 u_color;
uniform float u_opacity;
uniform vec3 u_emissive;
uniform bool u_lit;
uniform bool u_mapped;
uniform bool u_colors;
uniform bool u_sided;
uniform bool u_principled;
uniform bool u_solid;
uniform float u_cutoff;
uniform sampler2D u_map;
uniform float u_specular;
uniform float u_shine;
uniform float u_roughness;
uniform float u_metalness;
uniform float u_ior;
uniform float u_fresnel;
uniform vec3 u_eye;
uniform vec3 u_ambient;
uniform int u_count;
uniform vec3 u_lightColor[LIGHTS];
uniform vec4 u_lightPlace[LIGHTS];
uniform vec3 u_lightWay[LIGHTS];
uniform vec3 u_lightFade[LIGHTS];
uniform vec2 u_lightCone[LIGHTS];
uniform int u_tonemap;
out vec4 fragColor;

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
        c = max(vec3(0.0), c - vec3(0.004));
        return (c * (6.2 * c + 0.5)) / (c * (6.2 * c + 1.7) + 0.06);
    }
    if (u_tonemap == 4) return toScreen(filmic(c * 2.0) / filmic(vec3(11.2)));
    return c;
}

float schlick(float value) {
    float n = 1.0 - value;
    float n2 = n * n;
    return n2 * n2 * n;
}

float ggx2cos(float cosine, float alpha) {
    float k = 0.5 * alpha;
    return 0.5 / (cosine * (1.0 - k) + k);
}

// How much of a light a rough surface gives back all round.
float burley(vec3 N, vec3 L, vec3 V, float roughness) {
    vec3 H = normalize(V + L);
    float LdotH = max(0.0, dot(L, H));
    float NdotV = max(0.0, dot(N, V));
    float NdotL = max(0.0, dot(N, L));
    float at90 = 0.5 + 2.0 * LdotH * LdotH * roughness;
    return mix(1.0, at90, schlick(NdotL)) * mix(1.0, at90, schlick(NdotV)) * NdotL;
}

// And how much it gives back as the light's own shine.
vec3 ggx(vec3 N, vec3 L, vec3 V, vec3 f0, float roughness) {
    float NdotL = max(0.0, dot(N, L));
    float NdotV = max(0.0, dot(N, V));
    vec3 H = normalize(V + L);
    float LdotH = max(0.0, dot(L, H));
    float NdotH = max(0.001, dot(N, H));
    float alpha = clamp(roughness * roughness, 0.001, 1.0);
    float alpha2 = alpha * alpha;
    float d = 1.0 + (alpha2 - 1.0) * NdotH * NdotH;
    float spread = alpha2 / (PI * d * d);
    float seen = ggx2cos(NdotL, alpha) * ggx2cos(NdotV, alpha);
    vec3 F = mix(vec3(schlick(LdotH)), vec3(1.0), f0);
    return NdotL * spread * F * seen;
}

void main() {
    vec4 base = u_color;
    if (u_colors) base *= v_color;
    if (u_mapped) {
        vec4 picture = texture(u_map, v_uv);
        base *= vec4(toLinear(picture.rgb), picture.a);
    }
    float alpha = base.a * u_opacity;
    if (u_cutoff >= 0.0) {
        if (alpha < u_cutoff) discard;
        alpha = 1.0;
    }
    if (u_solid) alpha = 1.0;
    vec3 sum = base.rgb;
    if (u_lit) {
        vec3 N = normalize(v_normal);
        if (u_sided && !gl_FrontFacing) N = -N;
        vec3 V = normalize(u_eye - v_position);
        vec3 diffuse = u_ambient * (1.0 - u_metalness) * base.rgb;
        vec3 shine = vec3(0.0);
        float plain = ((u_ior - 1.0) * (u_ior - 1.0)) / ((u_ior + 1.0) * (u_ior + 1.0));
        vec3 f0 = vec3(plain) * (1.0 - u_metalness) + base.rgb * u_metalness;
        float NdotV = clamp(dot(N, V), 0.0, 1.0);
        float edge = u_fresnel == 0.0 ? 1.0 : pow(1.0 - NdotV, u_fresnel);
        vec3 amount = u_specular * (f0 + (max(vec3(1.0 - u_roughness), f0) - f0) * edge);
        for (int index = 0; index < u_count; index++) {
            vec3 L = -u_lightWay[index];
            float fade = 1.0;
            float kind = u_lightPlace[index].w;
            if (kind > 0.5) {
                vec3 to = u_lightPlace[index].xyz - v_position;
                float far = max(length(to), 0.000001);
                L = to / far;
                vec3 by = u_lightFade[index];
                fade = 1.0 / (by.x + by.y * far + by.z * far * far);
                if (kind > 1.5) {
                    vec2 cone = u_lightCone[index];
                    fade *= smoothstep(cone.x, max(cone.y, cone.x + 0.0001), dot(-L, u_lightWay[index]));
                }
            }
            vec3 light = u_lightColor[index] * fade;
            if (u_principled) {
                diffuse += base.rgb * light * burley(N, L, V, u_roughness);
                shine += light * ggx(N, L, V, f0, u_roughness);
            } else {
                diffuse += base.rgb * light * max(0.0, dot(N, L));
                if (u_specular > 0.0) shine += light * amount * pow(max(0.0, dot(normalize(V + L), N)), u_shine);
            }
        }
        if (u_principled) diffuse *= 1.0 - u_metalness;
        sum = diffuse + shine + u_emissive;
    }
    fragColor = vec4(tonemap(sum) * alpha, alpha);
}
`;

const UNIFORMS = [
  "u_all",
  "u_world",
  "u_facing",
  "u_picture",
  "u_point",
  "u_color",
  "u_opacity",
  "u_emissive",
  "u_lit",
  "u_mapped",
  "u_colors",
  "u_sided",
  "u_principled",
  "u_solid",
  "u_cutoff",
  "u_map",
  "u_specular",
  "u_shine",
  "u_roughness",
  "u_metalness",
  "u_ior",
  "u_fresnel",
  "u_eye",
  "u_ambient",
  "u_count",
  "u_lightColor",
  "u_lightPlace",
  "u_lightWay",
  "u_lightFade",
  "u_lightCone",
  "u_tonemap",
];

let surface;
let gl;
let at;

// The context, and the one program everything is drawn with. Null when the
// browser has none to give.
function context() {
  if (gl !== undefined) return gl;
  surface = new OffscreenCanvas(1, 1);
  gl = surface.getContext("webgl2", { antialias: false, depth: true }) ?? null;
  if (!gl) return gl;
  const program = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, VERTEX],
    [gl.FRAGMENT_SHADER, FRAGMENT],
  ]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.warn(`View3D: ${gl.getShaderInfoLog(shader)}`);
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(`View3D: ${gl.getProgramInfoLog(program)}`);
    return (gl = null);
  }
  gl.useProgram(program);
  at = {};
  for (const name of UNIFORMS) at[name] = gl.getUniformLocation(program, name);
  gl.uniform1i(at.u_map, 0);
  // A picture's first row is its bottom one to a mesh, as it is to Qt.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  // What a mesh says nothing of: it faces the eye, and is white.
  gl.vertexAttrib3f(1, 0, 0, 1);
  gl.vertexAttrib2f(2, 0, 0);
  gl.vertexAttrib4f(3, 1, 1, 1, 1);
  return gl;
}

// What a number of a mesh is to OpenGL, by Qt's number for its kind.
const KINDS = { 1: 0x1401, 2: 0x1400, 3: 0x1403, 4: 0x1402, 5: 0x1405, 6: 0x1404, 9: 0x140b, 10: 0x1406 };
const MODES = { 1: 0, 2: 3, 3: 2, 4: 1, 5: 5, 6: 6, [Triangles]: 4 };
const ATTRIBUTES = ["attr_pos", "attr_norm", "attr_uv0", "attr_color"];

// A shape as OpenGL holds it: its corners as the mesh file has them, each
// part of a corner said where it is in the row.
const shapes = new WeakMap();
function held(shape) {
  let made = shapes.get(shape);
  if (made) return made;
  const array = gl.createVertexArray();
  gl.bindVertexArray(array);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, shape.vertices, gl.STATIC_DRAW);
  ATTRIBUTES.forEach((name, location) => {
    const entry = shape.entries[name];
    if (!entry || !KINDS[entry.type]) return;
    gl.enableVertexAttribArray(location);
    // A colour kept as whole numbers is out of 255.
    gl.vertexAttribPointer(location, Math.min(4, entry.count), KINDS[entry.type], entry.type < 9, shape.stride, entry.offset);
  });
  let kind = 0;
  let size = 0;
  if (shape.indices) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, shape.indices, gl.STATIC_DRAW);
    size = shape.indices.BYTES_PER_ELEMENT;
    kind = size === 4 ? gl.UNSIGNED_INT : size === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_BYTE;
  }
  gl.bindVertexArray(null);
  shapes.set(shape, (made = { array, kind, size, mode: MODES[shape.drawMode] ?? gl.TRIANGLES, colors: Boolean(shape.entries.attr_color) }));
  return made;
}

const WRAPS = { 1: 0x812f, 2: 0x8370, 3: 0x2901 };

// A picture as a texture, sampled as its Texture says.
const textures = new WeakMap();
function bound(map) {
  const { element } = map;
  let made = textures.get(element);
  const fresh = !made;
  if (fresh) textures.set(element, (made = { texture: gl.createTexture(), mipped: false }));
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, made.texture);
  if (fresh || map.live) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, element);
    made.mipped = false;
  }
  if (map.mip && !made.mipped) {
    gl.generateMipmap(gl.TEXTURE_2D);
    made.mipped = true;
  }
  const near = map.min === 1;
  const smaller = map.mip === 0 ? (near ? gl.NEAREST : gl.LINEAR) : map.mip === 1 ? (near ? gl.NEAREST_MIPMAP_NEAREST : gl.LINEAR_MIPMAP_NEAREST) : near ? gl.NEAREST_MIPMAP_LINEAR : gl.LINEAR_MIPMAP_LINEAR;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, smaller);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, map.mag === 1 ? gl.NEAREST : gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, WRAPS[map.horizontal] ?? gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, WRAPS[map.vertical] ?? gl.REPEAT);
}

// Where edges are to be smooth, everything is drawn several times to the
// pixel into this, and from it to the surface.
let smooth = null;
function smoothed(width, height, samples) {
  samples = Math.min(samples, gl.getParameter(gl.MAX_SAMPLES));
  if (samples < 2) return null;
  smooth ??= { frame: gl.createFramebuffer(), color: gl.createRenderbuffer(), depth: gl.createRenderbuffer() };
  if (smooth.width !== width || smooth.height !== height || smooth.samples !== samples) {
    Object.assign(smooth, { width, height, samples });
    gl.bindRenderbuffer(gl.RENDERBUFFER, smooth.color);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, width, height);
    gl.bindRenderbuffer(gl.RENDERBUFFER, smooth.depth);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, smooth.frame);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, smooth.color);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, smooth.depth);
  }
  return smooth.frame;
}

const PICTURE = [1, 0, 0, 0, 1, 0, 0, 0, 1];

// One part of a shape, with the material it is drawn with.
function part(piece) {
  const { shape, subset, world, material, opacity } = piece;
  const made = held(shape);
  gl.bindVertexArray(made.array);
  gl.uniformMatrix4fv(at.u_all, false, piece.all);
  gl.uniformMatrix4fv(at.u_world, false, world);
  gl.uniformMatrix3fv(at.u_facing, false, math.normal(world));
  gl.uniform1f(at.u_point, material.point);
  gl.uniform4fv(at.u_color, material.color);
  gl.uniform1f(at.u_opacity, opacity * material.opacity);
  gl.uniform3fv(at.u_emissive, material.emissive);
  gl.uniform1i(at.u_lit, material.lit ? 1 : 0);
  gl.uniform1i(at.u_colors, material.colors && made.colors ? 1 : 0);
  gl.uniform1i(at.u_principled, material.principled ? 1 : 0);
  gl.uniform1i(at.u_solid, material.solid ? 1 : 0);
  gl.uniform1f(at.u_cutoff, material.cutoff);
  gl.uniform1f(at.u_specular, material.specular);
  gl.uniform1f(at.u_shine, material.shine ?? 1);
  gl.uniform1f(at.u_roughness, material.roughness ?? 0);
  gl.uniform1f(at.u_metalness, material.metalness);
  gl.uniform1f(at.u_ior, material.ior);
  gl.uniform1f(at.u_fresnel, material.fresnel);
  const { map } = material;
  gl.uniform1i(at.u_mapped, map ? 1 : 0);
  if (map) {
    bound(map);
    const m = map.transform;
    gl.uniformMatrix3fv(at.u_picture, false, [m[0], m[1], 0, m[4], m[5], 0, m[12], m[13], 1]);
  } else gl.uniformMatrix3fv(at.u_picture, false, PICTURE);
  // Which side of a triangle is its front is the other one in a mirror.
  const anticlockwise = (shape.winding !== 1) !== math.mirrors(world);
  gl.frontFace(anticlockwise ? gl.CCW : gl.CW);
  gl.uniform1i(at.u_sided, material.cull === 3 ? 1 : 0);
  if (material.cull === 3) gl.disable(gl.CULL_FACE);
  else {
    gl.enable(gl.CULL_FACE);
    gl.cullFace(material.cull === 2 ? gl.FRONT : gl.BACK);
  }
  if (made.kind) gl.drawElements(made.mode, subset.count, made.kind, subset.offset * made.size);
  else gl.drawArrays(made.mode, subset.offset, subset.count);
}

// Whether something is seen through what a material draws.
const sheer = (material, opacity) =>
  !material.solid && (material.blended || material.blend !== 0 || opacity * material.opacity < 1 || material.color[3] < 1 || Boolean(material.map?.sheer));

// Draws `scene` (`{ width, height, environment, projection, camera, models,
// lights }`) and hands the picture to `paper`, the context of `canvas`.
export function draw(scene, canvas, paper) {
  const ratio = window.devicePixelRatio || 1;
  const width = Math.round(scene.width * ratio);
  const height = Math.round(scene.height * ratio);
  if (width <= 0 || height <= 0 || !context()) {
    canvas.width = canvas.height = 0;
    return;
  }
  if (surface.width !== width) surface.width = width;
  if (surface.height !== height) surface.height = height;
  const { environment } = scene;
  const frame = smoothed(width, height, environment.samples);
  gl.bindFramebuffer(gl.FRAMEBUFFER, frame);
  gl.viewport(0, 0, width, height);
  gl.depthMask(true);
  gl.clearColor(...environment.clear);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (scene.camera) {
    // The eye sees from where the camera is and the way it is turned,
    // however big it is.
    const eye = math.unscaled(scene.camera);
    const view = math.inverse(eye) ?? math.IDENTITY;
    const seen = math.multiply(scene.projection, view);
    const lights = scene.lights.slice(0, LIGHTS);
    const ambient = [0, 0, 0];
    for (const light of scene.lights) for (let index = 0; index < 3; index++) ambient[index] += light.ambient[index];
    gl.uniform3fv(at.u_eye, eye.slice(12, 15));
    gl.uniform3fv(at.u_ambient, ambient);
    gl.uniform1i(at.u_tonemap, environment.tonemap);
    gl.uniform1i(at.u_count, lights.length);
    if (lights.length) {
      gl.uniform3fv(at.u_lightColor, lights.flatMap((light) => light.color));
      gl.uniform4fv(at.u_lightPlace, lights.flatMap((light) => [...light.position, light.kind]));
      gl.uniform3fv(at.u_lightWay, lights.flatMap((light) => light.direction));
      gl.uniform3fv(at.u_lightFade, lights.flatMap((light) => light.fade));
      gl.uniform2fv(at.u_lightCone, lights.flatMap((light) => [light.cone, light.inner]));
    }

    // Each part of each shape with a material is a thing to draw. A shape
    // with fewer materials than parts has the last for the rest; one with
    // none is not drawn.
    const solid = [];
    const clear = [];
    for (const model of scene.models) {
      const { shape, world, materials, opacity } = model;
      const all = math.multiply(seen, world);
      shape.subsets.forEach((subset, index) => {
        const material = materials[Math.min(index, materials.length - 1)];
        if (!material || material.waiting) return;
        const middle = math.point(world, ...subset.min.map((least, axis) => (least + subset.max[axis]) / 2));
        // How far in front of the eye it is: the eye looks down its own z.
        const distance = -math.point(view, ...middle)[2];
        (sheer(material, opacity) ? clear : solid).push({ shape, subset, world, all, material, opacity, distance });
      });
    }
    solid.sort((a, b) => a.distance - b.distance);
    clear.sort((a, b) => b.distance - a.distance);

    if (environment.depth) gl.enable(gl.DEPTH_TEST);
    else gl.disable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.BLEND);
    for (const piece of solid) part(piece);
    gl.enable(gl.BLEND);
    gl.depthMask(false);
    for (const piece of clear) {
      // What is drawn is already times its own alpha.
      const { blend } = piece.material;
      if (blend === 1) gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE);
      else if (blend === 2) gl.blendFuncSeparate(gl.DST_COLOR, gl.ZERO, gl.ONE, gl.ONE);
      else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      part(piece);
    }
    // What nodes draw by themselves (`paints`), each with a program of its
    // own: over the rest, hidden by what is nearer and hiding nothing.
    if (scene.paints?.length) {
      const own = gl.getParameter(gl.CURRENT_PROGRAM);
      for (const paint of scene.paints) paint({ gl, view, seen, projection: scene.projection, tonemap: environment.tonemap, bound });
      gl.useProgram(own);
    }
    gl.depthMask(true);
    gl.bindVertexArray(null);
  }

  if (frame) {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, frame);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  // The picture leaves the surface for the canvas: nothing is copied.
  paper.transferFromImageBitmap(surface.transferToImageBitmap());
}
