// A module of Qt's that is partly QML: `tests/qt` stands for the Qt that is
// installed, and has a style or two of a module the runtime has nothing of.
import { $object } from "qml-solid/object";
import { Item, Text } from "qml-solid/QtQuick";
import { FlexboxLayout, Flexed, Rack, RowLayout } from "qml-solid/QtQuick/Layouts";
import { LightmapperOutputWindow } from "qml-solid/QtQuick3D";
import * as Shelves from "qml-solid/QtShelf";
import { make } from "../scene.js";

const { Shelf } = Shelves;
const shelf = $object();
const rack = $object();

export const objects = { shelf, rack, Shelf, Text, RowLayout, FlexboxLayout, Flexed, LightmapperOutputWindow, make, names: Object.keys(Shelves) };

export default () =>
  make(Item, { width: 400, height: 300 }, () => [
    make(Rack, { $self: rack }),
    make(Shelf, { $self: shelf, elide: Shelf.ElideRight }),
  ]);
