import { expect, open, rect, test } from "./open.js";

const advance = (page, ms) => page.evaluate((ms) => window.objects.clock.advance(ms), ms);

test("a Behavior moves what a property reads as to the value it was given", async ({ page }) => {
  await open(page, "behavior");
  const assigned = await page.evaluate(() => {
    const { root, box, tail, follow, glide, log } = window.objects;
    root.where = 100;
    return [box.x, tail.x, follow.targetValue, glide.running, [...log]];
  });
  // As Qt prints it: the property still reads as it did, and so does what
  // is bound to it.
  expect(assigned).toEqual([0, 10, 100, true, ["glide true 0"]]);
  await advance(page, 48);
  expect(await rect(page, "box")).toEqual({ x: 48, y: 0, width: 50, height: 50 });
  expect(await rect(page, "tail")).toEqual({ x: 58, y: 60, width: 10, height: 10 });
  await advance(page, 52);
  expect(await page.evaluate(() => [window.objects.box.x, [...window.objects.log]])).toEqual([
    100,
    ["glide true 0", "glide false 100"],
  ]);
  expect(await page.evaluate(() => window.objects.clock.running)).toBe(false);
});

test("a value given on the way starts the animation again from where it is", async ({ page }) => {
  await open(page, "behavior");
  await page.evaluate(() => (window.objects.root.where = 100));
  await advance(page, 64);
  const turned = await page.evaluate(() => {
    const { root, box, glide, log } = window.objects;
    root.where = 0;
    return [box.x, glide.running, [...log]];
  });
  // It goes on running: nothing is told it stopped.
  expect(turned).toEqual([64, true, ["glide true 0"]]);
  await advance(page, 48);
  expect(await page.evaluate(() => window.objects.box.x)).toBeCloseTo(64 - 64 * 0.48, 10);
  await advance(page, 52);
  expect(await page.evaluate(() => [window.objects.box.x, window.objects.glide.running])).toEqual([0, false]);
});

test("a Behavior that is not enabled lets the value through", async ({ page }) => {
  await open(page, "behavior");
  await page.evaluate(() => (window.objects.root.where = 100));
  await advance(page, 64);
  const result = await page.evaluate(() => {
    const { root, box, follow, glide, log } = window.objects;
    log.length = 0;
    follow.enabled = false;
    const still = [box.x, glide.running];
    root.where = 60;
    const jumped = [box.x, glide.running];
    follow.enabled = true;
    root.where = 80;
    return [still, jumped, [box.x, glide.running], [...log]];
  });
  // Qt: disabling it stops nothing; the next value does, and is there at
  // once. (In Qt the handler of `running` still reads 64 there: here it is
  // run once the value is in.)
  expect(result).toEqual([
    [64, true],
    [60, false],
    [60, true],
    ["glide false 60", "glide true 60"],
  ]);
  await advance(page, 100);
  expect(await page.evaluate(() => [window.objects.box.x, window.objects.log.at(-1)])).toEqual([80, "glide false 80"]);
});

test("a colour moves through the colours between", async ({ page }) => {
  await open(page, "behavior");
  const first = await page.evaluate(() => {
    window.objects.box.color = "blue";
    return window.objects.box.color;
  });
  expect(first).toBe("#ff0000");
  await advance(page, 48);
  expect(await page.evaluate(() => window.objects.box.color)).toBe("#85007a");
  expect(await page.evaluate(() => getComputedStyle(window.objects.box.$node).backgroundColor)).toBe(
    "rgb(133, 0, 122)",
  );
  await advance(page, 52);
  expect(await page.evaluate(() => window.objects.box.color)).toBe("blue");
});

test("a spring keeps its velocity when it is given somewhere else to go", async ({ page }) => {
  await open(page, "behavior");
  const ys = await page.evaluate(() => {
    const { sprung, spring, clock } = window.objects;
    const seen = [];
    sprung.y = 100;
    for (let frame = 0; frame < 9; frame++) {
      clock.advance(16);
      seen.push(sprung.y.toFixed(4));
    }
    sprung.y = 0;
    for (let frame = 0; frame < 3; frame++) {
      clock.advance(16);
      seen.push(sprung.y.toFixed(4));
    }
    seen.push(spring.running);
    return seen;
  });
  // What Qt 6.11 prints for the same, frame by frame.
  expect(ys).toEqual([
    "3.2000",
    "8.8576",
    "16.3002",
    "24.9327",
    "34.2409",
    "43.7917",
    "53.2310",
    "62.2791",
    "70.7246",
    "75.2178",
    "76.4054",
    "74.9106",
    true,
  ]);
  await advance(page, 3000);
  expect(await page.evaluate(() => [window.objects.sprung.y, window.objects.spring.running])).toEqual([0, false]);
  expect(await page.evaluate(() => window.objects.clock.running)).toBe(false);
});

test("a smoothed animation eases in and out at its velocity", async ({ page }) => {
  await open(page, "behavior");
  await page.evaluate(() => (window.objects.eased.x = 100));
  const read = () => page.evaluate(() => window.objects.eased.x);
  await advance(page, 250);
  expect(await read()).toBeCloseTo(12.5, 6);
  await advance(page, 250);
  expect(await read()).toBeCloseTo(50, 6);
  await advance(page, 250);
  expect(await read()).toBeCloseTo(87.5, 6);
  await advance(page, 250);
  expect(await page.evaluate(() => [window.objects.eased.x, window.objects.smooth.running])).toEqual([100, false]);
});
