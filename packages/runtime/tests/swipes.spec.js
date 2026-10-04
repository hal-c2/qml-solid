// SwipeDelegate. What is expected is what Qt 6.11 answers for the same scene
// (`qml6`), and what it notes when a QtTest `TestCase` makes the same moves
// with its mouse. Where this is not Qt's, it says so.
import { advance, call, read, said, still as base } from "./notes.js";
import { test as plain } from "@playwright/test";
import { expect, open, test } from "./open.js";

const still = (page) => base(page, "swipes");

// Where the rows are in the scene.
const at = { sd: [10, 10], sb: [10, 60], sx: [10, 110], se: [10, 160], sn: [10, 210] };
const move = (page, name, x, y) => page.mouse.move(at[name][0] + x, at[name][1] + y);

async function press(page, name, x, y) {
  await move(page, name, x, y);
  await page.mouse.down();
}

// Time enough after a release for the next press not to be the second of a
// double click: what QtTest does as well.
async function release(page) {
  await page.mouse.up();
  await advance(page, 500);
}

async function click(page, name, x, y) {
  await press(page, name, x, y);
  await release(page);
}

const near = (value) => Math.round(value * 1000) / 1000;

// How far open a row is, whether all the way, whether it is pressed, and
// where its content and its background are.
const state = async (page, name) =>
  (
    await read(
      page,
      `${name}.swipe.position`,
      `${name}.swipe.complete`,
      `${name}.pressed`,
      `${name}.contentItem.x`,
      `${name}.background.x`,
    )
  ).map((value) => (typeof value === "number" ? near(value) : value));

// Which of what is under a row is seen: left, right, behind. Null for what
// was not made.
const items = (page, name) =>
  page.evaluate((name) => {
    const swipe = window.scene[name].swipe;
    return [swipe.leftItem, swipe.rightItem, swipe.behindItem].map((item) => (item ? item.visible : null));
  }, name);

// What was noted since the last step, and how the row is now.
async function now(page, name, notes, where, shown) {
  await said(page, notes);
  expect(await state(page, name)).toEqual(where);
  if (shown) expect(await items(page, name)).toEqual(shown);
}

test("a row that is swiped is what Qt says it is", async ({ page }) => {
  await open(page, "swipes");
  expect(await page.evaluate(() => window.scene.answers())).toEqual([
    [0, false, true, null, null, null, null, null, null],
    [1, -1, 0, false, false],
    [5, 195, 0, 200, -1],
    [false, true, true, true],
  ]);
});

