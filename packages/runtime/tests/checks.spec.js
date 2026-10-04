// The buttons that are checked. What is expected is what Qt 6.11 answers for
// the same scene (`qml6`), and what it notes when a QtTest `TestCase` makes
// the same moves with its mouse.
import { advance, read, said, set, still as base } from "./notes.js";
import { expect, open, test } from "./open.js";

const still = (page) => base(page, "checks");

// Where the buttons are in the scene.
const at = {
  cb: [10, 10],
  tri: [10, 45],
  fn: [10, 80],
  r1: [100, 10],
  r2: [100, 45],
  r3: [100, 80],
  t2: [145, 120],
  sw: [200, 10],
  dl: [200, 50],
  dt: [200, 90],
  plain: [200, 130],
  cd: [200, 160],
  rd1: [200, 190],
  rd2: [200, 220],
  sd: [310, 10],
};
const move = (page, name, x, y) => page.mouse.move(at[name][0] + x, at[name][1] + y);

async function press(page, name, x, y) {
  await move(page, name, x, y);
  await page.mouse.down();
}

// Time enough after a release for the next press not to be the second of a
// double click: what QtTest does as well.
async function release(page) {
  await page.mouse.up();
  await advance(page, 500);
}

async function click(page, name, x = 5, y = 5) {
  await press(page, name, x, y);
  await release(page);
}

test("the checked buttons are what Qt says they are", async ({ page }) => {
  await open(page, "checks");
  expect(await page.evaluate(() => window.scene.answers())).toEqual([
    [true, false, 0, false, false, 11, "undefined"],
    [false, 1, 0],
    // Declared checked, both are: they had no siblings yet.
    [true, true, false, true, true, 11],
    [true, true, true, false, 11],
    [true, false, 0, 0, false, 11],
    [true, false, 300, 0, null, 1000, true],
    [false, false, 0, false],
    [true, true, 0, 0],
    [true, true, 0, true, 0, 0, 0],
  ]);
});

test("a check box is checked or not, and what it is assigned it is", async ({ page }) => {
  await still(page);
  await click(page, "cb");
  await said(page, ["cb.checkState 2", "cb.checked true", "cb.toggled", "cb.clicked"]);
  await click(page, "cb");
  await said(page, ["cb.checkState 0", "cb.checked false", "cb.toggled", "cb.clicked"]);
  await set(page, "cb.checkState", 1);
  await said(page, ["cb.checkState 1"]);
  expect(await read(page, "cb.checked", "cb.checkState")).toEqual([false, 1]);
  await set(page, "cb.checked", true);
  await said(page, ["cb.checkState 2", "cb.checked true"]);
  await set(page, "cb.checkState", 0);
  await said(page, ["cb.checkState 0", "cb.checked false"]);
  await page.evaluate(() => window.scene.cb.toggle());
  await said(page, ["cb.checkState 2", "cb.checked true"]);
  expect(await read(page, "cb.checked", "cb.checkState")).toEqual([true, 2]);
});

test("a check box with three states goes through them, or where its function says", async ({ page }) => {
  await still(page);
  // Not a toggle: nothing says `toggled`.
  await click(page, "tri");
  await said(page, ["tri.checkState 1", "tri.clicked"]);
  expect(await read(page, "tri.checked", "tri.checkState")).toEqual([false, 1]);
  await click(page, "tri");
  await said(page, ["tri.checkState 2", "tri.checked true", "tri.clicked"]);
  await click(page, "tri");
  await said(page, ["tri.checkState 0", "tri.checked false", "tri.clicked"]);

  await click(page, "fn");
  await said(page, ["fn.checkState 2"]);
  expect(await read(page, "fn.checked", "fn.checkState")).toEqual([true, 2]);
  await click(page, "fn");
  await said(page, ["fn.checkState 0"]);
  await click(page, "fn");
  await said(page, ["fn.checkState 2"]);

  await click(page, "cd");
  await said(page, ["cd.checkState 1"]);
  expect(await read(page, "cd.checked", "cd.checkState")).toEqual([false, 1]);
  await click(page, "cd");
  await said(page, ["cd.checkState 2"]);
  expect(await read(page, "cd.checked", "cd.checkState")).toEqual([true, 2]);
});

test("of the radio buttons in an item one is checked by a click", async ({ page }) => {
  await still(page);
  const radios = () => read(page, "r1.checked", "r2.checked", "r3.checked");
  // It unchecks the first that is checked, which is all Qt looks for.
  await click(page, "r1");
  await said(page, ["r2.checked false", "r1.checked true", "r1.toggled", "r1.clicked"]);
  expect(await radios()).toEqual([true, false, true]);
  // And since another is checked still, a click unchecks it.
  await click(page, "r1");
  await said(page, ["r1.checked false", "r1.toggled", "r1.clicked"]);
  expect(await radios()).toEqual([false, false, true]);
  await set(page, "r3.checked", true);
  await said(page, []);
  await set(page, "r3.checked", false);
  await said(page, ["r3.checked false"]);
  await page.evaluate(() => window.scene.r2.toggle());
  await said(page, ["r2.checked true"]);
  expect(await radios()).toEqual([false, true, false]);
  // One that excludes nothing is toggled like any button.
  await set(page, "r2.autoExclusive", false);
  await click(page, "r2");
  await said(page, ["r2.checked false", "r2.toggled"]);
  await click(page, "r1");
  await said(page, ["r1.checked true", "r1.toggled", "r1.clicked"]);
  // The only one checked stays so.
  await click(page, "r1");
  await said(page, ["r1.clicked"]);

  await click(page, "t2");
  await said(page, ["t1.checked false", "t2.checked true", "t2.toggled"]);
  await click(page, "t2");
  await said(page, []);
  expect(await read(page, "t1.checked", "t2.checked")).toEqual([false, true]);

  await click(page, "rd2");
  await said(page, ["rd2.checked true", "rd2.toggled"]);
  await click(page, "rd1");
  await said(page, ["rd2.checked false", "rd1.checked true"]);
  await click(page, "plain");
  await said(page, ["plain.clicked"]);
  expect(await read(page, "plain.activeFocus")).toEqual([false]);
});

