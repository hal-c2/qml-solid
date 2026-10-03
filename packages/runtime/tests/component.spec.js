// What the compiler makes of a QML file, on the runtime it is made for.
import { test as plain } from "@playwright/test";
import { expect, open, rect, test } from "./open.js";

test("an instance sets what its component declares", async ({ page }) => {
  await open(page, "components");
  const read = await page.evaluate(() => {
    const { first, second } = window.objects;
    return [first.title, first.padding, first.width, second.title, second.padding, second.width, second.x];
  });
  expect(read).toEqual(["first", 20, 200, "untitled", 10, 100, 200]);
  expect(await rect(page, "first")).toEqual({ x: 0, y: 0, width: 200, height: 80 });
  expect(await rect(page, "second")).toEqual({ x: 200, y: 0, width: 100, height: 80 });
});

test("what is written in an instance goes where the default alias says", async ({ page }) => {
  await open(page, "components");
  const read = await page.evaluate(() => {
    const { first, inner } = window.objects;
    return [inner.parent === first.body, first.children.length, first.body.children.length];
  });
  expect(read).toEqual([true, 1, 1]);
  // The body is the panel less its padding, and `parent` is the body.
  expect(await rect(page, "inner")).toEqual({ x: 20, y: 20, width: 10, height: 20 });
});

test("an alias is the property it names", async ({ page }) => {
  await open(page, "components");
  const colour = () => page.evaluate(() => getComputedStyle(window.objects.first.body.$node).backgroundColor);
  expect(await colour()).toBe("rgb(255, 0, 0)");
  await page.evaluate(() => {
    window.objects.first.bodyColor = "green";
  });
  expect(await colour()).toBe("rgb(0, 128, 0)");
  expect(await page.evaluate(() => String(window.objects.first.bodyColor) === String(window.objects.first.body.color))).toBe(true);
});

test("a function is the object's, and what it emits reaches the instance's handler", async ({ page }) => {
  await open(page, "components");
  const read = await page.evaluate(() => {
    const { scene, objects } = window;
    const { first, second } = objects;
    first.grow(15);
    return [first.width, scene.grown, second.x];
  });
  expect(read).toEqual([215, 215, 215]);
  expect(await rect(page, "second")).toEqual({ x: 215, y: 0, width: 100, height: 80 });
});

test("a signal runs the component's handler and the instance's", async ({ page }) => {
  await open(page, "components");
  const read = await page.evaluate(() => {
    const { scene, objects } = window;
    const { second } = objects;
    const before = second.notified;
    second.width = 60;
    window.flush();
    return [second.notified - before, scene.narrowed];
  });
  expect(read).toEqual([1, 60]);
});

test("a singleton is one object, and whoever names it reads the same one", async ({ page }) => {
  await open(page, "singletons");
  expect(await rect(page, "first")).toEqual({ x: 0, y: 0, width: 40, height: 10 });
  expect(await rect(page, "second")).toEqual({ x: 40, y: 0, width: 10, height: 20 });
  // What is assigned to it reaches every binding that reads it, its own too.
  await page.evaluate(() => {
    window.scene.theme.grid = 25;
    window.flush();
  });
  expect(await rect(page, "first")).toEqual({ x: 0, y: 0, width: 100, height: 25 });
  expect(await rect(page, "second")).toEqual({ x: 100, y: 0, width: 25, height: 50 });
});

test("an enum is keys of the type that declares it", async ({ page }) => {
  await open(page, "singletons");
  const read = await page.evaluate(() => {
    const { scene } = window;
    const before = scene.second.width;
    scene.mode = 0;
    window.flush();
    return [scene.plain, scene.raised, before, scene.second.width];
  });
  expect(read).toEqual([0, 2, 10, 20]);
});

test("a name a component does not have is found in whatever made it", async ({ page }) => {
  await open(page, "scopes");
  expect(await rect(page, "dot")).toEqual({ x: 0, y: 0, width: 200, height: 8 });
  expect(await rect(page, "chip")).toEqual({ x: 0, y: 100, width: 100, height: 10 });
  // It is the object and the property themselves: what changes them is seen.
  await page.evaluate(() => {
    window.scene.width = 200;
    window.scene.__cell = 12;
    window.flush();
  });
  expect(await rect(page, "dot")).toEqual({ x: 0, y: 0, width: 100, height: 12 });
  expect(await rect(page, "chip")).toEqual({ x: 0, y: 100, width: 50, height: 10 });
});

// What Qt 6.11 says of `scenes/faults.qml`.
plain("a binding that cannot be evaluated leaves the property what it was, and says so", async ({ page }) => {
  const warnings = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
    if (message.type() === "error") errors.push(message.text());
  });
  await open(page, "faults");
  // A state is entered once what changed has settled, so each step is read
  // after it.
  const found = [];
  for (let step = 0; step < 4; step++) {
    await page.evaluate((step) => window.scene.step(step), step);
    found.push(await page.evaluate(() => window.scene.read()));
  }
  expect(found).toEqual([
    [false, 0, "", 0, true, ""],
    [true, 3, "xn", 7, false, "on"],
    [true, 3, "xn", 7, false, "on"],
    [false, 4, "xm", 8, true, ""],
  ]);
  expect(errors).toEqual([]);
  expect(warnings.length).toBeGreaterThan(0);
  for (const warning of warnings) expect(warning).toMatch(/^(on|n|label|width|visible|when): TypeError: /);
});
