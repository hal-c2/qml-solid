// What is expected here is what Qt 6.11 answers for the same QML: the scene
// is run by `qml6` too and asked the same, and `fixtures/universal.json` is
// what it said.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, open, test } from "./open.js";

const expected = JSON.parse(readFileSync(join(import.meta.dirname, "fixtures/universal.json"), "utf8"));

test("Universal gives an object the theme and the colours Qt gives it", async ({ page }) => {
  await open(page, "universal");
  const answers = await page.evaluate(() => JSON.parse(JSON.stringify(window.scene.answers())));
  for (const [index, row] of expected.entries()) expect(answers[index], `row ${index}`).toEqual(row);
  expect(answers.length).toBe(expected.length);
});
