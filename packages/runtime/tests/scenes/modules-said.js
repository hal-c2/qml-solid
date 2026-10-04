// The same module for a file whose settings name another style.
import { $object } from "qml-solid/object";
import { Shelf } from "qml-solid/QtShelf";
import { make } from "../scene.js";

const shelf = $object();

export const objects = { shelf };

export default () => make(Shelf, { $self: shelf });
