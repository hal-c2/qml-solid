// What a positioner or a layout did with its children, as one line: the same
// line this QML prints under Qt, so that a spec holds what `qml6` said.
//
//     function g(i) { return [i.x, i.y, i.width, i.height].join(" ") }
//     function dump(p) {
//         var out = g(p) + " implicit " + p.implicitWidth + " " + p.implicitHeight + " |"
//         for (var i = 0; i < p.children.length; i++)
//             if (!(p.children[i] instanceof Repeater)) out += " [" + g(p.children[i]) + "]"
//         return out
//     }
//
// It fails if the page does not show a visible child where its properties
// say it is.
export const dump = (page, name) =>
  page.evaluate((name) => {
    const parent = window.objects[name];
    const g = (item) => [item.x, item.y, item.width, item.height].join(" ");
    const origin = parent.$node.getBoundingClientRect();
    let out = `${g(parent)} implicit ${parent.implicitWidth} ${parent.implicitHeight} |`;
    for (const child of parent.children) {
      out += ` [${g(child)}]`;
      if (!child.visible) continue;
      const box = child.$node.getBoundingClientRect();
      const drawn = [box.x - origin.x, box.y - origin.y, box.width, box.height];
      const said = [child.x, child.y, child.width, child.height];
      if (drawn.some((value, index) => Math.abs(value - said[index]) > 0.01)) {
        throw new Error(`${name}: drawn at ${drawn.join(" ")}, not at ${said.join(" ")}`);
      }
    }
    return out;
  }, name);
