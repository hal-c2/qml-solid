// CustomMaterial: a material drawn by shaders of the scene's own.
//
// It names two files, each a piece of a shader as Qt has them written
// (`shaders.js` says how), and whether what they draw is lit as a
// PrincipledMaterial is (`Shaded`) or is the colour they say (`Unshaded`).
// What the shaders are handed besides is the material's own properties,
// those its QML declares: each is a uniform of its name, of the type Qt
// makes of the property's (a `real` a `float`, a `color` a `vec4` in linear
// light, a `TextureInput` a `sampler2D`).
//
// Nothing is seen through what one draws unless it says how it is blended
// (`sourceBlend` and `destinationBlend`, both), whatever the opacity of its
// model: Qt has it so.
//
// Not here: lines of any width but one (`lineWidth`), which a browser does
// not draw, and a property with no value of a type that says nothing of
// what it would be (`property vector2d wind` alone), which is no uniform
// until it has one.
import { defineType, kinds, located, slot } from "../object.js";
import { Matrix4x4, Point, Quaternion, Rect, Size, Vector2d, Vector3d, Vector4d } from "../QtQml/values.js";
import { Color } from "../QtQuick/color.js";
import { TextureInput } from "./effects.js";
import { file, linear, Material } from "./scene.js";
import { mentioned } from "./shaders.js";

const Unshaded = 0;
const Shaded = 1;

// Qt's numbers for how what is drawn is put over what is there.
const BLENDS = {
  NoBlend: 0,
  Zero: 1,
  One: 2,
  SrcColor: 3,
  OneMinusSrcColor: 4,
  DstColor: 5,
  OneMinusDstColor: 6,
  SrcAlpha: 7,
  OneMinusSrcAlpha: 8,
  DstAlpha: 9,
  OneMinusDstAlpha: 10,
  ConstantColor: 11,
  OneMinusConstantColor: 12,
  ConstantAlpha: 13,
  OneMinusConstantAlpha: 14,
  SrcAlphaSaturate: 15,
};

const decoder = new TextDecoder();
const warned = new Set();

// The text of a shader file: nothing where none is named, null until it is
// here.
function text(url, self) {
  const given = String(url ?? "");
  if (!given) return "";
  const at = located(given);
  const read = file(at, "text", (buffer) => decoder.decode(buffer)).state();
  if (read?.error) {
    if (!warned.has(at)) console.warn(`${self.$type.typeName}: ${at}: ${read.error}`);
    warned.add(at);
    return "";
  }
  return read;
}

// What a property is to a shader: the type of its uniform and the numbers
// handed over, or nothing for what a shader cannot be handed. A picture is
// handed as its TextureInput.
export function uniform(kind, value) {
  if (kind === kinds.bool || typeof value === "boolean") return { type: "bool", value: value ? 1 : 0 };
  if (kind === kinds.int) return { type: "int", value: Number(value) | 0 };
  if (kind === kinds.real || typeof value === "number") return { type: "float", value: Number(value) || 0 };
  // A colour is in linear light to a shader, as it is to a material.
  if (kind === kinds.color || value instanceof Color) return { type: "vec4", value: linear(value) };
  if (value instanceof Vector2d) return { type: "vec2", value: [value.x, value.y] };
  if (value instanceof Vector3d) return { type: "vec3", value: [value.x, value.y, value.z] };
  if (value instanceof Vector4d) return { type: "vec4", value: [value.x, value.y, value.z, value.w] };
  if (value instanceof Quaternion) return { type: "vec4", value: [value.x, value.y, value.z, value.scalar] };
  if (value instanceof Rect) return { type: "vec4", value: [value.x, value.y, value.width, value.height] };
  if (value instanceof Size) return { type: "vec2", value: [value.width, value.height] };
  if (value instanceof Point) return { type: "vec2", value: [value.x, value.y] };
  if (value instanceof Matrix4x4) {
    const m = value;
    return { type: "mat4", value: [m.m11, m.m21, m.m31, m.m41, m.m12, m.m22, m.m32, m.m42, m.m13, m.m23, m.m33, m.m43, m.m14, m.m24, m.m34, m.m44] };
  }
  if (value?.$type?.chain.includes(TextureInput)) return { type: "sampler2D", value };
  return null;
}

