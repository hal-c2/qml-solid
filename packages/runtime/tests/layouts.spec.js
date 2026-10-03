import { dump } from "./dump.js";
import { expect, open, test } from "./open.js";

// Every line a test expects is what Qt 6.11 prints for the QML at the top of
// the scene (see dump.js).

const lines = async (page, names) => {
  const out = {};
  for (const name of names) out[name] = await dump(page, name);
  return out;
};

test("a row shares its width among the children that fill, each within its limits", async ({ page }) => {
  await open(page, "layouts");
  expect(await lines(page, ["row", "squeezed", "loose", "stretched", "mixed", "uniform", "empty"])).toEqual({
    row: "0 0 300 40 implicit 130 20 | [0 15 20 10] [25 10 180 20] [210 13 60 15] [0 0 30 25] [275 0 25 40]",
    squeezed: "0 50 100 10 implicit 168 10 | [0 0 30 10] [34 0 42 10] [80 0 20 10]",
    loose: "0 70 86 21 implicit 86 21 | [0 6 20 10] [25 0 31 21] [68 8 15 5]",
    stretched: "0 110 300 20 implicit 90 10 | [0 5 65 10] [65 5 65 10] [130 5 170 10]",
    mixed: "0 135 301 20 implicit 86 10 | [0 5 44 10] [47 5 221 10] [271 5 30 10]",
    uniform: "0 260 200 10 implicit 110 10 | [0 0 63 10] [68 0 64 10] [137 0 63 10]",
    empty: "0 280 0 0 implicit 0 0 |",
  });
});

test("a child sits in its cell as Layout.alignment says, margins around it", async ({ page }) => {
  await open(page, "layouts");
  // The last two share a baseline: 13 + 22 and 31 + 4.
  expect(await lines(page, ["aligned", "mirrored", "column", "columnLoose"])).toEqual({
    aligned:
      "0 160 300 60 implicit 105 34 | [0 0 20 10] [39 50 20 10] [114 25 50 10] [180 45 31 15] [227 13 20 30] [266 31 20 16]",
    mirrored: "0 230 200 20 implicit 77 20 | [171 5 20 10] [96 0 40 20] [28 3 30 14]",
    column: "320 0 100 200 implicit 40 87 | [0 0 20 10] [0 15 100 105] [30 125 40 30] [70 160 30 40]",
    // The last child is half as high as it is wide, and it is as wide as
    // the layout.
    columnLoose: "430 0 44 56 implicit 44 56 | [0 0 20 10] [0 12 44 20] [0 34 44 22]",
  });
});

const FLT_MAX = 3.4028234663852886e38;

const read = (page) =>
  page.evaluate(() => {
    const { row, capped, loose, empty, attached } = window.objects;
    const info = attached(capped);
    const margins = attached(loose.children[2]);
    return [
      [row.spacing, row.layoutDirection, row.uniformCellSizes],
      [info.fillWidth, info.fillHeight, info.minimumWidth, info.maximumWidth, info.maximumHeight],
      [info.preferredWidth, info.preferredHeight, info.alignment, info.margins, info.leftMargin],
      [info.horizontalStretchFactor, info.row, info.column, info.rowSpan, info.columnSpan],
      [margins.leftMargin, margins.topMargin],
      // A layout's own limits are those of what is in it.
      [attached(row).minimumWidth, attached(row).maximumWidth, attached(row).minimumHeight, attached(row).maximumHeight],
      [attached(loose).minimumWidth, attached(loose).maximumWidth, attached(loose).fillWidth],
      [attached(empty).maximumWidth, attached(empty).maximumHeight],
    ];
  });

test("Layout reads as what was set, or as Qt's defaults", async ({ page }) => {
  await open(page, "layouts");
  expect(await read(page)).toEqual([
    [5, 0, false],
    [true, false, 0, 60, Infinity],
    [40, 15, 0, 0, 0],
    [-1, 0, 0, 1, 1],
    [7, 3],
    [60, Infinity, 20, Infinity],
    [86, 86, true],
    [FLT_MAX, FLT_MAX],
  ]);
});

