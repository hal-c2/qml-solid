// The controls of a range. What is expected is what Qt 6.11 answers for the
// same scene (`qml6`), and what it notes when a QtTest `TestCase` makes the
// same moves with its mouse, wheel and keys.
import { advance, call, read, said, set, still as base } from "./notes.js";
import { test as plain } from "@playwright/test";
import { expect, open, test } from "./open.js";

const still = (page) => base(page, "sliders");

// Where the controls are in the scene.
const at = {
  sl: [10, 10],
  st: [10, 40],
  sr: [10, 70],
  sv: [230, 10],
  rs: [10, 100],
  ri: [10, 130],
  dial: [10, 170],
  dw: [120, 170],
  dh: [230, 170],
  pg: [250, 20],
  pn: [250, 60],
};
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

// The wheel as Qt counts it: 120 to a notch, up and to the left positive.
async function wheel(page, name, x, y, across, up) {
  await move(page, name, x, y);
  await page.mouse.wheel(-across / 1.2, -up / 1.2);
  await page.waitForFunction(() => new Promise((done) => requestAnimationFrame(() => done(true))));
}

const near = async (page, ...names) =>
  (await read(page, ...names)).map((value) => (typeof value === "number" ? Math.round(value * 1000) / 1000 : value));

// Which of the controls have active focus, and which handle of a range.
const who = (page) =>
  page.evaluate(() => {
    const scene = window.scene;
    const names = ["sl", "st", "sr", "sv", "so", "sn", "sbound", "rs", "ri", "rx", "dial", "dw", "dh", "pb", "pg"];
    const found = names.filter((name) => scene[name].activeFocus);
    for (const name of ["rs", "ri"]) {
      if (scene[name].first.handle.activeFocus) found.push(`${name}.first`);
      if (scene[name].second.handle.activeFocus) found.push(`${name}.second`);
    }
    return found;
  });

test("the controls of a range are what Qt says they are", async ({ page }) => {
  await open(page, "sliders");
  expect(await page.evaluate(() => window.scene.answers())).toEqual([
    [0, 1, 0, 0, 0, 0, 0, false, 1],
    [true, false, true, -1, 11, true, false],
    [20, 20, true, null, 0],
    [0, 1, 2],
    [3, 0.3, 6, 4, 0.44, 30],
    [true, 0, 1, 90],
    // Out of range it is the end; the wrong way round the steps go down.
    [1, 1, 2.5, 0.75, 0.75, 6, 0.25],
    [0, 1, 0, 0, 1, true, true, false, -1],
    [11, true, true, true],
    [0.25, 0.25, 0.25, false, false],
    [0.75, 0.75, 0.75, 20, 20],
    // The first given past the second is where the second is.
    [3, 0.3, 3, 0.3, 4],
    [7, 0.3, 0.7, 7, 0.3, null],
    [0, 1, 0, 0, -140, -140, 140, 0],
    [0, 0, false, true, false, 1, true],
    [0, 1, 2, 0, 1, 2],
    [true, 0, 0, 360, -90],
    [0, 10, 4, 0.4, 0.4, false, 0],
    [1, 1, true, 3, 0, true],
    [4, 1, true, 5, 110, false],
    [2, false, true, true, false, 0],
  ]);
});