// The properties an object's QML declares, which are those of the types
// after `Type` in what it is: every one, in the order they are declared.
const owned = new WeakMap();
export function declared(self, Type) {
  let names = owned.get(self.$type);
  if (!names) {
    const { chain } = self.$type;
    names = [...new Set(chain.slice(chain.indexOf(Type) + 1).flatMap((type) => Object.keys(type.spec.properties ?? {})))];
    owned.set(self.$type, names);
  }
  return names;
}

// What an object's own properties are to its shaders: `uniforms`, each a
// name, a type and a value, where a picture's value is what the renderer
// reads of its texture, or null for one that has none (which reads as
// black, nothing seen through it). `waiting` is whether a picture is not
// here yet.
export function handed(self, Type) {
  const uniforms = [];
  let waiting = false;
  for (const name of declared(self, Type)) {
    const value = self[name];
    const told = uniform(slot(self, name)?.kind, value);
    if (!told) continue;
    if (told.type === "sampler2D") {
      const texture = value.enabled ? value.texture : null;
      told.value = texture?.$texture?.() ?? null;
      if (texture && !told.value) waiting = true;
    }
    uniforms.push({ name, ...told });
  }
  return { uniforms, waiting };
}

// How uniforms are declared to a shader.
export const declaration = (uniforms) => uniforms.map(({ name, type }) => `uniform ${type === "sampler2D" ? "highp sampler2D" : type} ${name};`).join("\n");

// The shaders of a material, once for all that have the same: what the
// renderer makes a program of, and keeps it by.
const sources = new Map();
function source(shaded, uniforms, vertex, fragment) {
  const told = declaration(uniforms);
  const key = [shaded ? 1 : 0, told, vertex, fragment].join("\u0000");
  let made = sources.get(key);
  if (!made) {
    const words = mentioned(`${vertex}\n${fragment}`);
    made = {
      vertex,
      fragment,
      shaded,
      declared: told,
      samplers: uniforms.filter(({ type }) => type === "sampler2D").map(({ name }) => name),
      colors: words.has("VAR_COLOR"),
      screen: words.has("SCREEN_TEXTURE") || words.has("SCREEN_MIP_TEXTURE"),
      mips: words.has("SCREEN_MIP_TEXTURE"),
      depth: words.has("DEPTH_TEXTURE"),
    };
    sources.set(key, made);
  }
  return made;
}

export const CustomMaterial = defineType("CustomMaterial", Material, {
  properties: {
    shadingMode: Shaded,
    fragmentShader: "",
    vertexShader: "",
    sourceBlend: 0,
    destinationBlend: 0,
    sourceAlphaBlend: 0,
    destinationAlphaBlend: 0,
    alwaysDirty: false,
    lineWidth: 1,
  },
  enums: { Unshaded, Shaded, ...BLENDS },
  setup(self) {
    self.$material = () => {
      const vertex = text(self.vertexShader, self);
      const fragment = text(self.fragmentShader, self);
      const { uniforms, waiting } = handed(self, CustomMaterial);
      if (vertex === null || fragment === null) return { waiting: true };
      const shaded = self.shadingMode !== Unshaded;
      const made = source(shaded, uniforms, vertex, fragment);
      // Blended only where both say how; how much of it is there is
      // blended as its colour is unless that is said too.
      const from = self.sourceBlend;
      const to = self.destinationBlend;
      const blend = from && to ? [from, to, self.sourceAlphaBlend || from, self.destinationAlphaBlend || to] : null;
      return {
        // What the renderer hands every shader, for the one this is drawn
        // with besides its own.
        lit: shaded,
        color: [1, 1, 1, 1],
        map: null,
        maps: {},
        waiting,
        emissive: [0, 0, 0],
        specular: 0.5,
        metalness: 0,
        ior: 1.5,
        fresnel: 5,
        opacity: 1,
        colors: made.colors,
        cull: self.cullMode,
        blend: 0,
        principled: true,
        cutoff: -1,
        point: 1,
        custom: {
          source: made,
          uniforms,
          blend,
          // What reads the picture of what is behind it is drawn after
          // that, as what is seen through is.
          through: Boolean(blend) || made.screen,
          depth: self.depthDrawMode,
        },
      };
    };
  },
});
