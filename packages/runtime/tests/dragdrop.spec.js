// What is expected here is what Qt 6.11 answers for the same QML (`qml6`),
// with a turn of its event loop after each step: a drag's moves are told then.
import { expect, open, test } from "./open.js";

const ENUMS = [2, 7, 2, 2, 3, 2];
const drag = (active, target) => [active, target, true, ...ENUMS];

const STEPS = [
  [["active true"], [false, 0, 0, false, false, false], drag(true, null)],
  [["left entered 30,30 thing [] true", "left contains true", "target left"], [true, 30, 30, true, false, false], drag(true, "left")],
  [["left moved 40,30 thing [] true"], [true, 40, 30, true, false, false], drag(true, "left")],
  // The one in front takes it from the one behind.
  [["left exited", "left contains false", "over entered 30,30 thing [] true", "target over"], [false, 40, 30, false, true, false], drag(true, "over")],
  [["over moved 80,30"], [false, 40, 30, false, true, false], drag(true, "over")],
  // One with keys does not have what has none of them...
  [["over exited", "target null"], [false, 40, 30, false, false, false], drag(true, null)],
  // ... and has it once it has one.
  [["keyed entered 30,30 thing [blue,red] true", "target keyed"], [false, 40, 30, false, false, true], drag(true, "keyed")],
  [[], [false, 40, 30, false, false, true], drag(true, "keyed")],
  // Dropped where it was taken: the target stays the area that took it.
  [["keyed dropped blue,red 2", "active false", "drop 1"], [false, 40, 30, false, false, false], drag(false, "keyed")],
  [["keyed entered 40,30 thing [blue,red] true", "active true"], [false, 40, 30, false, false, true], drag(true, "keyed")],
  // One that will not have it.
  [["keyed exited", "shy entered", "target null"], [false, 40, 30, false, false, false], drag(true, null)],
  [["left entered 30,30 thing [blue,red] true", "left contains true", "target left"], [true, 30, 30, true, false, false], drag(true, "left")],
  // Dropped where nothing took it.
  [["left dropped 30,30 thing [blue,red] false 2 2", "left contains false", "target null", "active false", "drop 0"], [false, 30, 30, false, false, false], drag(false, null)],
  // Assigned to, it starts and ends there and then.
  [
    ["left entered 30,30 thing [blue,red] true", "left contains true", "target left", "active true", "left exited", "left contains false", "target null", "active false"],
    [false, 30, 30, false, false, false],
    drag(false, null),
  ],
  [["active true", "active false", "drop 0"], [false, 30, 30, false, false, false], drag(false, null)],
  // An area that is not enabled is not asked.
  [["active true", "active false"], [false, 30, 30, false, false, false], drag(false, null)],
];

test("a drag is told to the area under its hot spot, as Qt tells it", async ({ page }) => {
  await open(page, "dragdrop");
  const read = () => page.evaluate(() => window.scene.read());
  expect(await read()).toEqual([[], [false, 0, 0, false, false, false], drag(false, null)]);
  for (const [index, expected] of STEPS.entries()) {
    await page.evaluate((index) => window.scene.step(index), index);
    expect(await read(), `step ${index}`).toEqual(expected);
  }
});

test("a row dragged with the mouse onto another is dropped on it", async ({ page }) => {
  await open(page, "dragreorder");
  const read = () => page.evaluate(() => window.scene.read());
  const box = await page.locator(".q-scene").boundingBox();
  const at = (x, y) => [box.x + x, box.y + y];

  await page.mouse.move(...at(100, 20));
  await page.mouse.down();
  await page.mouse.move(...at(100, 60), { steps: 4 });
  await page.mouse.move(...at(100, 100), { steps: 4 });
  expect((await read())[1]).toEqual(["over two", "over three"]);
  await page.mouse.up();
  expect(await read()).toEqual([["two", "three", "one", "four"], ["one on three", "drop 2"]]);

  // Let go of where there is nothing to take it, it is not dropped at all.
  await page.mouse.move(...at(100, 140));
  await page.mouse.down();
  await page.mouse.move(...at(100, 190), { steps: 4 });
  await read();
  await page.mouse.up();
  expect(await read()).toEqual([["two", "three", "one", "four"], ["drop 0"]]);
});