test("a slider's handle goes where the mouse presses and drags it", async ({ page }) => {
  await still(page);
  await press(page, "sl", 100, 10);
  await said(page, ["sl.pressed true", "sl.position 0.500", "sl.value 0.500", "sl.moved"]);
  expect(await near(page, "sl.value", "sl.position", "sl.pressed", "sl.activeFocus")).toEqual([0.5, 0.5, true, true]);
  await move(page, "sl", 145, 10);
  await said(page, ["sl.position 0.750", "sl.value 0.750", "sl.moved"]);
  await move(page, "sl", 300, 10);
  await said(page, ["sl.position 1.000", "sl.value 1.000", "sl.moved"]);
  await release(page);
  await said(page, ["sl.pressed false"]);

  // The arrow keys along it step it, and it is pressed while one is down.
  await page.keyboard.down("ArrowLeft");
  await said(page, ["sl.pressed true", "sl.position 0.900", "sl.value 0.900", "sl.moved"]);
  await page.keyboard.up("ArrowLeft");
  await said(page, ["sl.pressed false"]);
  await page.keyboard.press("ArrowRight");
  await said(page, ["sl.pressed true", "sl.position 1.000", "sl.value 1.000", "sl.moved", "sl.pressed false"]);
  await page.keyboard.press("ArrowRight");
  await said(page, ["sl.pressed true", "sl.pressed false"]);
  await page.keyboard.press("ArrowUp");
  await said(page, []);

  await set(page, "sl.value", 0.3);
  await said(page, ["sl.position 0.300", "sl.value 0.300"]);
  await call(page, "sl.increase");
  await said(page, ["sl.position 0.400", "sl.value 0.400"]);
  await call(page, "sl.decrease");
  await said(page, ["sl.position 0.300", "sl.value 0.300"]);
  await set(page, "sl.value", 7);
  await said(page, ["sl.position 1.000", "sl.value 1.000"]);
  expect(await near(page, "sl.value", "sl.position")).toEqual([1, 1]);

  // The ends moved: the value stays between them, and the handle is where
  // the value is between them.
  await set(page, "sl.from", 0.5);
  await said(page, []);
  await set(page, "sl.to", 0.8);
  await said(page, ["sl.value 0.800"]);
  expect(await near(page, "sl.value", "sl.position")).toEqual([0.8, 1]);
  await set(page, "sl.from", 0);
  await said(page, []);
  await set(page, "sl.to", 1);
  await said(page, ["sl.position 0.800"]);

  // It does not take the wheel unless it says so.
  await wheel(page, "sl", 100, 10, 0, 120);
  await said(page, []);
});

test("a slider with steps snaps to them, all the while or when let go", async ({ page }) => {
  await still(page);
  await press(page, "st", 100, 10);
  await said(page, ["st.position 0.600", "st.value 6.000", "st.moved"]);
  await move(page, "st", 120, 10);
  await said(page, []);
  await move(page, "st", 150, 10);
  await said(page, ["st.position 0.800", "st.value 8.000", "st.moved"]);
  await release(page);
  await said(page, []);

  // Not live: the value is the handle's when it is let go.
  await press(page, "sr", 100, 10);
  await said(page, ["sr.position 0.500", "sr.moved"]);
  await move(page, "sr", 127, 10);
  await said(page, ["sr.position 0.650", "sr.moved"]);
  expect(await near(page, "sr.value", "sr.position")).toEqual([0, 0.65]);
  await release(page);
  await said(page, ["sr.position 0.700", "sr.value 70.000", "sr.moved"]);
  await click(page, "sr", 127, 10);
  await said(page, ["sr.position 0.650", "sr.moved", "sr.position 0.700", "sr.moved"]);
  expect(await near(page, "sr.value", "sr.position")).toEqual([70, 0.7]);
});

test("a vertical slider goes up, by the mouse, the wheel and the keys", async ({ page }) => {
  await still(page);
  await press(page, "sv", 10, 60);
  await said(page, ["sv.pressed true", "sv.position 0.500", "sv.value 0.500", "sv.moved"]);
  expect(await near(page, "sv.value", "sv.visualPosition", "sv.handle.y")).toEqual([0.5, 0.5, 50]);
  await move(page, "sv", 10, 20);
  await said(page, ["sv.position 1.000", "sv.value 1.000", "sv.moved"]);
  await release(page);
  await said(page, ["sv.pressed false"]);

  await wheel(page, "sv", 10, 60, 0, -120);
  await said(page, ["sv.position 0.900", "sv.value 0.900", "sv.moved"]);
  await wheel(page, "sv", 10, 60, 0, -240);
  await said(page, ["sv.position 0.700", "sv.value 0.700", "sv.moved"]);
  await wheel(page, "sv", 10, 60, 0, 600);
  await said(page, ["sv.position 1.000", "sv.value 1.000", "sv.moved"]);
  await wheel(page, "sv", 10, 60, 0, 120);
  await said(page, []);
  await wheel(page, "sv", 10, 60, -120, 0);
  await said(page, ["sv.position 0.900", "sv.value 0.900", "sv.moved"]);

  await page.keyboard.press("ArrowDown");
  await said(page, ["sv.pressed true", "sv.position 0.800", "sv.value 0.800", "sv.moved", "sv.pressed false"]);
  expect(await who(page)).toEqual(["sv"]);
  await page.keyboard.press("ArrowLeft");
  await said(page, []);
});

