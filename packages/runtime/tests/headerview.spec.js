// What is expected here is what Qt 6.11 answers for the same QML, run with
// `qml6` and asked after each step.
import { expect, open, test } from "./open.js";

// What `read()` answers at the start, part by part.
const START = {
  hh: [1, 6, 1, 1, "display", 0, 0, true],
  hhCells: [[0, 0, 50, 18, "1", 1, true, true, 1, false, false, false], [1, 52, 60, 18, "2", 2, true, true, 1, false, false, false], [2, 114, 70, 18, "3", 3, true, true, 1, false, false, false], [3, 186, 80, 18, "4", 4, true, true, 1, false, false, false]],
  hhSize: [200, 400, 18, 18],
  vh: [20, 1, 2, 2, "display", 0, 0, true],
  vhCells: [[0, 0, 20, 34, "1", 1, true, 2], [1, 21, 24, 34, "2", 2, true, 2], [2, 46, 20, 34, "3", 3, true, 2], [3, 67, 24, 34, "4", 4, true, 2], [4, 92, 20, 34, "5", 5, true, 2], [5, 113, 24, 34, "6", 6, true, 2]],
  vhSize: [120, 459, 34, 34],
  tv: [0, 0, 0, 3, 0, 5],
  listed: [1, 3, 1, 1, "display", 0, 0, true],
  listedCells: [[0, 0, 0, 40, "one", 0, 0, 0], [1, 0, 40, 40, "two", 1, 0, 1], [2, 0, 80, 40, "three", 2, 0, 2]],
  values: [2, 1, 2, 2, "", 0, 0, true],
  valuesCells: [[0, 0, 0, 15, "x", 0, 0, 0], [0, 1, 15, 15, "y", 1, 0, 1]],
  counted: [3, 1, 2, 2, "", 0, 0, true],
  countedCells: [[0, 0, 0, 0, 0], [0, 1, 15, 1, 1], [0, 2, 30, 2, 2]],
};

