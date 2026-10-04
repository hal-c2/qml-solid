// What is expected here is what Qt 6.11 answers for the same QML: the scene
// is run by `qml6` too and asked the same, and `fixtures/fusion.json` is
// what it said.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, open, test } from "./open.js";

const expected = JSON.parse(readFileSync(join(import.meta.dirname, "fixtures/fusion.json"), "utf8"));

test("Fusion makes of a palette the colours Qt makes of it", async ({ page }) => {
  await open(page, "fusion");
  const answers = await page.evaluate(() => JSON.parse(JSON.stringify(window.scene.answers())));
  for (const [index, row] of expected.entries()) expect(answers[index], `row ${index}`).toEqual(row);
  expect(answers.length).toBe(expected.length);
});
