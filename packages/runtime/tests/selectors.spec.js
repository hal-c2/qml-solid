// What is expected here is what Qt 6.11 answers for the same QML: the scene
// is run by `qml6` too, with the same pictures in a folder, and asked the
// same after each step. `fixtures/selectors.json` is what it said: the file
// each image shows, its status, the files for values that are not true or
// false, and what a selector says of itself.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, open, test } from "./open.js";

const expected = JSON.parse(readFileSync(join(import.meta.dirname, "fixtures", "selectors.json"), "utf8"));

const answers = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.scene.answers())));

async function settled(page) {
  await page.waitForFunction(() => window.scene.ready());
  return answers(page);
}

test("a selector chooses the file Qt chooses", async ({ page }) => {
  await open(page, "selectors");
  const [files, statuses, truths, selector] = await settled(page);
  expect(files).toEqual(expected[0][0]);
  expect(statuses).toEqual(expected[0][1]);
  expect(truths).toEqual(expected[0][2]);
  expect(selector).toEqual(expected[0][3]);
});

// The last but one step is of another separator for a single state, which
// Qt remembers the file of by the state alone: the file stays.
test("a selector chooses again when a state, the name or the separator changes", async ({ page }) => {
  await open(page, "selectors");
  await settled(page);
  for (const [step, stage] of expected.slice(1).entries()) {
    await page.evaluate((step) => window.scene.step(step), step);
    expect(await settled(page), `step ${step}`).toEqual(stage);
  }
});

// The name alone is no file: nothing asks for it, before a file is chosen or
// when there is none to choose.
test("the name a picture is given is not loaded", async ({ page }) => {
  const asked = [];
  page.on("request", (request) => asked.push(new URL(request.url()).pathname));
  await open(page, "selectors");
  await settled(page);
  const pictures = asked.filter((path) => path.startsWith("/assets/chosen/"));
  expect(pictures.length).toBeGreaterThan(0);
  expect(pictures.filter((path) => !/\.(png|gif|webp)$/.test(path))).toEqual([]);
});
