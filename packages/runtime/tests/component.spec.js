// What the compiler makes of a QML file, on the runtime it is made for.
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
