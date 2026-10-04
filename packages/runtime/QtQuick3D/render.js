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
//
// A scene may be lit by its surroundings besides its lights: a picture of
// everything round it (a light probe), which is folded into a cube and that
// blurred as Qt blurs it, once for each step of roughness and once for what
// a rough surface takes from all round. The same cube is what is behind the
// scene where its background is a sky box.
//
// Under an ExtendedSceneEnvironment a scene is drawn in linear light, into
// a picture whose numbers are fractions, and brought to the screen after:
// which a browser that cannot draw into such a picture does not do, and
// there the scene is drawn as under a SceneEnvironment.
//
// A surface that is lit is in the scene's fog, where it has one. One that
// is not lit, and what is behind the scene, are not, as in Qt.
//
// A shape drawn by a table of instances is drawn once for each entry, by
// one call: where each is and what colour it is times are the entry's.
//
// Not here: a probe that is a canvas is folded once, as it is when first
// drawn, and a material's own probe is not looked at.
import * as math from "./math.js";
import { Triangles } from "./mesh.js";

// As many lights as Qt lets a surface have.
const LIGHTS = 15;
const NONE = [0, 0, 0, 0];

// Linear light and the screen's, by Qt's own sums, and Qt's ways of bringing
// the one to the other.
const TONES = `
uniform int u_tonemap;

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
`;

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
layout(location = 9) in vec4 inst_row0;
layout(location = 10) in vec4 inst_row1;
layout(location = 11) in vec4 inst_row2;
layout(location = 12) in vec4 inst_color;
uniform mat4 u_all;
uniform mat4 u_world;
uniform mat3 u_facing;
uniform bool u_instanced;
uniform mat4 u_above;
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
    mat4 world = u_world;
    mat3 turn = u_facing;
    mat4 all = u_all;
    v_color = attr_color;
    // One of many drawn by a table is where its entry puts it, within
    // where the table is, and its colour is times the entry's.
    if (u_instanced) {
        world = u_above * transpose(mat4(inst_row0, inst_row1, inst_row2, vec4(0.0, 0.0, 0.0, 1.0))) * u_world;
        turn = transpose(inverse(mat3(world)));
        all = u_all * world;
        v_color *= inst_color;
    }
    v_position = (world * position).xyz;
    // The way a corner faces is made one long here, before it is spread
    // over the triangle, as Qt makes it.
    v_normal = normalize(turn * facing);
    v_tangent = mat3(world) * tangent;
    v_binormal = mat3(world) * binormal;
    v_uv = attr_uv0;
    v_uv1 = attr_uv1;
    gl_Position = all * position;
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
// it and how rough that is. Of each: whether there is one (and with two,
// that it is in linear light), which channel of it is read and which of a
// corner's two places in a picture it is read at, and how that place is
// moved.
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
// The surroundings, folded and blurred: whether there are any, the last of
// the cube's levels, how far below the horizon they are dimmed (-1 is not
// at all) and how bright they are; and how they are turned.
uniform samplerCube u_probe;
uniform vec4 u_probing;
uniform mat3 u_probeTurn;
// How what a surface gives back of its surroundings as it is turned from
// the eye is scaled and shifted.
uniform vec2 u_edge;
uniform vec4 u_fog;
uniform vec4 u_fogDepth;
uniform vec4 u_fogHeight;
uniform vec2 u_fogLet;
uniform float u_far;
out vec4 fragColor;
${TONES}
// What is read of the surroundings is brought under one before the tone
// mapping, where there is any.
vec3 exposed(vec3 c) {
    return u_tonemap == 0 ? c : vec3(1.0) - exp(-c * u_probing.w);
}

float horizon(vec3 way) {
    float low = u_probing.z;
    if (low <= -1.0) return 1.0;
    float middle = 0.5 + 0.5 * low;
    return mix(1.0, smoothstep(middle * 0.25, middle + 0.25, way.y), low + 1.0);
}

// What the surroundings light a surface with from all round: the last
// level of the cube.
vec3 around(vec3 N) {
    vec3 way = u_probeTurn * N;
    return exposed(textureLod(u_probe, way, u_probing.y).rgb * horizon(way));
}

// What a DefaultMaterial gives back of them, the rougher from the further
// down the levels.
vec3 glossy(vec3 N, vec3 V, float rough) {
    float sigma = smoothstep(0.0, 1.0, clamp(rough, 0.0001, 1.0));
    vec3 way = u_probeTurn * reflect(-V, N);
    float NdotL = clamp(dot(way, N), 0.0, 0.999995);
    float k = sigma * 0.31830988618;
    float seen = clamp((NdotL / (NdotL * (1.0 - k) + k) + (1.0 - k * k)) * 0.5, 0.0, 1.0);
    return seen * exposed(textureLod(u_probe, way, sigma * (u_probing.y - 1.0)).rgb * horizon(way));
}

// And what a PrincipledMaterial does, which gives back F of them.
vec3 mirrored(vec3 N, vec3 V, vec3 F, float roughness) {
    float level = clamp(roughness * 5.0, 0.0, u_probing.y - 1.0);
    vec3 way = u_probeTurn * normalize(reflect(-V, N));
    vec3 read = textureLod(u_probe, way, level).rgb * horizon(way);
    vec4 r = roughness * vec4(-1.0, -0.0275, -0.572, 0.022) + vec4(1.0, 0.0425, 1.04, -0.04);
    float a004 = min(r.x * r.x, exp2(-9.28 * clamp(dot(N, V), 0.0, 1.0))) * r.x + r.y;
    vec2 brdf = vec2(-1.04, 1.04) * a004 + r.zw;
    return exposed(read * (F * brdf.x + brdf.y));
}

