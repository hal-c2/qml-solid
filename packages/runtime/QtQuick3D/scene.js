// What is in a scene besides nodes: the shapes drawn (Model), what they are
// drawn with (materials and textures), what lights them and what looks at
// them, and how the whole is to be shown (SceneEnvironment).
//
// These say what there is; `render.js` draws it.
//
// Not here: shadows, a light's `scope`, light probes and sky boxes, and of a
// PrincipledMaterial what only a reflected surrounding shows (it is lit by
// the lights alone). Of a material's pictures: a height map moves nothing,
// nothing is let through (`transmissionFactor` and its maps), a specular
// map and a translucency map are not read, a picture is read whole where
// Qt can read one channel of it (`baseColorSingleChannelEnabled` and the
// like), and the colours of a mesh's corners mask nothing.
import { createSignal } from "solid-js";
import { defineType, derived, flush, located } from "../object.js";
import { Vector3d } from "../QtQml/values.js";
import { color } from "../QtQuick/color.js";
import * as math from "./math.js";
import { read } from "./mesh.js";
import { Node, Object3D } from "./Node.js";
import { primitive } from "./primitives.js";

const WRITABLE = { ownedWrite: true };

// A colour as Qt lights with it: its channels in linear light, by Qt's own
// sum, and its alpha as it is.
export function linear(value) {
  const { r, g, b, a } = color(value);
  const one = (c) => c * (c * (c * 0.305306011 + 0.682171111) + 0.012522878);
  return [one(r), one(g), one(b), a];
}

// A file, once read: one record for everything that names it. `state()` is
// null until it is here, then what `took` made of it, or `{ error }`.
const files = new Map();
function file(url, kind, took) {
  const key = `${kind} ${url}`;
  let record = files.get(key);
  if (record) return record;
  const [state, setState] = createSignal(null, WRITABLE);
  files.set(key, (record = { state }));
  fetch(url)
    .then((answer) => (answer.ok ? answer.arrayBuffer() : Promise.reject(new Error(`${answer.status}`))))
    .then((buffer) => setState(took(buffer)))
    .catch((error) => setState({ error: `could not be read: ${error.message}` }))
    .then(() => flush());
  return record;
}

const PRIMITIVE = /#(Cube|Sphere|Cylinder|Cone|Rectangle)$/;

// The shape a Model's `source` names: one of Qt's own (`#Cube`), or a mesh
// file. Null until it is here.
const warned = new Set();
function shape(source) {
  const given = String(source ?? "");
  if (!given) return null;
  const own = given.match(PRIMITIVE);
  if (own) return primitive(own[1]);
  const url = located(given);
  const mesh = file(url, "mesh", read).state();
  if (mesh?.error) {
    if (!warned.has(url)) console.warn(`Model: ${url}: ${mesh.error}`);
    warned.add(url);
    return null;
  }
  return mesh;
}

// A picture, likewise: once it has loaded, the element, and whether any of
// it is seen through, which Qt looks a picture over for too.
const pictures = new Map();
function picture(url) {
  let record = pictures.get(url);
  if (!record) {
    const [ready, setReady] = createSignal(false, WRITABLE);
    const element = new Image();
    pictures.set(url, (record = { element, ready, sheer: false }));
    element.crossOrigin = "anonymous";
    element.onload = () => {
      record.sheer = seenThrough(element);
      setReady(true);
      flush();
    };
    element.onerror = () => console.warn(`Texture: ${url} could not be read`);
    element.src = url;
  }
  return record.ready() ? record : null;
}

function seenThrough(element) {
  const { naturalWidth: width, naturalHeight: height } = element;
  if (!width || !height) return false;
  const paper = new OffscreenCanvas(width, height).getContext("2d");
  paper.drawImage(element, 0, 0);
  const { data } = paper.getImageData(0, 0, width, height);
  for (let at = 3; at < data.length; at += 4) if (data[at] < 255) return true;
  return false;
}

const list = (value) => (value == null ? [] : Array.isArray(value) ? value : [value]);

