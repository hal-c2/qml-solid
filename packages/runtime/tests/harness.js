// Mounts `scenes/<name>.js` for `?scene=<name>`. A scene's default export is
// a component; the object it makes is `window.scene`, and whatever else the
// module exports as `objects` is there for a test to read and assign to. A
// scene may be QML: then the objects are what its root has aliases for.
import { flush } from "solid-js";
import { mount } from "qml-solid/object";
import { clock } from "qml-solid/QtQuick";

const scenes = import.meta.glob("./scenes/*.{js,qml}");
const name = new URLSearchParams(location.search).get("scene");
const module = await (scenes[`./scenes/${name}.js`] ?? scenes[`./scenes/${name}.qml`])();
const { object } = mount(module.default, document.getElementById("scene"));
window.scene = object;
window.objects = module.objects ?? object;
window.flush = flush;
// A scene in QML has no way to export the clock a test drives.
window.clock = clock;
window.ready = true;
