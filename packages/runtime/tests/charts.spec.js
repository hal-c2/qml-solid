// QtCharts' chart of bars and lines. What is expected is what Qt 6.11 says and
// paints for the same QML: each `chart*.qml` scene is run by `qml6` too
// (`--apptype widget`), asked the same and grabbed after each step.
// `fixtures/charts.json` is what it said and `fixtures/charts/` its pictures.
// The labels are of the test font, whose letters are boxes: text painted by
// two painters is otherwise no picture to compare.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, open, test } from "./open.js";

const fixtures = join(import.meta.dirname, "fixtures");
const expected = JSON.parse(readFileSync(join(fixtures, "charts.json"), "utf8"));

// The scene at its own size, once the font it measures with is there.
async function ready(page, scene) {
  await open(page, scene);
  await page.waitForFunction(() => window.scene.loaded !== false);
  return page.evaluate(() => {
    const { width, height } = window.scene;
    const element = document.getElementById("scene");
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    return { x: 0, y: 0, width, height };
  });
}

const read = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.scene.read())));
const step = (page, index) => page.evaluate((index) => window.scene.step(index), index);

// How many pixels of the page are not those of Qt's picture, as near as the
// rounding of two painters allows: or as `slack` does, where they smooth.
// Qt's has nothing around the chart, where the page is white.
async function unlike(page, clip, name, slack = 3) {
  const shot = (await page.screenshot({ clip })).toString("base64");
  const theirs = readFileSync(join(fixtures, "charts", `${name}.png`)).toString("base64");
  return page.evaluate(
    async ([slack, ...pictures]) => {
      const [ours, theirs] = await Promise.all(
        pictures.map(async (picture) => {
          const image = document.createElement("img");
          image.src = `data:image/png;base64,${picture}`;
          await image.decode();
          const canvas = new OffscreenCanvas(image.naturalWidth, image.naturalHeight);
          const context = canvas.getContext("2d", { willReadFrequently: true });
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0);
          return context.getImageData(0, 0, canvas.width, canvas.height);
        }),
      );
      if (ours.width !== theirs.width || ours.height !== theirs.height) return Infinity;
      let count = 0;
      for (let i = 0; i < ours.data.length; i += 4) {
        const far = Math.max(
          Math.abs(ours.data[i] - theirs.data[i]),
          Math.abs(ours.data[i + 1] - theirs.data[i + 1]),
          Math.abs(ours.data[i + 2] - theirs.data[i + 2]),
        );
        if (far > slack) count++;
      }
      return count;
    },
    [slack, shot, theirs],
  );
}

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