// Each step, and the parts it changes.
const STEPS = [
  // // The headers go where the table goes. tv.contentX = 90
  {
    hh: [1, 6, 1, 1, "display", 90, 0, true],
    hhCells: [[1, 52, 60, 18, "2", 2, true, true, 1, false, false, false], [2, 114, 70, 18, "3", 3, true, true, 1, false, false, false], [3, 186, 80, 18, "4", 4, true, true, 1, false, false, false], [4, 268, 90, 18, "5", 5, true, true, 1, false, false, false]],
    tv: [90, 0, 1, 4, 0, 5],
  },
  // tv.contentY = 70
  {
    vh: [20, 1, 2, 2, "display", 0, 70, true],
    vhCells: [[3, 67, 24, 34, "4", 4, true, 2], [4, 92, 20, 34, "5", 5, true, 2], [5, 113, 24, 34, "6", 6, true, 2], [6, 138, 20, 34, "7", 7, true, 2], [7, 159, 24, 34, "8", 8, true, 2], [8, 184, 20, 34, "9", 9, true, 2]],
    tv: [90, 70, 1, 4, 3, 8],
  },
  // // And the table where a header goes. hh.contentX = 30
  {
    hh: [1, 6, 1, 1, "display", 30, 0, true],
    hhCells: [[0, 0, 50, 18, "1", 1, true, true, 1, false, false, false], [1, 52, 60, 18, "2", 2, true, true, 1, false, false, false], [2, 114, 70, 18, "3", 3, true, true, 1, false, false, false], [3, 186, 80, 18, "4", 4, true, true, 1, false, false, false]],
    tv: [30, 70, 0, 3, 3, 8],
  },
  // vh.contentY = 10
  {
    vh: [20, 1, 2, 2, "display", 0, 10, true],
    vhCells: [[0, 0, 20, 34, "1", 1, true, 2], [1, 21, 24, 34, "2", 2, true, 2], [2, 46, 20, 34, "3", 3, true, 2], [3, 67, 24, 34, "4", 4, true, 2], [4, 92, 20, 34, "5", 5, true, 2], [5, 113, 24, 34, "6", 6, true, 2]],
    tv: [30, 10, 0, 3, 0, 5],
  },
  // tv.setColumnWidth(1, 80)
  {
    hhCells: [[0, 0, 50, 18, "1", 1, true, true, 1, false, false, false], [1, 52, 80, 18, "2", 2, true, true, 1, false, false, false], [2, 134, 70, 18, "3", 3, true, true, 1, false, false, false], [3, 206, 80, 18, "4", 4, true, true, 1, false, false, false]],
    hhSize: [200, 430, 18, 18],
  },
  // grid.removeRow(0, 17)
  {
    vh: [3, 1, 2, 2, "display", 0, 10, true],
    vhCells: [[0, 0, 20, 34, "1", 1, true, 2], [1, 21, 24, 34, "2", 2, true, 2], [2, 46, 20, 34, "3", 3, true, 2]],
    vhSize: [120, 66, 34, 34],
    tv: [30, 10, 0, 3, 0, 2],
  },
  // names.append({ display: "four" })
  {
    listed: [1, 4, 1, 1, "display", 0, 0, true],
    listedCells: [[0, 0, 0, 40, "one", 0, 0, 0], [1, 0, 40, 40, "two", 1, 0, 1], [2, 0, 80, 40, "three", 2, 0, 2], [3, 0, 120, 40, "four", 3, 0, 3]],
  },
  // names.remove(0)
  {
    listed: [1, 3, 1, 1, "display", 0, 0, true],
    listedCells: [[0, 0, 0, 40, "two", 0, 0, 0], [1, 0, 40, 40, "three", 1, 0, 1], [2, 0, 80, 40, "four", 2, 0, 2]],
  },
  // tv.contentX = 0
  {
    hh: [1, 6, 1, 1, "display", 0, 0, true],
    hhCells: [[0, 0, 50, 18, "1", 1, true, true, 1, false, false, false], [1, 52, 80, 18, "2", 2, true, true, 1, false, false, false], [2, 134, 70, 18, "3", 3, true, true, 1, false, false, false]],
    tv: [0, 10, 0, 2, 0, 2],
  },
  // // A header's own selection model is not the table's. tv.selectionModel.select(tv.index(0, 1),
  // ItemSelectionModel.Select)
  {},
  // grid.appendRow(grid.made(30))
  {
    vh: [4, 1, 2, 2, "display", 0, 10, true],
    vhCells: [[0, 0, 20, 34, "1", 1, true, 2], [1, 21, 24, 34, "2", 2, true, 2], [2, 46, 20, 34, "3", 3, true, 2], [3, 67, 24, 34, "4", 4, true, 2]],
    vhSize: [120, 91, 34, 34],
    tv: [0, 10, 0, 2, 0, 3],
  },
  // values.model = ["p", "q", "r"]
  {
    values: [3, 1, 2, 2, "", 0, 0, true],
    valuesCells: [[0, 0, 0, 15, "p", 0, 0, 0], [0, 1, 15, 15, "q", 1, 0, 1], [0, 2, 30, 15, "r", 2, 0, 2]],
  },
  // counted.model = 5
  {
    counted: [5, 1, 2, 2, "", 0, 0, true],
    countedCells: [[0, 0, 0, 0, 0], [0, 1, 15, 1, 1], [0, 2, 30, 2, 2], [0, 3, 45, 3, 3], [0, 4, 60, 4, 4]],
  },
  // // As an application fills a header of its own. names.clear()
  {
    listed: [1, 0, 1, 1, "display", 0, 0, true],
    listedCells: [],
  },
  // names.append({ display: "z" })
  {
    listed: [1, 1, 1, 1, "display", 0, 0, true],
    listedCells: [[0, 0, 0, 40, "z", 0, 0, 0]],
  },
];

test("Header views follow a table and lay out a list along themselves", async ({ page }) => {
  await open(page, "headerview");
  const read = () => page.evaluate(() => window.scene.read());
  let expected = START;
  expect(await read()).toEqual(expected);
  for (const [index, changed] of STEPS.entries()) {
    await page.evaluate((index) => {
      window.scene.step(index);
      window.flush();
    }, index);
    expected = { ...expected, ...changed };
    expect(await read(), `step ${index}`).toEqual(expected);
  }
});
