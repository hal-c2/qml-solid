// What is expected here is what Qt 6.11 answers for the same QML: the scene
// is run by `qml6` too and asked the same, and `fixtures/iconlabel.json` is
// what it said.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, open, test } from "./open.js";

const expected = JSON.parse(readFileSync(join(import.meta.dirname, "fixtures/iconlabel.json"), "utf8"));

test("an IconLabel measures and places its icon and its text as Qt's does", async ({ page }) => {
  await open(page, "iconlabel");
  await page.waitForFunction(() => window.scene.ready());
  const answers = await page.evaluate(() => JSON.parse(JSON.stringify(window.scene.answers())));
  for (const [index, row] of expected.entries()) expect(answers[index], `row ${index}`).toEqual(row);
  expect(answers.length).toBe(expected.length);
});
