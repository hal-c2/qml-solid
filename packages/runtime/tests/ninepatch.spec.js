// What is expected here is what Qt 6.11 answers and paints for the same
// QML: the scene is run by `qml6` too, asked the same after each step, and
// `fixtures/ninepatch.json` is what it said. `ninepatch-pixels.json` is the
// colours of its picture along a row and a column through each item, and
// `ninepatch-smooth.json` those of the item that is smoothed.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, open, test } from "./open.js";
import { pixels } from "./pixels.js";

const fixture = (name) => JSON.parse(readFileSync(join(import.meta.dirname, "fixtures", name), "utf8"));
const expected = fixture("ninepatch.json");
const painted = fixture("ninepatch-pixels.json");
const smoothed = fixture("ninepatch-smooth.json");

async function ready(page) {
  await open(page, "ninepatch");
  await page.waitForFunction(() => window.scene.ready());
}

const answers = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.scene.answers())));

// The points that are not the colour Qt has them, within `by`.
async function wrong(page, points, by) {
  const colours = await pixels(page, points.map(([point]) => point));
  return points.flatMap(([point, colour], index) => {
    const found = colours[index].split(" ").map(Number);
    return found.every((part, at) => Math.abs(part - colour[at]) <= by) ? [] : [`${point}: ${colours[index]}, Qt ${colour}`];
  });
}

test("a picture's marks are read as Qt reads them", async ({ page }) => {
  await ready(page);
  const first = await answers(page);
  for (const [index, row] of expected[0].entries()) expect(first[index], `item ${index}`).toEqual(row);
  expect(first.length).toBe(expected[0].length);
});

// What the marks said stays said when the next picture has none to read,
// and is said anew by one that has a frame with nothing in it.
test("what the marks said is kept until other marks are read", async ({ page }) => {
  await ready(page);
  for (const [step, rows] of expected.slice(1).entries()) {
    await page.evaluate((step) => window.scene.step(step), step);
    await page.waitForFunction(() => window.scene.ready());
    expect(await answers(page), `step ${step}`).toEqual(rows);
  }
});

// Among the points is where two pieces meet in the middle of a pixel, and
// where the picture ends in one.
test("the pieces of a picture are painted where Qt paints them", async ({ page }) => {
  await ready(page);
  await expect(async () => expect(await wrong(page, painted, 3)).toEqual([])).toPass({ timeout: 5000 });
});

// A browser smooths in coarser steps than a graphics card.
test("a smoothed picture is smoothed within itself", async ({ page }) => {
  await ready(page);
  await expect(async () => expect(await wrong(page, smoothed, 16)).toEqual([])).toPass({ timeout: 5000 });
});

// The colours are those `assets/makepatches.py` gives the pictures.
test("a picture with no marks takes the place of one with marks, and one with marks its place", async ({ page }) => {
  await ready(page);
  const middle = [[110, 145]];
  await page.evaluate(() => window.scene.step(0));
  await page.waitForFunction(() => window.scene.ready());
  await expect.poll(() => pixels(page, middle)).toEqual(["0 128 255"]);
  await page.evaluate(() => window.scene.step(1));
  await expect.poll(() => pixels(page, middle)).toEqual(["255 255 255"]);
  await page.evaluate(() => window.scene.step(2));
  await page.waitForFunction(() => window.scene.ready());
  await expect.poll(() => pixels(page, middle)).toEqual(["120 120 200"]);
});
