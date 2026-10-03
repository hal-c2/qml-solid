import { expect, open, rect, test } from "./open.js";

test("a Flickable's children are in its content item, which is as big as the content", async ({ page }) => {
  await open(page, "flickable");
  const read = await page.evaluate(() => {
    const { flick, inner, marks, plain, lone, extra } = window.objects;
    const content = flick.contentItem;
    const made = extra.createObject(flick);
    return {
      parents: [inner.parent === content, content.parent === flick, marks.itemAt(2).parent === content, made.parent === flick],
      children: [flick.children.length, flick.children[0] === content, content.children.length],
      content: [content.x, content.y, content.width, content.height],
      // With no content size, the content is as big as the Flickable.
      plain: [plain.contentWidth, plain.contentItem.width, plain.contentItem.height, lone.parent === plain.contentItem],
      ends: [plain.atXBeginning, plain.atXEnd, plain.atYBeginning, plain.atYEnd, flick.atYBeginning, flick.atYEnd],
      area: [plain.visibleArea.widthRatio, plain.visibleArea.heightRatio, flick.visibleArea.heightRatio, flick.visibleArea.yPosition],
    };
  });
  expect(read).toEqual({
    parents: [true, true, true, true],
    children: [2, true, 6],
    content: [0, 0, 300, 400],
    plain: [-1, 100, 80, true],
    ends: [true, true, true, true, true, false],
    area: [1, 1, 0.25, 0],
  });
  expect(await rect(page, "inner")).toEqual({ x: 10, y: 20, width: 50, height: 50 });
});

test("the content position scrolls the content, and scrolling sets the content position", async ({ page }) => {
  await open(page, "flickable");
  const read = await page.evaluate(() => {
    const { flick } = window.objects;
    flick.contentY = 50;
    flick.contentX = 30;
    return [flick.contentItem.x, flick.contentItem.y, flick.visibleArea.yPosition, flick.atYBeginning, flick.atXBeginning];
  });
  expect(read).toEqual([-30, -50, 0.125, false, false]);
  expect(await rect(page, "inner")).toEqual({ x: -20, y: -30, width: 50, height: 50 });
  // What the browser scrolls, the Flickable follows.
  await page.evaluate(() => window.objects.flick.$viewport.scrollTo(100, 300));
  await page.waitForFunction(() => window.objects.flick.contentY === 300 && !window.objects.flick.moving);
  const scrolled = await page.evaluate(() => {
    const { flick, log } = window.objects;
    return [flick.contentX, flick.contentY, flick.atXEnd, flick.atYEnd, flick.contentItem.y, log];
  });
  expect(scrolled).toEqual([100, 300, true, true, -300, ["started", "ended"]]);
  expect(await rect(page, "inner")).toEqual({ x: -90, y: -280, width: 50, height: 50 });
  // A position beyond the content is kept, as in Qt, until it is asked back.
  const beyond = await page.evaluate(() => {
    const { flick } = window.objects;
    flick.contentY = 5000;
    const seen = [flick.contentY, flick.contentItem.y, flick.$viewport.scrollTop];
    flick.returnToBounds();
    return [...seen, flick.contentY];
  });
  expect(beyond).toEqual([5000, -5000, 300, 300]);
});

test("a wheel moves the content", async ({ page }) => {
  await open(page, "flickable");
  await page.mouse.move(50, 50);
  await page.mouse.wheel(0, 120);
  await page.waitForFunction(() => window.objects.flick.contentY === 120 && !window.objects.flick.moving);
  expect(await page.evaluate(() => window.objects.log)).toEqual(["started", "ended"]);
  expect(await rect(page, "inner")).toEqual({ x: 10, y: -100, width: 50, height: 50 });
  // One that is not interactive stays where it is.
  await page.mouse.move(250, 50);
  await page.evaluate(() => (window.objects.margins.interactive = false));
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  await page.mouse.wheel(0, 120);
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  expect(await page.evaluate(() => window.objects.margins.contentY)).toBe(-7);
});

test("margins put the content's beginning before zero", async ({ page }) => {
  await open(page, "flickable");
  const read = await page.evaluate(() => {
    const { margins } = window.objects;
    const area = margins.visibleArea;
    const style = getComputedStyle(margins.$viewport);
    const start = [margins.contentX, margins.contentY, margins.contentItem.x, margins.contentItem.y, area.widthRatio, area.heightRatio];
    margins.contentY = 311;
    return { start, end: [margins.atYEnd, area.yPosition], style: [style.overflowX, style.overflowY, style.overscrollBehaviorY] };
  });
  expect(read.start).toEqual([-3, -7, 3, 7, 200 / 303, 100 / 418]);
  expect(read.end).toEqual([true, 318 / 418]);
  expect(read.style).toEqual(["hidden", "auto", "none"]);
  expect(await rect(page, "corner")).toEqual({ x: 203, y: -311, width: 10, height: 10 });
});

test("flick() throws the content as far as its speed takes it", async ({ page }) => {
  await open(page, "flickable");
  const read = await page.evaluate(() => {
    const { flick } = window.objects;
    flick.contentY = 50;
    flick.flick(0, -500);
    return [flick.moving, flick.flicking, flick.flickingVertically, flick.movingHorizontally];
  });
  expect(read).toEqual([true, true, true, false]);
  await page.waitForFunction(() => !window.objects.flick.moving);
  const after = await page.evaluate(() => [window.objects.flick.contentY, window.objects.flick.flicking, window.objects.log]);
  // 500² / (2 × 1500) further on.
  expect(Math.abs(after[0] - (50 + 250000 / 3000))).toBeLessThan(1);
  expect(after.slice(1)).toEqual([false, ["started", "flick started", "flick ended", "ended"]]);
});