test("a layout is shared again when a child, what it asks for, or the layout changes", async ({ page }) => {
  await open(page, "layouts");
  await page.evaluate(() => {
    const { hidden, capped, row, squeezed, loose, stretched, mirrored, column, columnLoose, uniform, aligned, attached } =
      window.objects;
    hidden.visible = true;
    attached(capped).maximumWidth = 45;
    row.spacing = 2;
    row.height = 30;
    squeezed.width = 140;
    loose.children[1].implicitWidth = 50;
    attached(loose.children[2]).margins = 1;
    attached(stretched.children[0]).horizontalStretchFactor = 4;
    mirrored.layoutDirection = 0;
    attached(column.children[1]).fillHeight = false;
    column.width = 80;
    attached(columnLoose.children[2]).preferredWidth = 60;
    uniform.uniformCellSizes = false;
    attached(aligned.children[0]).alignment = 0x80 | 0x2;
    aligned.children[4].baselineOffset = 10;
  });
  expect(
    await lines(page, ["row", "squeezed", "loose", "stretched", "aligned", "mirrored", "column", "columnLoose", "uniform"]),
  ).toEqual({
    row: "0 0 300 30 implicit 153 25 | [0 10 20 10] [22 5 172 20] [196 8 45 15] [243 3 30 25] [275 0 25 30]",
    squeezed: "0 50 140 10 implicit 168 10 | [0 0 48 10] [52 0 64 10] [120 0 20 10]",
    loose: "0 70 103 21 implicit 103 21 | [0 6 20 10] [25 0 50 21] [87 8 15 5]",
    stretched: "0 110 300 20 implicit 90 10 | [0 5 153 10] [153 5 73 10] [226 5 74 10]",
    aligned:
      "0 160 300 60 implicit 105 30 | [14 25 20 10] [39 50 20 10] [114 25 50 10] [180 45 31 15] [227 15 20 30] [266 21 20 16]",
    mirrored: "0 230 200 20 implicit 77 20 | [4 5 20 10] [64 0 40 20] [142 3 30 14]",
    column: "320 0 80 200 implicit 40 87 | [0 5 20 10] [0 33 80 20] [20 79 40 30] [50 143 30 40]",
    columnLoose: "430 0 60 64 implicit 60 64 | [0 0 20 10] [0 12 60 20] [0 34 60 30]",
    uniform: "0 260 200 10 implicit 110 10 | [0 0 38 10] [43 0 95 10] [143 0 57 10]",
  });
  expect(await read(page)).toEqual([
    [2, 0, false],
    [true, false, 0, 45, Infinity],
    [40, 15, 0, 0, 0],
    [-1, 0, 0, 1, 1],
    [7, 1],
    [83, Infinity, 25, Infinity],
    [103, 103, true],
    [FLT_MAX, FLT_MAX],
  ]);
});

const NESTED = ["outer", "first", "fixed", "outerLoose", "inner", "tight", "tightInner"];

