// The shaders a scene has of its own, made shaders a browser draws with.
//
// What a CustomMaterial names is a piece of a shader, as Qt has it written:
// a function `MAIN`, beside it for a material that is lit a function for
// each thing it would rather answer for itself (what a light gives it, what
// its surroundings do, what is done to the sum), and words in capitals for
// what Qt hands it: `MODEL_MATRIX`, `BASE_COLOR`, `SCREEN_TEXTURE`. Qt puts
// the piece into a shader of its own, and says there what the words are.
//
// So it is here, with the shader every other shape is drawn with: what that
// declares is declared, each word in capitals is put for what it has for
// it, and a `main` calls the piece where Qt's would, lighting what is lit
// by the same sums as a PrincipledMaterial is lit by. Everything of the
// renderer's own has `qt_` before its name, which Qt keeps for itself, so
// that a piece can call its own things what it likes.
//
// Not here: what a piece is handed of a shape that bends by a skin
// (`BONE_TRANSFORMS`) or that morphs, a picture of the light a scene was
// baked with, of how its surfaces face or of how they move (`LIGHTMAP`,
// `NORMAL_ROUGHNESS_TEXTURE`, `MOTION_VECTOR_TEXTURE`), more than one eye
// (`VIEW_INDEX` is always the first), and what a piece's functions would
// share of their own (`SHARED_VARS`), which Qt 6.11 does not compile either.
import { conditioned, prefixed, Reader, words } from "./glsl.js";

// What Qt's words are here.
const NAMES = {
  MODELVIEWPROJECTION_MATRIX: "qt_u_all",
  VIEWPROJECTION_MATRIX: "qt_u_seen",
  MODEL_MATRIX: "qt_u_world",
  VIEW_MATRIX: "qt_u_view",
  NORMAL_MATRIX: "qt_u_facing",
  PROJECTION_MATRIX: "qt_u_projection",
  INVERSE_PROJECTION_MATRIX: "qt_u_unprojected",
  CAMERA_POSITION: "qt_u_eye",
  CAMERA_DIRECTION: "qt_u_looking",
  CAMERA_PROPERTIES: "qt_u_clips",
  // A picture drawn into has its first row at the bottom, as OpenGL's do.
  FRAMEBUFFER_Y_UP: "1.0",
  NDC_Y_UP: "1.0",
  NEAR_CLIP_VALUE: "(-1.0)",
  IBL_MAXMIPMAP: "qt_u_probing.y",
  IBL_HORIZON: "qt_u_probing.z",
  IBL_EXPOSE: "qt_u_probing.w",
  IBL_TEXTURE: "qt_u_probe",
  POSITION: "gl_Position",
  FRAGCOLOR: "qt_fragColor",
  POINT_SIZE: "gl_PointSize",
  FRAGCOORD: "gl_FragCoord",
  SCREEN_TEXTURE: "qt_u_screen",
  SCREEN_MIP_TEXTURE: "qt_u_screen",
  DEPTH_TEXTURE: "qt_u_depth",
  AO_TEXTURE: "qt_u_white",
  VAR_WORLD_NORMAL: "qt_v_normal",
  VAR_WORLD_TANGENT: "qt_v_tangent",
  VAR_WORLD_BINORMAL: "qt_v_binormal",
  VAR_WORLD_POSITION: "qt_v_position",
  VAR_COLOR: "qt_v_color",
  INSTANCE_COLOR: "qt_inst_color",
  INSTANCE_DATA: "qt_inst_data",
  INSTANCE_INDEX: "gl_InstanceID",
  VIEW_INDEX: "0",
  // And of an effect: the picture it is run over, where in it a place is
  // read, and how big it and what is drawn into are.
  INPUT: "qt_u_input",
  INPUT_UV: "qt_v_input",
  TEXTURE_UV: "qt_v_texture",
  INPUT_SIZE: "qt_u_inputSize",
  OUTPUT_SIZE: "qt_u_outputSize",
  FRAME: "qt_u_frame",
};

