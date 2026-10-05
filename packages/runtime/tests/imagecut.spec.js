import { expect, open, test } from "./open.js";
import { pixels } from "./pixels.js";

const RED = "255 0 0";
const GREEN = "0 255 0";
const BLUE = "0 0 255";
const WHITE = "255 255 255";

// What `qml6` says of the scene, and the colours of its picture of it. The
// rectangle is of the picture as big as it is loaded, so of the smaller one
// `sourceSize` asks for; the item has a picture as big as the rectangle,
// with nothing in it where the picture ends first; and a rectangle with
// nothing in it is none.
const QT = [
  "40/20/40/20/40/20/1 10/10/10/10/10/10/1 5/5/50/50/5/5/1 10/10/10/10/0/10/1 20/30/20/30/80/40/1 10/10/60/60/10/10/1 20/20/20/20/20/20/1 30/30/30/30/30/30/1 40/20/40/20/40/20/1 40/20/40/20/40/20/1",
  "QRectF(0, 0, 0, 0)",
  "10/20/10/20/10/20/1 QRectF(5, 5, 10, 20)",
  "40/20/40/20/40/20/1 QRectF(0, 0, 0, 0)",
];

const PAINTED = [
  // cut
  [12, 15, RED],
  [17, 15, BLUE],
  [22, 15, WHITE],
  [12, 22, WHITE],
  // corner
  [42, 12, GREEN],
  [88, 58, GREEN],
  [92, 30, WHITE],
  // small
  [102, 15, RED],
  [108, 15, BLUE],
  [112, 15, WHITE],
  [102, 22, WHITE],
  // both
  [135, 15, BLUE],
  [145, 15, WHITE],
  [135, 38, WHITE],
  // fit
  [15, 120, RED],
  [35, 120, RED],
  [45, 120, BLUE],
  [65, 120, BLUE],
  [15, 150, RED],
  [65, 158, BLUE],
  [15, 108, WHITE],
  // over
  [103, 103, BLUE],
  [113, 103, WHITE],
  [103, 113, WHITE],
  [118, 118, WHITE],
  // outside
  [160, 110, WHITE],
  // empty, flat
  [205, 105, RED],
  [235, 110, BLUE],
  [255, 105, RED],
  // later
  [305, 105, BLUE],
  [315, 105, BLUE],
  [325, 105, WHITE],
  [315, 112, WHITE],
  // plain
  [302, 202, GREEN],
];

test("an Image has the part of its picture that sourceClipRect says", async ({ page }) => {
  await open(page, "imagecut");
  await page.waitForFunction(() => Object.values(window.objects).every((item) => item?.status !== 2));
  expect(await page.evaluate(() => window.scene.read())).toEqual(QT);
  const colours = await pixels(page, PAINTED.map(([x, y]) => [x, y]));
  expect(PAINTED.map(([x, y], index) => `${x},${y} ${colours[index]}`)).toEqual(PAINTED.map(([x, y, colour]) => `${x},${y} ${colour}`));
});
