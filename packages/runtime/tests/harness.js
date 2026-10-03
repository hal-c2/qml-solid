// Mounts `scenes/<name>.js` for `?scene=<name>`. A scene's default export is
// a component; the object it makes is `window.scene`, and whatever else the
// module exports as `objects` is there for a test to read and assign to.
import { flush } from "solid-js";
import { mount } from "qml-solid/object";

const scenes = import.meta.glob("./scenes/*.js");
const name = new URLSearchParams(location.search).get("scene");
const module = await scenes[`./scenes/${name}.js`]();
const { object } = mount(module.default, document.getElementById("scene"));
window.scene = object;
window.objects = module.objects;
window.flush = flush;
window.ready = true;
