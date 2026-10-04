// Effect and what one is made of: the shaders it runs over the picture of a
// scene once that is drawn (Shader), in what order and into what (Pass,
// Buffer), and what each is handed (BufferInput, SetUniformValue). Also
// TextureInput, by which an effect or a material names a picture one of
// its shaders reads.
//
// Not here: any of it being run. Each holds what it is told, and a scene
// with effects is drawn as it is without them. What an
// ExtendedSceneEnvironment does to a picture is in the renderer itself.
import { defineType } from "../object.js";
import { Object3D } from "./Node.js";

export const TextureInput = defineType("TextureInput", Object3D, {
  properties: {
    texture: null,
    enabled: true,
  },
});

const FORMATS = { Unknown: 0, RGBA8: 1, RGBA16F: 2, RGBA32F: 3, R8: 4, R16: 5, R16F: 6, R32F: 7 };

export const Buffer = defineType("Buffer", Object3D, {
  properties: {
    format: FORMATS.RGBA8,
    textureFilterOperation: 2,
    textureCoordOperation: 1,
    sizeMultiplier: 1,
    bufferFlags: 0,
    name: "",
  },
  // `Unknown` is the first of each of the three it is an answer to.
  enums: { ...FORMATS, Nearest: 1, Linear: 2, ClampToEdge: 1, MirroredRepeat: 2, Repeat: 3, None: 0, SceneLifetime: 1 },
});

export const Command = defineType("Command", Object3D, {});

export const BufferInput = defineType("BufferInput", Command, {
  properties: {
    buffer: null,
    sampler: "",
  },
});

export const SetUniformValue = defineType("SetUniformValue", Command, {
  properties: {
    target: "",
    value: undefined,
  },
});

export const Shader = defineType("Shader", Object3D, {
  properties: {
    shader: "",
    stage: 1,
  },
  enums: { Vertex: 0, Fragment: 1 },
});

export const Pass = defineType("Pass", Object3D, {
  properties: {
    commands: undefined,
    output: null,
    shaders: undefined,
  },
});

export const Effect = defineType("Effect", Object3D, {
  properties: {
    passes: undefined,
  },
});