bool has(int which) {
    return u_reads[which].x > 0.5;
}

// Whether a picture is in linear light already, as one of fractions is.
// Qt takes it so where it is a PrincipledMaterial's colour, and nowhere
// else: a DefaultMaterial's colour and any material's glow are read as a
// screen shows them whatever they are.
bool plain(int which) {
    return u_principled && u_reads[which].x > 1.5;
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

// From nothing at one end to all at the other, slowly at both, whichever of
// the ends is the greater.
float eased(float from, float to, float at) {
    float t = clamp((at - from) / (to - from), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
}

// Fog, by Qt's own sums: more of it the further a surface is from the eye,
// and the lower it lies, in place of what the surface gives back. Where it
// lets light through, what is brighter than the fog shows in it, the less
// the further off. How thick the fog is and the curve of the height are not
// heeded for the height, as Qt does not heed them.
void fogged(inout vec3 given, inout vec3 shine, inout vec3 diffuse) {
    float amount = 0.0;
    vec3 colour = u_fog.rgb;
    if (u_fogDepth.w > 0.5) {
        float far = eased(u_fogDepth.x, u_fogDepth.y > 0.0 ? u_fogDepth.y : u_far, length(u_eye - v_position));
        amount = pow(far, u_fogDepth.z) * u_fog.a;
        if (u_fogLet.y > 0.5) colour = mix(max(given + shine + diffuse, colour), colour, pow(far, u_fogLet.x));
    }
    if (u_fogHeight.w > 0.5) amount = max(amount, eased(u_fogHeight.x, u_fogHeight.y, v_position.y));
    given = given * (1.0 - amount) + colour * amount;
    shine *= 1.0 - amount;
    diffuse *= 1.0 - amount;
}

void main() {
    vec4 base = u_color;
    if (u_colors) base *= v_color;
    if (has(BASE)) {
        vec4 picture = texture(u_map, placed(BASE));
        base *= vec4(plain(BASE) ? picture.rgb : toLinear(picture.rgb), picture.a);
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
        if (has(EMISSIVE)) {
            vec3 picture = texture(u_emissiveMap, placed(EMISSIVE)).rgb;
            given *= toLinear(picture);
        }
        float coat = u_coat;
        if (has(COAT)) coat *= channel(u_coatMap, COAT);
        float coatRoughness = u_coatRoughness;
        if (has(COAT_ROUGHNESS)) coatRoughness = clamp(coatRoughness * channel(u_coatRoughnessMap, COAT_ROUGHNESS), 0.0, 1.0);
        vec3 coating = vec3(0.0);
        vec3 V = normalize(u_eye - v_position);
        vec3 diffuse = u_ambient * (1.0 - metalness) * base.rgb;
        vec3 shine = vec3(0.0);
        float bent = ((u_ior - 1.0) * (u_ior - 1.0)) / ((u_ior + 1.0) * (u_ior + 1.0));
        vec3 f0 = vec3(bent) * (1.0 - metalness) + base.rgb * metalness;
        bool coats = u_principled && u_coat > 0.0;
        // What a surface that is no metal gives back of a light can take
        // the surface's own colour.
        vec3 tint = mix(vec3(1.0), u_tint, 1.0 - metalness);
        float NdotV = clamp(dot(N, V), 0.0, 1.0);
        float edge = u_fresnel == 0.0 ? 1.0 : pow(1.0 - NdotV, u_fresnel);
        vec3 turning = f0 + (max(vec3(1.0 - roughness), f0) - f0) * edge;
        // How much a surface gives back as shine: a DefaultMaterial in its
        // own colour, a PrincipledMaterial all of it where it is metal. The
        // lights heed the first, and of the second only whether there is
        // any; the surroundings heed both.
        vec3 amount = u_principled ? vec3(metalness + u_specular * (1.0 - metalness)) * clamp(u_edge.y + u_edge.x * turning, 0.0, 1.0) : base.rgb * u_specular * turning;
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
                    if (coats) coating += light * ggx(coated, L, V, vec3(bent), coatRoughness);
                }
            } else {
                diffuse += base.rgb * light * max(0.0, dot(N, L));
                if (u_specular > 0.0) shine += light * amount * pow(max(0.0, dot(normalize(V + L), N)), u_shine);
            }
        }
        // What a light gives a surface all round is less where less of the
        // light reaches it.
        diffuse *= reached;
        if (u_probing.x > 0.5 && u_probing.w >= 0.005) {
            if (u_principled) {
                diffuse += base.rgb * (1.0 - amount) * around(N) * reached;
                shine += tint * mirrored(N, V, amount, roughness) * reached;
                if (coats) coating += mirrored(coated, V, vec3(bent), coatRoughness) * reached;
            } else {
                diffuse += base.rgb * around(N) * reached;
                shine += amount * u_tint * glossy(N, V, roughness) * reached;
            }
        }
        if (u_principled) diffuse *= 1.0 - metalness;
        if (u_fogDepth.w + u_fogHeight.w > 0.5) fogged(given, shine, diffuse);
        sum = diffuse + shine + given;
        // What is under a clear coat shows less the more the coat itself
        // gives back, which is more the further it is turned from the eye.
        if (coats) {
            float turn = clamp(pow(clamp(dot(coated, V), 0.0, 1.0), u_coatEdge.x), 0.0, 1.0);
            vec3 back = vec3(bent) + (vec3(1.0) - vec3(bent)) * (1.0 - turn);
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
  "u_instanced",
  "u_above",
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
  "u_probe",
  "u_probing",
  "u_probeTurn",
  "u_edge",
  "u_fog",
  "u_fogDepth",
  "u_fogHeight",
  "u_fogLet",
  "u_far",
];

// The three corners of a triangle that covers everything, which is all the
// passes that draw no shape draw.
const COVER = `#version 300 es
out vec2 v_at;
void main() {
    v_at = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)) * 2.0 - 1.0;
    gl_Position = vec4(v_at, 0.0, 1.0);
}
`;

// The way a place on one side of a cube lies from its middle, the sides in
// OpenGL's order.
const SIDE = `
uniform int u_side;
in vec2 v_at;

vec3 outward() {
    if (u_side == 0) return vec3(1.0, -v_at.y, -v_at.x);
    if (u_side == 1) return vec3(-1.0, -v_at.y, v_at.x);
    if (u_side == 2) return vec3(v_at.x, 1.0, v_at.y);
    if (u_side == 3) return vec3(v_at.x, -1.0, -v_at.y);
    if (u_side == 4) return vec3(v_at.x, -v_at.y, 1.0);
    return vec3(-v_at.x, -v_at.y, -1.0);
}
`;

// A picture of everything round a place, laid out as a map of the world is,
// onto one side of a cube: Qt's `environmentmap.frag`.
const FOLD = `#version 300 es
precision highp float;
uniform sampler2D u_from;
uniform bool u_screen;
out vec4 fragColor;
${SIDE}
void main() {
    vec3 v = normalize(outward());
    vec2 uv = vec2(atan(v.z, v.x), asin(v.y)) * vec2(0.1591, 0.3183) + 0.5;
    vec4 read = texture(u_from, uv);
    if (u_screen) read.rgb = read.rgb * (read.rgb * (read.rgb * 0.305306011 + 0.682171111) + 0.012522878);
    fragColor = read;
}
`;

// One side of one level of the blurred cube: what a surface of one
// roughness facing this way gives back of the surroundings, or what a rough
// one takes from all round, summed over as many ways as Qt sums it over.
// Qt's `environmentmapprefilter.frag`.
const WAYS = 1024;
const BLUR = `#version 300 es
precision highp float;
const int WAYS = ${WAYS};
const float PI = 3.14159265359;
uniform samplerCube u_from;
uniform float u_roughness;
uniform float u_resolution;
uniform bool u_round;
out vec4 fragColor;
${SIDE}
float radicalInverse(uint bits) {
    bits = (bits << 16u) | (bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    return float(bits) * 2.3283064365386963e-10;
}

mat3 frame(vec3 normal) {
    vec3 bitangent = vec3(0.0, 1.0, 0.0);
    float up = dot(normal, vec3(0.0, 1.0, 0.0));
    if (1.0 - abs(up) <= 0.0000001) bitangent = up > 0.0 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 0.0, -1.0);
    vec3 tangent = normalize(cross(bitangent, normal));
    return mat3(tangent, cross(normal, tangent), normal);
}

float spread(float NdotH, float roughness) {
    float a = NdotH * roughness;
    float k = roughness / (1.0 - NdotH * NdotH + a * a);
    return k * k * (1.0 / PI);
}

void main() {
    vec3 N = normalize(outward());
    // A surface that is not rough at all gives back what is the way it faces.
    if (!u_round && u_roughness == 0.0) {
        fragColor = vec4(textureLod(u_from, N, 0.0).rgb, 1.0);
        return;
    }
    mat3 about = frame(N);
    vec3 color = vec3(0.0);
    float weight = 0.0;
    for (int index = 0; index < WAYS; index++) {
        vec2 xi = vec2(float(index) / float(WAYS), radicalInverse(uint(index)));
        float cosine;
        float sine;
        float chance;
        if (u_round) {
            cosine = sqrt(1.0 - xi.y);
            sine = sqrt(xi.y);
            chance = cosine / PI;
        } else {
            float alpha = u_roughness * u_roughness;
            cosine = clamp(sqrt((1.0 - xi.y) / (1.0 + (alpha * alpha - 1.0) * xi.y)), 0.0, 1.0);
            sine = sqrt(1.0 - cosine * cosine);
            chance = spread(cosine, alpha) / 4.0;
        }
        float phi = 2.0 * PI * xi.x;
        vec3 H = about * normalize(vec3(sine * cos(phi), sine * sin(phi), cosine));
        float level = 0.5 * log2(6.0 * u_resolution * u_resolution / (float(WAYS) * chance));
        if (u_round) color += textureLod(u_from, H, level).rgb;
        else {
            vec3 L = normalize(reflect(-N, H));
            float NdotL = dot(N, L);
            if (NdotL > 0.0) {
                color += textureLod(u_from, L, level).rgb * NdotL;
                weight += NdotL;
            }
        }
    }
    fragColor = vec4(weight != 0.0 ? color / weight : color / float(WAYS), 1.0);
}
`;

// The surroundings behind the scene: for each place in the view, what lies
// the way the eye looks through it. Qt's `skybox.vert` and `skybox.frag`.
const BEHIND = `#version 300 es
uniform mat4 u_back;
uniform mat3 u_eye;
uniform mat3 u_turn;
out vec3 v_way;
void main() {
    vec2 at = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)) * 2.0 - 1.0;
    gl_Position = vec4(at, 0.0, 1.0);
    v_way = u_turn * (u_eye * (u_back * gl_Position).xyz);
}
`;

const SKY = `#version 300 es
precision highp float;
uniform samplerCube u_from;
uniform float u_level;
uniform float u_exposure;
in vec3 v_way;
out vec4 fragColor;
${TONES}
void main() {
    vec3 read = textureLod(u_from, normalize(v_way), u_level).rgb;
    if (u_tonemap != 0) read = vec3(1.0) - exp(-read * u_exposure);
    fragColor = vec4(tonemap(read), 1.0);
}
`;

// What an ExtendedSceneEnvironment does to the picture of a scene drawn in
// linear light, as Qt's own shader for it does: how exposed it is, edges
// smoothed and the whole sharpened, dithering, the tone mapping with its
// white point, brightness, contrast and saturation, and the vignette.
const OVER = `#version 300 es
out vec2 v_at;
void main() {
    v_at = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
    gl_Position = vec4(v_at * 2.0 - 1.0, 0.0, 1.0);
}
`;

const GRADE = `#version 300 es
precision highp float;
uniform sampler2D u_from;
uniform int u_tonemap;
uniform vec4 u_grade;
uniform bvec2 u_fine;
uniform vec4 u_adjust;
uniform vec4 u_vignette;
uniform vec2 u_vignetting;
in vec2 v_at;
out vec4 fragColor;

vec3 filmic(vec3 c, float white) {
    const float A = 0.22 * 2.0 * 2.0;
    const float B = 0.30 * 2.0;
    const float C = 0.10;
    const float D = 0.20;
    const float E = 0.01;
    const float F = 0.30;
    vec3 toned = ((c * (A * c + C * B) + D * E) / (c * (A * c + B) + D * F)) - E / F;
    float most = ((white * (A * white + C * B) + D * E) / (white * (A * white + B) + D * F)) - E / F;
    return clamp(toned / most, vec3(0.0), vec3(1.0));
}

vec3 aces(vec3 c, float white) {
    const float A = 2.51 * 0.85 * 0.85;
    const float B = 0.03 * 0.85;
    const float C = 2.43 * 0.85 * 0.85;
    const float D = 0.59 * 0.85;
    const float E = 0.14;
    vec3 toned = (c * (A * c + B)) / (c * (C * c + D) + E);
    float most = (white * (A * white + B)) / (white * (C * white + D) + E);
    return clamp(toned / most, vec3(0.0), vec3(1.0));
}

vec3 reinhard(vec3 c, float white) {
    return clamp((white * c + c) / (c * white + white), vec3(0.0), vec3(1.0));
}

vec3 toScreen(vec3 c) {
    return mix(1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, 12.92 * c, lessThan(c, vec3(0.0031308)));
}

vec3 tonemap(vec3 c, float white) {
    if (u_tonemap == 0) return c;
    if (u_tonemap == 1) return toScreen(clamp(c, vec3(0.0), vec3(1.0)));
    c = max(vec3(0.0), c);
    if (u_tonemap == 2) return toScreen(aces(c, white));
    if (u_tonemap == 3) return toScreen(reinhard(c, white));
    return toScreen(filmic(c, white));
}

vec3 smoothed(vec3 color, float exposure, vec2 pixel) {
    vec3 nw = textureLod(u_from, v_at + vec2(-1.0, -1.0) * pixel, 0.0).xyz * exposure;
    vec3 ne = textureLod(u_from, v_at + vec2(1.0, -1.0) * pixel, 0.0).xyz * exposure;
    vec3 sw = textureLod(u_from, v_at + vec2(-1.0, 1.0) * pixel, 0.0).xyz * exposure;
    vec3 se = textureLod(u_from, v_at + vec2(1.0, 1.0) * pixel, 0.0).xyz * exposure;
    vec3 luma = vec3(0.299, 0.587, 0.114);
    float lumaNW = dot(nw, luma);
    float lumaNE = dot(ne, luma);
    float lumaSW = dot(sw, luma);
    float lumaSE = dot(se, luma);
    float lumaM = dot(color, luma);
    float least = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float most = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));
    vec2 way = vec2(-((lumaNW + lumaNE) - (lumaSW + lumaSE)), (lumaNW + lumaSW) - (lumaNE + lumaSE));
    float less = max((lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 / 8.0), 1.0 / 128.0);
    way = min(vec2(8.0), max(vec2(-8.0), way / (min(abs(way.x), abs(way.y)) + less))) * pixel;
    vec3 near = 0.5 * exposure * (textureLod(u_from, v_at + way * (1.0 / 3.0 - 0.5), 0.0).xyz + textureLod(u_from, v_at + way * (2.0 / 3.0 - 0.5), 0.0).xyz);
    vec3 far = near * 0.5 + 0.25 * exposure * (textureLod(u_from, v_at + way * -0.5, 0.0).xyz + textureLod(u_from, v_at + way * 0.5, 0.0).xyz);
    float lumaFar = dot(far, luma);
    return lumaFar < least || lumaFar > most ? near : far;
}

vec3 sharpened(vec3 e, float exposure, float amount) {
    ivec2 here = ivec2(gl_FragCoord.xy);
    vec3 a = texelFetch(u_from, here + ivec2(-1, -1), 0).rgb * exposure;
    vec3 b = texelFetch(u_from, here + ivec2(0, -1), 0).rgb * exposure;
    vec3 c = texelFetch(u_from, here + ivec2(1, -1), 0).rgb * exposure;
    vec3 d = texelFetch(u_from, here + ivec2(-1, 0), 0).rgb * exposure;
    vec3 f = texelFetch(u_from, here + ivec2(1, 0), 0).rgb * exposure;
    vec3 g = texelFetch(u_from, here + ivec2(-1, 1), 0).rgb * exposure;
    vec3 h = texelFetch(u_from, here + ivec2(0, 1), 0).rgb * exposure;
    vec3 i = texelFetch(u_from, here + ivec2(1, 1), 0).rgb * exposure;
    vec3 least = min(min(min(d, e), min(f, b)), h);
    least += min(min(min(least, a), min(g, c)), i);
    vec3 most = max(max(max(d, e), max(f, b)), h);
    most += max(max(max(most, a), max(g, c)), i);
    vec3 room = inversesqrt(clamp(min(least, 2.0 - most) / most, 0.0, 1.0));
    vec3 weight = -vec3(1.0) / (room * (8.0 - 3.0 * amount));
    return max(vec3(0.0), ((b + d + f + h) * weight + e) / (1.0 + 4.0 * weight));
}

void main() {
    vec4 source = textureLod(u_from, v_at, 0.0);
    float exposure = u_grade.x;
    vec3 color = source.rgb * exposure;
    if (u_fine.x) color = smoothed(color, exposure, 1.0 / vec2(textureSize(u_from, 0)));
    if (u_grade.z >= 0.001) color = sharpened(color, exposure, u_grade.z);
    if (u_fine.y) color += (fract(vec3(dot(vec2(171.0, 231.0), gl_FragCoord.xy)) / vec3(103.0, 71.0, 97.0)) - 0.5) / 255.0;
    color = tonemap(color, u_grade.y);
    if (u_adjust.x > 0.5) {
        color = mix(vec3(0.0), color, u_adjust.y);
        color = mix(vec3(0.5), color, u_adjust.z);
        color = mix(vec3(dot(vec3(1.0), color) * 0.33333), color, u_adjust.w);
    }
    if (u_vignette.w > 0.5) {
        vec2 uv = v_at * (1.0 - v_at.yx);
        float edge = pow(uv.x * uv.y * u_vignetting.x, u_vignetting.y);
        color = mix(u_vignette.rgb * edge, color, edge);
    }
    fragColor = vec4(color, source.a);
}
`;

let surface;
let gl;
let at;
let shaded;
// Whether a picture of fractions can be drawn into, which the cube of a
// light probe is where it can.
let fractions = false;

// A program, and where each of its uniforms is. Null when it does not link.
function program(vertex, fragment, names) {
  const made = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertex],
    [gl.FRAGMENT_SHADER, fragment],
  ]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.warn(`View3D: ${gl.getShaderInfoLog(shader)}`);
    gl.attachShader(made, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(made);
  if (!gl.getProgramParameter(made, gl.LINK_STATUS)) {
    console.warn(`View3D: ${gl.getProgramInfoLog(made)}`);
    return null;
  }
  return { program: made, at: Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(made, name)])) };
}

