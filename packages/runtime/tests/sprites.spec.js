import { expect, test } from "./open.js";
import { pixels } from "./pixels.js";

async function show(page, part) {
  await page.goto(`/?scene=sprites&part=${part}`);
  await page.waitForFunction(() => window.ready);
}

const advance = (page, ms) => page.evaluate((ms) => window.objects.clock.advance(ms), ms);
// The sheets of these are there.
const loaded = (page, ...names) =>
  page.waitForFunction((names) => names.every((name) => window.objects.scene[name].implicitWidth > 0), names);
// The two layers of an item: what each shows of the sheet, and how much of the upper one.
const layers = (page, name) =>
  page.evaluate(
    (name) =>
      Array.from(window.objects.scene[name].$node.querySelectorAll(":scope > .qq-sprite"), (layer) =>
        layer.style.display === "none" ? null : [layer.style.backgroundPosition, Number(layer.style.opacity || 1)],
      ),
    name,
  );

const RED = "255 0 0";
const GREEN = "0 255 0";
const BLUE = "0 0 255";
const WHITE = "255 255 255";

// What Qt 6.11 says of `sprites/Sheets.qml`, fifty milliseconds after each
// tenth of a second: `sample()`, with `step()` called at the tenths between.
const SAMPLES = [
  [0, 0, true, false, 0, true, 1, "a", "a", "a"],
  [0, 0, true, false, 1, true, 1, "a", "a", "a"],
  [0, 1, true, false, 2, true, 1, "b", "a", "a"],
  [0, 1, true, false, 3, true, 1, "b", "a", "a"],
  [0, 2, true, false, 3, false, 1, "c", "b", "a"],
  [1, 2, true, false, 3, false, 1, "c", "b", "a"],
  [1, 3, true, false, 3, false, 0, "a", "b", "a"],
  [1, 3, true, false, 3, false, 0, "a", "c", "a"],
  [1, 0, true, false, 3, false, 2, "b", "c", "a"],
  [1, 0, true, false, 3, false, 2, "b", "c", "a"],
  [0, 1, true, false, 0, true, 2, "c", "c", "a"],
  [0, 1, true, false, 1, true, 2, "c", "c", "a"],
  [0, 2, true, false, 2, true, 2, "c", "c", "a"],
  [0, 2, true, false, 3, true, 2, "c", "c", "a"],
  [0, 3, true, false, 3, false, 2, "c", "c", "a"],
  [1, 3, true, false, 3, false, 2, "b", "c", "a"],
  [1, 0, false, false, 3, false, 2, "b", "c", "a"],
  [1, 0, true, false, 3, false, 2, "c", "c", "a"],
  [1, 0, true, true, 3, false, 2, "c", "c", "a"],
  [1, 0, true, true, 3, false, 2, "c", "c", "a"],
  [0, 0, true, false, 3, false, 2, "c", "c", "a"],
  [0, 1, true, false, 3, false, 2, "c", "c", "a"],
  [0, 1, true, false, 3, false, 2, "c", "c", "a"],
  [0, 2, true, false, 3, false, 2, "c", "c", "a"],
];

test("sprites have no size, frame or name before their sheet is there", async ({ page }) => {
  let release;
  const held = new Promise((resolve) => (release = resolve));
  await page.route("**/sheet.png", async (route) => {
    await held;
    await route.continue();
  });
  await show(page, "Sheets");
  expect(await page.evaluate(() => window.objects.scene.first())).toEqual([
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0],
    -1,
    true,
    0,
    "",
    true,
    false,
    "",
    3,
  ]);
  release();
  await loaded(page, "whole");
  // The frame's size is the sheet's, shared out among the frames.
  expect(await page.evaluate(() => window.objects.scene.sized())).toEqual([
    [20, 10, 20, 10, 20, 10],
    [40, 10, 40, 10, 40, 10],
    [10, 10, 10, 10, 10, 10],
  ]);
});

test("sprites play, end, pause, jump and seek as Qt's do", async ({ page }) => {
  await show(page, "Sheets");
  await loaded(page, "whole");
  const samples = [];
  for (let time = 50; time <= 2400; time += 50) {
    await advance(page, 50);
    if (time % 100) samples.push(await page.evaluate(() => window.objects.scene.sample()));
    else await page.evaluate((time) => window.objects.scene.step(time), time);
  }
  expect(samples).toEqual(SAMPLES);
  // One that ended is told so once it is stopped, at the frame it ends with.
  expect(await page.evaluate(() => window.objects.scene.log)).toEqual(["last 3 false", "last 3 false", "twice 0 false"]);
  // What is painted then: the frame that is on, stretched to the item, and
  // nothing of a sequence that has no size. These are the ones that blend
  // nothing: Qt was asked with its software renderer, which never does.
  expect(
    await pixels(page, [
      [60, 10],
      [69, 19],
      [105, 5],
      [155, 5],
      [202, 5],
      [238, 5],
      [10, 110],
      [19, 119],
      [55, 105],
      [105, 105],
    ]),
  ).toEqual([BLUE, BLUE, WHITE, GREEN, RED, WHITE, BLUE, BLUE, BLUE, RED]);
  const [none, empty] = await pixels(page, [
    [155, 105],
    [280, 180],
  ]);
  expect(none).toBe(empty);
});

test("a frame is on its way to the next, but the last one to none", async ({ page }) => {
  await show(page, "Blend");
  await loaded(page, "mixed");
  await advance(page, 16);
  await advance(page, 34);
  // Half way from the first frame to the second.
  let [under, over] = await layers(page, "mixed");
  expect(under[0]).toBe("0px 0px");
  expect(over[0]).toBe("-10px 0px");
  expect(over[1]).toBeCloseTo(0.5);
  const [mixed] = await pixels(page, [[5, 5]]);
  const [red, green, blue] = mixed.split(" ").map(Number);
  expect(Math.abs(red - green)).toBeLessThan(80);
  expect(red).toBeGreaterThan(100);
  expect(blue).toBe(0);
  await advance(page, 300);
  [under, over] = await layers(page, "mixed");
  expect(under[0]).toBe("-30px 0px");
  expect(over).toBe(null);
  // A sequence blends within a sprite, and not from one into the next.
  [under, over] = await layers(page, "steps");
  expect(under[0]).toBe("-30px 0px");
  expect(over).toBe(null);
  expect(await page.evaluate(() => window.objects.scene.steps.currentSprite)).toBe("rest");
});

test("a sprite in step with the frames shows one for each frame drawn", async ({ page }) => {
  await show(page, "Blend");
  await loaded(page, "synced");
  const frames = [];
  for (let frame = 0; frame < 6; frame++) {
    await advance(page, 16);
    frames.push(await page.evaluate(() => window.objects.scene.synced.currentFrame));
  }
  expect(frames).toEqual([1, 2, 3, 0, 1, 2]);
});
