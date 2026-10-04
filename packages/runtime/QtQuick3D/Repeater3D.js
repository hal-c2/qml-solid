// Repeater3D: a node for every row of a model. It is a node itself, and
// what it makes is inside it: not beside it, as an item QtQuick's Repeater
// makes is.
import { repeating } from "../QtQuick/Repeater.js";
import { Node } from "./Node.js";

export const Repeater3D = repeating("Repeater3D", Node, { at: "objectAt", added: "objectAdded", removed: "objectRemoved", own: true });