// The functions a piece may have, what each is called here, and what Qt
// hands it: said by Qt, not by the piece.
const CALLED = {
  MAIN: "qt_customMain",
  DIRECTIONAL_LIGHT: "qt_directionalLightProcessor",
  POINT_LIGHT: "qt_pointLightProcessor",
  SPOT_LIGHT: "qt_spotLightProcessor",
  AMBIENT_LIGHT: "qt_ambientLightProcessor",
  SPECULAR_LIGHT: "qt_specularLightProcessor",
  POST_PROCESS: "qt_customPostProcessor",
  IBL_PROBE: "qt_iblProbeProcessor",
};

const CORNER =
  "inout vec3 VERTEX, inout vec3 NORMAL, inout vec2 UV0, inout vec2 UV1, inout vec3 TANGENT, inout vec3 BINORMAL, inout ivec4 JOINTS, inout vec4 WEIGHTS, inout vec4 COLOR, inout mat4 INSTANCE_MODEL_MATRIX, inout mat4 INSTANCE_MODELVIEWPROJECTION_MATRIX";

const HANDED = {
  MAIN: "inout vec4 BASE_COLOR, inout vec3 EMISSIVE_COLOR, inout float METALNESS, inout float ROUGHNESS, inout float SPECULAR_AMOUNT, inout float FRESNEL_POWER, inout vec3 NORMAL, inout vec3 TANGENT, inout vec3 BINORMAL, in vec2 UV0, in vec2 UV1, in vec3 VIEW_VECTOR, inout float IOR, inout float OCCLUSION_AMOUNT",
  DIRECTIONAL_LIGHT: "inout vec3 DIFFUSE, in vec3 LIGHT_COLOR, in float SHADOW_CONTRIB, in vec3 TO_LIGHT_DIR, in vec3 NORMAL, in vec4 BASE_COLOR, in float METALNESS, in float ROUGHNESS, in vec3 VIEW_VECTOR",
  POINT_LIGHT: "inout vec3 DIFFUSE, in vec3 LIGHT_COLOR, in float LIGHT_ATTENUATION, in float SHADOW_CONTRIB, in vec3 TO_LIGHT_DIR, in vec3 NORMAL, in vec4 BASE_COLOR, in float METALNESS, in float ROUGHNESS, in vec3 VIEW_VECTOR",
  SPOT_LIGHT:
    "inout vec3 DIFFUSE, in vec3 LIGHT_COLOR, in float LIGHT_ATTENUATION, in float SPOT_FACTOR, in float SHADOW_CONTRIB, in vec3 TO_LIGHT_DIR, in vec3 NORMAL, in vec4 BASE_COLOR, in float METALNESS, in float ROUGHNESS, in vec3 VIEW_VECTOR",
  AMBIENT_LIGHT: "inout vec3 DIFFUSE, in vec3 TOTAL_AMBIENT_COLOR, in vec3 NORMAL, in vec3 VIEW_VECTOR",
  SPECULAR_LIGHT:
    "inout vec3 SPECULAR, in vec3 LIGHT_COLOR, in float LIGHT_ATTENUATION, in float SHADOW_CONTRIB, in vec3 FRESNEL_CONTRIB, in vec3 TO_LIGHT_DIR, in vec3 NORMAL, in vec4 BASE_COLOR, in float METALNESS, in float ROUGHNESS, in float SPECULAR_AMOUNT, in vec3 VIEW_VECTOR",
  POST_PROCESS: "inout vec4 COLOR_SUM, in vec4 DIFFUSE, in vec3 SPECULAR, in vec3 EMISSIVE, in vec2 UV0, in vec2 UV1",
  IBL_PROBE: "inout vec3 DIFFUSE, inout vec3 SPECULAR, in vec4 BASE_COLOR, in float AO_FACTOR, in float SPECULAR_AMOUNT, in float ROUGHNESS, in vec3 NORMAL, in vec3 VIEW_VECTOR, in mat3 IBL_ORIENTATION",
};

