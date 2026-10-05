// What is expected here is what Qt 6.11 answers for the same QML (`qml6`),
// the layout's once Qt has polished it.
import { expect, open, test } from "./open.js";

const LEFT = [
  [10, 65, 200, 7, 390, 205, 4, 190],
  [375, 20, 0, 5, 86],
  [0, 0, 12, 1, 190, 170],
  [0, 0, 30, 0, 0, 0, 60, 0],
  [1, 1, 4],
  [0, 0, 10],
];

const RIGHT = [
  [340, 305, 160, 3, 390, 175, 206, 190],
  [375, 0, 95, 9, 86],
  [1, 22, 0, 0, 0, 10],
  [1, 40, 0, 20, 1, 40, 10, 50],
  [2, 1, 4],
  [0, 90, 0],
];

const but = (rows, row, column, value) => rows.map((line, at) => (at === row ? line.with(column, value) : line));

test("a mirrored item is laid out from the right, and so is what inherits it", async ({ page }) => {
  await open(page, "layoutmirroring");
  const read = () => page.evaluate(() => window.scene.read());
  const step = (index) => page.evaluate((index) => window.scene.step(index), index);
  expect(await read()).toEqual([...LEFT, [false, false, false, true, false, false, 0]]);

  // The item alone: it has nothing of its own to turn round.
  await step(0);
  expect(await read()).toEqual([...LEFT, [true, false, false, true, false, false, 0]]);

  await step(1);
  expect(await read()).toEqual([...RIGHT, [true, true, false, true, true, false, 1]]);

  // One that says otherwise for what is inside it too.
  await step(2);
  let right = but(RIGHT, 1, 1, 20);
  expect(await read()).toEqual([...right, [true, true, false, true, true, false, 1]]);

  // One that says otherwise for itself, and goes on saying so.
  await step(3);
  right = but(right, 0, 1, 395);
  expect(await read()).toEqual([...right, [true, true, false, true, true, false, 1]]);
  // It had said nothing of mirroring until now, and is drawn where it says.
  await expect.poll(() => page.evaluate(() => window.scene.late().$node.getBoundingClientRect().x)).toBe(395);
  await step(4);
  expect(await read()).toEqual([...right, [true, true, false, true, true, false, 1]]);

  await step(5);
  expect(await read()).toEqual([...LEFT, [false, false, false, true, false, false, 2]]);
});
