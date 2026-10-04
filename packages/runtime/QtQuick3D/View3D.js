// View3D: the item a scene in space is seen in. The nodes declared inside
// it are the scene, a camera among them is what it is seen through, and the
// items declared inside it lie over the picture as in any item.
//
// Not here: `pick` finds nothing, the picture is drawn in the item whatever
// `renderMode` says, and of the ways of smoothing edges there is one.
import { defineType, effect, inside as within, slot } from "../object.js";
import { Vector3d } from "../QtQml/values.js";
import { Item } from "../QtQuick/Item.js";
import { inside, Node } from "./Node.js";
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
  let camera = null;
  const walk = (node, above) => {
    if (!node.visible) return;
    const opacity = above * node.opacity;
    if (node.$model) {
      const shape = node.$shape();
      if (shape) models.push({ shape, world: node.$world(), bones: node.$bones(), instances: node.$instances(), materials: node.$materials().map((material) => material?.$material?.() ?? null), opacity });
    } else if (node.$light) lights.push(node.$light());
    else if (node.$camera) camera ??= node;
    for (const child of inside(node)) walk(child, opacity);
  };
  for (const node of inside(self.$scene)) walk(node, 1);
  if (self.importScene?.$spatial) walk(self.importScene, 1);
  return { models, lights, camera };
}

const NOWHERE = () => new Vector3d(0, 0, 0);

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
    pick() {
      return { objectHit: null, itemHit: null, distance: 0, instanceIndex: -1, hitType: 0, uvPosition: { x: 0, y: 0 }, uvPosition1: { x: 0, y: 0 }, scenePosition: NOWHERE(), position: NOWHERE(), normal: NOWHERE(), sceneNormal: NOWHERE() };
    },
    pickAll() {
      return [];
    },
    rayPick() {
      return this.pick();
    },
    rayPickAll() {
      return [];
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
        const { models, lights, camera: any } = found(self);
        const camera = self.camera ?? any;
        return {
          width,
          height,
          camera,
          models,
          lights,
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
