// What a style attaches to an object (`Material.theme`, `Universal.accent`)
// is inherited: an item has what the item it is in has, an item in none what
// its window has, a window what the window it belongs to has. What was set on
// an object is its own and that of everything inside it.
import { chosen, QtObject, slot } from "../../object.js";
import { styleHints } from "../../QtQml/application.js";
import { Color, color } from "../color.js";
import { Item } from "../Item.js";

// The attached object of `Type` that the one of `object` inherits from. One
// is made for every object on the way up: only so does each hear of a change
// above it.
export function around(Type, object) {
  if (Item.proto.isPrototypeOf(object)) return Type.attached(object.parent ?? object.$popup ?? object.$window) ?? null;
  // A window is in the window it belongs to; a popup, in its parent's.
  return Type.attached("transientParent" in object ? object.transientParent : object.parent) ?? null;
}

// What a property was given, or undefined: its own default is to inherit.
export function said(self, name) {
  const own = slot(self, name);
  return own.explicit() ? own.own() : undefined;
}

// `control.Material.elevation`: the attached object, read off an object by
// the name of its type.
export function reached(name, Type) {
  Object.defineProperty(QtObject.proto, name, {
    get() {
      return Type.attached(this);
    },
    configurable: true,
  });
}

// A style imported where nothing has chosen one is the style, as in Qt.
export function preferred(style) {
  if (!chosen.has("QtQuick.Controls")) chosen.set("QtQuick.Controls", style);
}

// `Qt::ColorScheme::Dark`: what the theme `System` is.
export const dark = () => styleHints().colorScheme === 2;

// A colour as Qt writes one in its tables, `0xAARRGGBB`, and back.
export const fromArgb = (argb) => color(`#${(argb >>> 0).toString(16).padStart(8, "0")}`);

export function toArgb(value) {
  const text = value.toString();
  return text.length === 7 ? (0xff000000 | parseInt(text.slice(1), 16)) >>> 0 : parseInt(text.slice(1), 16);
}

// What `accent` and its like may be given: a colour of the style's own by
// its number or its name, or any colour. `{ value, custom }` as Qt keeps it,
// the number or the colour's `0xAARRGGBB`; null for what is neither.
export function chosenColour(given, names) {
  if (typeof given === "number") return Number.isInteger(given) && given >= 0 && given < names.length ? { value: given, custom: false } : null;
  if (typeof given === "string") {
    const index = names.indexOf(given);
    if (index !== -1) return { value: index, custom: false };
  }
  const colour = given instanceof Color ? given : typeof given === "string" ? color(given) : null;
  return colour?.valid ? { value: toArgb(colour), custom: true } : null;
}
