// An item's layer and the effect of it.
import { expect, open, test } from "./open.js";
import { pixels } from "./pixels.js";

const RED = "255 0 0";
const BLUE = "51 102 153";
const WHITE = "255 255 255";

// What there is of the effects made for the item `name` is of.
const effects = (page, name) =>
  page.evaluate((name) => {
    const item = name === "button" ? window.objects.button.background : window.objects[name];
    return window.objects.made
      .filter((effect) => effect.name === name)
      .map((effect) => {
        const { x, y, width, height } = effect.$node.getBoundingClientRect();
        return {
          seen: [...effect.seen],
          box: [x, y, width, height],
          there: effect.$node.isConnected,
          under: effect.$node.nextSibling === item.$node,
          of: effect.source?.sourceItem === item,
          parent: effect.parent === item.parent,
        };
      });
  }, name);

test("the effect of a layer is drawn under its item, where the item is", async ({ page }) => {
  await open(page, "layer");
  expect(await effects(page, "box")).toEqual([
    { seen: ["rounded 4", "completed 4 of 100"], box: [40, 120, 100, 40], there: true, under: true, of: true, parent: true },
  ]);
  // Around the item, and not over it.
  expect(await pixels(page, [[37, 140], [60, 140], [143, 140], [150, 140]])).toEqual([RED, BLUE, RED, WHITE]);
  await page.evaluate(() => {
    window.objects.box.x = 60;
    window.objects.box.height = 60;
  });
  expect((await effects(page, "box"))[0].box).toEqual([60, 120, 100, 60]);
  expect(await pixels(page, [[37, 140], [57, 140], [80, 170], [80, 183]])).toEqual([WHITE, RED, BLUE, RED]);
});

test("the effect of the layer of what a property holds reads the property", async ({ page }) => {
  await open(page, "layer");
  // Complete with what it was bound to: nothing changed after.
  expect(await effects(page, "button")).toEqual([
    { seen: ["rounded 20", "completed 20 of 120"], box: [40, 30, 120, 40], there: true, under: true, of: true, parent: true },
  ]);
  expect(await pixels(page, [[100, 27], [100, 50]])).toEqual([RED, BLUE]);
});

test("a layer has an effect while it is enabled", async ({ page }) => {
  await open(page, "layer");
  await page.evaluate(() => (window.objects.box.layer.enabled = false));
  expect((await effects(page, "box")).map((effect) => effect.there)).toEqual([false]);
  expect(await pixels(page, [[37, 140], [60, 140]])).toEqual([WHITE, BLUE]);
  await page.evaluate(() => (window.objects.box.layer.enabled = true));
  expect((await effects(page, "box")).map((effect) => [effect.there, effect.under])).toEqual([
    [false, false],
    [true, true],
  ]);
  expect(await pixels(page, [[37, 140], [60, 140]])).toEqual([RED, BLUE]);
});

test("a MultiEffect of a layer is done to the item where it is", async ({ page }) => {
  await open(page, "layer");
  const given = await page.evaluate(() => {
    const node = window.objects.soft.$node;
    const { x, y, width, height } = node.getBoundingClientRect();
    return {
      filter: node.style.filter,
      moved: node.style.translate + node.style.scale,
      shown: node.classList.contains("qq-effect-shown"),
      opacity: getComputedStyle(node).opacity,
      box: [x, y, width, height],
    };
  });
  expect(given).toEqual({ filter: "drop-shadow(rgb(0, 0, 0) 0px 10px 0px)", moved: "", shown: false, opacity: "0.5", box: [240, 120, 80, 40] });
  // Its shadow below it, as clear as the item is.
  const [shadow, below] = await pixels(page, [[280, 165], [280, 175]]);
  expect(Math.abs(Number(shadow.split(" ")[0]) - 128)).toBeLessThan(4);
  expect(below).toBe(WHITE);
});
