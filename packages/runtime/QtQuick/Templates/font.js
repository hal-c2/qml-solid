// The `font` of a control: what it was given, else what a control around it
// was given, else what the style sets a control of its type in. A Button in
// a Pane with `font.pixelSize: 20` is that big, and as bold as the style
// makes buttons.
import { derived, group, kinds, typed } from "../../object.js";
import { given, lazy } from "../compute.js";
import { font as styled } from "./theme.js";

// The nearest object around one that has such a font: a control, a label,
// the application's window. They mark themselves with `$fonted`.
function around(self) {
  self.$around ??= lazy(self, () => {
    for (let at = self.parent ?? self.$popup; at; at = at.parent ?? at.$popup) {
      if (at.$fonted) return at;
      if (at.$window) return at.$window.$fonted ? at.$window : null;
    }
    return null;
  });
  return self.$around();
}

// What the objects around one were given for a part of the font. Bold and
// weight say the same thing, and so do the two sizes.
function said(self, member, other, convert) {
  for (let at = around(self); at; at = around(at)) {
    if (given(at, "font", member)) return at.font[member];
    if (other && given(at, "font", other)) return convert(at.font[other]);
  }
  return undefined;
}

const pixels = (points) => Math.round((points * 96) / 72);
const heavy = (bold) => (bold ? 700 : 400);

const inherited = (member, plain) => derived((self) => said(self, member) ?? styled(self.$type)[member] ?? plain);

export const font = group({
  family: inherited("family", "Sans Serif"),
  styleName: inherited("styleName", ""),
  bold: derived((self) => self.font.weight >= 600),
  weight: derived((self) =>
    given(self, "font", "bold") ? heavy(self.font.bold) : (said(self, "weight", "bold", heavy) ?? styled(self.$type).weight),
  ),
  italic: inherited("italic", false),
  underline: inherited("underline", false),
  overline: inherited("overline", false),
  strikeout: inherited("strikeout", false),
  pixelSize: typed(
    kinds.pixels,
    derived((self) =>
      given(self, "font", "pointSize")
        ? pixels(self.font.pointSize)
        : (said(self, "pixelSize", "pointSize", pixels) ?? styled(self.$type).pixelSize),
    ),
  ),
  pointSize: typed(
    kinds.points,
    derived((self) => (self.font.pixelSize * 72) / 96),
  ),
  capitalization: inherited("capitalization", 0),
  letterSpacing: inherited("letterSpacing", 0),
  wordSpacing: inherited("wordSpacing", 0),
  kerning: inherited("kerning", true),
  features: inherited("features", undefined),
  variableAxes: inherited("variableAxes", undefined),
});