// The context, and the program every shape is drawn with. Null when the
// browser has none to give.
function context() {
  if (gl !== undefined) return gl;
  surface = new OffscreenCanvas(1, 1);
  gl = surface.getContext("webgl2", { antialias: false, depth: true }) ?? null;
  if (!gl) return gl;
  shaded = program(VERTEX, FRAGMENT, UNIFORMS);
  if (!shaded) return (gl = null);
  fractions = Boolean(gl.getExtension("EXT_color_buffer_float"));
  gl.useProgram(shaded.program);
  at = shaded.at;
  gl.uniform1i(at.u_map, 0);
  gl.uniform1i(at.u_bones, 1);
  gl.uniform1i(at.u_probe, PROBE);
  SAMPLERS.forEach((name, index) => name && gl.uniform1i(at[name], UNITS[index]));
  // A cube there is always, for a program that could read one: of nothing,
  // where the scene has no surroundings.
  nothing = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + PROBE);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, nothing);
  for (let side = 0; side < 6; side++) gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + side, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.activeTexture(gl.TEXTURE0);
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
// Where the cube of the surroundings is read, and where what it is made
// from is while it is made.
const PROBE = 11;
const MAKING = 12;
let nothing;

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

// How the numbers of a picture given as numbers are handed over. Whole
// fractions are kept as halves, which is what can be smoothed.
const forms = () => ({
  RGBA8: [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE],
  RGBA16F: [gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT],
  RGBA32F: [gl.RGBA16F, gl.RGBA, gl.FLOAT],
  R8: [gl.R8, gl.RED, gl.UNSIGNED_BYTE],
  R16F: [gl.R16F, gl.RED, gl.HALF_FLOAT],
  R32F: [gl.R16F, gl.RED, gl.FLOAT],
});

