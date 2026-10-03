import { expect, open, rect, test } from "./open.js";

const advance = (page, ms) => page.evaluate((ms) => window.objects.clock.advance(ms), ms);
const log = (page) => page.evaluate(() => window.objects.log.splice(0));
const set = (page, name, value) =>
  page.evaluate(([name, value]) => void (window.objects.root[name] = value), [name, value]);

test("a state changes properties, and what they had comes back after it", async ({ page }) => {
  await open(page, "states");
  // As Qt prints it: the state it starts in is entered before
  // `Component.onCompleted`, and the handler hears of it first.
  expect(await log(page)).toEqual([
    "state start 50 0 red",
    "script start 10",
    "completed start 10",
    "onCompleted start 10",
  ]);
  expect(await rect(page, "box")).toEqual({ x: 10, y: 0, width: 50, height: 50 });
  const entered = await page.evaluate(() => {
    const { root, box, move, grow } = window.objects;
    root.state = "wide";
    return [box.width, box.x, box.color, move.running, grow.running];
  });
  // What the transition animates still reads as it did; the colour, which it
  // does not, is the state's already. Its animation is not said to run.
  expect(entered).toEqual([50, 10, "blue", true, false]);
  expect(await log(page)).toEqual(["state wide 50 10 red", "move true 50", "script wide 50 10 blue"]);
  await advance(page, 48);
  const midway = await rect(page, "box");
  expect(midway.x).toBeCloseTo(5.2, 5);
  expect(midway.width).toBe(122);
  await advance(page, 52);
  // The transition is still running when the state is complete.
  expect(await log(page)).toEqual(["completed wide 200 0 true false", "move false 200"]);
  expect(await page.evaluate(() => window.objects.clock.running)).toBe(false);
  // The change is a binding for as long as the state lasts.
  await set(page, "ratio", 0.5);
  expect(await rect(page, "box")).toEqual({ x: 0, y: 0, width: 100, height: 50 });
});

test("a state whose `when` holds is the state", async ({ page }) => {
  await open(page, "states");
  await set(page, "state", "wide");
  await advance(page, 100);
  await log(page);
  await set(page, "flag", true);
  const during = await page.evaluate(() => {
    const { root, box } = window.objects;
    return [root.state, box.width, box.x, box.y, box.color];
  });
  expect(during).toEqual(["auto", 50, 0, 100, "red"]);
  expect(await log(page)).toEqual(["state auto 200 0 blue", "completed auto 100"]);
  await set(page, "flag", false);
  const after = await page.evaluate(() => {
    const { root, box } = window.objects;
    return [root.state, box.y];
  });
  expect(after).toEqual(["", 0]);
  expect(await log(page)).toEqual(["state  50 0 red"]);
});

const shown = (page) =>
  page.evaluate(() => {
    const { root, box } = window.objects;
    return [root.state, box.x, box.y, box.width, box.height, box.opacity, box.rotation];
  });

test("a reversible transition runs backwards on the way back", async ({ page }) => {
  await open(page, "transitions");
  await set(page, "state", "a");
  expect(await shown(page)).toEqual(["a", 0, 0, 50, 50, 1, 0]);
  await advance(page, 48);
  expect(await shown(page)).toEqual(["a", 48, 0, 50, 50, 1, 0]);
  await advance(page, 100);
  expect((await shown(page))[3]).toBeCloseTo(50 + 30 * 0.48, 10);
  await advance(page, 52);
  expect(await shown(page)).toEqual(["a", 100, 0, 80, 50, 1, 0]);
  expect(await log(page)).toEqual(["ab true", "completed a 100", "ab false"]);
  await set(page, "unit", 5);
  expect(await shown(page)).toEqual(["a", 100, 0, 40, 50, 0.5, 0]);
  await set(page, "unit", 10);
  // Back: the width first, then x.
  await set(page, "state", "");
  expect(await shown(page)).toEqual(["", 100, 0, 80, 50, 1, 0]);
  await advance(page, 48);
  expect(await shown(page)).toEqual(["", 100, 0, 65.6, 50, 1, 0]);
  await advance(page, 100);
  expect(await shown(page)).toEqual(["", 52, 0, 50, 50, 1, 0]);
  await advance(page, 52);
  expect(await shown(page)).toEqual(["", 0, 0, 50, 50, 1, 0]);
  expect(await log(page)).toEqual(["ab true", "ab false"]);
});

test("a change of state on the way starts from where things are", async ({ page }) => {
  await open(page, "transitions");
  // `b` extends `a`; its `height` is evaluated once. (Qt applies a binding
  // no animation takes, the width here, when the transition ends; a value,
  // at once. The two cannot be told apart here, so both are at once.)
  await set(page, "state", "b");
  expect(await shown(page)).toEqual(["b", 0, 0, 80, 70, 1, 0]);
  await advance(page, 48);
  expect(await shown(page)).toEqual(["b", 96, 60 * 0.48, 80, 70, 1, 0]);
  await set(page, "state", "a");
  expect(await shown(page)).toEqual(["a", 96, 60 * 0.48, 80, 50, 1, 0]);
  // As Qt prints it: the transition stops and starts.
  expect(await log(page)).toEqual(["any true", "any false", "any true"]);
  await advance(page, 48);
  const [, x, y] = await shown(page);
  expect(x).toBeCloseTo(96 + 4 * 0.48, 10);
  expect(y).toBeCloseTo(60 * 0.48 * 0.52, 10);
  await advance(page, 52);
  expect(await shown(page)).toEqual(["a", 100, 0, 80, 50, 1, 0]);
  expect(await log(page)).toEqual(["completed a 100", "any false"]);
  await set(page, "state", "b");
  await advance(page, 100);
  expect(await log(page)).toEqual(["any true", "completed b 200 60", "any false"]);
  await set(page, "unit", 20);
  expect(await shown(page)).toEqual(["b", 200, 60, 160, 70, 2, 0]);
});

