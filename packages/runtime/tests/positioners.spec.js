import { dump } from "./dump.js";
import { expect, open, test } from "./open.js";

// Every line a test expects is what Qt 6.11 prints for the QML at the top of
// the scene (see dump.js).

test("a row puts its children side by side, inside its padding", async ({ page }) => {
  await open(page, "positioners");
  // The hidden child and the one with no width are left out, and keep the
  // place they had.
  expect(await dump(page, "row")).toBe(
    "0 0 86 31 implicit 86 31 | [10 3 20 10] [34 5 30 25] [0 0 30 25] [0 0 0 25] [68 3 15 5]",
  );
});

test("a row from right to left starts at its right edge, or at the end of its children", async ({ page }) => {
  await open(page, "positioners");
  expect(await dump(page, "mirrored")).toBe("0 40 200 20 implicit 62 20 | [173 0 20 10] [138 0 30 20]");
  expect(await dump(page, "mirroredLoose")).toBe("0 70 57 20 implicit 57 20 | [37 0 20 10] [2 0 30 20]");
});

test("a column stacks its children, a repeater's among them, and leaves their x alone", async ({ page }) => {
  await open(page, "positioners");
  expect(await dump(page, "column")).toBe(
    "250 0 50 66 implicit 50 66 | [8 5 20 10] [5 17 40 20] [5 39 10 8] [5 49 10 8] [5 59 12 6]",
  );
  expect(await dump(page, "plain")).toBe("320 0 40 30 implicit 40 30 | [3 0 20 10] [0 10 40 20]");
});

test("a grid sizes each column and row to its largest item and aligns the others in the cell", async ({ page }) => {
  await open(page, "positioners");
  expect(await dump(page, "grid")).toBe(
    "0 100 68 40 implicit 68 40 | [2 4 20 10] [26 0 30 14] [58 2 10 12] [0 20 24 20] [35.5 33 11 7]",
  );
  expect(await dump(page, "down")).toBe(
    "0 150 73 34 implicit 73 34 | [11 2 20 10] [1 16 30 14] [48 1 10 12] [34 13 24 20] [61 3.5 11 7]",
  );
  expect(await dump(page, "gridMirrored")).toBe(
    "0 200 150.7 30 implicit 57 30 | [127 0 20 10] [93 0 30 14] [137 18 10 12]",
  );
  // With neither rows nor columns, four columns.
  expect(await dump(page, "four")).toBe("0 240 30 10 implicit 30 10 | [0 0 5 5] [9 0 6 5] [15 0 7 5] [22 0 8 5] [0 5 9 5]");
  const read = await page.evaluate(() => {
    const { four, gridMirrored, row } = window.objects;
    return [
      four.rows,
      four.columns,
      four.rowSpacing,
      four.columnSpacing,
      four.flow,
      four.horizontalItemAlignment,
      four.verticalItemAlignment,
      gridMirrored.effectiveHorizontalItemAlignment,
      row.effectiveLayoutDirection,
    ];
  });
  expect(read).toEqual([-1, -1, -1, -1, 0, 1, 32, 2, 0]);
});

test("a flow wraps at its width, or at its height when it runs downwards", async ({ page }) => {
  await open(page, "positioners");
  expect(await dump(page, "flow")).toBe(
    "200 100 100 54 implicit 99 54 | [2 2 40 10] [47 2 40 20] [2 27 40 15] [2 47 70 5] [77 47 20 5]",
  );
  expect(await dump(page, "flowDown")).toBe(
    "200 170 86 40 implicit 86 33 | [0 0 40 10] [0 13 20 20] [43 0 30 15] [76 0 10 30]",
  );
  expect(await dump(page, "flowMirrored")).toBe(
    "200 220 100 40 implicit 89 40 | [60 0 40 10] [15 0 40 20] [60 25 40 15]",
  );
  expect(await dump(page, "flowLoose")).toBe("200 260 85 20 implicit 85 20 | [0 0 40 10] [45 0 40 20]");
});

