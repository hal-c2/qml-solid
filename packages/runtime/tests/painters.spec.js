// What the styles paint in C++. Where it stands still, what is expected is
// what Qt 6.11 answers and paints for the same QML: `painted.qml` is run by
// `qml6` too, asked the same and grabbed, `fixtures/painted.json` is what it
// said and `painted-pixels.json` the colours of its picture at points inside
// what is painted. Where it moves, Qt cannot be stopped to look: what is
// expected there is what its sources say of each moment.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "./open.js";
import { pixels } from "./pixels.js";

const fixture = (name) => JSON.parse(readFileSync(join(import.meta.dirname, "fixtures", name), "utf8"));
const expected = fixture("painted.json");
const painted = fixture("painted-pixels.json");

async function ready(page, part) {
  await page.goto(`/?scene=painters&part=${part}`);
  await page.waitForFunction(() => window.ready);
  await page.waitForFunction(() => window.objects.scene.ready());
}

const advance = (page, time) => page.evaluate((time) => window.objects.clock.advance(time), time);
const set = (page, name, value) => page.evaluate(([name, value]) => (window.objects.scene[name] = value), [name, value]);

// A colour as near as the rounding of two painters allows.
const near = (colour, [red, green, blue]) => {
  const [r, g, b] = colour.split(" ").map(Number);
  return Math.abs(r - red) <= 3 && Math.abs(g - green) <= 3 && Math.abs(b - blue) <= 3;
};

test("what the styles paint answers what Qt's does", async ({ page }) => {
  await ready(page, "painted");
  const answers = await page.evaluate(() => JSON.parse(JSON.stringify(window.objects.scene.answers())));
  for (const [index, row] of expected.entries()) expect(answers[index], `row ${index}`).toEqual(row);
  expect(answers.length).toBe(expected.length);
});

test("what stands still is painted as Qt paints it", async ({ page }) => {
  await ready(page, "painted");
  await advance(page, 400);
  const colours = await pixels(page, painted.map(([point]) => point));
  const wrong = painted.flatMap(([point, colour], index) => (near(colours[index], colour) ? [] : [`${point}: ${colours[index]}, Qt ${colour}`]));
  expect(wrong).toEqual([]);
});

// The elements a painter made in an item, and what each is styled with.
const parts = (page, name, selector, ...styles) =>
  page.evaluate(
    ([name, selector, styles]) =>
      Array.from(window.objects.scene[name].$node.querySelectorAll(selector), (element) => styles.map((style) => element.style[style])),
    [name, selector, styles],
  );

// Whether the red of the scene's Material busy indicator is at points of it.
const inked = async (page, points) => (await pixels(page, points.map(([x, y]) => [x, y + 60]))).map((colour) => colour === "255 0 0");

const numbers = (texts) => texts.map((text) => Number(Number.parseFloat(text).toFixed(3)));

test("the circles of a Basic busy indicator fill one after the other and empty the same way", async ({ page }) => {
  await ready(page, "moving");
  const filled = async () => (await parts(page, "basicBusy", ".qq-basic-busy > div", "backgroundColor")).map(([colour]) => colour === "rgb(0, 0, 255)");
  expect(await filled()).toEqual(Array(10).fill(false));
  await advance(page, 500);
  expect(await filled()).toEqual([true, true, true, true, true, false, false, false, false, false]);
  await advance(page, 1000);
  expect(await filled()).toEqual([false, false, false, false, false, false, true, true, true, true]);
  // It stops when it is hidden, and is where it was when it is shown again.
  await set(page, "busy", false);
  await advance(page, 500);
  expect(await page.evaluate(() => window.objects.scene.basicBusy.visible)).toBe(false);
  await set(page, "busy", true);
  expect(await page.evaluate(() => [window.objects.scene.basicBusy.visible, window.objects.scene.basicBusy.running])).toEqual([true, true]);
  expect(await filled()).toEqual([false, false, false, false, false, false, true, true, true, true]);
});

test("the blocks of a Basic bar come in, rest in the middle and leave", async ({ page }) => {
  await ready(page, "moving");
  const lefts = async () => numbers((await parts(page, "basicBar", ".qq-part > .qq-part", "left")).map(([left]) => left));
  expect(await lefts()).toEqual([-16, -80, -144, -208]);
  // A bar's width in the first second, as something that falls.
  await advance(page, 800);
  expect(await lefts()).toEqual([24, -40, -104, -168]);
  await advance(page, 1200);
  expect(await lefts()).toEqual([72, 52, 32, 12]);
  // They leave one after the other, the first of them first.
  await advance(page, 800);
  expect(await lefts()).toEqual([112, 52, 32, 12]);
  expect(await page.evaluate(() => window.objects.scene.basicBar.clip)).toBe(true);
  await set(page, "busy", false);
  expect(await page.evaluate(() => window.objects.scene.basicBar.clip)).toBe(false);
});