// Some of this warns, as Qt does, which the scenes' `test` takes for a
// failure.
plain("a row is dragged, opened and closed as Qt's is", async ({ page }) => {
  const problems = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") problems.push(message.text());
  });
  const told = () => problems.splice(0);
  await still(page);
  const sd = (notes, where, shown) => now(page, "sd", notes, where, shown);

  // To the right, from closed: nothing until it is a drag, and then what is
  // to the left is made and the content goes aside by as much of it.
  await press(page, "sd", 100, 20);
  await sd(["sd.down true", "sd.pressed"], [0, false, true, 5, 0]);
  await move(page, "sd", 108, 20);
  await sd([], [0, false, true, 5, 0], [null, null, null]);
  await move(page, "sd", 111, 20);
  await sd(["sd.position 0.183"], [0.183, false, true, 16, 11], [true, null, null]);
  // Where it was pressed stays where it was pressed.
  expect(await read(page, "sd.pressX")).toEqual([100]);
  await move(page, "sd", 130, 20);
  await sd(["sd.position 0.500"], [0.5, false, true, 35, 30]);
  expect(await page.evaluate(() => [scene.sd.swipe.leftItem.z, scene.sd.swipe.leftItem.parent === scene.sd])).toEqual([
    -2,
    true,
  ]);
  await move(page, "sd", 190, 20);
  await sd(["sd.position 1.000"], [1, false, true, 65, 60]);
  await move(page, "sd", 190, 100);
  await sd([], [1, false, true, 65, 60]);
  await move(page, "sd", 136, 20);
  await sd(["sd.position 0.600"], [0.6, false, true, 41, 36]);
  // Let go of past half way, it opens; a swipe is no click.
  await release(page);
  await sd(
    ["sd.down false", "sd.canceled", "sd.position 1.000", "sd.complete true", "sd.completed", "sd.opened"],
    [1, true, false, 65, 60],
    [true, null, null],
  );

  // Open: a click of it is none either, and it says again that it is open.
  await click(page, "sd", 150, 20);
  await sd(["sd.down true", "sd.pressed", "sd.down false", "sd.opened", "sd.canceled"], [1, true, false, 65, 60]);

  // Dragged back a little.
  await press(page, "sd", 150, 20);
  await sd(["sd.down true", "sd.pressed"], [1, true, true, 65, 60]);
  await move(page, "sd", 130, 20);
  await sd(["sd.complete false", "sd.position 0.667"], [0.667, false, true, 45, 40], [true, null, null]);
  await move(page, "sd", 126, 20);
  await sd(["sd.position 0.600"], [0.6, false, true, 41, 36]);
  await release(page);
  await sd(
    ["sd.down false", "sd.canceled", "sd.position 1.000", "sd.complete true", "sd.completed", "sd.opened"],
    [1, true, false, 65, 60],
  );

  // And across to the other side: closed when dragged by the width of what
  // was open, and then what is to the right is made.
  await press(page, "sd", 150, 20);
  await said(page, ["sd.down true", "sd.pressed"]);
  await move(page, "sd", 120, 20);
  await sd(["sd.complete false", "sd.position 0.500"], [0.5, false, true, 35, 30], [true, null, null]);
  await move(page, "sd", 90, 20);
  await sd(["sd.position 0.000"], [0, false, true, 5, 0], [true, null, null]);
  await move(page, "sd", 70, 20);
  await sd([], [0, false, true, 5, 0], [true, true, null]);
  await move(page, "sd", 30, 20);
  await sd(["sd.position -0.500"], [-0.5, false, true, -35, -40], [false, true, null]);
  await move(page, "sd", 20, 20);
  await sd(["sd.position -0.625"], [-0.625, false, true, -45, -50], [false, true, null]);
  await release(page);
  await sd(
    ["sd.down false", "sd.canceled", "sd.position -1.000", "sd.complete true", "sd.completed", "sd.opened"],
    [-1, true, false, -75, -80],
    [false, true, null],
  );
  expect(await read(page, "sd.swipe.rightItem.x", "sd.swipe.rightItem.z")).toEqual([120, -2]);

  // What is shown at the right is clicked: it says `SwipeDelegate.pressed`
  // and `SwipeDelegate.clicked`. The row is pressed and released around it.
  await press(page, "sd", 180, 20);
  await sd(["sd.down true", "sd.pressed", "sdr.down true"], [-1, true, true, -75, -80]);
  await release(page);
  await sd(
    [
      "sd.down false",
      "sd.opened",
      "sdr.down false",
      "sdr.clicked",
      "sd.canceled",
      "sd.down true",
      "sd.opened",
      "sd.down false",
    ],
    [-1, true, false, -75, -80],
  );
  // Pressed there and dragged, it is not clicked.
  await press(page, "sd", 180, 20);
  await sd(["sd.down true", "sd.pressed", "sdr.down true"], [-1, true, true, -75, -80]);
  await move(page, "sd", 185, 20);
  await sd([], [-1, true, true, -75, -80]);
  await move(page, "sd", 195, 20);
  await sd(["sd.complete false", "sdr.down false", "sd.position -0.813"], [-0.812, false, true, -60, -65]);
  await move(page, "sd", 220, 20);
  await sd(["sd.position -0.500"], [-0.5, false, true, -35, -40]);
  // Half way and going the other way, it closes.
  await release(page);
  await sd(["sd.down false", "sd.canceled", "sd.position 0.000", "sd.closed"], [0, false, false, 5, 0]);

  // Closed, it is a row like any other, over what is under it too.
  await click(page, "sd", 20, 20);
  await sd(["sd.down true", "sd.pressed", "sd.down false", "sd.released", "sd.clicked"], [0, false, false, 5, 0]);
  await call(page, "sd.swipe.close");
  await sd([], [0, false, false, 5, 0], [false, true, null]);
  await click(page, "sd", 180, 20);
  await sd(["sd.down true", "sd.pressed", "sd.down false", "sd.released", "sd.clicked"], [0, false, false, 5, 0]);

  // `open` and `close`.
  await call(page, "sd.swipe.open", 1);
  await sd(
    ["sd.position 1.000", "sd.complete true", "sd.completed", "sd.opened"],
    [1, true, false, 65, 60],
    [true, false, null],
  );
  await call(page, "sd.swipe.open", -1);
  await sd([], [1, true, false, 65, 60]);
  // Qt's: a row with no transition that was closed by `close()` is not
  // opened by `open()` after it, nor by letting go of it.
  await call(page, "sd.swipe.close");
  await call(page, "sd.swipe.open", -1);
  await sd(["sd.position 0.000", "sd.complete false", "sd.closed"], [0, false, false, 5, 0], [true, false, null]);

  // `position` is from -1 to 1, and shows what is on its side.
  await page.evaluate(() => (scene.sd.swipe.position = 0.5));
  await sd(["sd.position 0.500"], [0.5, false, false, 35, 30], [true, false, null]);
  await page.evaluate(() => (scene.sd.swipe.position = -3));
  await sd(["sd.position -1.000"], [-1, false, false, -75, -80], [false, true, null]);
  expect(told()).toEqual([]);

  // What is under it is not replaced while it is seen, and `behind` not had
  // together with the two sides.
  expect(await page.evaluate(() => ((scene.sd.swipe.left = scene.other), scene.sd.swipe.left === scene.other))).toBe(false);
  expect(told()).toEqual(["SwipeDelegate: left/right/behind properties may only be set when swipe.position is 0"]);
  expect(await page.evaluate(() => ((scene.sd.swipe.behind = scene.other), scene.sd.swipe.behind === null))).toBe(true);
  expect(told()).toEqual(["SwipeDelegate: cannot set both behind and left/right properties"]);
  await page.evaluate(() => (scene.sd.swipe.position = 0));
  await sd(["sd.position 0.000"], [0, false, false, 5, 0], [false, true, null]);
  // Another component leaves the item that was made; none takes it away.
  expect(await page.evaluate(() => ((scene.sd.swipe.left = scene.other), scene.sd.swipe.left === scene.other))).toBe(true);
  expect(await items(page, "sd")).toEqual([false, true, null]);
  await page.evaluate(() => (scene.sd.swipe.left = null));
  expect(await items(page, "sd")).toEqual([null, true, null]);
  await said(page, []);

  // With nothing to the left, a drag to the right is a drag of nothing.
  await press(page, "sd", 100, 20);
  await move(page, "sd", 150, 20);
  await sd(["sd.down true", "sd.pressed"], [0, false, true, 5, 0]);
  await release(page);
  await sd(["sd.down false", "sd.canceled"], [0, false, false, 5, 0]);

  // Qt's again: after that `close()` the row stays where it is let go of.
  await press(page, "sd", 150, 20);
  await move(page, "sd", 130, 20);
  await move(page, "sd", 126, 20);
  await said(page, ["sd.down true", "sd.pressed", "sd.position -0.250", "sd.position -0.300"]);
  await release(page);
  await sd(["sd.down false", "sd.canceled"], [-0.3, false, false, -19, -24]);
  expect(told()).toEqual([]);
});

