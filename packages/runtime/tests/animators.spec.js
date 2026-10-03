// What is expected of the properties here is what Qt 6.11 answers for the
// same QML (`qml6`): opacity of a, x and y of b, scale and rotation of c, x
// of d, x and opacity of e, and then which animations are running.
import { expect, open, test } from "./open.js";

const read = (page) => page.evaluate(() => [window.scene.read(), window.scene.running()]);
const advance = (page, ms) => page.evaluate((ms) => window.clock.advance(ms), ms);

// What the page draws: each item's opacity and where its element is.
const drawn = (page) =>
  page.evaluate(() =>
    window.scene.items().map((item) => {
      const { x, y, width } = item.$node.getBoundingClientRect();
      return [Number(getComputedStyle(item.$node).opacity), x, y, width].map((value) => Math.round(value * 100) / 100);
    }),
  );

const STILL = [1, 0, 60, 1, 0, 300, 0, 1];

test("an animator moves what is drawn, and the property is told at the end", async ({ page }) => {
  await open(page, "animators&still");
  expect(await read(page)).toEqual([STILL, [false, false, false, false, false, false, false]]);

  await page.evaluate(() => window.scene.step(0));
  expect(await read(page)).toEqual([STILL, [true, true, true, true, true, true, true]]);
  await advance(page, 50);
  expect(await read(page)).toEqual([STILL, [true, true, true, true, true, true, true]]);
  // Half way: InQuad is a quarter of the way there, the turn is through 360,
  // and the square twice the size sticks out by a half of what it has grown.
  expect(await drawn(page)).toEqual([
    [0.6, 0, 0, 50],
    [1, 60, 85, 50],
    [1, 187.5, -12.5, 75],
    [1, 150, 100, 50],
    [1, 50, 200, 20],
  ]);

  await advance(page, 100);
  // In a sequence it is told when the whole sequence is over.
  expect(await read(page)).toEqual([[0.2, 110, 160, 2, 370, 0, 0, 1], [false, false, false, false, false, false, true]]);
  expect((await drawn(page))[4]).toEqual([0.75, 100, 200, 20]);
  await advance(page, 150);
  expect(await read(page)).toEqual([[0.2, 110, 160, 2, 370, 0, 100, 0.5], [false, false, false, false, false, false, false]]);

  await page.evaluate(() => window.scene.step(1));
  expect(await read(page)).toEqual([[0.2, 110, 160, 2, 370, 0, 100, 0.5], [true, false, false, false, false, false, false]]);
  await advance(page, 200);
  expect(await read(page)).toEqual([[1, 110, 160, 2, 370, 0, 100, 0.5], [false, false, false, false, false, false, false]]);
  expect((await drawn(page))[0]).toEqual([1, 0, 0, 50]);
});