test("a layout in a layout fills it, and is no smaller and no bigger than its own children allow", async ({ page }) => {
  await open(page, "layouts-grid");
  expect(await lines(page, NESTED)).toEqual({
    outer: "0 0 200 120 implicit 55 48 | [0 0 200 12] [145 16 55 14] [0 34 50 10] [0 48 200 72]",
    first: "0 0 200 12 implicit 55 12 | [0 1 20 10] [25 0 175 12]",
    fixed: "145 16 55 14 implicit 55 14 | [0 2 20 10] [25 0 30 14]",
    outerLoose: "0 130 55 25 implicit 55 25 | [0 0 40 25] [45 8 10 10]",
    inner: "0 0 40 25 implicit 40 25 | [0 0 40 10] [0 15 40 10]",
    // Too narrow for what is in it: the inner layout stops at its least.
    tight: "0 170 30 10 implicit 75 10 | [0 0 25 10] [30 0 10 10]",
    tightInner: "0 0 25 10 implicit 60 10 | [0 0 25 10]",
  });
  const read = () =>
    page.evaluate(() => {
      const { first, fixed, inner, outerLoose, attached } = window.objects;
      return [
        [attached(first).fillWidth, attached(first).fillHeight, attached(fixed).fillWidth, attached(fixed).fillHeight],
        [attached(first).minimumWidth, attached(first).maximumWidth],
        [attached(first).minimumHeight, attached(first).maximumHeight],
        [attached(fixed).minimumWidth, attached(fixed).maximumWidth],
        [attached(inner).minimumWidth, attached(inner).maximumWidth, attached(inner).preferredWidth],
        [attached(outerLoose).minimumWidth, attached(outerLoose).maximumWidth],
      ];
    });
  expect(await read()).toEqual([
    [true, true, false, true],
    [25, Infinity],
    [12, 12],
    [55, 55],
    [40, Infinity, -1],
    [55, Infinity],
  ]);
  await page.evaluate(() => {
    const { kept, fixed, least, tight, attached } = window.objects;
    // The width a layout gave stays, and what the item prefers is the width
    // it had first.
    kept.width = 80;
    attached(fixed).fillWidth = true;
    attached(least).minimumWidth = 55;
    tight.width = 90;
  });
  expect(await lines(page, NESTED)).toEqual({
    outer: "0 0 200 120 implicit 55 48 | [0 0 200 12] [145 16 55 14] [0 34 50 10] [0 48 200 72]",
    first: "0 0 200 12 implicit 55 12 | [0 1 20 10] [25 0 175 12]",
    fixed: "145 16 55 14 implicit 55 14 | [0 2 20 10] [25 0 30 14]",
    outerLoose: "0 130 70 25 implicit 70 25 | [0 0 55 25] [60 8 10 10]",
    inner: "0 0 55 25 implicit 55 25 | [0 0 40 10] [0 15 55 10]",
    tight: "0 170 90 10 implicit 75 10 | [0 0 75 10] [80 0 10 10]",
    tightInner: "0 0 75 10 implicit 60 10 | [0 0 75 10]",
  });
  expect(await read()).toEqual([
    [true, true, true, true],
    [25, Infinity],
    [12, 12],
    [55, 55],
    [55, Infinity, -1],
    [70, Infinity],
  ]);
});

const GRIDS = ["grid", "down", "explicit", "gridMirrored", "even", "gridLoose"];

const readGrid = (page) =>
  page.evaluate(() => {
    const { grid, down, explicit, attached } = window.objects;
    const at = (item) => [attached(item).row, attached(item).column, attached(item).rowSpan, attached(item).columnSpan];
    return [
      [grid.columns, grid.rows, grid.flow, grid.rowSpacing, grid.columnSpacing, grid.uniformCellWidths, grid.layoutDirection],
      [down.columns, down.rows, down.flow],
      // `Layout.row` and `Layout.column` are what was set, not where the
      // grid put the item.
      [at(grid.children[1]), at(grid.children[2]), at(grid.children[3]), at(explicit.children[0]), at(explicit.children[2])],
      [attached(grid).minimumWidth, attached(grid).maximumWidth, attached(grid).minimumHeight, attached(grid).maximumHeight],
    ];
  });

test("a grid fills its cells along its flow, around those that say where they are and those that span", async ({
  page,
}) => {
  await open(page, "layouts-grid");
  expect(await lines(page, GRIDS)).toEqual({
    grid:
      "220 0 200 100 implicit 80 57 | [0 5 20 10] [86 5 114 10] [0 25 30 50] [86 32 25 12] [0 0 40 10] [185 42 15 8] [86 60 10 10] [0 85 154 10]",
    down: "220 110 79 34 implicit 79 34 | [0 1 20 10] [0 17 30 14] [37 0 10 12] [37 14 24 20] [68 3 11 7]",
    explicit: "220 160 150 40 implicit 70 40 | [103 19 20 10] [0 0 30 14] [75 2 10 10] [103 4 12 6] [0 34 14 6]",
    gridMirrored: "220 210 150 31 implicit 61 31 | [130 2 20 10] [6 0 30 14] [41 19 109 12] [0 20 10 10]",
    even: "220 260 160 60 implicit 105 49 | [0 9 20 10] [83 7 50 14] [0 36 10 22] [83 33 77 27]",
    gridLoose:
      "420 0 59 56 implicit 59 56 | [0 2 20 10] [29 0 30 14] [0 19 59 12] [0 36 24 20] [29 36 11 7] [29 48 12 8]",
  });
  expect(await readGrid(page)).toEqual([
    [3, -1, 0, 5, 5, false, 0],
    [-1, 2, 1],
    [
      [0, 0, 1, 2],
      [0, 0, 2, 1],
      [0, 0, 1, 1],
      [1, 2, 1, 1],
      [0, 1, 1, 1],
    ],
    [80, 80, 57, 57],
  ]);
});

