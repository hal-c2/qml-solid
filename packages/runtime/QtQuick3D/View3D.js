// View3D: the item a scene in space is seen in. The nodes declared inside
// it are the scene, a camera among them is what it is seen through, and the
// items declared inside it lie over the picture as in any item.
//
// What is under a place in the view, or along a ray through the scene, is
// found among the models that are for picking (`pick.js`). As in Qt one
// that is not shown is found too, where its shape is one that something
// shown is drawn with, and one that bends by a skin is found where it is
// unbent. Qt answers by the picture it last drew; here it is by the scene
// as it is.
//
// Not here: picking among one model or a list of them, in a rectangle, or
// nearest a place, and the items in a scene, of which none is picked; the
// picture is drawn in the item whatever `renderMode` says, and of the ways
// of smoothing edges there is one.
import { untrack } from "solid-js";
import { defineType, effect, inside as within, slot } from "../object.js";
import { Vector2d, Vector3d } from "../QtQml/values.js";
import { Item } from "../QtQuick/Item.js";
import * as math from "./math.js";
import { inside, Node } from "./Node.js";
import { met } from "./pick.js";
import { draw } from "./render.js";
import { SceneEnvironment } from "./scene.js";

const sheet = new CSSStyleSheet();
sheet.replaceSync(`.qq-view3d { position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; }`);
document.adoptedStyleSheets.push(sheet);

// What a view draws: the shapes and lights among the nodes that are shown,
// and the first camera there is.
function found(self) {
  const models = [];
  const lights = [];
  const paints = [];
  let camera = null;
  const walk = (node, above) => {
    if (!node.visible) return;
    const opacity = above * node.opacity;
    if (node.$model) {
      const shape = node.$shape();
      if (shape) models.push({ node, shape, world: node.$world(), bones: node.$bones(), instances: node.$instances(), materials: node.$materials().map((material) => material?.$material?.() ?? null), opacity });
    } else if (node.$light) lights.push(node.$light());
    else if (node.$camera) camera ??= node;
    // What a node draws by itself.
    const paint = node.$paint?.(opacity);
    if (paint) paints.push(paint);
    for (const child of inside(node)) walk(child, opacity);
  };
  for (const node of inside(self.$scene)) walk(node, 1);
  if (self.importScene?.$spatial) walk(self.importScene, 1);
  // A light that is for a node lights what is that node or inside it: a
  // model has the lights that are for everything and those that are for it.
  if (lights.some((light) => light.scope)) {
    for (const model of models) model.lights = lights.filter((light) => !light.scope || under(model.node, light.scope));
  }
  return { models, lights, paints, camera };
}

function under(node, scope) {
  for (let at = node; at; at = at.parent) if (at === scope) return true;
  return false;
}

// The models a ray is tried against: those for picking, shown or not, of
// a shape that something shown is drawn with. A shape's triangles are what
// is met where a model that is for picking, or is inside one that is, is
// shown with it and not shown through wholly.
function pickable(self) {
  const drawn = new Set();
  const exact = new Set();
  for (const { node, shape, opacity } of found(self).models) {
    drawn.add(shape);
    if (opacity > 0.01 && forPicking(node)) exact.add(shape);
  }
  const models = [];
  const walk = (node) => {
    const shape = node.$model && node.pickable ? node.$shape() : null;
    if (shape && drawn.has(shape)) models.push({ node, shape, exact: exact.has(shape), placed: node.$world(), instances: node.$instances() });
    for (const child of inside(node)) walk(child);
  };
  for (const node of inside(self.$scene)) walk(node);
  if (self.importScene?.$spatial) walk(self.importScene);
  return models;
}

function forPicking(node) {
  for (let at = node; at; at = at.parent) if (at.pickable) return true;
  return false;
}

// The ray a place in the view is seen along, or null where the place is
// not in the view. A camera with no depth sees along its own way from
// across and up of where it is; any other from where it is.
function through(self, x, y) {
  const camera = self.$seeing();
  const { width, height } = self;
  const up = height - y;
  if (!camera || !(x >= 0 && x < width && up >= 0 && up < height)) return null;
  const projection = camera.$projection(width, height);
  const across = (x / (width / 2) - 1) / projection[0];
  const rise = (up / (height / 2) - 1) / projection[5];
  const world = camera.$world();
  const flat = Boolean(camera.$flat);
  return {
    origin: flat ? math.point(world, across, rise, 0) : math.point(world, 0, 0, 0),
    direction: math.normalized(math.turned(math.normal(world), flat ? 0 : across, flat ? 0 : rise, -1)),
  };
}

const three = (value) => [Number(value?.x) || 0, Number(value?.y) || 0, Number(value?.z) || 0];