test("a switch is toggled by a click", async ({ page }) => {
  await still(page);
  await click(page, "sw", 80, 5);
  await said(page, ["sw.position 1", "sw.checked true", "sw.toggled", "sw.released", "sw.clicked"]);
  expect(await read(page, "sw.checked", "sw.position", "sw.visualPosition")).toEqual([true, 1, 1]);
  await click(page, "sw", 80, 5);
  await said(page, ["sw.position 0", "sw.checked false", "sw.toggled", "sw.released", "sw.clicked"]);
  // It stays pressed wherever the pointer goes, so a release anywhere is a
  // click.
  await press(page, "sw", 5, 5);
  await move(page, "sw", 5, 100);
  expect(await read(page, "sw.pressed")).toEqual([true]);
  await release(page);
  await said(page, ["sw.position 1", "sw.checked true", "sw.toggled", "sw.released", "sw.clicked"]);
  await set(page, "sw.checked", false);
  await said(page, ["sw.position 0", "sw.checked false"]);

  await click(page, "sd");
  await said(page, ["sd.position 1", "sd.toggled"]);
  await press(page, "sd", 65, 15);
  await move(page, "sd", 35, 15);
  await said(page, ["sd.position 0.125"]);
  await release(page);
  await said(page, ["sd.position 0", "sd.toggled"]);
  expect(await read(page, "sd.checked", "sd.position")).toEqual([false, 0]);
});

test("the handle of a switch is dragged, and it is on when let go in the second half", async ({ page }) => {
  await still(page);
  await press(page, "sw", 15, 15);
  await said(page, []);
  // Not before it has moved some way.
  await move(page, "sw", 20, 15);
  await said(page, []);
  await move(page, "sw", 30, 15);
  await said(page, ["sw.position 0.5"]);
  await move(page, "sw", 40, 15);
  await said(page, ["sw.position 0.75"]);
  await move(page, "sw", 200, 100);
  await said(page, ["sw.position 1"]);
  expect(await read(page, "sw.pressed")).toEqual([true]);
  await release(page);
  await said(page, ["sw.checked true", "sw.toggled", "sw.released", "sw.clicked"]);

  // Let go where it already is: the handle goes back to its end.
  await press(page, "sw", 45, 15);
  await move(page, "sw", 32, 15);
  await said(page, ["sw.position 0.55"]);
  await release(page);
  await said(page, ["sw.position 1", "sw.released", "sw.clicked"]);
  expect(await read(page, "sw.checked", "sw.position")).toEqual([true, 1]);

  await press(page, "sw", 45, 15);
  await move(page, "sw", 20, 15);
  await said(page, ["sw.position 0.25"]);
  await release(page);
  await said(page, ["sw.position 0", "sw.checked false", "sw.toggled", "sw.released", "sw.clicked"]);

  // A press beside the indicator drags once the pointer is over it.
  await press(page, "sw", 80, 15);
  await move(page, "sw", 95, 15);
  await said(page, []);
  await move(page, "sw", 40, 15);
  await said(page, ["sw.position 0.75"]);
  await release(page);
  await said(page, ["sw.position 1", "sw.checked true", "sw.toggled", "sw.released", "sw.clicked"]);
});

test("a delay button is checked by being held to the end", async ({ page }) => {
  await still(page);
  // With no transition it is there at once, and gone when it is let go: it
  // is activated and never checked.
  await press(page, "dl", 5, 5);
  await said(page, ["dl.progress 1", "dl.activated"]);
  await release(page);
  await said(page, ["dl.progress 0", "dl.clicked"]);
  expect(await read(page, "dl.progress", "dl.checked")).toEqual([0, false]);
  await set(page, "dl.checked", true);
  await said(page, ["dl.progress 1", "dl.checked true"]);
  await click(page, "dl");
  await said(page, ["dl.progress 0", "dl.checked false", "dl.clicked"]);

  await press(page, "dt", 5, 5);
  await advance(page, 500);
  await said(page, []);
  let [progress] = await read(page, "dt.progress");
  expect(progress).toBeGreaterThan(0.3);
  expect(progress).toBeLessThan(0.7);
  // Let go early, it goes back, faster than it came.
  await page.mouse.up();
  await said(page, ["dt.clicked"]);
  expect((await read(page, "dt.progress"))[0]).toBeGreaterThan(0.3);
  await advance(page, 400);
  expect(await read(page, "dt.progress", "dt.checked")).toEqual([0, false]);
  await advance(page, 500);

  await page.mouse.down();
  await advance(page, 1200);
  await said(page, ["dt.activated"]);
  expect(await read(page, "dt.progress", "dt.checked")).toEqual([1, false]);
  await release(page);
  await said(page, ["dt.checked true", "dt.clicked"]);
  await click(page, "dt");
  await said(page, ["dt.checked false", "dt.clicked"]);
  expect(await read(page, "dt.progress", "dt.checked")).toEqual([0, false]);
});