// A picture as a texture, sampled as its Texture says: an element of the
// page, or numbers, whose first row is the bottom one already.
const textures = new WeakMap();
function bound(map, unit = 0) {
  const from = map.element ?? map.data;
  let made = textures.get(from);
  const fresh = !made;
  if (fresh) textures.set(from, (made = { texture: gl.createTexture(), mipped: false }));
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, made.texture);
  if (fresh && map.data) {
    const { pixels, width, height, format } = map.data;
    const [inner, outer, kind] = forms()[format];
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, inner, width, height, 0, outer, kind, pixels);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  } else if (!map.data && (fresh || map.live)) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, map.element);
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

// A cube of so many levels, each side of the first `size` across.
function cube(size, levels) {
  const made = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + MAKING);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, made);
  gl.texStorage2D(gl.TEXTURE_CUBE_MAP, levels, fractions ? gl.RGBA16F : gl.RGBA8, size, size);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return made;
}

// The passes that draw no shape: made when first there is something for
// them to draw.
let fold;
let blur;
let sky;

function covering() {
  gl.bindVertexArray(null);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  gl.disable(gl.CULL_FACE);
  gl.depthMask(false);
}

// The picture of a light probe as the cube that is read when a scene is lit
// by it, made as Qt makes it: each side at least 512 across, half the
// picture's height where that is more, and six levels. The first is the
// picture itself; the next four what surfaces of a roughness of a quarter,
// a half, three quarters and one give back of it; the last what one takes
// of it from all round.
const probes = new WeakMap();
const LEVELS = 6;
function probed(map) {
  const from = map.element ?? map.data;
  let made = probes.get(from);
  if (made !== undefined) return made;
  fold ??= program(COVER, FOLD, ["u_from", "u_screen", "u_side"]);
  blur ??= program(COVER, BLUR, ["u_from", "u_roughness", "u_resolution", "u_round", "u_side"]);
  if (!fold || !blur) {
    probes.set(from, null);
    return null;
  }
  const high = map.data?.height ?? map.element.naturalHeight ?? map.element.height;
  const size = Math.max(512, Math.floor(high * 0.5));
  const levels = Math.min(Math.floor(Math.log2(size)) + 1, LEVELS);
  covering();
  const frame = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frame);
  const sides = (onto, level, across, at) => {
    gl.viewport(0, 0, across, across);
    for (let side = 0; side < 6; side++) {
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + side, onto, level);
      gl.uniform1i(at.u_side, side);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  };

  // The picture, folded: read between its pixels, and not past its edges.
  const folded = cube(size, Math.floor(Math.log2(size)) + 1);
  bound(map, MAKING);
  gl.activeTexture(gl.TEXTURE0 + MAKING);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.useProgram(fold.program);
  gl.uniform1i(fold.at.u_from, MAKING);
  gl.uniform1i(fold.at.u_screen, map.data?.linear ? 0 : 1);
  sides(folded, 0, size, fold.at);
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

  // And blurred, level by level.
  const cubed = cube(size, levels);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, folded);
  gl.useProgram(blur.program);
  gl.uniform1i(blur.at.u_from, MAKING);
  gl.uniform1f(blur.at.u_resolution, size);
  for (let level = 0; level < levels; level++) {
    gl.uniform1f(blur.at.u_roughness, level / (levels - 2));
    gl.uniform1i(blur.at.u_round, level === levels - 1 ? 1 : 0);
    sides(cubed, level, size >> level, blur.at);
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(frame);
  gl.deleteTexture(folded);
  gl.activeTexture(gl.TEXTURE0);
  gl.useProgram(shaded.program);
  probes.set(from, (made = { cube: cubed, levels }));
  return made;
}