export const Model = defineType("Model", Node, {
  properties: {
    source: "",
    materials: undefined,
    geometry: null,
    instancing: null,
    instanceRoot: null,
    skeleton: null,
    skin: null,
    morphTargets: undefined,
    inverseBindPoses: undefined,
    castsShadows: true,
    receivesShadows: true,
    castsReflections: true,
    receivesReflections: false,
    pickable: false,
    depthBias: 0,
    usedInBakedLighting: false,
    lightmapBaseResolution: 1024,
    bakedLightmap: null,
    instancingLodMin: -1,
    instancingLodMax: -1,
    levelOfDetailBias: 1,
    // The box the shape fits in, in the model's own space.
    bounds: derived((self) => {
      const subsets = self.$shape()?.subsets ?? [];
      const minimum = [0, 0, 0];
      const maximum = [0, 0, 0];
      subsets.forEach(({ min, max }, index) => {
        for (let axis = 0; axis < 3; axis++) {
          minimum[axis] = index ? Math.min(minimum[axis], min[axis]) : min[axis];
          maximum[axis] = index ? Math.max(maximum[axis], max[axis]) : max[axis];
        }
      });
      return { minimum: math.vector(minimum), maximum: math.vector(maximum) };
    }),
  },
  setup(self) {
    self.$model = true;
    self.$shape = () => self.geometry?.$shape?.() ?? shape(self.source);
    self.$materials = () => list(self.materials);
    // What bends it: a skin's joints, else a skeleton's with the poses the
    // model has for them.
    self.$bones = () => (self.skin ? (self.skin.$bones?.() ?? null) : (self.skeleton?.$bones?.(list(self.inverseBindPoses)) ?? null));
  },
});

const ClampToEdge = 1;
const MirroredRepeat = 2;
const Repeat = 3;
const Nearest = 1;
const Linear = 2;