test("the two bars of a Material bar pass one after the other", async ({ page }) => {
  await ready(page, "moving");
  const bars = async () => (await parts(page, "materialBar", ".qq-part > .qq-part", "left", "width")).map(numbers);
  expect(await bars()).toEqual([
    [0, 0],
    [0, 0],
  ]);
  await advance(page, 620);
  const second = 1 - (1 - 100 / 1240) ** 3;
  expect(await bars()).toEqual([[87.5, 10.938], numbers([`${second * 100}`, `${second * (100 - second * 100)}`])]);
  // It starts over when both have left.
  await advance(page, 1144);
  expect(await bars()).toEqual([
    [0, 0],
    [0, 0],
  ]);
});

test("the arc of a Material busy indicator grows as it goes around", async ({ page }) => {
  await ready(page, "moving");
  // Three, six, nine and twelve o'clock, in the middle of the line.
  const clock = [
    [46, 24],
    [24, 46],
    [2, 24],
    [24, 2],
  ];
  // Ten degrees from three o'clock on.
  expect(await inked(page, [[46, 26], ...clock.slice(1)])).toEqual([true, false, false, false]);
  // Half way through growing: from 60 degrees to 287.5, clockwise.
  await advance(page, 350);
  expect(await inked(page, clock)).toEqual([false, true, true, true]);
  // Told to stop, it goes on until it is hidden.
  await set(page, "busy", false);
  await advance(page, 350);
  expect(await inked(page, [clock[3]])).toEqual([true]);
  await page.evaluate(() => (window.objects.scene.materialBusy.visible = false));
  expect(await inked(page, clock)).toEqual([false, false, false, false]);
});

test("the dots of a Universal busy indicator set off one after the other", async ({ page }) => {
  await ready(page, "moving");
  const dots = () => parts(page, "universalBusy", ".qq-universal-busy > div", "opacity", "transform");
  await advance(page, 100);
  expect((await dots()).map(([opacity]) => opacity)).toEqual(["", "0", "0", "0", "0"]);
  await advance(page, 1100);
  // The first is at the end of its second part; each that follows is five
  // degrees behind where it would be.
  const turned = (await dots()).map(([, transform]) => Number(/rotate\((.*)deg\)/.exec(transform)[1]));
  expect(turned[0]).toBe(93);
  expect(turned[1]).toBeCloseTo(10 + (83 * (1200 - 167 - 433)) / 767 - 5, 3);
  expect((await dots()).map(([opacity]) => opacity)).toEqual(["", "", "", "", ""]);
});

test("the dots of a Universal bar come in to a third of the way", async ({ page }) => {
  await ready(page, "moving");
  const dots = () => parts(page, "universalBar", ".qq-universal-bar > div + div", "opacity", "left");
  await advance(page, 1000);
  const [[opacity, left]] = await dots();
  expect(opacity).toBe("");
  // What it is on has drifted from -34, and it has slid a third of the way.
  expect(Number.parseFloat(left)).toBeCloseTo(32 - 34 + 0.435222 * 100 * (1000 / 3917) + 100 / 3, 3);
  // All of them have left before the round is over.
  await advance(page, 2800);
  expect((await dots()).map(([opacity]) => opacity)).toEqual(["0", "0", "0", "0", "0"]);
});

// The waves of a ripple of the scene: where each is, how wide and how faint.
const waves = async (page, name) =>
  (await parts(page, name, ".qq-ripple-wave", "transform", "width", "opacity")).map(([transform, width, opacity]) => [
    transform,
    width === "" ? 0 : Number(Number.parseFloat(width).toFixed(2)),
    opacity === "" ? 1 : Number(Number(opacity).toFixed(3)),
  ]);

