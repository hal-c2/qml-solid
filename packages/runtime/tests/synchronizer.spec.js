import { test as plain } from "@playwright/test";
import { expect, open, rect, test } from "./open.js";

test("a Synchronizer gives the source's value to the target and then follows either", async ({ page }) => {
  await open(page, "synchronizer");
  const read = await page.evaluate(() => {
    const { scene } = window;
    const { a, b, c, box, inset, log } = scene;
    const now = () => [a.v, b.v, box.width, a.w, inset.anchors.leftMargin, c.v];
    const seen = { initial: [now(), [...log]] };
    a.v = 6;
    seen.source = now();
    b.v = 7.5;
    seen.target = now();
    // One on a property has that property as its target.
    box.width = 42;
    seen.on = now();
    a.w = 12;
    inset.anchors.leftMargin += 2;
    seen.group = now();
    log.length = 0;
    // Two brought together later are left as they are until one changes.
    scene.other = a;
    seen.late = [now(), [...log]];
    a.v = 2;
    seen.then = now();
    c.v = 1;
    seen.back = now();
    scene.which = "w";
    c.v = 8;
    seen.renamed = now();
    scene.other = null;
    c.v = 3;
    a.w = 5;
    seen.parted = now();
    return seen;
  });
  expect(read).toEqual({
    // The value a target is given as it is made is the first its change
    // handler knows of (Qt tells it of that one too).
    initial: [[5, 5, 5, 3, 3, 11], []],
    source: [6, 6, 6, 3, 3, 11],
    target: [7.5, 7.5, 7.5, 3, 3, 11],
    on: [42, 42, 42, 3, 3, 11],
    group: [42, 42, 42, 14, 14, 11],
    late: [[42, 42, 42, 14, 14, 11], []],
    then: [2, 2, 2, 14, 14, 2],
    back: [1, 1, 1, 14, 14, 1],
    renamed: [1, 1, 1, 8, 8, 8],
    parted: [1, 1, 1, 5, 5, 3],
  });
  expect(await rect(page, "box")).toEqual({ x: 0, y: 0, width: 1, height: 10 });
  expect(await rect(page, "inset")).toEqual({ x: 5, y: 10, width: 10, height: 10 });
});

test("a Synchronizer tells of a value its target changed or did not take", async ({ page }) => {
  await open(page, "synchronizer-limits");
  const read = await page.evaluate(() => {
    const { wanted, dial, log } = window.objects;
    const now = () => [wanted.amount, dial.value, wanted.fixed, dial.sealed, log.splice(0)];
    const seen = { initial: now() };
    wanted.amount = 4;
    seen.taken = now();
    // What the target makes of its value on its own goes to the source.
    dial.to = 2;
    seen.narrowed = now();
    wanted.amount = 99;
    seen.refused = now();
    dial.value = 1;
    seen.back = now();
    return seen;
  });
  expect(read).toEqual({
    // A value the target changed is not given back to the source.
    initial: [50, 10, 1, 7, [["bounced", true, "value"], ["ignored", true, "sealed"]]],
    taken: [4, 4, 1, 7, []],
    narrowed: [2, 2, 1, 7, []],
    refused: [99, 2, 1, 7, [["ignored", true, "value"]]],
    back: [1, 1, 1, 7, []],
  });
});

plain("a Synchronizer says so when an object has no such property", async ({ page }) => {
  const warnings = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  await open(page, "synchronizer-limits");
  const read = await page.evaluate(() => {
    const { wanted, dial, second } = window.objects;
    second.targetProperty = "nope";
    wanted.fixed = 5;
    second.targetProperty = "to";
    wanted.fixed = 6;
    return [wanted.fixed, dial.to, dial.nope];
  });
  expect(read).toEqual([6, 6, undefined]);
  expect(warnings).toEqual(["Synchronizer: Target object has no property called nope"]);
});