test("Positioner.index counts the children that were placed", async ({ page }) => {
  await open(page, "positioners");
  const read = () =>
    page.evaluate(() => {
      const { row, last, attached } = window.objects;
      const [first, , hidden] = row.children;
      return [
        attached(last).index,
        attached(last).isFirstItem,
        attached(last).isLastItem,
        attached(hidden).index,
        attached(hidden).isLastItem,
        attached(first).isFirstItem,
      ];
    });
  expect(await read()).toEqual([2, false, true, -1, false, true]);
  await page.evaluate(() => {
    const { row, last } = window.objects;
    row.children[2].visible = true;
    last.width = 0;
  });
  expect(await read()).toEqual([-1, false, false, 2, true, true]);
});

test("children are placed again when one of them, or the positioner, changes", async ({ page }) => {
  await open(page, "positioners");
  expect(await page.evaluate(() => window.objects.log)).toEqual(["row"]);
  await page.evaluate(() => {
    const { row, last, column, flow, grid } = window.objects;
    last.width = 0;
    row.children[2].visible = true;
    row.spacing = 1;
    column.padding = 0;
    column.children[0].height = 30;
    flow.width = 60;
    grid.columns = 2;
  });
  expect(await dump(page, "row")).toBe(
    "0 0 95 31 implicit 95 31 | [10 3 20 10] [31 5 30 25] [62 3 30 25] [0 0 0 25] [68 3 0 5]",
  );
  expect(await dump(page, "column")).toBe(
    "250 0 40 81 implicit 40 81 | [3 0 20 30] [0 32 40 20] [0 54 10 8] [0 64 10 8] [0 74 12 6]",
  );
  expect(await dump(page, "flow")).toBe(
    "200 100 60 79 implicit 74 79 | [2 2 40 10] [2 17 40 20] [2 42 40 15] [2 62 70 5] [2 72 20 5]",
  );
  expect(await dump(page, "grid")).toBe(
    "0 100 52 53 implicit 52 53 | [0 4 20 10] [22 0 30 14] [5 28 10 12] [25 20 24 20] [4.5 46 11 7]",
  );
  // Once for each change that moved something: Qt, which waits for the next
  // frame, would have said it once.
  expect(await page.evaluate(() => window.objects.log)).toEqual(["row", "row", "row", "row"]);
});

test("a child a positioner leaves out is not drawn, with what is in it", async ({ page }) => {
  await open(page, "positioners");
  const hidden = () =>
    page.evaluate(() => window.objects.row.children.map((child) => getComputedStyle(child.$node).visibility));
  expect(await hidden()).toEqual(["visible", "visible", "hidden", "hidden", "visible"]);
  await page.evaluate(() => {
    const { row, last } = window.objects;
    row.children[2].visible = true;
    row.children[3].width = 8;
    last.height = 0;
  });
  expect(await hidden()).toEqual(["visible", "visible", "visible", "visible", "hidden"]);
});

test("a positioner in a positioner is as big as what it placed, and a child may be as wide as its column", async ({
  page,
}) => {
  await open(page, "positioners-nested");
  const beside = () =>
    page.evaluate(() => {
      const { x, y, width, height } = window.objects.beside;
      return [x, y, width, height];
    });
  // The last child is as wide as the column, which is as wide as its widest
  // child: Qt gets there at its second polish, and these are its numbers then.
  expect(await dump(page, "outer")).toBe(
    "159 119 82 62 implicit 82 62 | [0 0 82 20] [31 26 20 10] [0 42 70 10] [0 58 82 4]",
  );
  expect(await dump(page, "first")).toBe("0 0 82 20 implicit 82 20 | [0 0 30 20] [32 0 50 10]");
  expect(await dump(page, "second")).toBe("0 42 70 10 implicit 70 10 | [0 0 10 10] [10 0 60 10]");
  expect(await dump(page, "inner")).toBe("10 0 60 10 implicit 60 10 | [0 0 60 5] [0 5 15 5]");
  expect(await beside()).toEqual([241, 119, 82, 62]);
  await page.evaluate(() => {
    window.objects.grows.width = 100;
    window.objects.grows.height = 9;
  });
  expect(await dump(page, "outer")).toBe(
    "145 117 110 66 implicit 110 66 | [0 0 82 20] [45 26 20 10] [0 42 110 14] [0 62 110 4]",
  );
  expect(await dump(page, "second")).toBe("0 42 110 14 implicit 110 14 | [0 0 10 10] [10 0 100 14]");
  expect(await dump(page, "inner")).toBe("10 0 100 14 implicit 100 14 | [0 0 60 5] [0 5 100 9]");
  expect(await beside()).toEqual([255, 117, 82, 66]);
});