test("what is behind a row is shown from either side, and a transition takes the row there", async ({ page }) => {
  await still(page);
  const sb = (notes, where, shown) => now(page, "sb", notes, where, shown);
  const complete = async () => (await read(page, "sb.swipe.complete"))[0];

  await press(page, "sb", 100, 20);
  await move(page, "sb", 80, 20);
  await move(page, "sb", 40, 20);
  await sb([], [-0.3, false, true, -60, -60], [null, null, true]);
  // Let go of slowly short of half way, it closes: over 100 ms here.
  await page.waitForTimeout(600);
  await page.mouse.up();
  await said(page, ["sb.canceled"]);
  expect(await complete()).toBe(false);
  await advance(page, 300);
  await sb(["sb.closed"], [0, false, false, 0, 0]);

  await press(page, "sb", 40, 20);
  await move(page, "sb", 80, 20);
  await move(page, "sb", 160, 20);
  await sb([], [0.6, false, true, 120, 120], [null, null, true]);
  await page.mouse.up();
  await said(page, ["sb.canceled"]);
  expect(await complete()).toBe(false);
  await advance(page, 300);
  await sb(["sb.complete true", "sb.completed", "sb.opened"], [1, true, false, 200, 200]);

  // A click of the open row: the transition runs, to where it is already.
  await press(page, "sb", 100, 20);
  await page.mouse.up();
  await sb(["sb.canceled"], [1, true, false, 200, 200]);
  await advance(page, 500);
  await sb(["sb.opened"], [1, true, false, 200, 200]);

  // `close()`, and nothing opens the row until it is closed.
  await call(page, "sb.swipe.close");
  await said(page, []);
  expect(await complete()).toBe(true);
  await call(page, "sb.swipe.open", 1);
  await said(page, []);
  expect(await complete()).toBe(true);
  await advance(page, 300);
  await sb(["sb.complete false", "sb.closed"], [0, false, false, 0, 0]);
  await call(page, "sb.swipe.open", -1);
  await said(page, []);
  expect(await complete()).toBe(false);
  await advance(page, 300);
  await sb(["sb.complete true", "sb.completed", "sb.opened"], [-1, true, false, -200, -200]);
});