// The surroundings behind everything, as blurred as the scene says.
function backdrop(probe, environment, projection, eye, tonemap) {
  sky ??= program(BEHIND, SKY, ["u_back", "u_eye", "u_turn", "u_from", "u_level", "u_exposure", "u_tonemap"]);
  const back = sky && math.inverse(projection);
  if (!back) return;
  covering();
  gl.useProgram(sky.program);
  gl.uniform1i(sky.at.u_from, PROBE);
  gl.uniformMatrix4fv(sky.at.u_back, false, back);
  gl.uniformMatrix3fv(sky.at.u_eye, false, [eye[0], eye[1], eye[2], eye[4], eye[5], eye[6], eye[8], eye[9], eye[10]]);
  gl.uniformMatrix3fv(sky.at.u_turn, false, environment.probe.turn);
  gl.uniform1f(sky.at.u_level, environment.blur * (probe.levels - 2));
  gl.uniform1f(sky.at.u_exposure, environment.probe.exposure);
  gl.uniform1i(sky.at.u_tonemap, tonemap);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.useProgram(shaded.program);
}

// A colour in linear light as the screen shows it, by the same sums as the
// shader's.
function toned([r, g, b], mode) {
  const screen = (c) => 0.585122381 * Math.sqrt(c) + 0.783140355 * c ** 0.25 - 0.368262736 * c ** 0.125;
  const filmic = (c) => (c * (0.15 * c + 0.05) + 0.004) / (c * (0.15 * c + 0.5) + 0.06) - 0.02 / 0.3;
  const one = (c) => {
    if (mode === 1) return screen(c);
    if (mode === 2) return screen(Math.min(1, Math.max(0, (c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14))));
    if (mode === 3) {
      c = Math.max(0, c - 0.004);
      return (c * (6.2 * c + 0.5)) / (c * (6.2 * c + 1.7) + 0.06);
    }
    if (mode === 4) return screen(filmic(c * 2) / filmic(11.2));
    return c;
  };
  return [one(r), one(g), one(b)];
}