test("a slider's value is its own until what it is bound to changes", async ({ page }) => {
  await still(page);
  await set(page, "source", 0.6);
  await said(page, ["sbound.value 0.600"]);
  await call(page, "sbound.increase");
  await said(page, ["sbound.value 0.700"]);
  await set(page, "source", 0.6);
  await said(page, []);
  expect(await near(page, "sbound.value")).toEqual([0.7]);
  await set(page, "source", 0.2);
  await said(page, ["sbound.value 0.200"]);
});

test("a range slider's handles hover, and the one pressed or the nearer is dragged", async ({ page }) => {
  await still(page);
  await move(page, "rs", 100, 10);
  await said(page, []);
  expect(await read(page, "rs.hovered")).toEqual([true]);
  await move(page, "rs", 50, 10);
  await said(page, ["one.hovered true"]);
  await move(page, "rs", 140, 10);
  await said(page, ["one.hovered false", "two.hovered true"]);
  await move(page, "rs", 100, 60);
  await said(page, ["two.hovered false"]);
  expect(await read(page, "rs.hovered")).toEqual([false]);

  await press(page, "rs", 55, 10);
  await said(page, ["one.hovered true", "one.pressed true"]);
  expect(await who(page)).toEqual(["rs", "rs.first"]);
  expect(await read(page, "rs.first.handle.z", "rs.second.handle.z")).toEqual([1, 0]);
  await move(page, "rs", 100, 10);
  await said(page, ["one.position 0.500", "one.value 0.500", "one.moved"]);
  // Not past the second.
  await move(page, "rs", 190, 10);
  await said(page, ["one.position 0.750", "one.value 0.750", "one.moved"]);
  // Let go, what is under the pointer hovers, as everything here does. In
  // Qt's test a handle hovers anew only when the pointer next moves: these
  // two notes come with the press there, and the `two.hovered` below with
  // the move after.
  await release(page);
  await said(page, ["one.pressed false", "one.hovered false"]);
  // One over the other: the one that was pressed last.
  await press(page, "rs", 145, 10);
  await said(page, ["one.hovered true", "one.pressed true"]);
  await move(page, "rs", 55, 10);
  await said(page, ["one.position 0.250", "one.value 0.250", "one.moved"]);
  await release(page);
  await said(page, ["one.pressed false"]);
  // Between them, the nearer comes.
  await press(page, "rs", 120, 10);
  await said(page, ["one.hovered false", "two.pressed true", "two.position 0.611", "two.value 0.611", "two.moved"]);
  expect(await near(page, "rs.first.value", "rs.second.value")).toEqual([0.25, 0.611]);
  expect(await who(page)).toEqual(["rs", "rs.second"]);
  expect(await read(page, "rs.first.handle.z", "rs.second.handle.z")).toEqual([0, 1]);
  await release(page);
  await said(page, ["two.pressed false", "two.hovered true"]);
  expect(await read(page, "rs.first.hovered", "rs.second.hovered")).toEqual([false, true]);
  await move(page, "rs", 121, 10);
  await said(page, []);
  await move(page, "rs", 100, 60);
  await said(page, ["two.hovered false"]);
});

test("the keys move the handle of a range slider that has focus, and Tab goes from one to the other", async ({ page }) => {
  await still(page);
  await click(page, "rs", 120, 10);
  await page.evaluate(() => window.scene.take());
  expect(await who(page)).toEqual(["rs", "rs.second"]);
  await page.keyboard.down("ArrowRight");
  await said(page, ["two.pressed true", "two.position 0.711", "two.value 0.711", "two.moved"]);
  await page.keyboard.up("ArrowRight");
  await said(page, ["two.pressed false"]);
  await page.keyboard.press("ArrowLeft");
  await said(page, ["two.pressed true", "two.position 0.611", "two.value 0.611", "two.moved", "two.pressed false"]);
  await page.keyboard.press("Shift+Tab");
  expect(await who(page)).toEqual(["rs", "rs.first"]);
  await page.evaluate(() => window.scene.take());
  await page.keyboard.press("ArrowLeft");
  await said(page, ["one.pressed true", "one.position 0.150", "one.value 0.150", "one.moved", "one.pressed false"]);
  // The slider itself is no stop: its handles are.
  await page.keyboard.press("Shift+Tab");
  expect(await who(page)).toEqual(["sbound"]);
  const stops = [];
  for (const key of ["Tab", "Tab", "Tab", "Tab", "Shift+Tab", "Shift+Tab", "Shift+Tab"]) {
    await page.keyboard.press(key);
    stops.push((await who(page)).at(-1));
  }
  expect(stops).toEqual(["rs.first", "rs.second", "ri.first", "ri.second", "ri.first", "rs.second", "rs.first"]);
  // Given focus, it gives it to its first handle.
  await call(page, "sl.forceActiveFocus");
  expect(await who(page)).toEqual(["sl"]);
  await call(page, "rs.forceActiveFocus");
  expect(await who(page)).toEqual(["rs", "rs.first"]);
});