// What Qt's words in a piece are: all of them, for what asks whether it
// reads what is behind it, or says where its corners go.
export function mentioned(source) {
  return new Set(String(source ?? "").match(/\b[A-Z][A-Z0-9_]+\b/g));
}

// A piece with Qt's words put for what they are here: its text, which of
// the functions it has, and what it hands from one shader to the other.
// `takes` is what each function is handed, or nothing for what Qt hands
// nothing.
function worded(source, corners, takes) {
  const all = words(conditioned(source, { QSHADER_VIEW_COUNT: 1 }));
  const code = all.filter((word) => word.kind !== "space" && word.kind !== "line");
  const has = new Set();
  const handed = [];
  code.forEach((word, index) => {
    const { text } = word;
    if (word.kind !== "name" || code[index - 1]?.text === ".") return;
    if (text === "VARYING") {
      word.text = corners ? "out" : "in";
      let end = index + 1;
      while (code[end] && code[end].text !== ";") end++;
      handed.push({ name: code[end - 1]?.text, said: all.slice(all.indexOf(word) + 1, all.indexOf(code[end])).map((each) => each.text).join("").trim() });
    } else if (CALLED[text] && code[index - 1]?.text === "void" && code[index + 1]?.text === "(") {
      // What a function is handed is not said by the piece.
      has.add(text);
      word.text = CALLED[text];
      let end = index + 2;
      while (code[end] && code[end].text !== ")") code[end++].text = "";
      code[index + 1].text = `(${takes(text)}`;
    } else if (Object.hasOwn(NAMES, text)) word.text = NAMES[text];
  });
  return { text: all.map((word) => word.text).join(""), has, handed };
}

// What both shaders are told besides what the renderer's own are.
const BOTH = `
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat4 u_seen;
uniform mat4 u_unprojected;
uniform vec3 u_looking;
uniform vec2 u_clips;
uniform highp sampler2D u_screen;
uniform highp sampler2D u_depth;
uniform highp sampler2D u_white;
`;

const CORNERS = `
layout(location = 13) in vec4 inst_data;
uniform vec3 u_eye;
uniform vec4 u_probing;
${BOTH}`;

const PIXELS = `
uniform mat4 u_all;
uniform mat4 u_world;
uniform mat3 u_facing;
uniform bool u_instanced;
${BOTH}
vec3 sRGBToLinear(vec3 c) {
    return toLinear(c);
}

vec4 sRGBToLinear(vec4 c) {
    return vec4(toLinear(c.rgb), c.a);
}

vec3 linearTosRGB(vec3 c) {
    return toScreen(c);
}

vec4 linearTosRGB(vec4 c) {
    return vec4(toScreen(c.rgb), c.a);
}
`;

// Where a corner goes: as the renderer's own shader puts it, with the
// piece asked first, of the corner as the mesh has it. A piece that says
// itself where the corner is on the screen is not said otherwise.
const corner = (has, placed) => `
void main() {
    customGlobals();
    vec3 vertex = attr_pos;
    vec3 facing = attr_norm;
    vec2 uv0 = attr_uv0;
    vec2 uv1 = attr_uv1;
    vec3 tangent = attr_textan;
    vec3 binormal = attr_binormal;
    ivec4 joints = ivec4(attr_joints);
    vec4 weights = attr_weights;
    vec4 color = attr_color;
    mat4 world = u_world;
    mat3 turn = u_facing;
    mat4 all = u_all;
    if (u_instanced) {
        world = u_above * transpose(mat4(inst_row0, inst_row1, inst_row2, vec4(0.0, 0.0, 0.0, 1.0))) * u_world;
        turn = transpose(inverse(mat3(world)));
        all = u_all * world;
        color *= inst_color;
    }
    gl_PointSize = u_point;
    ${has.has("MAIN") ? "customMain(vertex, facing, uv0, uv1, tangent, binormal, joints, weights, color, world, all);" : ""}
    vec4 position = vec4(vertex, 1.0);
    if (u_skinned && weights != vec4(0.0)) {
        mat4 moved = bone(joints.x * 2) * weights.x + bone(joints.y * 2) * weights.y + bone(joints.z * 2) * weights.z + bone(joints.w * 2) * weights.w;
        position = moved * position;
        facing = (mat3(bone(joints.x * 2 + 1)) * weights.x + mat3(bone(joints.y * 2 + 1)) * weights.y + mat3(bone(joints.z * 2 + 1)) * weights.z + mat3(bone(joints.w * 2 + 1)) * weights.w) * facing;
        tangent = mat3(moved) * tangent;
        binormal = mat3(moved) * binormal;
    }
    v_color = color;
    v_position = (world * position).xyz;
    v_normal = normalize(turn * facing);
    v_tangent = mat3(world) * tangent;
    v_binormal = mat3(world) * binormal;
    v_uv = uv0;
    v_uv1 = uv1;
    ${placed ? "" : "gl_Position = all * position;"}
}
`;

