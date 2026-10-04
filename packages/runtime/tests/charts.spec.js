// QtCharts' chart of bars and lines. What is expected is what Qt 6.11 says and
// paints for the same QML: each `chart*.qml` scene is run by `qml6` too
// (`--apptype widget`), asked the same and grabbed after each step.
// `fixtures/charts.json` is what it said and `fixtures/charts/` its pictures.
// The labels are of the test font, whose letters are boxes: text painted by
// two painters is otherwise no picture to compare.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "./open.js";
import { fixtures, read, ready, step, unlike as differing } from "./plots.js";

const expected = JSON.parse(readFileSync(join(fixtures, "charts.json"), "utf8"));
const unlike = (page, clip, name, slack) => differing(page, clip, `charts/${name}`, slack);

test("bars on a category axis are where and what Qt's are", async ({ page }) => {
  const clip = await ready(page, "chartbars");
  expect(await read(page)).toEqual(expected.chartbars[0]);
  expect(await unlike(page, clip, "chartbars-0")).toBe(0);
});

// A wide line that is not smoothed has edges two painters round differently:
// a pixel here and there along the curve, and around the legend's circles.
test("a spline on a right-hand axis over bars, and what is appended to it", async ({ page }) => {
  const clip = await ready(page, "chartspline");
  const rows = expected.chartspline;
  for (const [index, row] of rows.entries()) {
    expect(await read(page), `row ${index}`).toEqual(row);
    expect(await unlike(page, clip, `chartspline-${index}`), `picture ${index}`).toBeLessThan(120);
    if (index + 1 < rows.length) await step(page, index);
  }
});

test("the axes a chart makes, and the ones it is given", async ({ page }) => {
  const clip = await ready(page, "chartaxes");
  const rows = expected.chartaxes;
  // Until the first step the labels are of the machine's own font, and the
  // plot is where their widths leave it.
  expect((await read(page)).slice(4)).toEqual(rows[0].slice(4));
  for (let index = 1; index < rows.length; index++) {
    await step(page, index - 1);
    expect(await read(page), `row ${index}`).toEqual(rows[index]);
    expect(await unlike(page, clip, `chartaxes-${index}`), `picture ${index}`).toBeLessThan(20);
  }
});

test("the legend on each side, and its markers", async ({ page }) => {
  const clip = await ready(page, "chartlegend");
  const rows = expected.chartlegend;
  for (const [index, row] of rows.entries()) {
    expect(await read(page), `row ${index}`).toEqual(row);
    expect(await unlike(page, clip, `chartlegend-${index}`), `picture ${index}`).toBeLessThan(40);
    if (index + 1 < rows.length) await step(page, index);
  }
});

// Two painters smooth an edge each in its own way, and Qt's shadow is not
// quite the blur a browser has: what is compared is where things are and how
// dark, not the last shade of each edge.
test("a chart that smooths what it draws, with a shadow under it", async ({ page }) => {
  const clip = await ready(page, "chartsmooth");
  expect(await read(page)).toEqual(expected.chartsmooth[0]);
  expect(await unlike(page, clip, "chartsmooth-0", 40)).toBeLessThan(150);
});

test("a theme's colours replace only the pens and brushes nothing was said of", async ({ page }) => {
  await ready(page, "chartpens");
  expect(await read(page)).toEqual(expected.chartpens[0]);
});
