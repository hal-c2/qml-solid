// Label: text set in the font of the control it is in, with a background.
import { defineType, derived } from "../../object.js";
import { Text } from "../Text.js";
import { backed, insets, methods } from "./Control.js";
import { font } from "./font.js";

export const Label = defineType("Label", Text, {
  properties: {
    font,
    background: null,
    ...insets,
    implicitBackgroundWidth: derived((self) => self.background?.implicitWidth ?? 0),
    implicitBackgroundHeight: derived((self) => self.background?.implicitHeight ?? 0),
  },
  methods,
  setup: backed,
});
