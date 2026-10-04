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
layout(location = 4) in vec4 attr_joints;
layout(location = 5) in vec4 attr_weights;
layout(location = 6) in vec2 attr_uv1;
layout(location = 7) in vec3 attr_textan;
layout(location = 8) in vec3 attr_binormal;
uniform mat4 u_all;
uniform mat4 u_world;
uniform mat3 u_facing;
uniform float u_point;
uniform bool u_skinned;
uniform highp sampler2D u_bones;
out vec3 v_position;
out vec3 v_normal;
out vec2 v_uv;
out vec2 v_uv1;
out vec3 v_tangent;
out vec3 v_binormal;
out vec4 v_color;

// One of the matrices of the joints: the one that moves a corner at an even
// place, the one that turns the way it faces at the odd one after it.
mat4 bone(int index) {
    int width = textureSize(u_bones, 0).x;
    int at = index * 4;
    mat4 m;
    for (int column = 0; column < 4; column++) {
        int x = (at + column) % width;
        m[column] = texelFetch(u_bones, ivec2(x, (at + column - x) / width), 0);
    }
    return m;
}

void main() {
    vec4 position = vec4(attr_pos, 1.0);
    vec3 facing = attr_norm;
    vec3 tangent = attr_textan;
    vec3 binormal = attr_binormal;
    // A corner no joint has a hold of stays where the mesh has it.
    if (u_skinned && attr_weights != vec4(0.0)) {
        ivec4 joints = ivec4(attr_joints);
        vec4 w = attr_weights;
        mat4 moved = bone(joints.x * 2) * w.x + bone(joints.y * 2) * w.y + bone(joints.z * 2) * w.z + bone(joints.w * 2) * w.w;
        position = moved * position;
        facing = (mat3(bone(joints.x * 2 + 1)) * w.x + mat3(bone(joints.y * 2 + 1)) * w.y + mat3(bone(joints.z * 2 + 1)) * w.z + mat3(bone(joints.w * 2 + 1)) * w.w) * facing;
        tangent = mat3(moved) * tangent;
        binormal = mat3(moved) * binormal;
    }
    v_position = (u_world * position).xyz;
    // The way a corner faces is made one long here, before it is spread
    // over the triangle, as Qt makes it.
    v_normal = normalize(u_facing * facing);
    v_tangent = mat3(u_world) * tangent;
    v_binormal = mat3(u_world) * binormal;
    v_uv = attr_uv0;
    v_uv1 = attr_uv1;
    v_color = attr_color;
    gl_Position = u_all * position;
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
in vec2 v_uv1;
in vec3 v_tangent;
in vec3 v_binormal;
in vec4 v_color;
uniform vec4 u_color;
uniform float u_opacity;
uniform vec3 u_emissive;
uniform bool u_lit;
uniform bool u_framed;
uniform bool u_inverted;
uniform float u_bump;
uniform float u_occlusion;
uniform bool u_colors;
uniform bool u_sided;
uniform bool u_principled;
uniform bool u_solid;
uniform float u_cutoff;
// The pictures a material reads: its colour's, the way it faces, how rough
// and how much a metal it is, how much of the light reaches it, what it
// gives off, how much of it is there, and how much of a clear coat is over
// it and how rough that is. Of each: whether there is one,
// which channel of it is read and which of a corner's two places in a
// picture it is read at, and how that place is moved.
const int BASE = 0;
const int NORMAL = 1;
const int ROUGHNESS = 2;
const int METALNESS = 3;
const int OCCLUSION = 4;
const int EMISSIVE = 5;
const int OPACITY = 6;
const int BUMP = 7;
const int COAT = 8;
const int COAT_ROUGHNESS = 9;
const int COAT_NORMAL = 10;
const int MAPS = 11;
uniform sampler2D u_map;
uniform sampler2D u_normalMap;
uniform sampler2D u_roughnessMap;
uniform sampler2D u_metalnessMap;
uniform sampler2D u_occlusionMap;
uniform sampler2D u_emissiveMap;
uniform sampler2D u_opacityMap;
uniform sampler2D u_coatMap;
uniform sampler2D u_coatRoughnessMap;
uniform sampler2D u_coatNormalMap;
uniform float u_coat;
uniform float u_coatRoughness;
// How far a picture turns the coat, and how what the coat gives back grows
// as it is turned from the eye: the power of it, and a scale and a bias.
uniform float u_coatBump;
uniform vec3 u_coatEdge;
uniform vec3 u_tint;
uniform bool u_shiny;
uniform vec3 u_reads[MAPS];
uniform mat3 u_places[MAPS];
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

bool has(int which) {
    return u_reads[which].x > 0.5;
}

vec2 placed(int which) {
    return (u_places[which] * vec3(u_reads[which].z > 0.5 ? v_uv1 : v_uv, 1.0)).xy;
}

float channel(sampler2D map, int which) {
    return texture(map, placed(which))[int(u_reads[which].y)];
}

float average(vec4 read) {
    return (read.r + read.g + read.b) / 3.0;
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
    if (has(BASE)) {
        vec4 picture = texture(u_map, placed(BASE));
        base *= vec4(toLinear(picture.rgb), picture.a);
    }
    // How much of the colour is there is all of it where the material says
    // nothing is seen through it; how much of the material is, is its own.
    if (u_cutoff >= 0.0 && base.a < u_cutoff) discard;
    if (u_solid) base.a = 1.0;
    float alpha = base.a * u_opacity;
    if (has(OPACITY)) {
        float there = channel(u_opacityMap, OPACITY);
        alpha *= u_inverted ? 1.0 - there : there;
    }
    vec3 sum = base.rgb;
    if (u_lit) {
        vec3 N = normalize(v_normal);
        float side = u_sided && !gl_FrontFacing ? -1.0 : 1.0;
        // The frame a way of facing read from a picture is in: the mesh's
        // own, or where it has none, the way the first of the pictures
        // lies across the surface.
        int turned = has(BUMP) ? BUMP : has(NORMAL) ? NORMAL : has(COAT_NORMAL) ? COAT_NORMAL : -1;
        vec3 T = vec3(0.0);
        vec3 B = vec3(0.0);
        if (turned >= 0) {
            if (u_framed) {
                T = normalize(v_tangent);
                B = normalize(v_binormal);
            } else {
                vec2 at = placed(turned);
                vec2 across = dFdx(at);
                vec2 down = dFdy(at);
                T = (down.y * dFdx(v_position) - across.y * dFdy(v_position)) / (across.x * down.y - across.y * down.x);
                T = normalize(T - dot(N, T) * N);
                B = cross(N, T);
            }
            T *= side;
            B *= side;
        }
        N *= side;
        // A clear coat faces as the shape does, or as its own picture says,
        // whatever a picture says of what is under it.
        vec3 coated = N;
        if (has(COAT_NORMAL)) {
            vec3 way = texture(u_coatNormalMap, placed(COAT_NORMAL)).xyz * 2.0 - vec3(1.0);
            coated = normalize(mat3(T, B, N) * (way * vec3(u_coatBump, u_coatBump, 1.0)));
        }
        if (has(BUMP)) {
            // A picture of heights: how it rises to the right and upward
            // is how far the surface leans from them.
            vec2 at = placed(BUMP);
            vec2 unit = 1.0 / vec2(textureSize(u_normalMap, 0));
            float here = average(texture(u_normalMap, at));
            float du = average(texture(u_normalMap, vec2(at.x + unit.x, at.y))) - here;
            float dv = average(texture(u_normalMap, vec2(at.x, at.y + unit.y))) - here;
            vec3 n = normalize(vec3(-u_bump * du, -u_bump * dv, 1.0));
            N = normalize(N + n.x * T + n.y * B + n.z * N);
        } else if (has(NORMAL)) {
            vec3 way = texture(u_normalMap, placed(NORMAL)).xyz * 2.0 - vec3(1.0);
            N = normalize(mat3(T, B, N) * (way * vec3(u_bump, u_bump, 1.0)));
        }
        float roughness = u_roughness;
        if (has(ROUGHNESS)) roughness *= channel(u_roughnessMap, ROUGHNESS);
        float metalness = u_metalness;
        if (has(METALNESS)) metalness = clamp(metalness * channel(u_metalnessMap, METALNESS), 0.0, 1.0);
        float reached = 1.0;
        if (has(OCCLUSION)) reached = channel(u_occlusionMap, OCCLUSION) * u_occlusion;
        vec3 given = u_emissive;
        if (has(EMISSIVE)) given *= toLinear(texture(u_emissiveMap, placed(EMISSIVE)).rgb);
        float coat = u_coat;
        if (has(COAT)) coat *= channel(u_coatMap, COAT);
        float coatRoughness = u_coatRoughness;
        if (has(COAT_ROUGHNESS)) coatRoughness = clamp(coatRoughness * channel(u_coatRoughnessMap, COAT_ROUGHNESS), 0.0, 1.0);
        vec3 coating = vec3(0.0);
        vec3 V = normalize(u_eye - v_position);
        vec3 diffuse = u_ambient * (1.0 - metalness) * base.rgb;
        vec3 shine = vec3(0.0);
        float plain = ((u_ior - 1.0) * (u_ior - 1.0)) / ((u_ior + 1.0) * (u_ior + 1.0));
        vec3 f0 = vec3(plain) * (1.0 - metalness) + base.rgb * metalness;
        bool coats = u_principled && u_coat > 0.0;
        // What a surface that is no metal gives back of a light can take
        // the surface's own colour.
        vec3 tint = mix(vec3(1.0), u_tint, 1.0 - metalness);
        float NdotV = clamp(dot(N, V), 0.0, 1.0);
        float edge = u_fresnel == 0.0 ? 1.0 : pow(1.0 - NdotV, u_fresnel);
        vec3 amount = u_specular * (f0 + (max(vec3(1.0 - roughness), f0) - f0) * edge);
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
                // Qt takes what is metal out of the light here, and out of
                // the sum of them once more below.
                diffuse += base.rgb * light * (1.0 - metalness) * burley(N, L, V, roughness);
                if (u_shiny) {
                    shine += light * tint * ggx(N, L, V, f0, roughness);
                    if (coats) coating += light * ggx(coated, L, V, vec3(plain), coatRoughness);
                }
            } else {
                diffuse += base.rgb * light * max(0.0, dot(N, L));
                if (u_specular > 0.0) shine += light * amount * pow(max(0.0, dot(normalize(V + L), N)), u_shine);
            }
        }
        // What a light gives a surface all round is less where less of the
        // light reaches it.
        diffuse *= reached;
        if (u_principled) diffuse *= 1.0 - metalness;
        sum = diffuse + shine + given;
        // What is under a clear coat shows less the more the coat itself
        // gives back, which is more the further it is turned from the eye.
        if (coats) {
            float turn = clamp(pow(clamp(dot(coated, V), 0.0, 1.0), u_coatEdge.x), 0.0, 1.0);
            vec3 back = vec3(plain) + (vec3(1.0) - vec3(plain)) * (1.0 - turn);
            back = clamp(vec3(u_coatEdge.z) + u_coatEdge.y * back, 0.0, 1.0);
            sum = sum * (1.0 - coat * back) + coating * coat;
        }
    }
    fragColor = vec4(tonemap(sum) * alpha, alpha);
}
`;

const UNIFORMS = [
  "u_all",
  "u_world",
  "u_facing",
  "u_point",
  "u_skinned",
  "u_bones",
  "u_color",
  "u_opacity",
  "u_emissive",
  "u_lit",
  "u_framed",
  "u_inverted",
  "u_bump",
  "u_occlusion",
  "u_normalMap",
  "u_roughnessMap",
  "u_metalnessMap",
  "u_occlusionMap",
  "u_emissiveMap",
  "u_opacityMap",
  "u_coatMap",
  "u_coatRoughnessMap",
  "u_coatNormalMap",
  "u_coat",
  "u_coatRoughness",
  "u_coatBump",
  "u_coatEdge",
  "u_tint",
  "u_shiny",
  "u_reads",
  "u_places",
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
  gl.uniform1i(at.u_bones, 1);
  SAMPLERS.forEach((name, index) => name && gl.uniform1i(at[name], UNITS[index]));
  // A picture's first row is its bottom one to a mesh, as it is to Qt.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  // What a mesh says nothing of: it faces the eye, and is white.
  gl.vertexAttrib3f(1, 0, 0, 1);
  gl.vertexAttrib2f(2, 0, 0);
  gl.vertexAttrib4f(3, 1, 1, 1, 1);
  gl.vertexAttrib4f(4, 0, 0, 0, 0);
  gl.vertexAttrib4f(5, 0, 0, 0, 0);
  gl.vertexAttrib2f(6, 0, 0);
  gl.vertexAttrib3f(7, 1, 0, 0);
  gl.vertexAttrib3f(8, 0, 1, 0);
  return gl;
}

// What a number of a mesh is to OpenGL, by Qt's number for its kind.
const KINDS = { 1: 0x1401, 2: 0x1400, 3: 0x1403, 4: 0x1402, 5: 0x1405, 6: 0x1404, 9: 0x140b, 10: 0x1406 };
const MODES = { 1: 0, 2: 3, 3: 2, 4: 1, 5: 5, 6: 6, [Triangles]: 4 };
const ATTRIBUTES = ["attr_pos", "attr_norm", "attr_uv0", "attr_color", "attr_joints", "attr_weights", "attr_uv1", "attr_textan", "attr_binormal"];

// The pictures of a material besides its colour's, in the order the shader
// has them, and what each is read through. A picture of heights is read
// where the way of facing would be: a material has one or the other.
const MAPS = ["map", "normal", "roughness", "metalness", "occlusion", "emissive", "opacity", "bump", "coat", "coatRoughness", "coatNormal"];
const SAMPLERS = [null, "u_normalMap", "u_roughnessMap", "u_metalnessMap", "u_occlusionMap", "u_emissiveMap", "u_opacityMap", "u_normalMap", "u_coatMap", "u_coatRoughnessMap", "u_coatNormalMap"];
const UNITS = [0, 2, 3, 4, 5, 6, 7, 2, 8, 9, 10];

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
    // A colour kept as whole numbers is out of 255; which joint a corner
    // goes with is the number itself.
    gl.vertexAttribPointer(location, Math.min(4, entry.count), KINDS[entry.type], entry.type < 9 && name !== "attr_joints", shape.stride, entry.offset);
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
  const jointed = Boolean(shape.entries.attr_joints && shape.entries.attr_weights);
  const framed = Boolean(shape.entries.attr_textan && shape.entries.attr_binormal);
  shapes.set(shape, (made = { array, kind, size, mode: MODES[shape.drawMode] ?? gl.TRIANGLES, colors: Boolean(shape.entries.attr_color), jointed, framed }));
  return made;
}

const WRAPS = { 1: 0x812f, 2: 0x8370, 3: 0x2901 };

// A picture as a texture, sampled as its Texture says.
const textures = new WeakMap();
function bound(map, unit = 0) {
  const { element } = map;
  let made = textures.get(element);
  const fresh = !made;
  if (fresh) textures.set(element, (made = { texture: gl.createTexture(), mipped: false }));
  gl.activeTexture(gl.TEXTURE0 + unit);
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
  if (unit) gl.activeTexture(gl.TEXTURE0);
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

// The joints of a bent shape, as a texture the corners look their matrices
// up in.
let skeleton = null;
function jointed(bones) {
  skeleton ??= gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, skeleton);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, bones.width, bones.width, 0, gl.RGBA, gl.FLOAT, bones.data);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.activeTexture(gl.TEXTURE0);
}

const UNTURNED = [1, 0, 0, 0, 1, 0, 0, 0, 1];

// One part of a shape, with the material it is drawn with.
function part(piece) {
  const { shape, subset, world, material, opacity } = piece;
  const made = held(shape);
  gl.bindVertexArray(made.array);
  gl.uniformMatrix4fv(at.u_all, false, piece.all);
  gl.uniformMatrix4fv(at.u_world, false, world);
  gl.uniformMatrix3fv(at.u_facing, false, piece.bones ? UNTURNED : math.normal(world));
  const skinned = Boolean(piece.bones) && made.jointed;
  gl.uniform1i(at.u_skinned, skinned ? 1 : 0);
  if (skinned) jointed(piece.bones);
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
  gl.uniform1i(at.u_framed, made.framed ? 1 : 0);
  gl.uniform1i(at.u_inverted, material.inverted ? 1 : 0);
  gl.uniform1f(at.u_bump, material.bump ?? 1);
  gl.uniform1f(at.u_occlusion, material.occlusion ?? 1);
  gl.uniform1f(at.u_coat, material.coat ?? 0);
  gl.uniform1f(at.u_coatRoughness, material.coatRoughness ?? 0);
  gl.uniform1f(at.u_coatBump, material.coatBump ?? 1);
  gl.uniform3fv(at.u_coatEdge, material.coatEdge ?? [5, 1, 0]);
  gl.uniform3fv(at.u_tint, material.tint ?? [1, 1, 1]);
  gl.uniform1i(at.u_shiny, material.shiny === false ? 0 : 1);
  const reads = new Float32Array(MAPS.length * 3);
  const places = new Float32Array(MAPS.length * 9);
  MAPS.forEach((name, index) => {
    const map = name === "map" ? material.map : material.maps?.[name];
    if (!map) return;
    bound(map, UNITS[index]);
    reads.set([1, map.channel ?? 0, map.index ? 1 : 0], index * 3);
    const m = map.transform;
    places.set([m[0], m[1], 0, m[4], m[5], 0, m[12], m[13], 1], index * 9);
  });
  gl.uniform3fv(at.u_reads, reads);
  gl.uniformMatrix3fv(at.u_places, false, places);
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
  material.blended || material.blend !== 0 || opacity * material.opacity < 1 || Boolean(material.maps?.opacity) || (!material.solid && (material.color[3] < 1 || Boolean(material.map?.sheer)));

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
      const { shape, materials, opacity, bones } = model;
      // A bent shape is where its joints put it, wherever its model is.
      const world = bones ? math.IDENTITY : model.world;
      const all = math.multiply(seen, world);
      shape.subsets.forEach((subset, index) => {
        const material = materials[Math.min(index, materials.length - 1)];
        if (!material || material.waiting) return;
        const middle = math.point(world, ...subset.min.map((least, axis) => (least + subset.max[axis]) / 2));
        // How far in front of the eye it is: the eye looks down its own z.
        const distance = -math.point(view, ...middle)[2];
        (sheer(material, opacity) ? clear : solid).push({ shape, subset, world, all, material, opacity, distance, bones });
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
