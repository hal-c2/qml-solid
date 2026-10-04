import { expect, open, rect, test } from "./open.js";

test("anchors place an item against its parent and its siblings", async ({ page }) => {
  await open(page, "anchors");
  expect(await rect(page, "root")).toEqual({ x: 0, y: 0, width: 400, height: 300 });
  expect(await rect(page, "fill")).toEqual({ x: 30, y: 10, width: 360, height: 280 });
  expect(await rect(page, "centre")).toEqual({ x: 150, y: 125, width: 100, height: 50 });
  // `later` is declared after the item that anchors to it.
  expect(await rect(page, "after")).toEqual({ x: 80, y: 110, width: 40, height: 40 });
  expect(await rect(page, "between")).toEqual({ x: 80, y: 140, width: 315, height: 20 });
  expect(await rect(page, "half")).toEqual({ x: 0, y: 290, width: 200, height: 10 });
});

test("what is anchored follows what it is anchored to", async ({ page }) => {
  await open(page, "anchors");
  await page.evaluate(() => {
    const { root, later } = window.objects;
    root.width = 500;
    later.x = 100;
    later.height = 40;
  });
  expect(await rect(page, "fill")).toEqual({ x: 30, y: 10, width: 460, height: 280 });
  expect(await rect(page, "centre")).toEqual({ x: 200, y: 125, width: 100, height: 50 });
  expect(await rect(page, "after")).toEqual({ x: 160, y: 70, width: 40, height: 20 });
  expect(await rect(page, "between")).toEqual({ x: 160, y: 140, width: 335, height: 20 });
  expect(await rect(page, "half")).toEqual({ x: 0, y: 290, width: 250, height: 10 });
});

test("a property reads as what was just assigned, and so does what is bound to it", async ({ page }) => {
  await open(page, "anchors");
  const read = await page.evaluate(() => {
    const { root, half, fill } = window.objects;
    root.width = 320;
    return [root.width, half.width, fill.width, fill.parent === root, root.children.length];
  });
  expect(read).toEqual([320, 160, 280, true, 6]);
});

test("an assignment replaces the binding", async ({ page }) => {
  await open(page, "anchors");
  const read = await page.evaluate(() => {
    const { root, half } = window.objects;
    half.width = 30;
    root.width = 100;
    return half.width;
  });
  expect(read).toBe(30);
  expect((await rect(page, "half")).width).toBe(30);
});

test("a rectangle is painted with its colour, radius, border and gradient", async ({ page }) => {
  await open(page, "rectangle");
  const style = (id) =>
    page.evaluate((id) => {
      const { backgroundColor, backgroundImage, borderRadius, boxShadow, opacity, zIndex, display, overflow } = getComputedStyle(
        window.objects[id].$node,
      );
      return { backgroundColor, backgroundImage, borderRadius, boxShadow, opacity, zIndex, display, overflow };
    }, id);
  expect(await style("plain")).toEqual({
    backgroundColor: "rgb(255, 255, 255)",
    backgroundImage: "none",
    borderRadius: "0px",
    boxShadow: "none",
    opacity: "1",
    zIndex: "auto",
    display: "block",
    overflow: "visible",
  });
  expect(await style("round")).toMatchObject({
    // QML's `#AARRGGBB`.
    backgroundColor: "rgba(255, 0, 0, 0.5)",
    borderRadius: "8px",
    boxShadow: "rgb(0, 0, 128) 0px 0px 0px 3px inset",
    opacity: "0.5",
    zIndex: "2",
  });
  expect(await style("hidden")).toMatchObject({ display: "none" });
  expect(await style("turned")).toMatchObject({ overflow: "hidden" });
  expect((await style("shaded")).backgroundImage).toBe("linear-gradient(rgb(255, 0, 0) 0%, rgb(0, 0, 255) 100%)");
  // The border is inside: the size is the item's.
  expect(await rect(page, "round")).toEqual({ x: 60, y: 0, width: 50, height: 40 });
});

test("an item inside a hidden one is not visible", async ({ page }) => {
  await open(page, "rectangle");
  expect(await page.evaluate(() => [window.objects.inside.visible, window.objects.hidden.visible])).toEqual([false, false]);
  await page.evaluate(() => (window.objects.hidden.visible = true));
  expect(await page.evaluate(() => window.objects.inside.visible)).toBe(true);
});

test("rotation turns about the transform origin, a Rotation about its own", async ({ page }) => {
  await open(page, "rectangle");
  // 100x20 at (200, 100), a quarter turn about its centre (250, 110).
  expect(await rect(page, "turned")).toEqual({ x: 240, y: 60, width: 20, height: 100 });
  // 40x40 at (100, 200), a quarter turn about its top left corner.
  expect(await rect(page, "spun")).toEqual({ x: 60, y: 200, width: 40, height: 40 });
  await page.evaluate(() => (window.objects.spun.transform.angle = 180));
  expect(await rect(page, "spun")).toEqual({ x: 60, y: 160, width: 40, height: 40 });
});

test("declared properties, signals and change handlers", async ({ page }) => {
  await open(page, "properties");
  // A binding's first value is a change of what the property had.
  expect(await page.evaluate(() => window.objects.log)).toEqual(["width 40", "completed 40"]);
  expect((await rect(page, "follower")).width).toBe(40);
  const read = await page.evaluate(() => {
    const { root, follower } = window.objects;
    root.count = 5;
    const first = [root.doubled, follower.width];
    root.poked(3);
    return first;
  });
  expect(read).toEqual([10, 100]);
  expect(await page.evaluate(() => window.objects.log)).toEqual(["width 40", "completed 40", "width 100", "poked 3"]);
  expect((await rect(page, "follower")).width).toBe(100);
});