// Where edges are to be smooth, everything is drawn several times to the
// pixel into this, and from it to the surface.
let smooth = null;
function smoothed(width, height, samples, format) {
  samples = Math.min(samples, gl.getParameter(gl.MAX_SAMPLES));
  if (samples < 2) return null;
  smooth ??= { frame: gl.createFramebuffer(), color: gl.createRenderbuffer(), depth: gl.createRenderbuffer() };
  if (smooth.width !== width || smooth.height !== height || smooth.samples !== samples || smooth.format !== format) {
    Object.assign(smooth, { width, height, samples, format });
    gl.bindRenderbuffer(gl.RENDERBUFFER, smooth.color);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, format, width, height);
    gl.bindRenderbuffer(gl.RENDERBUFFER, smooth.depth);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, smooth.frame);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, smooth.color);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, smooth.depth);
  }
  return smooth.frame;
}

// Where the whole picture is brought to the screen after it is drawn, it
// is drawn in linear light into this, which holds more than a screen shows.
// Null where the browser cannot draw into such a thing.
let linear = null;
function unscreened(width, height) {
  if (!gl.getExtension("EXT_color_buffer_float")) return null;
  linear ??= { frame: gl.createFramebuffer(), color: gl.createTexture(), depth: gl.createRenderbuffer() };
  if (linear.width !== width || linear.height !== height) {
    Object.assign(linear, { width, height });
    gl.bindTexture(gl.TEXTURE_2D, linear.color);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, linear.depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, linear.frame);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, linear.color, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, linear.depth);
  }
  return linear.frame;
}