test("a grid is filled again when its columns, its flow, its spacing or a child's cell changes", async ({ page }) => {
  await open(page, "layouts-grid");
  await page.evaluate(() => {
    const { grid, gridHidden, down, explicit, gridMirrored, even, gridLoose, attached } = window.objects;
    grid.columns = 2;
    gridHidden.visible = true;
    down.flow = 0;
    down.columns = 2;
    attached(explicit.children[0]).column = 0;
    explicit.width = 100;
    gridMirrored.layoutDirection = 0;
    even.uniformCellWidths = false;
    even.rowSpacing = 0;
    attached(gridLoose.children[3]).rowSpan = 1;
    gridLoose.columnSpacing = 1;
  });
  expect(await lines(page, GRIDS)).toEqual({
    grid:
      "220 0 200 100 implicit 75 87 | [0 1 20 10] [0 18 200 10] [0 34 30 32] [89 36 25 12] [89 55 40 10] [69 75 15 8] [89 72 10 10] [0 89 200 10]",
    down: "220 110 57 45 implicit 57 45 | [0 2 20 10] [27 0 30 14] [0 20 10 12] [27 16 24 20] [0 38 11 7]",
    explicit: "220 160 100 40 implicit 62 40 | [0 19 20 10] [0 0 30 14] [57 2 10 10] [79 4 12 6] [0 34 14 6]",
    gridMirrored: "220 210 150 31 implicit 61 31 | [0 2 20 10] [120 0 30 14] [0 19 109 12] [140 20 10 10]",
    even: "220 260 160 60 implicit 75 44 | [0 10 20 10] [25 8 50 14] [0 34 10 22] [25 30 135 30]",
    gridLoose:
      "420 0 55 69 implicit 55 69 | [0 2 20 10] [25 0 30 14] [0 19 55 12] [0 36 24 20] [25 43 11 7] [0 61 12 8]",
  });
  expect(await readGrid(page)).toEqual([
    [2, -1, 0, 5, 5, false, 0],
    [2, 2, 0],
    [
      [0, 0, 1, 2],
      [0, 0, 2, 1],
      [0, 0, 1, 1],
      [1, 0, 1, 1],
      [0, 1, 1, 1],
    ],
    [75, 75, 87, 87],
  ]);
});

const STACKS = ["stack", "stackLoose", "holder", "held", "none"];

// Which children of a stack are shown, and what `StackLayout` says of each.
const seen = (page, name) =>
  page.evaluate((name) => {
    const { [name]: layout, attached, stacked } = window.objects;
    const children = layout.children.map((child) => {
      const info = stacked(child);
      return [child.visible, info.index, info.isCurrentItem, info.layout === layout].join(" ");
    });
    const info = attached(layout);
    const limits = [info.minimumWidth, info.maximumWidth, info.minimumHeight, info.maximumHeight, info.fillWidth];
    return `${layout.count} ${layout.currentIndex} | ${children.join(" | ")} | ${limits.join(" ")}`;
  }, name);

test("a stack shows its current child, as big as itself within what the child allows", async ({ page }) => {
  await open(page, "layouts-stack");
  expect(await lines(page, STACKS)).toEqual({
    stack: "0 0 120 80 implicit 50 90 | [0 0 120 80] [0 0 50 10] [0 0 40 25] [0 0 20 10]",
    stackLoose: "0 100 50 20 implicit 50 20 | [0 0 30 20] [0 0 50 20]",
    holder: "200 0 100 100 implicit 50 35 | [0 0 100 10] [0 15 100 85]",
    held: "0 15 100 85 implicit 50 20 | [0 0 100 85] [0 0 50 10]",
    none: "0 300 0 0 implicit 0 0 |",
  });
  expect(await seen(page, "stack")).toBe(
    "4 0 | true 0 true true | false 1 false true | false 2 false true | false 3 false true | 40 Infinity 90 Infinity true",
  );
  expect(await seen(page, "stackLoose")).toBe("2 1 | false 0 false true | true 1 true true | 12 Infinity 0 Infinity true");
  expect(await seen(page, "held")).toBe("2 0 | true 0 true true | false 1 false true | 0 Infinity 0 Infinity true");
  expect(await seen(page, "none")).toBe("0 -1 |  | 0 Infinity 0 Infinity true");
  const read = await page.evaluate(() => {
    const { stack, capped, outside, stacked } = window.objects;
    const info = stacked(outside);
    return [stack.itemAt(1) === capped, stack.itemAt(9), info.index, info.isCurrentItem, info.layout];
  });
  expect(read).toEqual([true, null, -1, false, null]);
  // What is not shown is not drawn.
  const drawn = await page.evaluate(() =>
    window.objects.stack.children.map((child) => getComputedStyle(child.$node).display !== "none"),
  );
  expect(drawn).toEqual([true, false, false, false]);
});

