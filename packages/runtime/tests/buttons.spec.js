// Buttons of QtQuick.Templates. What is expected is what Qt 6.11 answers for
// the same scene (`qml6`), and what it notes when a QtTest `TestCase` makes
// the same moves with its mouse and keys.
import { expect, open, test } from "./open.js";

const take = (page) => page.evaluate(() => window.scene.take());
const read = (page, ...names) =>
  page.evaluate((names) => names.map((name) => name.split(".").reduce((at, part) => at[part], window.scene)), names);
const advance = (page, ms) => page.evaluate((ms) => window.clock.advance(ms), ms);

// The scene with time standing still: a test moves it.
async function still(page) {
  await open(page, "buttons");
  await page.evaluate(() => window.clock.stop());
}

// Where the buttons are in the scene.
const at = { a: [10, 10], b: [10, 60], c: [10, 110], e: [150, 10], h: [150, 60], r: [150, 130] };
const move = (page, name, x, y) => page.mouse.move(at[name][0] + x, at[name][1] + y);

// A click, and time enough after it for the next press not to be the second
// of a double click: what QtTest does as well.
async function click(page, name, x, y) {
  await move(page, name, x, y);
  await page.mouse.down();
  await page.mouse.up();
  await advance(page, 500);
}

test("a button is what Qt says it is", async ({ page }) => {
  await open(page, "buttons");
  expect(await page.evaluate(() => window.scene.answers())).toEqual([
    [11, 7, true, false, false, false],
    [false, false, false, false, false, false, 300, 100],
    [0, 0, 2, null, null, 0, 0],
    ["a", "", "", 0, 0, true],
    [false, false],
    [0, 1, 2, 3],
    [false, true, false, false, 2, 0],
    [true, true],
    [14, 18, true, true],
    [90, 32, 90, 32],
    ["go", 24, 0, "#ff0000", 3, true],
    [20, 3],
  ]);
});

test("a press is down while the pointer is over the button, and a release over it clicks", async ({ page }) => {
  await still(page);
  await move(page, "a", 20, 20);
  await page.mouse.down();
  expect(await take(page)).toEqual(["a.activeFocus true", "a.down true", "a.pressed"]);
  expect(await read(page, "a.pressed", "a.down", "a.pressX", "a.pressY", "a.activeFocus", "a.focusReason", "a.visualFocus")).toEqual(
    [true, true, 20, 20, true, 0, false],
  );
  await move(page, "a", 200, 200);
  expect(await take(page)).toEqual(["a.down false"]);
  expect(await read(page, "a.pressed", "a.pressX", "a.pressY")).toEqual([false, 200, 200]);
  await move(page, "a", 30, 25);
  expect(await take(page)).toEqual(["a.down true"]);
  expect(await read(page, "a.pressed", "a.pressX", "a.pressY")).toEqual([true, 30, 25]);
  await page.mouse.up();
  expect(await take(page)).toEqual(["a.down false", "a.released", "a.clicked"]);
  expect(await read(page, "a.pressed", "a.pressX", "a.pressY")).toEqual([false, 30, 25]);
  await advance(page, 500);

  // Dragged out and let go there: no click.
  await move(page, "a", 20, 20);
  await page.mouse.down();
  await move(page, "a", 300, 250);
  await page.mouse.up();
  expect(await take(page)).toEqual(["a.down true", "a.pressed", "a.down false", "a.canceled"]);
});

test("a click toggles a checkable button, and so does Space", async ({ page }) => {
  await still(page);
  await click(page, "a", 20, 20);
  await take(page);
  await click(page, "b", 5, 5);
  expect(await take(page)).toEqual(["a.activeFocus false", "b.pressed", "b.toggled true", "b.released true", "b.clicked true"]);
  expect(await read(page, "b.checked", "b.activeFocus", "a.activeFocus")).toEqual([true, true, false]);
  await click(page, "b", 5, 5);
  expect(await take(page)).toEqual(["b.pressed", "b.toggled false", "b.released false", "b.clicked false"]);
  expect(await read(page, "b.checked")).toEqual([false]);

  await page.keyboard.down("Space");
  expect(await take(page)).toEqual(["b.pressed"]);
  expect(await read(page, "b.pressed", "b.down", "b.pressX", "b.pressY")).toEqual([true, true, 50, 20]);
  await page.keyboard.up("Space");
  expect(await take(page)).toEqual(["b.toggled true", "b.released true", "b.clicked true"]);
  expect(await read(page, "b.pressed", "b.checked")).toEqual([false, true]);
});

test("focus that a key brought is seen, and a click gives focus where the policy says", async ({ page }) => {
  await still(page);
  await click(page, "b", 5, 5);
  await take(page);
  await page.keyboard.press("Tab");
  expect(await read(page, "d.activeFocus", "d.focusReason", "d.visualFocus", "b.focusReason", "b.visualFocus")).toEqual(
    [true, 1, true, 1, false],
  );
  await page.keyboard.press("Shift+Tab");
  expect(await read(page, "b.activeFocus", "b.focusReason", "b.visualFocus", "d.visualFocus")).toEqual([true, 2, true, false]);
  await page.keyboard.press("Shift+Tab");
  expect(await take(page)).toEqual(["a.activeFocus true"]);
  expect(await read(page, "a.activeFocus", "a.focusReason", "a.visualFocus")).toEqual([true, 2, true]);
  // A control takes no press, so no click gives it focus, whatever its
  // policy.
  await click(page, "c", 5, 5);
  expect(await take(page)).toEqual([]);
  expect(await read(page, "c.activeFocus", "c.focusReason", "a.activeFocus")).toEqual([false, 7, true]);
  await click(page, "e", 5, 5);
  expect(await take(page)).toEqual(["e.clicked"]);
  expect(await read(page, "e.activeFocus", "a.activeFocus")).toEqual([false, true]);
});

