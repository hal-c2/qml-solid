// The colours a style paints with: `SystemPalette`, and `Palette` with its
// three `ColorGroup`s.
//
// The numbers are what Qt 6.11 answers with its own (Fusion) light palette,
// read from `qml6`: a browser has no palette to ask for.
import { defineType, derived, group, QtObject, slot } from "../object.js";
import { color, colorValue } from "./color.js";

const ACTIVE = {
  alternateBase: "#f7f7f7",
  base: "#ffffff",
  brightText: "#ffffff",
  button: "#efefef",
  buttonText: "#000000",
  dark: "#9f9f9f",
  highlight: "#308cc6",
  highlightedText: "#ffffff",
  light: "#ffffff",
  link: "#0000ff",
  linkVisited: "#ff00ff",
  mid: "#b8b8b8",
  midlight: "#cacaca",
  shadow: "#767676",
  text: "#000000",
  toolTipBase: "#ffffdc",
  toolTipText: "#000000",
  window: "#efefef",
  windowText: "#000000",
  placeholderText: "#80000000",
  accent: "#308cc6",
};

const DISABLED = {
  ...ACTIVE,
  base: "#efefef",
  buttonText: "#bebebe",
  dark: "#bebebe",
  highlight: "#919191",
  shadow: "#b1b1b1",
  text: "#bebebe",
  windowText: "#bebebe",
  accent: "#919191",
};

const ROLES = Object.keys(ACTIVE);
// An inactive window is painted as an active one.
const NUMBERS = { active: ACTIVE, inactive: ACTIVE, disabled: DISABLED };

const each = (make) => Object.fromEntries(ROLES.map((role) => [role, make(role)]));

// `ColorGroup {}` on its own: the active colours, until it is given others.
export const ColorGroup = defineType("ColorGroup", QtObject, {
  properties: each((role) => ACTIVE[role]),
  resolve: each(() => colorValue),
});

// What a palette says for a role whatever the group: `palette.button: "red"`
// is the button colour of all three.
function common(self, role) {
  const all = slot(self, role);
  return all.explicit() ? all.own() : undefined;
}

// A group's colour: its own, else the palette's for every group, else that
// of the palette this one follows (an item's follows its parent's: `$from`
// is set by whatever gives items a palette), else Qt's.
const part = (name) =>
  group(each((role) => derived((self) => common(self, role) ?? self.$from?.()?.[name][role] ?? NUMBERS[name][role])));

const resolve = each((role) => (self) => self[self.$group?.() ?? "active"][role]);
for (const name of Object.keys(NUMBERS)) {
  for (const role of ROLES) resolve[`${name}$${role}`] = colorValue;
}

// Read without a group, a palette answers for the one in use: `$group`,
// which says "disabled" for an item that is, is set like `$from`.
export const Palette = defineType("Palette", ColorGroup, {
  properties: {
    ...each(() => undefined),
    active: part("active"),
    inactive: part("inactive"),
    disabled: part("disabled"),
  },
  resolve,
});

// By `SystemPalette.Active`, `Disabled` and `Inactive`.
const GROUPS = ["active", "disabled", "inactive"];

// SystemPalette: the same colours by `colorGroup`, read only.
export const SystemPalette = defineType("SystemPalette", QtObject, {
  properties: {
    colorGroup: 0,
    ...Object.fromEntries(
      [
        "window",
        "windowText",
        "base",
        "text",
        "alternateBase",
        "button",
        "buttonText",
        "light",
        "midlight",
        "dark",
        "mid",
        "shadow",
        "highlight",
        "highlightedText",
        "placeholderText",
        "accent",
      ].map((role) => [role, derived((self) => color(NUMBERS[GROUPS[self.colorGroup] ?? "active"][role]))]),
    ),
  },
  enums: { Active: 0, Disabled: 1, Inactive: 2 },
});