test("a stack shows another child when its current index changes", async ({ page }) => {
  await open(page, "layouts-stack");
  await page.evaluate(() => {
    const { stack, stackLoose, held } = window.objects;
    stack.currentIndex = 1;
    stackLoose.currentIndex = 0;
    held.currentIndex = 1;
  });
  // The one that was shown keeps the size it had.
  expect(await lines(page, ["stack", "stackLoose", "held"])).toEqual({
    stack: "0 0 120 80 implicit 50 90 | [0 0 120 80] [0 0 60 90] [0 0 40 25] [0 0 20 10]",
    stackLoose: "0 100 50 20 implicit 50 20 | [0 0 50 20] [0 0 50 20]",
    held: "0 15 100 85 implicit 50 20 | [0 0 100 85] [0 0 100 85]",
  });
  expect(await seen(page, "stack")).toBe(
    "4 1 | false 0 false true | true 1 true true | false 2 false true | false 3 false true | 40 Infinity 90 Infinity true",
  );
  expect(await seen(page, "stackLoose")).toBe("2 0 | true 0 true true | false 1 false true | 12 Infinity 0 Infinity true");
  expect(await seen(page, "held")).toBe("2 1 | false 0 false true | true 1 true true | 0 Infinity 0 Infinity true");

  // One that does not fill is as big as it prefers.
  await page.evaluate(() => {
    const { stack, holder } = window.objects;
    stack.currentIndex = 2;
    stack.width = 150;
    holder.height = 60;
  });
  expect(await lines(page, ["stack", "holder", "held"])).toEqual({
    stack: "0 0 150 80 implicit 50 90 | [0 0 120 80] [0 0 60 90] [0 0 40 25] [0 0 20 10]",
    holder: "200 0 100 60 implicit 50 35 | [0 0 100 10] [0 15 100 45]",
    held: "0 15 100 45 implicit 50 20 | [0 0 100 85] [0 0 100 45]",
  });

  await page.evaluate(() => {
    const { stack, fixed } = window.objects;
    stack.currentIndex = 3;
    fixed.implicitWidth = 200;
  });
  expect(await dump(page, "stack")).toBe("0 0 150 80 implicit 200 90 | [0 0 120 80] [0 0 60 90] [0 0 40 25] [0 0 150 80]");
  expect(await seen(page, "stack")).toBe(
    "4 3 | false 0 false true | false 1 false true | false 2 false true | true 3 true true | 200 Infinity 90 Infinity true",
  );

  await page.evaluate(() => {
    window.objects.stack.currentIndex = -1;
  });
  expect(await dump(page, "stack")).toBe("0 0 150 80 implicit 200 90 | [0 0 120 80] [0 0 60 90] [0 0 40 25] [0 0 150 80]");
  expect(await seen(page, "stack")).toBe(
    "4 -1 | false 0 false true | false 1 false true | false 2 false true | false 3 false true | 200 Infinity 90 Infinity true",
  );

  await page.evaluate(() => {
    const { stack, capped, attached } = window.objects;
    stack.currentIndex = 0;
    attached(capped).minimumHeight = 5;
  });
  expect(await dump(page, "stack")).toBe("0 0 150 80 implicit 200 25 | [0 0 150 80] [0 0 60 90] [0 0 40 25] [0 0 150 80]");
  expect(await seen(page, "stack")).toBe(
    "4 0 | true 0 true true | false 1 false true | false 2 false true | false 3 false true | 200 Infinity 25 Infinity true",
  );
});

