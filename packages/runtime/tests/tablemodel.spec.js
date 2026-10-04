// What is expected here is what Qt 6.11 answers for the same QML, run with
// `qml6` and asked after each step.
import { test as plain } from "@playwright/test";
import { expect, open, test } from "./open.js";

// What `read()` answers at the start, part by part.
const START = {
  size: [3, 2, 3, 2],
  rows: "a1 b2 c3",
  cells: [[0, 0, "a", "a", 0], [0, 1, 1, "costs 1", 0], [1, 0, "b", "b", 20], [1, 1, 2, "costs 2", 20], [2, 0, "c", "c", 40], [2, 1, 3, "costs 3", 40]],
  heard: ["reset"],
  told: [0, 0],
  late: [0, 1, 0, 1, ""],
  lateCells: [],
  asked: ["a", 2, "costs 2", null, "costs 2", "b", "b"],
  indexes: [true, false, false, 0, 1, 35, 2],
};

// Each step, and the parts it changes.
const STEPS = [
  // tm.appendRow({ name: "d", cost: 4 })
  {
    size: [4, 2, 4, 2],
    rows: "a1 b2 c3 d4",
    cells: [[0, 0, "a", "a", 0], [0, 1, 1, "costs 1", 0], [1, 0, "b", "b", 20], [1, 1, 2, "costs 2", 20], [2, 0, "c", "c", 40], [2, 1, 3, "costs 3", 40], [3, 0, "d", "d", 60], [3, 1, 4, "costs 4", 60]],
    heard: ["inserted 3 3"],
    told: [1, 1],
  },
  // tm.insertRow(1, { name: "e", cost: 5 })
  {
    size: [5, 2, 5, 2],
    rows: "a1 e5 b2 c3 d4",
    cells: [[0, 0, "a", "a", 0], [0, 1, 1, "costs 1", 0], [1, 0, "e", "e", 20], [1, 1, 5, "costs 5", 20], [2, 0, "b", "b", 40], [2, 1, 2, "costs 2", 40], [3, 0, "c", "c", 60], [3, 1, 3, "costs 3", 60], [4, 0, "d", "d", 80], [4, 1, 4, "costs 4", 80]],
    heard: ["inserted 1 1"],
    asked: ["a", 5, "costs 5", null, "costs 5", "e", "e"],
  },
  // tm.removeRow(0)
  {
    size: [4, 2, 4, 2],
    rows: "e5 b2 c3 d4",
    cells: [[0, 0, "e", "e", 0], [0, 1, 5, "costs 5", 0], [1, 0, "b", "b", 20], [1, 1, 2, "costs 2", 20], [2, 0, "c", "c", 40], [2, 1, 3, "costs 3", 40], [3, 0, "d", "d", 60], [3, 1, 4, "costs 4", 60]],
    heard: ["removed 0 0"],
    asked: ["e", 2, "costs 2", null, "costs 2", "b", "b"],
  },
  // tm.moveRow(0, 2)
  {
    rows: "b2 c3 e5 d4",
    cells: [[0, 0, "b", "b", 0], [0, 1, 2, "costs 2", 0], [1, 0, "c", "c", 20], [1, 1, 3, "costs 3", 20], [2, 0, "e", "e", 40], [2, 1, 5, "costs 5", 40], [3, 0, "d", "d", 60], [3, 1, 4, "costs 4", 60]],
    heard: ["moved 0 0 3"],
    told: [1, 0],
    asked: ["b", 3, "costs 3", null, "costs 3", "c", "c"],
  },
  // tm.moveRow(2, 0, 2)
  {
    rows: "e5 d4 b2 c3",
    cells: [[0, 0, "e", "e", 0], [0, 1, 5, "costs 5", 0], [1, 0, "d", "d", 20], [1, 1, 4, "costs 4", 20], [2, 0, "b", "b", 40], [2, 1, 2, "costs 2", 40], [3, 0, "c", "c", 60], [3, 1, 3, "costs 3", 60]],
    heard: ["moved 2 3 0"],
    asked: ["e", 4, "costs 4", null, "costs 4", "d", "d"],
  },
  // tm.setRow(1, { name: "f", cost: 6 })
  {
    rows: "e5 f6 b2 c3",
    cells: [[0, 0, "e", "e", 0], [0, 1, 5, "costs 5", 0], [1, 0, "f", "f", 20], [1, 1, 6, "costs 6", 20], [2, 0, "b", "b", 40], [2, 1, 2, "costs 2", 40], [3, 0, "c", "c", 60], [3, 1, 3, "costs 3", 60]],
    heard: ["data 1,0 1,1 "],
    asked: ["e", 6, "costs 6", null, "costs 6", "f", "f"],
  },
  // tm.setRow(tm.rowCount, { name: "g", cost: 7 })
  {
    size: [5, 2, 5, 2],
    rows: "e5 f6 b2 c3 g7",
    cells: [[0, 0, "e", "e", 0], [0, 1, 5, "costs 5", 0], [1, 0, "f", "f", 20], [1, 1, 6, "costs 6", 20], [2, 0, "b", "b", 40], [2, 1, 2, "costs 2", 40], [3, 0, "c", "c", 60], [3, 1, 3, "costs 3", 60], [4, 0, "g", "g", 80], [4, 1, 7, "costs 7", 80]],
    heard: ["inserted 4 4"],
    told: [1, 1],
  },
  // tm.setData(tm.index(0, 0), "h", "edit")
  {
    rows: "h5 f6 b2 c3 g7",
    cells: [[0, 0, "e", "h", 0], [0, 1, 5, "costs 5", 0], [1, 0, "f", "f", 20], [1, 1, 6, "costs 6", 20], [2, 0, "b", "b", 40], [2, 1, 2, "costs 2", 40], [3, 0, "c", "c", 60], [3, 1, 3, "costs 3", 60], [4, 0, "g", "g", 80], [4, 1, 7, "costs 7", 80]],
    heard: ["data 0,0 0,0 2"],
    told: [1, 0],
    asked: ["h", 6, "costs 6", null, "costs 6", "f", "f"],
  },
  // tm.setData(tm.index(0, 1), 8, "display")
  {
    rows: "h8 f6 b2 c3 g7",
    cells: [[0, 0, "e", "h", 0], [0, 1, 8, "costs 8", 0], [1, 0, "f", "f", 20], [1, 1, 6, "costs 6", 20], [2, 0, "b", "b", 40], [2, 1, 2, "costs 2", 40], [3, 0, "c", "c", 60], [3, 1, 3, "costs 3", 60], [4, 0, "g", "g", 80], [4, 1, 7, "costs 7", 80]],
    heard: ["data 0,1 0,1 0"],
  },
  // // A delegate writes to the model through a role. tv.itemAtCell(Qt.point(0, 1)).model.edit = "i"
  {
    rows: "h8 i6 b2 c3 g7",
    cells: [[0, 0, "e", "h", 0], [0, 1, 8, "costs 8", 0], [1, 0, "f", "i", 20], [1, 1, 6, "costs 6", 20], [2, 0, "b", "b", 40], [2, 1, 2, "costs 2", 40], [3, 0, "c", "c", 60], [3, 1, 3, "costs 3", 60], [4, 0, "g", "g", 80], [4, 1, 7, "costs 7", 80]],
    heard: ["data 1,0 1,0 2"],
    asked: ["h", 6, "costs 6", null, "costs 6", "i", "i"],
  },
  // tm.removeRow(1, 2)
  {
    size: [3, 2, 3, 2],
    rows: "h8 c3 g7",
    cells: [[0, 0, "e", "h", 0], [0, 1, 8, "costs 8", 0], [1, 0, "c", "c", 20], [1, 1, 3, "costs 3", 20], [2, 0, "g", "g", 40], [2, 1, 7, "costs 7", 40]],
    heard: ["removed 1 2"],
    told: [1, 1],
    asked: ["h", 3, "costs 3", null, "costs 3", "c", "c"],
  },
  // tm.rows = [{ name: "x", cost: 10 }, { name: "y", cost: 11 }]
  {
    size: [2, 2, 2, 2],
    rows: "x10 y11",
    cells: [[0, 0, "x", "x", 0], [0, 1, 10, "costs 10", 0], [1, 0, "y", "y", 20], [1, 1, 11, "costs 11", 20]],
    heard: ["reset"],
    asked: ["x", 11, "costs 11", null, "costs 11", "y", "y"],
  },
  // tm.clear()
  {
    size: [0, 2, 0, 2],
    rows: "",
    cells: [],
    asked: [],
    indexes: [false, false, false, -1, -1, 35, 2],
  },
  // tm.appendRow({ name: "z", cost: 12 })
  {
    size: [1, 2, 1, 2],
    rows: "z12",
    cells: [[0, 0, "z", "z", 0], [0, 1, 12, "costs 12", 0]],
    heard: ["inserted 0 0"],
    indexes: [true, false, false, 0, 1, 35, 2],
  },
  // late.appendRow({ n: 1 })
  {
    heard: ["late inserted 0 0"],
    told: [0, 0],
    late: [1, 1, 1, 1, "1"],
    lateCells: [1],
  },
  // late.rows = [{ n: 2 }, { n: 3 }]
  {
    heard: [],
    late: [2, 1, 2, 1, "2 3"],
    lateCells: [2, 3],
  },
  // // The same rows again are no change. late.rows = [{ n: 2 }, { n: 3 }]
  {},
  // tm.setRow(0, { name: "w", cost: 13 })
  {
    rows: "w13",
    cells: [[0, 0, "w", "w", 0], [0, 1, 13, "costs 13", 0]],
    heard: ["data 0,0 0,1 "],
    told: [1, 0],
  },
];