test("the values of a range slider keep to each other and to the ends", async ({ page }) => {
  await still(page);
  await call(page, "rs.setValues", 0.9, 0.1);
  await said(page, ["one.value 0.100", "two.value 0.100", "one.position 0.100", "two.position 0.100"]);
  await set(page, "rs.first.value", 0.5);
  await said(page, []);
  expect(await near(page, "rs.first.value", "rs.first.position")).toEqual([0.1, 0.1]);
  await set(page, "rs.second.value", 0.8);
  await said(page, ["two.position 0.800", "two.value 0.800"]);
  await set(page, "rs.first.value", 0.5);
  await said(page, ["one.position 0.500", "one.value 0.500"]);
  await call(page, "rs.first.increase");
  await said(page, ["one.position 0.600", "one.value 0.600"]);
  await call(page, "rs.second.decrease");
  await said(page, ["two.position 0.700", "two.value 0.700"]);
  await call(page, "rs.second.decrease");
  await said(page, ["two.position 0.600", "two.value 0.600"]);
  await set(page, "rs.to", 0.5);
  await said(page, ["one.value 0.500", "two.position 1.000", "two.value 0.500", "one.position 1.000"]);
  await set(page, "rs.to", 1);
  await said(page, ["one.position 0.500", "two.position 0.500"]);
  expect(await near(page, "rs.first.value", "rs.second.value")).toEqual([0.5, 0.5]);
});

test("a range slider that is not live moves its handles and gives the value when let go", async ({ page }) => {
  await still(page);
  // As near to both, which are at the same place: the second, to go up.
  await press(page, "ri", 150, 10);
  await said(page, ["itwo.position 0.800", "itwo.moved"]);
  expect(await near(page, "ri.first.position", "ri.second.position", "ri.second.value")).toEqual([0.3, 0.8, 3]);
  await release(page);
  await said(page, ["itwo.value 8.000"]);
  await press(page, "ri", 20, 10);
  await said(page, ["ione.position 0.100", "ione.moved"]);
  await move(page, "ri", 190, 10);
  await said(page, ["ione.position 0.800", "ione.moved"]);
  await release(page);
  await said(page, ["ione.value 8.000"]);
  expect(await near(page, "ri.first.value", "ri.first.position")).toEqual([8, 0.8]);
});