test("a double click and a long press are told to a button that is asked, and neither clicks", async ({ page }) => {
  await still(page);
  await move(page, "a", 20, 20);
  await page.mouse.down();
  await page.mouse.up();
  await advance(page, 500);
  await take(page);

  await page.mouse.down();
  await page.mouse.up();
  await advance(page, 50);
  await page.mouse.down();
  await page.mouse.up();
  expect(await take(page)).toEqual([
    "a.down true",
    "a.pressed",
    "a.down false",
    "a.released",
    "a.clicked",
    "a.down true",
    "a.pressed",
    "a.doubleClicked",
    "a.down false",
    "a.released",
  ]);
  await advance(page, 500);

  await page.mouse.down();
  await advance(page, 799);
  expect(await take(page)).toEqual(["a.down true", "a.pressed"]);
  await advance(page, 201);
  await page.mouse.up();
  expect(await take(page)).toEqual(["a.pressAndHold", "a.down false", "a.released"]);
});

test("click(), toggle() and animateClick() do what a click does", async ({ page }) => {
  await still(page);
  await click(page, "a", 20, 20);
  await take(page);
  await page.evaluate(() => window.scene.a.click());
  expect(await take(page)).toEqual(["a.down true", "a.pressed", "a.down false", "a.released", "a.clicked"]);
  await page.evaluate(() => window.scene.a.toggle());
  expect(await take(page)).toEqual(["a.checked true"]);
  await page.evaluate(() => {
    window.scene.a.toggle();
    window.scene.a.checkable = true;
  });
  await take(page);
  await click(page, "a", 20, 20);
  expect(await take(page)).toEqual(["a.down true", "a.pressed", "a.down false", "a.checked true", "a.toggled true", "a.released", "a.clicked"]);
  await page.evaluate(() => (window.scene.a.checked = false));
  expect(await take(page)).toEqual(["a.checked false"]);

  await page.evaluate(() => window.scene.a.animateClick());
  expect(await take(page)).toEqual(["a.down true", "a.pressed"]);
  expect(await read(page, "a.pressed", "a.pressX", "a.pressY")).toEqual([true, 50, 20]);
  await advance(page, 99);
  expect(await take(page)).toEqual([]);
  await advance(page, 51);
  expect(await take(page)).toEqual(["a.down false", "a.checked true", "a.toggled true", "a.released", "a.clicked"]);
  expect(await read(page, "a.pressed", "a.checked")).toEqual([false, true]);

  // A disabled button is not clicked.
  await page.evaluate(() => {
    window.scene.a.enabled = false;
    window.scene.take();
    window.scene.a.click();
  });
  expect(await take(page)).toEqual([]);
});

test("a button that repeats clicks again and again while it is held", async ({ page }) => {
  await still(page);
  await move(page, "r", 5, 5);
  await page.mouse.down();
  await advance(page, 350);
  expect(await take(page)).toEqual(["r.pressed"]);
  await advance(page, 100);
  expect(await take(page)).toEqual(["r.released", "r.clicked", "r.pressed"]);
  await advance(page, 100);
  expect(await take(page)).toEqual(["r.released", "r.clicked", "r.pressed"]);
  await page.mouse.up();
  expect(await take(page)).toEqual(["r.released", "r.clicked"]);
  await advance(page, 500);

  // It stops when the pointer leaves, and does not start again when it is
  // back.
  await page.mouse.down();
  await move(page, "r", 300, 5);
  await advance(page, 500);
  expect(await take(page)).toEqual(["r.pressed"]);
  expect(await read(page, "r.pressed")).toEqual([false]);
  await move(page, "r", 5, 5);
  await advance(page, 350);
  expect(await take(page)).toEqual([]);
  expect(await read(page, "r.pressed")).toEqual([true]);
  await page.mouse.up();
  expect(await take(page)).toEqual(["r.released", "r.clicked"]);
});

test("a control hovers with the one it is in, and hides what is under it from the mouse", async ({ page }) => {
  await still(page);
  await move(page, "h", 60, 5);
  expect(await take(page)).toEqual(["h.hovered true"]);
  expect(await read(page, "h.hovered", "inH.hovered", "under.containsMouse")).toEqual([true, false, false]);
  await move(page, "h", 15, 15);
  expect(await take(page)).toEqual(["inH.hovered true"]);
  expect(await read(page, "h.hovered", "inH.hovered", "under.containsMouse")).toEqual([true, true, false]);
  // The press goes through the control to the button, which no longer
  // hovers once the pointer has left it.
  await page.mouse.down();
  await move(page, "h", 15, 80);
  expect(await take(page)).toEqual(["h.hovered false"]);
  expect(await read(page, "h.hovered", "inH.hovered", "h.pressed")).toEqual([false, true, false]);
  await page.mouse.up();
  await move(page, "h", 15, 100);
  expect(await read(page, "h.hovered", "inH.hovered", "under.containsMouse")).toEqual([false, false, false]);
});