// What is not lit is the colour its piece says, as it says it.
const unlit = (has) => `
void main() {
    customGlobals();
    fragColor = vec4(1.0);
    ${has.has("MAIN") ? "customMain();" : ""}
}
`;

// What is lit, by Qt's sums for a PrincipledMaterial: the piece says what
// the surface is, and each light gives it what the piece's function for
// that light says, or what Qt's own would. How far the sum is seen through
// is written as it is, and not times the colour as the renderer's own
// shader writes it: nothing is seen through a CustomMaterial that does not
// say how it is blended.
const lit = (has) => `
void main() {
    customGlobals();
    vec4 custom = vec4(1.0);
    vec3 given = vec3(0.0);
    float metalness = 0.0;
    float roughness = 0.0;
    float specular = 0.5;
    float power = 5.0;
    float ior = 1.5;
    float reached = 1.0;
    float side = u_sided && !gl_FrontFacing ? -1.0 : 1.0;
    vec3 N = normalize(v_normal) * side;
    vec3 T = normalize(v_tangent) * side;
    vec3 B = normalize(v_binormal) * side;
    vec3 V = normalize(u_eye - v_position);
    ${has.has("MAIN") ? "customMain(custom, given, metalness, roughness, specular, power, N, T, B, v_uv, v_uv1, V, ior, reached);" : ""}
    vec4 base = custom * (u_colors ? v_color : vec4(1.0));
    float alpha = base.a * u_opacity;
    vec3 diffuse = vec3(0.0);
    vec3 shine = vec3(0.0);
    vec3 dim = u_ambient * (1.0 - metalness) * base.rgb;
    ${has.has("AMBIENT_LIGHT") ? "ambientLightProcessor(diffuse, dim, N, V);" : "diffuse = dim;"}
    float bent = ((ior - 1.0) * (ior - 1.0)) / ((ior + 1.0) * (ior + 1.0));
    vec3 f0 = vec3(bent) * (1.0 - metalness) + base.rgb * metalness;
    float NdotV = clamp(dot(N, V), 0.0, 1.0);
    float edge = power == 0.0 ? 1.0 : pow(1.0 - NdotV, power);
    vec3 turning = f0 + (max(vec3(1.0 - roughness), f0) - f0) * edge;
    vec3 amount = vec3(metalness + specular * (1.0 - metalness)) * clamp(turning, 0.0, 1.0);
    for (int index = 0; index < u_count; index++) {
        vec3 L = -u_lightWay[index];
        float fade = 1.0;
        float kind = u_lightPlace[index].w;
        // Qt takes what is metal out of the light here, and out of the sum
        // of them once more below.
        vec3 less = u_lightColor[index] * (1.0 - metalness);
        if (kind < 0.5) {
            ${has.has("DIRECTIONAL_LIGHT") ? "directionalLightProcessor(diffuse, less, 1.0, L, N, custom, metalness, roughness, V);" : "diffuse += base.rgb * less * burley(N, L, V, roughness);"}
        } else {
            vec3 to = u_lightPlace[index].xyz - v_position;
            float far = max(length(to), 0.000001);
            L = to / far;
            vec3 by = u_lightFade[index];
            fade = 1.0 / (by.x + by.y * far + by.z * far * far);
            if (kind < 1.5) {
                ${has.has("POINT_LIGHT") ? "pointLightProcessor(diffuse, less, fade, 1.0, L, N, custom, metalness, roughness, V);" : "diffuse += base.rgb * less * fade * burley(N, L, V, roughness);"}
            } else {
                vec2 cone = u_lightCone[index];
                float spot = smoothstep(cone.x, max(cone.y, cone.x + 0.0001), dot(-L, u_lightWay[index]));
                if (spot > 0.0) {
                    ${has.has("SPOT_LIGHT") ? "spotLightProcessor(diffuse, less, fade, spot, 1.0, L, N, custom, metalness, roughness, V);" : "diffuse += base.rgb * less * fade * spot * burley(N, L, V, roughness);"}
                }
                fade *= spot;
            }
        }
        ${has.has("SPECULAR_LIGHT") ? "specularLightProcessor(shine, u_lightColor[index], fade, 1.0, amount, L, N, custom, metalness, roughness, specular, V);" : "shine += u_lightColor[index] * fade * ggx(N, L, V, f0, roughness);"}
    }
    diffuse *= reached;
    if (u_probing.x > 0.5 && u_probing.w >= 0.005) {
        vec3 about = vec3(0.0);
        vec3 back = vec3(0.0);
        ${
          has.has("IBL_PROBE")
            ? "iblProbeProcessor(about, back, custom, reached, specular, roughness, N, V, u_probeTurn);"
            : `about = base.rgb * (1.0 - amount) * around(N);
        back = mirrored(N, V, amount, roughness);`
        }
        diffuse += about * reached;
        shine += back * reached;
    }
    diffuse *= 1.0 - metalness;
    if (u_fogDepth.w + u_fogHeight.w > 0.5) fogged(given, shine, diffuse);
    vec4 sum = vec4(diffuse + shine + given, alpha);
    ${has.has("POST_PROCESS") ? "customPostProcessor(sum, vec4(diffuse, alpha), shine, given, v_uv, v_uv1);" : ""}
    fragColor = vec4(tonemap(sum.rgb), sum.a);
}
`;

