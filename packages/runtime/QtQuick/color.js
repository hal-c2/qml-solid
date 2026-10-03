// QML colours as CSS ones. The names are the same (SVG's); the one
// difference is where the alpha goes: QML writes `#AARRGGBB`.
export function css(color) {
  if (color == null || color === "") return "transparent";
  if (typeof color !== "string") return String(color);
  if (color[0] === "#" && color.length === 9) return `#${color.slice(3)}${color.slice(1, 3)}`;
  return color;
}
