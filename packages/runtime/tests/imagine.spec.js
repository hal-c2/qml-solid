// What is expected here is what Qt 6.11 answers for the same QML: the scene
// is run by `qml6` too and asked the same after each step, and
// `fixtures/imagine.json` is what it said.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, open, test } from "./open.js";

const expected = JSON.parse(readFileSync(join(import.meta.dirname, "fixtures/imagine.json"), "utf8"));

const answers = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.scene.answers())));

test("Imagine gives an object the path of what it is in, unless it is given its own", async ({ page }) => {
  await open(page, "imagine");
  const first = await answers(page);
  for (const [index, row] of expected[0].entries()) expect(first[index], `row ${index}`).toEqual(row);
  expect(first.length).toBe(expected[0].length);
});

test("a path that changes, or is taken back, changes what follows it", async ({ page }) => {
  await open(page, "imagine");
  for (const [step, rows] of expected.slice(1).entries()) {
    await page.evaluate((step) => window.scene.step(step), step);
    expect(await answers(page), `step ${step}`).toEqual(rows);
  }
});