test("a button under a row is pressed through the row once it is open", async ({ page }) => {
  await still(page);
  const sx = (notes, where, shown) => now(page, "sx", notes, where, shown);

  // Closed, the row is what is clicked.
  await click(page, "sx", 180, 20);
  await sx(["sx.down true", "sx.pressed", "sx.down false", "sx.clicked"], [0, false, false, 0, 0]);
  await press(page, "sx", 180, 20);
  await move(page, "sx", 150, 20);
  await move(page, "sx", 100, 20);
  await sx(
    ["sx.down true", "sx.pressed", "sx.position -0.375", "sx.position -1.000"],
    [-1, false, true, -80, -80],
    [null, true, null],
  );
  await release(page);
  await sx(["sx.down false", "sx.canceled", "sx.opened"], [-1, true, false, -80, -80]);

  // Open, the button is, and the row is not pressed.
  await press(page, "sx", 180, 20);
  await sx(["sx.down true", "sx.pressed", "sxb.pressed", "sx.down false"], [-1, true, false, -80, -80]);
  await release(page);
  await sx(["sx.opened", "sx.canceled", "sxb.clicked", "sx.opened"], [-1, true, false, -80, -80]);

  // Pressed and dragged, the row takes the press back.
  await press(page, "sx", 180, 20);
  await move(page, "sx", 185, 20);
  await sx(["sx.down true", "sx.pressed", "sxb.pressed", "sx.down false"], [-1, true, false, -80, -80]);
  // Out of the button by then, which is pressed no longer.
  await move(page, "sx", 200, 20);
  await sx(["sx.down true", "sx.position -0.750"], [-0.75, false, true, -60, -60]);
  await move(page, "sx", 230, 20);
  await sx(["sx.position -0.375"], [-0.375, false, true, -30, -30]);
  await release(page);
  await sx(["sx.down false", "sx.canceled", "sx.position 0.000", "sx.closed"], [0, false, false, 0, 0]);

  // Dragged while the pointer is still over the button. Not Qt's: there the
  // button is pressed no longer without a word, and says `canceled` when the
  // row is let go of; here it says so when it loses the press.
  await call(page, "sx.swipe.open", -1);
  await sx(["sx.position -1.000", "sx.opened"], [-1, true, false, -80, -80]);
  await press(page, "sx", 140, 20);
  await sx(["sx.down true", "sx.pressed", "sxb.pressed", "sx.down false"], [-1, true, false, -80, -80]);
  await move(page, "sx", 155, 20);
  await sx(["sx.down true", "sxb.canceled", "sx.position -0.813"], [-0.812, false, true, -65, -65]);
  await release(page);
  await sx(
    ["sx.down false", "sx.canceled", "sx.position -1.000", "sx.opened", "sx.opened"],
    [-1, true, false, -80, -80],
  );
});

test("a row that is not to be swiped stays pressed wherever the pointer goes", async ({ page }) => {
  await still(page);
  const se = (notes, where, shown) => now(page, "se", notes, where, shown);

  await press(page, "se", 100, 20);
  await move(page, "se", 150, 20);
  await se(["se.down true", "se.pressed"], [0, false, true, 0, 0], [null, null, null]);
  await move(page, "se", 150, 100);
  await se([], [0, false, true, 0, 0]);
  // And is clicked there, as in Qt.
  await release(page);
  await se(["se.down false", "se.clicked"], [0, false, false, 0, 0]);
  await click(page, "se", 100, 20);
  await se(["se.down true", "se.pressed", "se.down false", "se.clicked"], [0, false, false, 0, 0]);
  // `open` opens it all the same.
  await call(page, "se.swipe.open", 1);
  await se(["se.position 1.000"], [1, true, false, 60, 60], [true, null, null]);
});

test("a row with nothing under it is a row like any other", async ({ page }) => {
  await still(page);
  const sn = (notes, where) => now(page, "sn", notes, where);

  await press(page, "sn", 100, 20);
  await move(page, "sn", 150, 20);
  await sn(["sn.down true", "sn.pressed"], [0, false, true, 0, 0]);
  await move(page, "sn", 150, -30);
  await sn(["sn.down false"], [0, false, false, 0, 0]);
  await move(page, "sn", 150, 20);
  await release(page);
  await sn(["sn.down true", "sn.down false", "sn.clicked"], [0, false, false, 0, 0]);
  await call(page, "sn.swipe.open", 1);
  await sn([], [0, false, false, 0, 0]);
  await page.evaluate(() => (scene.sn.swipe.position = 0.5));
  await sn(["sn.position 0.500"], [0.5, false, false, 0, 0]);
});