test("what a state does not restore stays, and the rest goes back", async ({ page }) => {
  await open(page, "transitions");
  await set(page, "state", "b");
  await advance(page, 100);
  await set(page, "state", "c");
  expect(await shown(page)).toEqual(["c", 200, 60, 50, 50, 0.5, 10]);
  await advance(page, 100);
  await set(page, "unit", 30);
  expect(await shown(page)).toEqual(["c", 0, 0, 50, 50, 0.5, 30]);
  // The opacity was bound to `unit` before; it is not any more.
  await set(page, "state", "");
  expect(await shown(page)).toEqual(["", 0, 0, 50, 50, 0.5, 0]);
  await advance(page, 100);
  expect(await page.evaluate(() => window.objects.clock.running)).toBe(false);
});

const places = (page, what) =>
  page.evaluate((what) => {
    const { root, log, right, fade } = window.objects;
    root.show(what);
    return [...log.splice(0), right.opacity, fade.running];
  }, what);

test("anchors and parents change with the state", async ({ page }) => {
  await open(page, "changes");
  await set(page, "state", "moved");
  // The item is the other one's child at once, where the state puts it; the
  // anchors are the state's, and where they put the bar is animated.
  expect(await places(page, "to moved")).toEqual(["to moved 0 0 5 -30 right ", 1, false]);
  expect(await rect(page, "token")).toEqual({ x: 205, y: 20, width: 20, height: 20 });
  expect(await rect(page, "bar")).toEqual({ x: 0, y: 0, width: 40, height: 30 });
  await advance(page, 48);
  const out = await rect(page, "bar");
  expect(out.x).toBeCloseTo(360 * 0.48, 4);
  expect(out.y).toBeCloseTo(135 * 0.48, 4);
  // A StateGroup's `when` reads the bar where it is shown.
  await advance(page, 48);
  expect((await places(page, "+96")).slice(0, 1)).toEqual(["group on"]);
  await advance(page, 16);
  // The script waited for the ScriptAction that names it.
  expect(await places(page, "+112")).toEqual([
    "script 360 135 5 -30 right on",
    "completed 360 135 5 -30 right on",
    "+112 360 135 5 -30 right on",
    0.92,
    true,
  ]);
  await advance(page, 100);
  expect(await places(page, "done")).toEqual(["done 360 135 5 -30 right on", 0.5, false]);
  await set(page, "state", "");
  expect(await places(page, "to none")).toEqual(["to none 360 135 10 20 left on", 0.5, false]);
  expect(await rect(page, "token")).toEqual({ x: 10, y: 20, width: 20, height: 20 });
  await advance(page, 48);
  const back = await rect(page, "bar");
  expect(back.x).toBeCloseTo(360 * 0.52, 4);
  expect(back.y).toBeCloseTo(135 * 0.52, 4);
  await advance(page, 200);
  expect(await places(page, "end")).toEqual(["group ", "end 0 0 10 20 left ", 1, false]);
  expect(await page.evaluate(() => window.objects.left.children.length)).toBe(1);
  expect(await page.evaluate(() => window.objects.clock.running)).toBe(false);
});

const moving = (page) =>
  page.evaluate(() => {
    const { box, slide, drop, via } = window.objects;
    return [box.x, box.y, slide.running, drop.running, via.running];
  });

test("a Behavior animates what a transition does not", async ({ page }) => {
  await open(page, "statebehavior");
  await set(page, "state", "plain");
  expect(await moving(page)).toEqual([0, 0, true, false, false]);
  await advance(page, 48);
  expect(await moving(page)).toEqual([24, 0, true, false, false]);
  await advance(page, 152);
  expect(await moving(page)).toEqual([100, 0, false, false, false]);
  // The transition takes `x` from its Behavior; `y` is left to its own.
  await set(page, "state", "taken");
  expect(await moving(page)).toEqual([100, 0, false, true, true]);
  await advance(page, 48);
  expect(await moving(page)).toEqual([148, 24, false, true, true]);
  await advance(page, 52);
  expect(await moving(page)).toEqual([200, 50, false, true, false]);
  await advance(page, 100);
  expect(await moving(page)).toEqual([200, 100, false, false, false]);
  await set(page, "state", "");
  await advance(page, 48);
  expect(await moving(page)).toEqual([152, 76, true, true, false]);
  // Qt lets the Behavior's animation run on under the transition and end
  // the property where it was going before: at 0, in a state that says
  // 200. Here the transition has the property, and it ends where it says.
  await set(page, "state", "taken");
  expect(await moving(page)).toEqual([152, 76, false, true, true]);
  await advance(page, 100);
  expect((await moving(page))[0]).toBe(200);
  await advance(page, 100);
  expect(await moving(page)).toEqual([200, 100, false, false, false]);
});
