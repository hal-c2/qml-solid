// What is expected here is what Qt 6.11 answers for the same QML with the
// same settings: each scene is run by `qml6` too, with the
// `qtquickcontrols2.conf` beside it as its `QT_QUICK_CONTROLS_CONF`, and the
// fixture is what it said. Here the build is given that file (`controls`,
// in `vite.config.js`).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, open, test } from "./open.js";

const fixture = (name) => JSON.parse(readFileSync(join(import.meta.dirname, "fixtures", name), "utf8"));

async function answered(page, scene) {
  await open(page, scene);
  const expected = fixture(`${scene}.json`);
  const answers = await page.evaluate(() => JSON.parse(JSON.stringify(window.scene.answers())));
  for (const [index, row] of expected.entries()) expect(answers[index], `row ${index}`).toEqual(row);
  expect(answers.length).toBe(expected.length);
}

// Universal is imported there too, and is not the style: Qt has it read
// nothing of the settings then, and neither does it here.
test("Material has what an application's settings say", async ({ page }) => {
  await answered(page, "conf");
});

test("Universal has what an application's settings say where it is the style", async ({ page }) => {
  await answered(page, "confuniversal");
});

test("the style the settings name is the style where the build names none", async ({ page }) => {
  await open(page, "modules-said");
  expect(await page.evaluate(() => [window.objects.shelf.width, window.objects.shelf.height])).toEqual([60, 20]);
});