test("a dial turns to where it is pressed, but not across the gap between its ends", async ({ page }) => {
  await still(page);
  await press(page, "dial", 50, 10);
  await said(page, ["dial.pressed true", "dial.angle 0.0", "dial.value 0.500", "dial.moved"]);
  expect(await near(page, "dial.value", "dial.position", "dial.angle", "dial.pressed")).toEqual([0.5, 0.5, 0, true]);
  // A click does not give it focus.
  expect(await who(page)).toEqual([]);
  await move(page, "dial", 90, 50);
  await said(page, ["dial.angle 90.0", "dial.value 0.821", "dial.moved"]);
  await move(page, "dial", 60, 90);
  await said(page, ["dial.angle 140.0", "dial.value 1.000", "dial.moved"]);
  await move(page, "dial", 40, 90);
  await said(page, []);
  await move(page, "dial", 10, 50);
  await said(page, []);
  await release(page);
  await said(page, ["dial.moved", "dial.pressed false"]);
  expect(await near(page, "dial.value")).toEqual([1]);

  await call(page, "dial.forceActiveFocus");
  expect(await who(page)).toEqual(["dial"]);
  await page.keyboard.down("ArrowLeft");
  await said(page, ["dial.pressed true", "dial.angle 112.0", "dial.value 0.900", "dial.moved"]);
  await page.keyboard.up("ArrowLeft");
  await said(page, ["dial.pressed false"]);
  await page.keyboard.press("Home");
  await said(page, ["dial.pressed true", "dial.angle -140.0", "dial.value 0.000", "dial.moved", "dial.pressed false"]);
  await page.keyboard.press("ArrowUp");
  await said(page, ["dial.pressed true", "dial.angle -112.0", "dial.value 0.100", "dial.moved", "dial.pressed false"]);
  await page.keyboard.press("End");
  await said(page, ["dial.pressed true", "dial.angle 140.0", "dial.value 1.000", "dial.moved", "dial.pressed false"]);
  await page.keyboard.press("ArrowDown");
  await said(page, ["dial.pressed true", "dial.angle 112.0", "dial.value 0.900", "dial.moved", "dial.pressed false"]);
  await page.keyboard.press("a");
  await said(page, []);

  await set(page, "dial.value", 0.2);
  await said(page, ["dial.angle -84.0", "dial.value 0.200"]);
  // From one side to the other at once: the handle stays.
  await press(page, "dial", 90, 50);
  await said(page, ["dial.pressed true"]);
  await release(page);
  await said(page, ["dial.moved", "dial.pressed false"]);
  expect(await near(page, "dial.value")).toEqual([0.2]);
  await click(page, "dial", 10, 50);
  await said(page, ["dial.pressed true", "dial.angle -90.0", "dial.value 0.179", "dial.moved", "dial.pressed false"]);
});

test("a dial that wraps goes round, in whole numbers when its ends and step are", async ({ page }) => {
  await still(page);
  await press(page, "dw", 90, 50);
  await said(page, ["dw.angle 108.0", "dw.value 3.000", "dw.moved"]);
  await move(page, "dw", 50, 90);
  await said(page, ["dw.angle 180.0", "dw.value 5.000", "dw.moved"]);
  await move(page, "dw", 10, 50);
  await said(page, ["dw.angle 288.0", "dw.value 8.000", "dw.moved"]);
  await move(page, "dw", 40, 10);
  await said(page, ["dw.angle 360.0", "dw.value 10.000", "dw.moved"]);
  await move(page, "dw", 60, 10);
  await said(page, ["dw.wrapped 0", "dw.angle 0.0", "dw.value 0.000", "dw.moved"]);
  await move(page, "dw", 40, 10);
  await said(page, ["dw.wrapped 1", "dw.angle 360.0", "dw.value 10.000", "dw.moved"]);
  await release(page);
  await said(page, ["dw.moved"]);
  // The wheel turns it and says nothing of having moved it.
  await wheel(page, "dw", 50, 50, 0, -120);
  await said(page, ["dw.angle 324.0", "dw.value 9.000"]);
  await wheel(page, "dw", 50, 50, 0, 240);
  await said(page, ["dw.angle 360.0", "dw.value 10.000"]);
});

test("a dial dragged across turns by how far, and gives its value when let go if not live", async ({ page }) => {
  await still(page);
  await press(page, "dh", 50, 50);
  await said(page, []);
  await move(page, "dh", 100, 50);
  await said(page, ["dh.position 0.250", "dh.angle -45.0", "dh.moved"]);
  await move(page, "dh", 150, 80);
  await said(page, ["dh.position 0.500", "dh.angle 0.0", "dh.moved"]);
  expect(await near(page, "dh.value", "dh.position")).toEqual([0, 0.5]);
  await release(page);
  await said(page, ["dh.value 0.500"]);
});

test("a progress bar's value keeps between its ends", async ({ page }) => {
  await still(page);
  await set(page, "pb.value", 20);
  expect(await near(page, "pb.value", "pb.position")).toEqual([10, 1]);
  await set(page, "pb.to", 5);
  expect(await near(page, "pb.value", "pb.position")).toEqual([5, 1]);
  await set(page, "pb.from", 10);
  expect(await near(page, "pb.value", "pb.position")).toEqual([5, 1]);
  await set(page, "pb.value", 7);
  expect(await near(page, "pb.value", "pb.position")).toEqual([7, 0.6]);
});