const PROXIES = ["wide", "narrow", "pa1", "pb1", "pa2", "pb2"];

// Where the two shared items are: the proxy that has each, whether it is
// shown, its place in the root as the page draws it, and its own geometry.
const shared = (page) =>
  page.evaluate(() => {
    const { root, a, b, pa1, pb1, pa2, pb2, pa3 } = window.objects;
    const all = { root, a, b, pa1, pb1, pa2, pb2, pa3 };
    const name = (object) => Object.keys(all).find((key) => all[key] === object) ?? String(object);
    const origin = root.$node.getBoundingClientRect();
    const at = (item) => {
      if (!item.$node.isConnected) return "0 0";
      const box = item.$node.getBoundingClientRect();
      return `${box.x - origin.x} ${box.y - origin.y}`;
    };
    const g = (item) => [item.x, item.y, item.width, item.height].join(" ");
    const where = (item) => `${name(item.parent)} ${item.visible} ${at(item)} ${g(item)}`;
    const targets = [pa1, pb1, pa2, pb2].map((proxy) => name(proxy.effectiveTarget()));
    return [`a ${where(a)} b ${where(b)}`, `targets ${targets.join(" ")} root ${root.children.length}`];
  });

const readProxies = (page) =>
  page.evaluate(() => {
    const { a, pa1, pb1, pa2, pb2, attached } = window.objects;
    return [
      [attached(pa1).fillWidth, attached(pb1).alignment, attached(pb1).margins],
      [attached(pb2).alignment, attached(pb2).margins, attached(pa2).fillWidth, attached(pa2).fillHeight],
      [pa1.implicitWidth, pb2.implicitHeight, pa1.target === a],
    ];
  });

test("a proxy stands in a layout for its target, asking what the target asks unless it asks itself", async ({
  page,
}) => {
  await open(page, "layouts-proxy");
  // The layout that is not shown lays its proxies out all the same.
  expect(await lines(page, PROXIES)).toEqual({
    wide: "0 0 200 40 implicit 81 20 | [0 10 149 20] [157 27 40 10]",
    narrow: "0 60 80 100 implicit 46 41 | [37 3 40 10] [0 21 80 79]",
    pa1: "0 10 149 20 implicit 30 20 | [0 0 149 20]",
    pb1: "157 27 40 10 implicit 40 10 | [0 0 40 10]",
    pa2: "0 21 80 79 implicit 30 20 |",
    pb2: "37 3 40 10 implicit 40 10 |",
  });
  expect(await shared(page)).toEqual([
    "a pa1 true 0 10 0 0 149 20 b pb1 true 157 27 0 0 40 10",
    "targets a b null null root 2",
  ]);
  expect(await readProxies(page)).toEqual([
    [true, 64, 3],
    [2, 3, true, true],
    [30, 10, true],
  ]);
});