export const Texture = defineType("Texture", Object3D, {
  properties: {
    source: "",
    sourceItem: null,
    textureData: null,
    textureProvider: null,
    scaleU: 1,
    scaleV: 1,
    mappingMode: 0,
    tilingModeHorizontal: Repeat,
    tilingModeVertical: Repeat,
    tilingModeDepth: Repeat,
    rotationUV: 0,
    positionU: 0,
    positionV: 0,
    pivotU: 0,
    pivotV: 0,
    flipU: false,
    flipV: false,
    indexUV: 0,
    magFilter: Linear,
    minFilter: Linear,
    mipFilter: 0,
    generateMipmaps: false,
    autoOrientation: true,
  },
  enums: { UV: 0, Environment: 1, LightProbe: 2, ClampToEdge, MirroredRepeat, Repeat, None: 0, Nearest, Linear },
  setup(self) {
    // What the renderer needs of it: the picture once it is here, how it
    // is sampled, and where in it a corner's coordinates are, as Qt places
    // them: flipped, moved, then turned and scaled about the pivot.
    self.$texture = () => {
      const source = String(self.source ?? "");
      const loaded = source ? picture(located(source)) : null;
      const element = source ? loaded?.element : (self.sourceItem?.$canvas?.element ?? self.sourceItem?.$shader?.canvas ?? null);
      if (!element) return null;
      let transform = [...math.IDENTITY];
      const by = (m) => void (transform = math.multiply(transform, m));
      const move = (x, y) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, 0, 1];
      if (self.flipU) by([-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1]);
      if (self.flipV) by([1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1]);
      by(move(self.positionU, self.positionV));
      by(move(self.pivotU, self.pivotV));
      by(math.rotation(math.fromAxis(0, 0, 1, self.rotationUV)));
      by([self.scaleU, 0, 0, 0, 0, self.scaleV, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
      by(move(-self.pivotU, -self.pivotV));
      return {
        element,
        // A canvas may have been drawn on since, and may be seen through.
        live: !loaded,
        sheer: loaded ? loaded.sheer : true,
        horizontal: self.tilingModeHorizontal,
        vertical: self.tilingModeVertical,
        mag: self.magFilter,
        min: self.minFilter,
        mip: self.generateMipmaps ? self.mipFilter : 0,
        transform,
        index: self.indexUV,
      };
    };
  },
});

const BackFaceCulling = 1;
const FrontFaceCulling = 2;
const NoCulling = 3;

export const Material = defineType("Material", Object3D, {
  properties: {
    lightProbe: null,
    cullMode: BackFaceCulling,
    depthDrawMode: 0,
  },
  enums: {
    BackFaceCulling,
    FrontFaceCulling,
    NoCulling,
    R: 0,
    G: 1,
    B: 2,
    A: 3,
    OpaqueOnlyDepthDraw: 0,
    AlwaysDepthDraw: 1,
    NeverDepthDraw: 2,
    OpaquePrePassDepthDraw: 3,
  },
});

// The pictures a material reads besides its colour's: for each that is
// set, how it is sampled and which channel of it is read, which a property
// of the material says or is always the same one. `waiting` is
// whether any is not here yet.
function mapped(self, base, named) {
  const maps = {};
  let waiting = Boolean(base) && !base.$texture?.();
  for (const [name, [property, channel]] of Object.entries(named)) {
    const texture = self[property];
    if (!texture) continue;
    const map = texture.$texture?.();
    if (map) maps[name] = { ...map, channel: typeof channel === "string" ? self[channel] : (channel ?? 0) };
    else waiting = true;
  }
  return { map: base?.$texture?.() ?? null, maps, waiting };
}

const NoLighting = 0;
const FragmentLighting = 1;
const SHADING = { NoLighting, FragmentLighting, SourceOver: 0, Screen: 1, Multiply: 2 };

const vec = (value) => [Number(value?.x) || 0, Number(value?.y) || 0, Number(value?.z) || 0];

export const DefaultMaterial = defineType("DefaultMaterial", Material, {
  properties: {
    lighting: FragmentLighting,
    blendMode: 0,
    diffuseColor: "#ffffff",
    diffuseMap: null,
    emissiveFactor: new Vector3d(0, 0, 0),
    emissiveMap: null,
    specularReflectionMap: null,
    specularMap: null,
    specularModel: 0,
    specularTint: "#ffffff",
    indexOfRefraction: 1.45,
    fresnelPower: 0,
    specularAmount: 0,
    specularRoughness: 0,
    roughnessMap: null,
    opacity: 1,
    opacityMap: null,
    bumpMap: null,
    bumpAmount: 0,
    normalMap: null,
    translucencyMap: null,
    translucentFalloff: 0,
    diffuseLightWrap: 0,
    vertexColorsEnabled: false,
    pointSize: 1,
    lineWidth: 1,
  },
  enums: { ...SHADING, Default: 0, KGGX: 1 },
  setup(self) {
    self.$material = () => ({
      lit: self.lighting !== NoLighting,
      color: linear(self.diffuseColor),
      ...mapped(self, self.diffuseMap, {
        normal: ["normalMap"],
        bump: ["bumpMap"],
        emissive: ["emissiveMap"],
        opacity: ["opacityMap", 3],
      }),
      // How far a picture of the way it faces, or of heights, turns it.
      bump: self.bumpAmount,
      emissive: vec(self.emissiveFactor),
      // How much of a light a surface that faces between it and the eye
      // gives back, and how tight the spot of it is.
      specular: self.specularAmount,
      tint: linear(self.specularTint).slice(0, 3),
      shine: 2.56 / (self.specularRoughness + 0.01),
      metalness: 0,
      ior: self.indexOfRefraction,
      fresnel: self.fresnelPower,
      opacity: self.opacity,
      colors: self.vertexColorsEnabled,
      cull: self.cullMode,
      blend: self.blendMode,
      cutoff: -1,
      point: self.pointSize,
    });
  },
});

const Mask = 1;
const Blend = 2;
const Opaque = 3;

export const PrincipledMaterial = defineType("PrincipledMaterial", Material, {
  properties: {
    lighting: FragmentLighting,
    blendMode: 0,
    alphaMode: 0,
    alphaCutoff: 0.5,
    baseColor: "#ffffff",
    baseColorMap: null,
    metalness: 0,
    metalnessMap: null,
    metalnessChannel: 2,
    roughness: 0,
    roughnessMap: null,
    roughnessChannel: 1,
    specularAmount: 1,
    specularMap: null,
    specularTint: 0,
    specularReflectionMap: null,
    indexOfRefraction: 1.5,
    opacity: 1,
    opacityMap: null,
    opacityChannel: 3,
    invertOpacityMapValue: false,
    emissiveFactor: new Vector3d(0, 0, 0),
    emissiveMap: null,
    normalMap: null,
    normalStrength: 1,
    occlusionMap: null,
    occlusionAmount: 1,
    occlusionChannel: 0,
    heightMap: null,
    heightAmount: 0,
    heightChannel: 0,
    minHeightMapSamples: 8,
    maxHeightMapSamples: 32,
    clearcoatAmount: 0,
    clearcoatMap: null,
    clearcoatChannel: 0,
    clearcoatRoughnessAmount: 0,
    clearcoatRoughnessMap: null,
    clearcoatRoughnessChannel: 1,
    clearcoatNormalMap: null,
    clearcoatNormalStrength: 1,
    clearcoatFresnelPower: 5,
    clearcoatFresnelScaleBiasEnabled: false,
    clearcoatFresnelScale: 1,
    clearcoatFresnelBias: 0,
    fresnelScaleBiasEnabled: false,
    fresnelScale: 1,
    fresnelBias: 0,
    baseColorSingleChannelEnabled: false,
    baseColorChannel: 0,
    specularSingleChannelEnabled: false,
    specularChannel: 0,
    emissiveSingleChannelEnabled: false,
    emissiveChannel: 0,
    transmissionMap: null,
    transmissionChannel: 0,
    thicknessMap: null,
    thicknessChannel: 1,
    vertexColorsMaskEnabled: false,
    transmissionFactor: 0,
    thicknessFactor: 0,
    attenuationDistance: Infinity,
    attenuationColor: "#ffffff",
    fresnelPower: 5,
    vertexColorsEnabled: true,
    pointSize: 1,
    lineWidth: 1,
  },
  enums: { ...SHADING, Default: 0, Mask, Blend, Opaque },
  setup(self) {
    self.$material = () => {
      const mode = self.alphaMode;
      const [r, g, b, a] = linear(self.baseColor);
      return {
        lit: self.lighting !== NoLighting,
        color: [r, g, b, mode === Opaque ? 1 : a],
        ...mapped(self, self.baseColorMap, {
          normal: ["normalMap"],
          roughness: ["roughnessMap", "roughnessChannel"],
          metalness: ["metalnessMap", "metalnessChannel"],
          occlusion: ["occlusionMap", "occlusionChannel"],
          emissive: ["emissiveMap"],
          opacity: ["opacityMap", "opacityChannel"],
          coat: ["clearcoatMap", "clearcoatChannel"],
          coatRoughness: ["clearcoatRoughnessMap", "clearcoatRoughnessChannel"],
          coatNormal: ["clearcoatNormalMap"],
        }),
        bump: self.normalStrength,
        coat: self.clearcoatAmount,
        coatRoughness: self.clearcoatRoughnessAmount,
        coatBump: self.clearcoatNormalStrength,
        coatEdge: [self.clearcoatFresnelPower, ...(self.clearcoatFresnelScaleBiasEnabled ? [self.clearcoatFresnelScale, self.clearcoatFresnelBias] : [1, 0])],
        occlusion: self.occlusionAmount,
        inverted: self.invertOpacityMapValue,
        emissive: vec(self.emissiveFactor),
        // A surface that is not metal gives back a little of a light as it
        // is, or as much in its own colour as `specularTint` says, and a
        // metal all of it in its own colour. One that is neither metal nor
        // gives any back has no shine at all, nor has its coat.
        specular: self.specularAmount,
        tint: [r, g, b].map((c) => 1 + (c - 1) * self.specularTint),
        shiny: self.specularAmount > 0.01 || self.metalness > 0.01,
        roughness: self.roughness,
        metalness: self.metalness,
        principled: true,
        ior: self.indexOfRefraction,
        fresnel: self.fresnelPower,
        opacity: self.opacity,
        colors: self.vertexColorsEnabled,
        cull: self.cullMode,
        blend: self.blendMode,
        solid: mode === Opaque || mode === Mask,
        blended: mode === Blend,
        cutoff: mode === Mask ? self.alphaCutoff : -1,
        point: self.pointSize,
      };
    };
  },
});

// A light: its colour times how bright it is, and what it adds to every
// surface wherever that is (`ambientColor`).
export const Light = defineType("Light", Node, {
  properties: {
    color: "#ffffff",
    ambientColor: "#000000",
    brightness: 1,
    scope: null,
    castsShadow: false,
    shadowBias: 0,
    shadowFactor: 75,
    shadowMapQuality: 0,
    shadowMapFar: 5000,
    shadowFilter: 5,
    softShadowQuality: 1,
    pcfFactor: 2,
    bakeMode: 0,
  },
  enums: {
    ShadowMapQualityLow: 0,
    ShadowMapQualityMedium: 1,
    ShadowMapQualityHigh: 2,
    ShadowMapQualityVeryHigh: 3,
    ShadowMapQualityUltra: 4,
    Hard: 0,
    PCF4: 1,
    PCF8: 2,
    PCF16: 3,
    PCF32: 4,
    PCF64: 5,
    BakeModeDisabled: 0,
    BakeModeIndirect: 1,
    BakeModeAll: 2,
  },
  setup(self) {
    self.$light = () => {
      const world = self.$world();
      const by = self.brightness;
      const [r, g, b] = linear(self.color);
      return {
        kind: self.$lit,
        color: [r * by, g * by, b * by],
        ambient: linear(self.ambientColor).slice(0, 3),
        // A light shines along its own z, away from the eye.
        direction: math.normalized(math.turned(math.normal(world), 0, 0, -1)),
        position: world.slice(12, 15),
        fade: [clamped(self.constantFade ?? 1), clamped(self.linearFade ?? 0) * 0.01, clamped(self.quadraticFade ?? 1) * 0.0001],
        cone: Math.cos(((self.coneAngle ?? 360) * Math.PI) / 360),
        inner: Math.cos((Math.min(self.innerConeAngle ?? 360, self.coneAngle ?? 360) * Math.PI) / 360),
      };
    };
  },
});

const clamped = (fade) => Math.min(1000, Math.max(0, Number(fade) || 0));

export const DIRECTIONAL = 0;
export const POINT = 1;
export const SPOT = 2;

export const DirectionalLight = defineType("DirectionalLight", Light, {
  properties: { csmSplit1: 0, csmSplit2: 0.25, csmSplit3: 0.5, csmNumSplits: 0, csmBlendRatio: 0.05, lockShadowmapTexels: false },
  setup(self) {
    self.$lit = DIRECTIONAL;
  },
});

export const PointLight = defineType("PointLight", Light, {
  properties: { constantFade: 1, linearFade: 0, quadraticFade: 1 },
  setup(self) {
    self.$lit = POINT;
  },
});

export const SpotLight = defineType("SpotLight", Light, {
  properties: { constantFade: 1, linearFade: 0, quadraticFade: 1, coneAngle: 40, innerConeAngle: 30 },
  setup(self) {
    self.$lit = SPOT;
  },
});

// A camera: `$projection(width, height)` is what it sees of a view that
// size, as a matrix.
export const Camera = defineType("Camera", Node, {
  properties: {
    frustumCullingEnabled: false,
    lookAtNode: null,
    levelOfDetailBias: 1,
  },
  methods: {
    // Where in a view (0 to 1 across and down, the top left first) a place
    // in the scene is seen, and how far beyond the near plane it is.
    $seen(scene, width, height) {
      const projection = this.$projection(width, height);
      const all = math.multiply(projection, math.inverse(this.$world()) ?? math.IDENTITY);
      const [x, y, , w] = math.transform(all, scene.x, scene.y, scene.z);
      if (Math.abs(w) < 1e-12 || Number.isNaN(w)) return new Vector3d(0, 0, 0);
      const back = math.inverse(all);
      if (!back) return new Vector3d(0, 0, 0);
      const near = math.transform(back, x / w, y / w, -1);
      const far = math.transform(back, x / w, y / w, 0);
      if (Math.abs(near[3]) < 1e-12 || Math.abs(far[3]) < 1e-12) return new Vector3d(0, 0, 0);
      const from = near.slice(0, 3).map((value) => value / near[3]);
      const along = far.slice(0, 3).map((value, index) => value / far[3] - from[index]);
      const to = [scene.x - from[0], scene.y - from[1], scene.z - from[2]];
      const ahead = along[0] * to[0] + along[1] * to[1] + along[2] * to[2] > 0;
      return new Vector3d(x / w / 2 + 0.5, 1 - (y / w / 2 + 0.5), Math.hypot(...to) * (ahead ? 1 : -1));
    },
    // And the place in the scene that is seen there, that far beyond.
    $place(viewport, width, height) {
      const projection = this.$projection(width, height);
      const back = math.inverse(math.multiply(projection, math.inverse(this.$world()) ?? math.IDENTITY));
      if (!back) return new Vector3d(0, 0, 0);
      const x = viewport.x * 2 - 1;
      const y = (1 - viewport.y) * 2 - 1;
      const near = math.transform(back, x, y, -1);
      const far = math.transform(back, x, y, 0);
      if (Math.abs(near[3]) < 1e-12 || Math.abs(far[3]) < 1e-12) return new Vector3d(0, 0, 0);
      const from = near.slice(0, 3).map((value) => value / near[3]);
      const along = math.normalized(far.slice(0, 3).map((value, index) => value / far[3] - from[index]));
      return new Vector3d(from[0] + along[0] * viewport.z, from[1] + along[1] * viewport.z, from[2] + along[2] * viewport.z);
    },
    mapToViewport(scene) {
      return this.$seen(scene, this.$width ?? 1, this.$height ?? 1);
    },
    mapFromViewport(viewport) {
      return this.$place(viewport, this.$width ?? 1, this.$height ?? 1);
    },
    // Turns the camera to face a place in the scene, or a node.
    lookAt(target) {
      const scene = target?.$spatial ? target.scenePosition : target;
      const at = this.scenePosition;
      const forward = math.normalized([scene.x - at.x, scene.y - at.y, scene.z - at.z]);
      if (forward.every((value) => value === 0)) return;
      const up = Math.abs(forward[1]) > 0.99999 ? [0, 0, -Math.sign(forward[1])] : [0, 1, 0];
      const side = math.normalized([forward[1] * up[2] - forward[2] * up[1], forward[2] * up[0] - forward[0] * up[2], forward[0] * up[1] - forward[1] * up[0]]);
      const above = [side[1] * forward[2] - side[2] * forward[1], side[2] * forward[0] - side[0] * forward[2], side[0] * forward[1] - side[1] * forward[0]];
      const facing = [side[0], side[1], side[2], 0, above[0], above[1], above[2], 0, -forward[0], -forward[1], -forward[2], 0, 0, 0, 0, 1];
      const parent = this.parent?.$spatial ? math.unscaled(this.parent.$world()) : math.IDENTITY;
      const own = math.multiply(math.inverse([...parent.slice(0, 12), 0, 0, 0, 1]) ?? math.IDENTITY, facing);
      this.rotation = math.quaternion(math.turnOf(own));
    },
  },
  setup(self) {
    self.$camera = true;
  },
});

const Vertical = 0;
const Horizontal = 1;

export const PerspectiveCamera = defineType("PerspectiveCamera", Camera, {
  properties: {
    clipNear: 10,
    clipFar: 10000,
    fieldOfView: 60,
    fieldOfViewOrientation: Vertical,
  },
  enums: { Vertical, Horizontal },
  methods: {
    $projection(width, height) {
      const aspect = height > 0 ? width / height : 1;
      let degrees = this.fieldOfView;
      if (this.fieldOfViewOrientation === Horizontal) {
        degrees = (2 * Math.atan(Math.tan((degrees * Math.PI) / 360) / aspect) * 180) / Math.PI;
      }
      return math.perspective(degrees, aspect, this.clipNear, this.clipFar);
    },
  },
});

export const OrthographicCamera = defineType("OrthographicCamera", Camera, {
  properties: {
    clipNear: 10,
    clipFar: 10000,
    horizontalMagnification: 1,
    verticalMagnification: 1,
  },
  methods: {
    // A unit of the scene is a pixel of the view, times the magnification.
    $projection(width, height) {
      const across = width / 2 / (this.horizontalMagnification || 1);
      const down = height / 2 / (this.verticalMagnification || 1);
      return math.ortho(-across, across, -down, down, this.clipNear, this.clipFar);
    },
  },
});

export const FrustumCamera = defineType("FrustumCamera", PerspectiveCamera, {
  properties: { top: 0, bottom: 0, right: 0, left: 0 },
  methods: {
    $projection() {
      return math.frustum(this.left, this.right, this.bottom, this.top, this.clipNear, this.clipFar);
    },
  },
});

export const CustomCamera = defineType("CustomCamera", Camera, {
  properties: { projection: undefined },
  methods: {
    $projection() {
      return math.columns(this.projection);
    },
  },
});

const Transparent = 0;
const Color = 2;
const NoAA = 0;

export const SceneEnvironment = defineType("SceneEnvironment", Object3D, {
  properties: {
    antialiasingMode: NoAA,
    antialiasingQuality: 4,
    temporalAAEnabled: false,
    temporalAAStrength: 0.3,
    specularAAEnabled: false,
    backgroundMode: Transparent,
    clearColor: "#000000",
    depthTestEnabled: true,
    depthPrePassEnabled: false,
    aoEnabled: false,
    aoStrength: 0,
    aoDistance: 5,
    aoSoftness: 50,
    aoDither: false,
    aoSampleRate: 2,
    aoBias: 0,
    lightProbe: null,
    probeExposure: 1,
    probeHorizon: 0,
    probeOrientation: new Vector3d(0, 0, 0),
    skyBoxCubeMap: null,
    skyboxBlurAmount: 0,
    tonemapMode: 1,
    effects: undefined,
    lightmapper: null,
    debugSettings: null,
    scissorRect: null,
    fog: null,
    gridEnabled: false,
    gridScale: 1,
    gridFlags: 0,
    oitMethod: 0,
  },
  enums: {
    NoAA,
    SSAA: 1,
    MSAA: 2,
    ProgressiveAA: 3,
    Medium: 2,
    High: 4,
    VeryHigh: 8,
    Transparent,
    Unspecified: 1,
    Color,
    SkyBox: 3,
    SkyBoxCubeMap: 4,
    TonemapModeNone: 0,
    TonemapModeLinear: 1,
    TonemapModeAces: 2,
    TonemapModeHejlDawson: 3,
    TonemapModeFilmic: 4,
    OITNone: 0,
    OITWeightedBlended: 1,
    OITLinkedList: 2,
  },
  setup(self) {
    self.$environment = () => {
      const { r, g, b, a } = color(self.clearColor);
      const filled = self.backgroundMode === Color;
      return {
        clear: filled ? [r * a, g * a, b * a, a] : [0, 0, 0, 0],
        // Smoothed edges: each pixel drawn several times over. The other
        // ways Qt has of it are drawn this way too.
        samples: self.antialiasingMode === NoAA ? 0 : self.antialiasingQuality,
        tonemap: self.tonemapMode,
        depth: self.depthTestEnabled,
      };
    };
  },
});