test("a page indicator's dot is pressed and its page made the current one", async ({ page }) => {
  await still(page);
  await press(page, "pg", 35, 10);
  await said(page, ["pg.down 1 true"]);
  await move(page, "pg", 65, 10);
  await said(page, ["pg.down 1 false", "pg.down 2 true"]);
  // Between the dots and beside them: the nearest.
  await move(page, "pg", 85, 25);
  await said(page, []);
  await move(page, "pg", 140, 25);
  await said(page, ["pg.down 2 false", "pg.down 3 true"]);
  await move(page, "pg", 140, 100);
  await said(page, ["pg.down 3 false"]);
  await move(page, "pg", 95, 10);
  await said(page, ["pg.down 3 true"]);
  await release(page);
  await said(page, ["pg.currentIndex 3", "pg.down 3 false"]);
  // Let go outside, the page stays.
  await press(page, "pg", 5, 5);
  await move(page, "pg", 5, 100);
  await release(page);
  await said(page, ["pg.down 0 true", "pg.down 0 false"]);
  expect(await read(page, "pg.currentIndex")).toEqual([3]);

  // One that is not interactive takes no press.
  await click(page, "pn", 35, 10);
  await said(page, []);
  await set(page, "pn.interactive", true);
  await click(page, "pn", 35, 10);
  await said(page, ["pn.currentIndex 1"]);
  // Fewer pages: the current one is not the indicator's to change.
  await set(page, "pg.count", 2);
  await said(page, []);
  expect(await read(page, "pg.currentIndex", "pg.contentItem.children.length")).toEqual([3, 3]);
});

// This warns, as Qt does, which the scenes' `test` takes for a failure.
plain("a dial's angles are less than a turn apart, the start before the end, and it says so of others", async ({ page }) => {
  const warnings = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  const told = () => warnings.splice(0);
  await open(page, "dialangles");
  expect(await page.evaluate(() => window.scene.answers())).toEqual([
    [-140, 100, 0.5, 0.5, -20],
    [-300, 60, 1, 1, 60],
    [90, 450, 90],
  ]);
  expect(told().sort()).toEqual([
    "Dial: Difference between startAngle (-300) and endAngle (300) cannot be greater than 360. Changing endAngle to avoid overlaps.",
    "Dial: Difference between startAngle (90) and endAngle (800) cannot be greater than 360. Changing endAngle to avoid overlaps.",
    "Dial: startAngle (200) cannot be greater than or equal to endAngle (100)",
  ]);
  await page.evaluate(() => window.scene.take());
  const angles = () => near(page, "dial.angle", "dial.startAngle", "dial.endAngle");

  await set(page, "dial.startAngle", -90);
  // Qt says the position changed too whenever the angle did; here it is
  // said to change when it does, so the scene does not note it.
  await said(page, ["dial.angle -32.5", "dial.startAngle -90"]);
  await set(page, "dial.endAngle", 300);
  await said(page, ["dial.startAngle -60", "dial.angle 30.0", "dial.endAngle 300"]);
  expect(await angles()).toEqual([30, -60, 300]);
  expect(told()).toEqual([
    "Dial: Difference between startAngle (-90) and endAngle (300) cannot be greater than 360. Changing startAngle to avoid overlaps.",
  ]);
  await set(page, "dial.startAngle", 400);
  await set(page, "dial.endAngle", 720);
  await set(page, "dial.endAngle", -60);
  await set(page, "dial.startAngle", -360);
  await said(page, []);
  expect(await angles()).toEqual([30, -60, 300]);
  expect(told()).toEqual([
    "Dial: startAngle (400) cannot be greater than or equal to endAngle (300)",
    "Dial: endAngle (720) cannot be greater than or equal to 720",
    "Dial: endAngle (-60) cannot be less than or equal to startAngle (-60)",
    "Dial: startAngle (-360) cannot be less than or equal to -360",
  ]);
  await set(page, "dial.startAngle", -200);
  await said(page, ["dial.endAngle 160", "dial.angle -110.0", "dial.startAngle -200"]);
  expect(told()).toEqual([
    "Dial: Difference between startAngle (-200) and endAngle (300) cannot be greater than 360. Changing endAngle to avoid overlaps.",
  ]);
  await set(page, "dial.endAngle", 100);
  await said(page, ["dial.angle -125.0", "dial.endAngle 100"]);
  expect(await angles()).toEqual([-125, -200, 100]);
});