test("A TableModel answers and tells of its rows as Qt's does, and a TableView follows it", async ({ page }) => {
  await open(page, "tablemodel");
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

// What Qt warns of, in the order it does. The roles of a column are in no
// order in Qt (they are a hash's keys): here, in the order they were given.
const REFUSED = [
  "QML TableModel: data(): no role named toolTip at column index 0. The available roles for that column are: QList(\"display\", \"edit\")",
  "QML TableModel: data(): invalid QModelIndex",
  "QML TableModel: setData(): no role named \"toolTip\" at column index 0. The available roles for that column are: QList(\"display\", \"edit\")",
  "QML TableModel: setData(): manipulation of complex row structures is not supported",
  "QML TableModel: setData(): failed converting value QVariant(QString, \"abc\") set at row 0 column 1 with role \"display\" to \"int\"",
  "QML TableModel: setData(): the value QVariant(QJSValue, ) set at row 0 column 0 with role \"edit\" cannot be converted to \"QString\"",
  "QML TableModel: appendRow(): expected \"row\" argument to be a QJSValue, but got int instead:\nQVariant(int, 3)",
  "QML TableModel: appendRow(): expected \"row\" argument to be a QJSValue, but got QString instead:\nQVariant(QString, \"abc\")",
  "QML TableModel: appendRow(): row manipulation functions do not support complex rows",
  "QML TableModel: appendRow(): expected 2 columns, but only got 1",
  "QML TableModel: appendRow(): expected a property named \"cost\" in row",
  "QML TableModel: appendRow(): expected the property named \"cost\" to be of type \"int\", but got \"QVariantMap\" instead",
  "QML TableModel: appendRow(): expected the property named \"name\" to be of type \"QString\", but got \"QVariantList\" instead",
  "QML TableModel: appendRow(): failed converting value \"QVariant(QString, abc)\" set at column 1 with role \"QString\" to \"int\"",
  "QML TableModel: insertRow(): \"rowIndex\" cannot be negative",
  "QML TableModel: insertRow(): \"rowIndex\" 99 is greater than rowCount() of 3",
  "QML TableModel: getRow(): \"rowIndex\" 99 is greater than or equal to rowCount() of 3",
  "QML TableModel: moveRow(): \"fromRowIndex\" cannot be equal to \"toRowIndex\"",
  "QML TableModel: moveRow(): \"rows\" is less than or equal to 0",
  "QML TableModel: moveRow(): \"fromRowIndex\" 99 is greater than or equal to rowCount() of 3",
  "QML TableModel: moveRow(): \"toRowIndex\" 99 is greater than or equal to rowCount() of 3",
  "QML TableModel: moveRow(): \"fromRowIndex\" (1) + \"rows\" (99) = 100, which is greater than rowCount() of 3",
  "QML TableModel: moveRow(): \"toRowIndex\" (2) + \"rows\" (2) = 4, which is greater than rowCount() of 3",
  "QML TableModel: removeRow(): \"rowIndex\" 99 is greater than or equal to rowCount() of 3",
  "QML TableModel: removeRow(): \"rows\" is less than or equal to zero",
  "QML TableModel: removeRow(): \"rows\" 99 exceeds available rowCount() of 3 when removing from \"rowIndex\" 1",
  "QML TableModel: setRow(): \"rowIndex\" 99 is greater than rowCount() of 3",
  "QML TableModel: setRow(): expected 2 columns, but only got 1",
  "QML TableModel: setRows(): expected 2 columns, but only got 1",
  "QML TableModel: setRows(): expected the property named \"cost\" to be of type \"int\", but got \"QVariantList\" instead",
];

plain("A TableModel says why it refuses what it is asked, in Qt's words", async ({ page }) => {
  const warnings = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  await open(page, "tablemodel");
  const answer = await page.evaluate(() => window.scene.refuse());
  expect(answer).toEqual([[false,  false,  false,  false,  false],  "a1 b2 c3"]);
  expect(warnings).toEqual(REFUSED);
});