test("the target goes to the proxy that is shown, and stays with the one that has it", async ({ page }) => {
  await open(page, "layouts-proxy");
  const show = (wide, narrow) =>
    page.evaluate(
      ([wide, narrow]) => {
        if (wide !== null) window.objects.wide.visible = wide;
        if (narrow !== null) window.objects.narrow.visible = narrow;
      },
      [wide, narrow],
    );
  await show(false, true);
  expect(await lines(page, ["pa1", "pb1", "pa2", "pb2"])).toEqual({
    pa1: "0 10 149 20 implicit 30 20 |",
    pb1: "157 27 40 10 implicit 40 10 |",
    pa2: "0 21 80 79 implicit 30 20 | [0 0 80 79]",
    pb2: "37 3 40 10 implicit 40 10 | [0 0 40 10]",
  });
  expect(await shared(page)).toEqual([
    "a pa2 true 0 81 0 0 80 79 b pb2 true 37 63 0 0 40 10",
    "targets null null a b root 2",
  ]);

  await page.evaluate(() => {
    window.objects.narrow.visible = false;
    window.objects.wide.visible = true;
  });
  expect(await shared(page)).toEqual([
    "a pa1 true 0 10 0 0 149 20 b pb1 true 157 27 0 0 40 10",
    "targets a b null null root 2",
  ]);

  // Both are shown: the one that has the target keeps it.
  await show(null, true);
  expect(await shared(page)).toEqual([
    "a pa1 true 0 10 0 0 149 20 b pb1 true 157 27 0 0 40 10",
    "targets a b null null root 2",
  ]);

  // What the target asks for reaches both layouts.
  await page.evaluate(() => {
    const { wide, a, b, attached } = window.objects;
    wide.visible = false;
    a.implicitWidth = 50;
    attached(b).margins = 6;
  });
  expect(await lines(page, PROXIES)).toEqual({
    wide: "0 0 200 40 implicit 107 22 | [0 10 143 20] [154 24 40 10]",
    narrow: "0 60 80 100 implicit 52 47 | [34 6 40 10] [0 27 80 73]",
    pa1: "0 10 143 20 implicit 50 20 |",
    pb1: "154 24 40 10 implicit 40 10 |",
    pa2: "0 27 80 73 implicit 50 20 | [0 0 80 73]",
    pb2: "34 6 40 10 implicit 40 10 | [0 0 40 10]",
  });
  expect(await shared(page)).toEqual([
    "a pa2 true 0 87 0 0 80 73 b pb2 true 34 66 0 0 40 10",
    "targets null null a b root 2",
  ]);
  expect(await readProxies(page)).toEqual([
    [true, 64, 6],
    [2, 6, true, true],
    [50, 10, true],
  ]);

  // With no proxy shown the target is in nothing, and hidden.
  await show(null, false);
  expect(await shared(page)).toEqual([
    "a null false 0 0 0 0 80 73 b null false 0 0 0 0 40 10",
    "targets null null null null root 2",
  ]);

  await page.evaluate(() => {
    window.objects.wide.visible = true;
    window.objects.wide.width = 240;
  });
  expect(await lines(page, ["wide", "pa1", "pb1"])).toEqual({
    wide: "0 0 240 40 implicit 107 22 | [0 10 183 20] [194 24 40 10]",
    pa1: "0 10 183 20 implicit 50 20 | [0 0 183 20]",
    pb1: "194 24 40 10 implicit 40 10 | [0 0 40 10]",
  });
  expect(await shared(page)).toEqual([
    "a pa1 true 0 10 0 0 183 20 b pb1 true 194 24 0 0 40 10",
    "targets a b null null root 2",
  ]);
});

test("when the proxy that has the target is destroyed, or takes another, the next one shown has it", async ({
  page,
}) => {
  await open(page, "layouts-proxy");
  const step = (run) => page.evaluate(run).then(() => shared(page));
  expect(await step(() => (window.objects.wide.visible = false))).toEqual([
    "a null false 0 0 0 0 149 20 b null false 0 0 0 0 40 10",
    "targets null null null null root 2",
  ]);
  // What a Loader would load: a third layout, with a third proxy for `a`.
  expect(await step(() => (window.unload = window.objects.load()))).toEqual([
    "a pa3 true 0 205 0 0 60 20 b null false 0 0 0 0 40 10",
    "targets null null null null root 3",
  ]);
  expect(await step(() => (window.objects.narrow.visible = true))).toEqual([
    "a pa3 true 0 205 0 0 60 20 b pb2 true 37 63 0 0 40 10",
    "targets null null null b root 3",
  ]);
  expect(await step(() => window.unload())).toEqual([
    "a pa2 true 0 81 0 0 80 79 b pb2 true 37 63 0 0 40 10",
    "targets null null a b root 2",
  ]);

  // Each of the two proxies takes the other's target.
  await page.evaluate(() => {
    const { a, b, pa2, pb2 } = window.objects;
    pa2.target = b;
    pb2.target = a;
  });
  const has = await page.evaluate(() => {
    const { a, b, pa2, pb2 } = window.objects;
    return [a.parent === pb2, b.parent === pa2, pb2.effectiveTarget() === a, pa2.effectiveTarget() === b];
  });
  expect(has).toEqual([true, true, true, true]);
  expect(await dump(page, "pb2")).toBe("0 0 80 20 implicit 30 20 | [0 0 80 20]");
});