test("a press that lasts is a wave from where it was, which fades when it is let go", async ({ page }) => {
  await ready(page, "moving");
  await set(page, "pressed", true);
  await advance(page, 79);
  expect(await waves(page, "ripple")).toEqual([]);
  // There is nothing of it to see before it has spread at all.
  await advance(page, 1);
  expect(await waves(page, "ripple")).toEqual([["", 0, 1]]);
  // As wide as the item is across its corners after the time something
  // would take to fall that far, from where it was pressed to the middle.
  await advance(page, 94);
  expect(await waves(page, "ripple")).toEqual([["translate(2px, 2px)", 36.06, 1]]);
  await advance(page, 200);
  expect(await waves(page, "ripple")).toEqual([["translate(-6px, -16px)", 72.11, 1]]);
  // One that waits for the press to be over has none yet.
  expect(await waves(page, "late")).toEqual([]);
  await set(page, "pressed", false);
  await advance(page, 111);
  expect(await waves(page, "ripple")).toEqual([["translate(-6px, -16px)", 72.11, 0.667]]);
  expect(await waves(page, "late")).toEqual([["translate(9px, -1px)", 42.58, 1]]);
  await advance(page, 222);
  expect(await waves(page, "ripple")).toEqual([]);
  expect(await waves(page, "late")).toEqual([["translate(-6px, -16px)", 72.11, 1]]);
  // The next press is the end of that one.
  await set(page, "pressed", true);
  await advance(page, 333);
  expect(await waves(page, "late")).toEqual([]);
});

test("a press that is over before it is a wave is none", async ({ page }) => {
  await ready(page, "moving");
  await set(page, "pressed", true);
  await advance(page, 40);
  await set(page, "pressed", false);
  await advance(page, 100);
  expect(await waves(page, "ripple")).toEqual([]);
});

test("the layer of a ripple fades in while it is active", async ({ page }) => {
  await ready(page, "moving");
  const layer = async () => Number((await parts(page, "ripple", ":scope > .qq-part:not(.qq-ripple-wave)", "opacity"))[0][0]);
  expect(await layer()).toBe(0);
  await set(page, "focused", true);
  await advance(page, 60);
  expect(await layer()).toBe(0.5);
  await advance(page, 100);
  expect(await layer()).toBe(1);
  await set(page, "focused", false);
  await advance(page, 111);
  expect(await layer()).toBeCloseTo(2 / 3, 6);
  await advance(page, 300);
  expect(await layer()).toBe(0);
});

const field = (page) =>
  page.evaluate(() => {
    const { container, placeholder } = window.objects.scene;
    return [container.focusAnimationProgress, placeholder.x, placeholder.y, placeholder.scale].map((value) => Number(value.toFixed(3)));
  });

test("the text of a Material field moves up into a gap of the outline", async ({ page }) => {
  await ready(page, "moving");
  // The outline, where the gap is to be and beside it.
  const outline = () =>
    pixels(page, [
      [255, 100],
      [320, 100],
    ]);
  expect(await field(page)).toEqual([0, 16, 18, 1]);
  expect(await outline()).toEqual(["0 0 0", "0 0 0"]);
  await set(page, "focused", true);
  await advance(page, 150);
  // The place eases, the size and the gap do not.
  const eased = Math.sin(Math.PI / 4);
  expect(await field(page)).toEqual([0.5, Number((16 - 4 * eased).toFixed(3)), Number((18 - 28 * eased).toFixed(3)), 0.9]);
  await advance(page, 150);
  expect(await field(page)).toEqual([1, 12, -10, 0.8]);
  expect(await outline()).toEqual(["255 255 255", "0 0 0"]);
  // A field with a text keeps it up there without the focus.
  await set(page, "typed", true);
  await set(page, "focused", false);
  await advance(page, 300);
  expect(await field(page)).toEqual([1, 12, -10, 0.8]);
  // Without either it comes down at once: only the focus takes its time.
  await set(page, "typed", false);
  expect(await field(page)).toEqual([0, 16, 18, 1]);
  expect(await outline()).toEqual(["0 0 0", "0 0 0"]);
});

test("the focus going back turns the text around where it is", async ({ page }) => {
  await ready(page, "moving");
  await set(page, "focused", true);
  await advance(page, 150);
  await set(page, "focused", false);
  const eased = Math.sin(Math.PI / 4);
  const from = [16 - 4 * eased, 18 - 28 * eased];
  expect(await field(page)).toEqual([0.5, Number(from[0].toFixed(3)), Number(from[1].toFixed(3)), 0.9]);
  await advance(page, 150);
  expect(await field(page)).toEqual([0.25, Number((from[0] + (16 - from[0]) * eased).toFixed(3)), Number((from[1] + (18 - from[1]) * eased).toFixed(3)), 0.95]);
  await advance(page, 150);
  expect(await field(page)).toEqual([0, 16, 18, 1]);
});
