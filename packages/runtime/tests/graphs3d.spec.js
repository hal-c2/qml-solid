// QtGraphs' graphs in space. What is expected is what Qt 6.11 says and draws
// for the same QML: each `graph3d*.qml` scene is run by `qml6` too, asked the
// same and grabbed after each step. `fixtures/graphs3d.json` is what it said
// and `fixtures/graphs3d/` its pictures.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "./open.js";
import { fixtures, read, ready, step, unlike } from "./plots.js";

const expected = JSON.parse(readFileSync(join(fixtures, "graphs3d.json"), "utf8"));

async function same(page, scene, most) {
  const clip = await ready(page, scene);
  const rows = expected[scene];
  for (const [index, row] of rows.entries()) {
    expect(await read(page), `row ${index}`).toEqual(row);
    if (most !== undefined) expect(await unlike(page, clip, `graphs3d/${scene}-${index}`, 24), `picture ${index}`).toBeLessThan(most);
    if (index + 1 < rows.length) await step(page, index);
  }
}

test("surfaces through the rows of list models", async ({ page }) => {
  await same(page, "graph3dsurface");
});

test("bars in the rows and columns of a list model", async ({ page }) => {
  await same(page, "graph3dbars");
});

test("points from a list model, and the one that is selected", async ({ page }) => {
  await same(page, "graph3dscatter");
});

test("graphs that were given nothing, and what their cameras, axes and series answer", async ({ page }) => {
  await same(page, "graph3dbare");
});