// That picture brought to the screen, as the environment says.
let graded = null;
function finished(grade) {
  graded ??= program(OVER, GRADE, ["u_from", "u_tonemap", "u_grade", "u_fine", "u_adjust", "u_vignette", "u_vignetting"]);
  if (!graded) return;
  covering();
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.useProgram(graded.program);
  gl.bindTexture(gl.TEXTURE_2D, linear.color);
  gl.uniform1i(graded.at.u_from, 0);
  gl.uniform1i(graded.at.u_tonemap, grade.tonemap);
  gl.uniform4f(graded.at.u_grade, grade.exposure, grade.white, grade.sharpness, 0);
  gl.uniform2i(graded.at.u_fine, grade.smooth ? 1 : 0, grade.dither ? 1 : 0);
  gl.uniform4f(graded.at.u_adjust, grade.adjust ? 1 : 0, ...(grade.adjust ?? [1, 1, 1]));
  gl.uniform4f(graded.at.u_vignette, ...(grade.vignette?.slice(0, 3) ?? [0, 0, 0]), grade.vignette ? 1 : 0);
  gl.uniform2f(graded.at.u_vignetting, grade.vignette?.[3] ?? 0, grade.vignette?.[4] ?? 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.depthMask(true);
  gl.useProgram(shaded.program);
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

// The entries of a table, as OpenGL holds them: each is three rows of a
// matrix, a colour, and four numbers of its own, which nothing here reads.
// A table whose entries are put in order for every picture has one buffer
// for them all.
const ENTRY = 20;
const tables = new WeakMap();
let ordered = null;
function entered(instances) {
  let buffer = instances.fresh ? (ordered ??= gl.createBuffer()) : tables.get(instances.data);
  const fresh = instances.fresh || !buffer;
  if (!buffer) tables.set(instances.data, (buffer = gl.createBuffer()));
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  if (fresh) gl.bufferData(gl.ARRAY_BUFFER, instances.data, instances.fresh ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
  for (let row = 0; row < 4; row++) {
    gl.enableVertexAttribArray(9 + row);
    gl.vertexAttribPointer(9 + row, 4, gl.FLOAT, false, ENTRY * 4, row * 16);
    gl.vertexAttribDivisor(9 + row, 1);
  }
}

// The entries of a table from the farthest along the way the eye looks to
// the nearest, which is the order Qt draws them in where the table says to
// put them in order: `way` is the way the eye looks, as the model has it.
function farthestFirst(data, count, way) {
  const order = Array.from({ length: count }, (_, index) => {
    const from = index * ENTRY;
    return [data[from + 3] * way[0] + data[from + 7] * way[1] + data[from + 11] * way[2], from];
  }).sort((a, b) => b[0] - a[0]);
  const sorted = new Float32Array(count * ENTRY);
  order.forEach(([, from], index) => sorted.set(data.subarray(from, from + ENTRY), index * ENTRY));
  return sorted;
}

const UNTURNED = [1, 0, 0, 0, 1, 0, 0, 0, 1];

// The lights a part is lit by, which are the scene's unless one of them is
// for some of it only: said again when they are others than the last
// part's.
let shining = null;
function shone(all) {
  if (all === shining) return;
  shining = all;
  const lights = all.slice(0, LIGHTS);
  const ambient = [0, 0, 0];
  for (const light of all) for (let index = 0; index < 3; index++) ambient[index] += light.ambient[index];
  gl.uniform3fv(at.u_ambient, ambient);
  gl.uniform1i(at.u_count, lights.length);
  if (!lights.length) return;
  gl.uniform3fv(at.u_lightColor, lights.flatMap((light) => light.color));
  gl.uniform4fv(at.u_lightPlace, lights.flatMap((light) => [...light.position, light.kind]));
  gl.uniform3fv(at.u_lightWay, lights.flatMap((light) => light.direction));
  gl.uniform3fv(at.u_lightFade, lights.flatMap((light) => light.fade));
  gl.uniform2fv(at.u_lightCone, lights.flatMap((light) => [light.cone, light.inner]));
}

// One part of a shape, with the material it is drawn with.
function part(piece) {
  const { shape, subset, world, material, opacity } = piece;
  const made = held(shape);
  shone(piece.lights);
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
  // An entry of a table colours what it draws whether the material looks
  // at the colours of the corners or not; how far it is seen through shows
  // only where the table says something of it is.
  const { instances } = piece;
  gl.uniform1i(at.u_instanced, instances ? 1 : 0);
  if (instances) gl.uniformMatrix4fv(at.u_above, false, instances.above);
  gl.uniform1i(at.u_colors, (material.colors && made.colors) || instances ? 1 : 0);
  gl.uniform1i(at.u_principled, material.principled ? 1 : 0);
  gl.uniform1i(at.u_solid, material.solid || (instances && !piece.sheer) ? 1 : 0);
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
  gl.uniform2fv(at.u_edge, material.edge ?? [1, 0]);
  const reads = new Float32Array(MAPS.length * 3);
  const places = new Float32Array(MAPS.length * 9);
  MAPS.forEach((name, index) => {
    const map = name === "map" ? material.map : material.maps?.[name];
    if (!map) return;
    bound(map, UNITS[index]);
    reads.set([map.data?.linear ? 2 : 1, map.channel ?? 0, map.index ? 1 : 0], index * 3);
    const m = map.transform;
    places.set([m[0], m[1], 0, m[4], m[5], 0, m[12], m[13], 1], index * 9);
  });
  gl.uniform3fv(at.u_reads, reads);
  gl.uniformMatrix3fv(at.u_places, false, places);
  // Which side of a triangle is its front is the other one in a mirror.
  const anticlockwise = (shape.winding !== 1) !== math.mirrors(piece.placed ?? world);
  gl.frontFace(anticlockwise ? gl.CCW : gl.CW);
  gl.uniform1i(at.u_sided, material.cull === 3 ? 1 : 0);
  if (material.cull === 3) gl.disable(gl.CULL_FACE);
  else {
    gl.enable(gl.CULL_FACE);
    gl.cullFace(material.cull === 2 ? gl.FRONT : gl.BACK);
  }
  if (!instances) {
    if (made.kind) gl.drawElements(made.mode, subset.count, made.kind, subset.offset * made.size);
    else gl.drawArrays(made.mode, subset.offset, subset.count);
    return;
  }
  entered(instances);
  if (made.kind) gl.drawElementsInstanced(made.mode, subset.count, made.kind, subset.offset * made.size, instances.count);
  else gl.drawArraysInstanced(made.mode, subset.offset, subset.count, instances.count);
  // The shape is held once, for what draws it once as well.
  for (let row = 0; row < 4; row++) gl.disableVertexAttribArray(9 + row);
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
  const probe = environment.probe ? probed(environment.probe.map) : null;
  // What an effect brings to the screen afterwards is drawn in linear
  // light, into something that holds it.
  const grade = environment.grade && unscreened(width, height) ? environment.grade : null;
  // Left as it is drawn (-1): which is not the same as no tone mapping
  // being asked for (0), where what lights from all round is as bright as
  // its picture says.
  const tonemap = grade && environment.tonemap !== 0 ? -1 : environment.tonemap;
  const frame = smoothed(width, height, environment.samples, grade ? gl.RGBA16F : gl.RGBA8);
  gl.bindFramebuffer(gl.FRAMEBUFFER, frame ?? (grade ? linear.frame : null));
  gl.viewport(0, 0, width, height);
  gl.depthMask(true);
  // What is behind the scene is a colour of the screen's, which Qt brings
  // to linear light and back as it does everything it draws.
  const [red, green, blue, alpha] = environment.clear;
  gl.clearColor(...toned([red, green, blue], tonemap).map((channel) => channel * alpha), alpha);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.activeTexture(gl.TEXTURE0 + PROBE);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, probe?.cube ?? nothing);
  gl.activeTexture(gl.TEXTURE0);

  if (scene.camera) {
    // The eye sees from where the camera is and the way it is turned,
    // however big it is.
    const eye = math.unscaled(scene.camera);
    const view = math.inverse(eye) ?? math.IDENTITY;
    const seen = math.multiply(scene.projection, view);
    if (probe && environment.sky) backdrop(probe, environment, scene.projection, eye, tonemap);
    gl.uniform4f(at.u_probing, probe ? 1 : 0, probe ? probe.levels - 1 : 0, environment.probe?.horizon ?? -1, environment.probe?.exposure ?? 0);
    gl.uniformMatrix3fv(at.u_probeTurn, false, environment.probe?.turn ?? UNTURNED);
    shining = null;
    gl.uniform3fv(at.u_eye, eye.slice(12, 15));
    gl.uniform4fv(at.u_fog, environment.fog?.color ?? NONE);
    gl.uniform4fv(at.u_fogDepth, environment.fog?.depth ?? NONE);
    gl.uniform4fv(at.u_fogHeight, environment.fog?.height ?? NONE);
    gl.uniform2fv(at.u_fogLet, environment.fog?.through ?? NONE.slice(0, 2));
    gl.uniform1f(at.u_far, scene.far ?? 0);
    gl.uniform1i(at.u_tonemap, tonemap);

    // Each part of each shape with a material is a thing to draw. A shape
    // with fewer materials than parts has the last for the rest; one with
    // none is not drawn.
    const solid = [];
    const clear = [];
    for (const model of scene.models) {
      const { shape, materials, opacity, bones } = model;
      const lights = model.lights ?? scene.lights;
      let { instances } = model;
      if (instances && !instances.count) continue;
      // A bent shape is where its joints put it, wherever its model is. One
      // drawn by a table is where each entry puts it, which the corners
      // work out: here it is as its model is within the entry.
      const world = bones ? math.IDENTITY : (instances?.local ?? model.world);
      const all = instances ? seen : math.multiply(seen, world);
      const placed = instances ? math.multiply(instances.above, world) : world;
      if (instances?.sorted) {
        const way = math.normalized(math.point(math.inverse(model.world) ?? math.IDENTITY, -eye[8], -eye[9], -eye[10]));
        instances = { ...instances, data: farthestFirst(instances.data, instances.count, way), fresh: true };
      }
      shape.subsets.forEach((subset, index) => {
        const material = materials[Math.min(index, materials.length - 1)];
        if (!material || material.waiting) return;
        const middle = math.point(placed, ...subset.min.map((least, axis) => (least + subset.max[axis]) / 2));
        // How far in front of the eye it is: the eye looks down its own z.
        const distance = -math.point(view, ...middle)[2];
        const through = sheer(material, opacity) || Boolean(instances?.sheer);
        (through ? clear : solid).push({ shape, subset, world, all, material, opacity, distance, bones, lights, instances, placed, sheer: through });
      });
    }
    solid.sort((a, b) => a.distance - b.distance);
    clear.sort((a, b) => b.distance - a.distance);

    if (environment.depth) gl.enable(gl.DEPTH_TEST);
    else gl.disable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    // What is behind the scene was drawn without saying how far it is.
    gl.depthMask(true);
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
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, grade ? linear.frame : null);
    gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  if (grade) finished(grade);
  // The picture leaves the surface for the canvas: nothing is copied.
  paper.transferFromImageBitmap(surface.transferToImageBitmap());
}
