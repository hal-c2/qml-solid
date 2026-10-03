// Card.qml, as a module of its own: what a Loader's `source` names.
//
// Rectangle { property string label: "none"; width: 80; height: 45 }
import { $define, $signal } from "qml-solid/object";
import { Rectangle } from "qml-solid/QtQuick";
import { make } from "../../scene.js";

export default function Card(props) {
  const [label, setLabel] = $signal(props.label ?? "none");
  return $define(make(Rectangle, { width: 80, height: 45 }), { label: [label, setLabel] });
}
