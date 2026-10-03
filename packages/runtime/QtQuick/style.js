// The little CSS an item needs: QML positions everything itself, so an item
// is taken out of the flow and measured from its parent's top left corner.
const sheet = new CSSStyleSheet();
sheet.replaceSync(`
.q-scene { position: relative; overflow: hidden; }
.qq { position: absolute; left: 0; top: 0; box-sizing: border-box; transform-origin: 0 0; }
`);
document.adoptedStyleSheets.push(sheet);
