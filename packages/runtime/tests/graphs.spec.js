// QtGraphs' graph of bars. What is expected is what Qt 6.11 says and draws
// for the same QML: each `graph*.qml` scene is run by `qml6` too, asked the
// same and grabbed after each step. `fixtures/graphs.json` is what it said
// and `fixtures/graphs/` its pictures. The labels are of the test font, whose
// letters are boxes: text drawn by two painters is otherwise no picture to
// compare. Qt draws a graph's lines and its bars' corners in a shader, which
// smooths an edge otherwise than a browser does: a few pixels along each.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "./open.js";
import { fixtures, read, ready, step, unlike } from "./plots.js";

const expected = JSON.parse(readFileSync(join(fixtures, "graphs.json"), "utf8"));

// The scene says what Qt's did after each step, and is its picture but for
// fewer than `most` pixels.
async function same(page, scene, most) {
  const clip = await ready(page, scene);
  const rows = expected[scene];
  for (const [index, row] of rows.entries()) {
    expect(await read(page), `row ${index}`).toEqual(row);
    if (most !== undefined) expect(await unlike(page, clip, `graphs/${scene}-${index}`), `picture ${index}`).toBeLessThan(most);
    if (index + 1 < rows.length) await step(page, index);
  }
}

test("bars between a category axis and a value axis, in each theme's colours", async ({ page }) => {
  await same(page, "graphbars", 320);
});

// A label that is turned is smoothed all along its edges, by each painter in
// its own way.
test("the delegates of labels and of bars, and what each is told", async ({ page }) => {
  await same(page, "graphdelegate", 2400);
});

// Qt smooths the edge of a bar that ends between two pixels, where a browser
// draws a box to the nearer one: a stack in thirds of the whole has many.
test("stacked bars, two series side by side, and whose colours a set takes", async ({ page }) => {
  await same(page, "graphstack", 900);
});

test("a mapper makes sets of a list model's rows and follows them", async ({ page }) => {
  await same(page, "graphmapper", 300);
});

// What the rows are is what Qt's mapper makes of a TableModel of the same
// cells: the pictures are not compared, there being no such model here.
test("a mapper makes sets of a table's columns or rows, and hears what it signals", async ({ page }) => {
  await same(page, "graphtable");
});

test("a view draws nothing until it has an axis, and an axis keeps its range in order", async ({ page }) => {
  await same(page, "graphbare", 80);
});
