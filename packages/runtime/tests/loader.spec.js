import { test as plain } from "@playwright/test";
import { expect, open, rect, test } from "./open.js";

const ready = (page, name) => page.waitForFunction((name) => window.objects[name].status === 1, name);

test("a Loader is as big as its item, or its item as big as it", async ({ page }) => {
  await open(page, "loader");
  await ready(page, "later");
  const read = await page.evaluate(() => {
    const { bare, natural, sized, half, filled, inactive, object, made } = window.objects;
    const size = (item) => [item.width, item.height];
    const both = (loader) => [...size(loader), loader.implicitWidth, loader.implicitHeight, ...size(loader.item)];
    return {
      bare: [bare.status, bare.item, ...size(bare), bare.progress],
      natural: [natural.status, natural.progress, natural.item.parent === natural, natural.children.length, ...both(natural)],
      sized: both(sized),
      half: both(half),
      filled: both(filled),
      inactive: [inactive.status, inactive.item, inactive.children.length],
      object: [object.status, object.item.value, ...size(object), object.children.length],
      made: [made.rect, made.implicit],
    };
  });
  expect(read).toEqual({
    bare: [0, null, 0, 0, 0],
    natural: [1, 1, true, 1, 60, 30, 60, 30, 60, 30],
    // A size the item was given is not an implicit one.
    sized: [120, 80, 0, 0, 120, 80],
    half: [120, 35, 70, 35, 120, 35],
    filled: [200, 100, 0, 0, 200, 100],
    inactive: [0, null, 0],
    object: [1, 3, 0, 0, 0],
    made: [4, 1],
  });
  expect(await rect(page, "sized")).toEqual({ x: 100, y: 0, width: 120, height: 80 });
  const item = await page.evaluate(() => {
    const { x, y, width, height } = window.objects.half.item.$node.getBoundingClientRect();
    return { x, y, width, height };
  });
  expect(item).toEqual({ x: 0, y: 100, width: 120, height: 35 });
});

test("a Loader makes its item when it is active and unmakes it when it is not", async ({ page }) => {
  await open(page, "loader");
  const read = await page.evaluate(() => {
    const { natural, parts, log, made } = window.objects;
    const out = { start: log.filter((line) => !line.startsWith("file")) };
    const said = () => log.splice(0).join(", ");
    said();
    const first = natural.item;
    first.width = 90;
    out.grown = [natural.width, natural.implicitWidth];
    natural.width = 40;
    out.set = [natural.width, first.width, natural.implicitWidth, said()];
    natural.active = false;
    out.inactive = [natural.status, natural.item, natural.width, natural.implicitWidth, natural.children.length, said()];
    natural.active = true;
    out.active = [natural.status, natural.item.width, natural.item === first, made.rect, said()];
    natural.sourceComponent = parts.implicit;
    out.changed = [natural.status, natural.item.width, natural.implicitWidth, natural.height, natural.children.length, said()];
    natural.sourceComponent = undefined;
    out.unset = [natural.status, natural.item, natural.progress, natural.height, said()];
    return out;
  });
  expect(read).toEqual({
    start: ["item", "status 1", "loaded 60"],
    grown: [90, 90],
    set: [40, 40, 0, ""],
    inactive: [0, null, 40, 0, 0, "item null, status 0"],
    // Another item, as wide as the Loader was told to be.
    active: [1, 40, false, 5, "item, status 1, loaded 40"],
    changed: [1, 40, 70, 35, 1, "item, loaded 40"],
    unset: [0, null, 0, 0, "item null, status 0"],
  });
});

test("an asynchronous Loader makes its item once whoever asked has gone on", async ({ page }) => {
  await open(page, "loader");
  const read = await page.evaluate(async () => {
    const { later, bare, parts } = window.objects;
    await new Promise((resolve) => (later.status === 1 ? resolve() : later.loaded.connect(resolve)));
    const out = { later: [later.status, later.item.width, later.width, later.progress] };
    bare.asynchronous = true;
    bare.sourceComponent = parts.rect;
    out.during = [bare.status, bare.item, bare.progress];
    // What is asked for meanwhile is what is made.
    bare.sourceComponent = parts.implicit;
    await new Promise((resolve) => bare.loaded.connect(resolve));
    out.after = [bare.status, bare.item.implicitWidth, bare.width, bare.progress, bare.children.length];
    return out;
  });
  expect(read).toEqual({ later: [1, 60, 60, 1], during: [2, null, 0], after: [1, 70, 70, 1, 1] });
});

test("a source the compiler saw is a module the Loader imports", async ({ page }) => {
  await open(page, "loader");
  await ready(page, "file");
  const loaded = await page.evaluate(() => {
    const { file, log } = window.objects;
    window.first = file.item;
    return [file.status, file.progress, file.width, file.height, file.item.label, file.item.parent === file, log.filter((line) => line.startsWith("file"))];
  });
  expect(loaded).toEqual([1, 1, 80, 45, "none", true, ["file none"]]);
  expect(await rect(page, "file")).toEqual({ x: 100, y: 200, width: 80, height: 45 });
  // The same source again, and what its item's properties begin as.
  const during = await page.evaluate(() => {
    const { file, parts } = window.objects;
    file.setSource(parts.card, { label: "set", height: 20 });
    return [file.status, file.item, file.progress, file.source === parts.card];
  });
  expect(during).toEqual([2, null, 0, true]);
  await ready(page, "file");
  const again = await page.evaluate(() => {
    const { file, bare, parts, log } = window.objects;
    const out = [file.item === window.first, file.item.label, file.height, log.filter((line) => line.startsWith("file"))];
    bare.source = parts.card;
    bare.source = "";
    return [...out, bare.status, bare.item];
  });
  expect(again).toEqual([false, "set", 20, ["file none", "file set"], 0, null]);
  // What was let go of while it was on its way never comes.
  await page.evaluate(() => window.objects.parts.card().then(() => true));
  expect(await page.evaluate(() => [window.objects.bare.status, window.objects.bare.item])).toEqual([0, null]);
});

// Not the scenes' `test`: these warn, and are meant to.
plain("a source that cannot be loaded is an error the console tells of", async ({ page }) => {
  const warnings = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  await open(page, "loader");
  const url = "https://example.test/parts/Missing.qml";
  const read = await page.evaluate((url) => {
    const { bare } = window.objects;
    bare.source = url;
    return [bare.status, bare.status === bare.$type.Error, bare.item, bare.progress, bare.width];
  }, url);
  expect(read).toEqual([3, true, null, 1, 0]);
  expect(warnings).toEqual([`Loader: cannot load ${url}: only a QML file the compiler saw can be loaded`]);
  // A module that does not come.
  await page.evaluate(() => {
    const { natural } = window.objects;
    natural.source = () => Promise.reject(new Error("no such module"));
    natural.sourceComponent = undefined;
  });
  await page.waitForFunction(() => window.objects.natural.status === 3);
  expect(await page.evaluate(() => [window.objects.natural.item, window.objects.natural.progress])).toEqual([null, 1]);
  expect(warnings[1]).toBe("Loader: cannot load no such module");
  expect(warnings).toHaveLength(2);
});