// The renderer's own shader as far as its `main`, with what a piece is
// told besides, and what reads a piece knowing all of it.
const heads = new Map();
function head(own, more) {
  let made = heads.get(own);
  if (!made) {
    const text = prefixed(own.slice(0, own.lastIndexOf("void main()")).replace("precision highp float;", "precision highp float;\nprecision highp int;") + more);
    const reader = new Reader();
    reader.declare(text);
    heads.set(own, (made = { text, reader }));
  }
  return made;
}

// One of the two shaders: the head, what the material hands the piece, the
// piece fitted for a browser, and the `main` that calls it.
function whole({ text, reader }, declared, extra, piece, main) {
  const reading = reader.fork();
  reading.declare(`${declared}\n${extra}`);
  const fitted = reading.fitted(piece);
  return `${text}\n${declared}\n${extra}\n${fitted.text}\nvoid qt_customGlobals() {\n${fitted.begun.join("\n")}\n}\n${prefixed(main)}`;
}

// The two shaders a CustomMaterial draws with. `own` is the renderer's
// (`{ vertex, fragment }`); `declared` is what the material's properties
// are to its pieces.
export function customised(own, { vertex, fragment, shaded, declared }) {
  const corners = worded(vertex, true, () => CORNER);
  const pixels = worded(fragment, false, (name) => (shaded ? HANDED[name] : ""));
  // What one shader reads of the other, the other hands it: nothing, where
  // its piece says nothing of it.
  const missing = pixels.handed.filter((read) => !corners.handed.some((written) => written.name === read.name)).map((read) => `out ${read.said};`);
  return {
    vertex: whole(head(own.vertex, CORNERS), declared, missing.join("\n"), corners.text, corner(corners.has, mentioned(vertex).has("POSITION"))),
    fragment: whole(head(own.fragment, PIXELS), declared, "", pixels.text, shaded ? lit(pixels.has) : unlit(pixels.has)),
  };
}
