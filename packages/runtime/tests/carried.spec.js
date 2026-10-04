import { expect, open, test } from "./open.js";

// The steps are the ones Qt 6.11 was taken through with the same scene, and
// the answers the ones it gave.
test("a handler is given what Qt's signal carries: for most changes, nothing", async ({ page }) => {
  await open(page, "carried");
  const read = await page.evaluate(() => {
    const { scene } = window;
    const seen = [scene.read()];
    for (let step = 0; step < 8; step++) {
      scene.step(step);
      window.flush();
      seen.push(scene.read());
    }
    return seen;
  });
  expect(read).toEqual([
    [],
    // The change of a property QML declares carries nothing, whatever the
    // handler says it takes.
    ["count undefined", "connections count undefined", "label undefined", "size 2.5"],
    // `objectNameChanged(objectName)` carries the name.
    ["objectName see", "objectName injected two"],
    // `widthChanged()` and `visibleChanged()` carry nothing; `focusChanged(bool)`
    // and `stateChanged(string)` what the property now is.
    ["width undefined", "visible undefined", "focus true", "state on"],
    // A font is a value: it changes when anything in it does.
    ["text hi", "font 20 false", "lineHeight 2", "style true", "color undefined"],
    ["duration 10", "interval undefined"],
    // The item that had the focus loses it; a Connections is told the same.
    ["focus false", "connections focus true", "connections state on", "connections width undefined"],
    // A signal QML declares carries what it was emitted with, to however
    // many arguments the handler takes.
    ["moved 1 2", "connections moved 1 2", "titled t 1", "bare undefined"],
    // The names of the signal's arguments are before the object's own, for
    // a handler that is not a function.
    ["moved by name 5 6", "sized by name 9", "moved fewer 5 7 8"],
  ]);
});