// Everything a ray meets, the nearest first: nothing where there is no ray.
function along(self, ray) {
  return ray ? untrack(() => met(pickable(self), ray.origin, ray.direction)) : [];
}

const NOWHERE = () => new Vector3d(0, 0, 0);

// What is told of a place a ray met, or of its having met nothing.
function told(hit) {
  if (!hit) return { objectHit: null, itemHit: null, distance: 0, instanceIndex: -1, hitType: 0, uvPosition: new Vector2d(0, 0), scenePosition: NOWHERE(), position: NOWHERE(), normal: NOWHERE(), sceneNormal: NOWHERE() };
  return {
    objectHit: hit.node,
    itemHit: null,
    distance: Math.sqrt(hit.distance),
    instanceIndex: hit.instance,
    hitType: 1,
    uvPosition: new Vector2d(hit.uv[0], hit.uv[1]),
    scenePosition: math.vector(hit.scene),
    position: math.vector(hit.local),
    normal: math.vector(hit.normal),
    sceneNormal: math.vector(hit.sceneNormal),
  };
}

export const View3D = defineType("View3D", Item, {
  properties: {
    camera: null,
    environment: null,
    importScene: null,
    renderMode: 0,
    renderFormat: 0,
    extensions: undefined,
    explicitTextureWidth: 0,
    explicitTextureHeight: 0,
  },
  enums: { Offscreen: 0, Underlay: 1, Overlay: 2, Inline: 3 },
  methods: {
    // The node the nodes declared in the view are in.
    get scene() {
      return this.$scene;
    },
    get renderStats() {
      return null;
    },
    get effectiveTextureSize() {
      return { width: this.width, height: this.height };
    },
    // Where in the view a place in the scene is seen, and how far away.
    mapFrom3DScene(scene) {
      const camera = this.$seeing();
      const { width, height } = this;
      if (!camera || !(width > 0) || !(height > 0)) return NOWHERE();
      const seen = camera.$seen(scene, width, height);
      return new Vector3d(seen.x * width, seen.y * height, seen.z);
    },
    // And the place in the scene seen there, that far away.
    mapTo3DScene(view) {
      const camera = this.$seeing();
      const { width, height } = this;
      if (!camera || !(width > 0) || !(height > 0)) return NOWHERE();
      return camera.$place(new Vector3d(view.x / width, view.y / height, view.z), width, height);
    },
    // What is nearest under a place in the view, and everything under it.
    pick(x, y) {
      return told(along(this, untrack(() => through(this, Number(x), Number(y))))[0]);
    },
    pickAll(x, y) {
      return along(this, untrack(() => through(this, Number(x), Number(y)))).map(told);
    },
    // And along a ray from a place in the scene.
    rayPick(origin, direction) {
      return told(along(this, { origin: three(origin), direction: three(direction) })[0]);
    },
    rayPickAll(origin, direction) {
      return along(this, { origin: three(origin), direction: three(direction) }).map(told);
    },
    setTouchpoint() {},
    bakeLightmap() {},
    rebuildExtensionList() {},
  },
  setup(self, props) {
    const canvas = document.createElement("canvas");
    canvas.className = "qq-view3d";
    canvas.width = canvas.height = 0;
    self.$node.append(canvas);
    const paper = canvas.getContext("bitmaprenderer");

    // The scene is a node of its own, whose children are the view's.
    const scene = (self.$scene = within(null, () => Node({})));
    Object.defineProperties(scene, {
      $static: { get: () => self.$static },
      $extra: { get: () => self.$extra },
      $track: { value: () => self.$track() },
    });
    if (!("environment" in props)) slot(self, "environment").provide(within(null, () => SceneEnvironment({})));

    let first = null;
    self.$seeing = () => self.camera ?? first;

    effect(
      () => {
        const { width, height } = self;
        const { models, lights, paints, camera: any } = found(self);
        const camera = self.camera ?? any;
        return {
          width,
          height,
          camera,
          models,
          lights,
          paints,
          eye: camera?.$world() ?? null,
          projection: camera?.$projection(width, height) ?? null,
          far: camera?.clipFar ?? 0,
          environment: (self.environment ?? SceneEnvironment).$environment?.() ?? PLAIN,
        };
      },
      (seen) => {
        // A camera maps to the view it was last seen through.
        first = seen.camera;
        if (seen.camera) Object.assign(seen.camera, { $width: seen.width, $height: seen.height });
        draw({ ...seen, camera: seen.eye }, canvas, paper);
      },
    );
  },
});

const PLAIN = { clear: [0, 0, 0, 0], probe: null, sky: false, blur: 0, samples: 0, tonemap: 1, depth: true };
