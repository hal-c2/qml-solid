// What is expected here is what Qt 6.11 answers for the same QML, run with
// `qml6` and asked after each step.
import { expect, open, test } from "./open.js";

// What `read()` answers at the start, part by part.
const START = {
  size: [20, 6, 345, 538],
  place: [0, 0, 0, 0],
  edges: [0, 3, 0, 5],
  columns: [[0, 0, 40], [1, 43, 50], [2, 96, 60], [3, 159, 70]],
  rows: [[0, 0, 20], [1, 22, 25], [2, 49, 30], [3, 81, 20], [4, 103, 25], [5, 130, 30]],
  cells: [24, [0, 0, 0, "a0"], [5, 3, 65, "d5"]],
  current: [-1, -1],
  selected: [],
  reuse: [11, 0],
  said: [],
};

// Each step, and the parts it changes.
const STEPS = [
  // said = [at(0, 0) !== null, at(5, 19), tv.itemAtIndex(tv.index(1, 1)) === at(1, 1), at(0, 0).view === tv,
  // at(1, 2).model.display, at(1, 2).model.row, at(1, 2).model.column, at(1, 2).model.index, tv.itemAtCell(1, 2)
  // === at(1, 2), sel.model === tv.model, at(0, 0).editing, tv.selectionBehavior, tv.selectionMode,
  // tv.keyNavigationEnabled, tv.pointerNavigationEnabled, tv.reuseItems, tv.alternatingRows, tv.syncDirection,
  // tv.interactive]
  {
    said: [true, null, true, true, "b2", 2, 1, 22, true, true, false, 1, 2, true, true, true, true, 3, true],
  },
  // tv.contentX = 60
  {
    place: [60, 0, 0, 0],
    edges: [1, 4, 0, 5],
    columns: [[1, 43, 50], [2, 96, 60], [3, 159, 70], [4, 232, 80]],
    cells: [24, [0, 1, 20, "b0"], [5, 4, 85, "e5"]],
    reuse: [17, 6],
    said: [],
  },
  // tv.contentY = 100
  {
    place: [60, 100, 0, 0],
    edges: [1, 4, 3, 9],
    rows: [[3, 81, 20], [4, 103, 25], [5, 130, 30], [6, 162, 20], [7, 184, 25], [8, 211, 30], [9, 243, 20]],
    cells: [28, [3, 1, 23, "b3"], [9, 4, 89, "e9"]],
    reuse: [29, 22],
  },
  // tv.contentY = 400
  {
    place: [60, 400, 0, 0],
    edges: [1, 4, 14, 19],
    rows: [[14, 378, 30], [15, 410, 20], [16, 432, 25], [17, 459, 30], [18, 491, 20], [19, 513, 25]],
    cells: [24, [14, 1, 34, "b14"], [19, 4, 99, "e19"]],
    reuse: [57, 29],
  },
  // tv.contentX = 0; tv.contentY = 0
  {
    place: [0, 0, 0, 0],
    edges: [0, 3, 0, 5],
    columns: [[0, 0, 40], [1, 43, 50], [2, 96, 60], [3, 159, 70]],
    rows: [[0, 0, 20], [1, 22, 25], [2, 49, 30], [3, 81, 20], [4, 103, 25], [5, 130, 30]],
    cells: [24, [0, 0, 0, "a0"], [5, 3, 65, "d5"]],
    reuse: [87, 59],
  },
  // tv.setColumnWidth(1, 80); said = sizes(1, 0)
  {
    size: [20, 6, 390, 538],
    columns: [[0, 0, 40], [1, 43, 80], [2, 126, 60], [3, 189, 70]],
    said: [50, 50, 80, 20, 20, -1],
  },
  // tv.setRowHeight(0, 40); said = sizes(1, 0); break // What a provider says is asked for when the table is next
  // laid out.
  {
    size: [20, 6, 390, 598],
    edges: [0, 3, 0, 4],
    rows: [[0, 0, 40], [1, 42, 25], [2, 69, 30], [3, 101, 20], [4, 123, 25]],
    cells: [20, [0, 0, 0, "a0"], [4, 3, 64, "d4"]],
    reuse: [91, 59],
    said: [80, 50, 80, 20, 20, 40],
  },
  // tv.columnWidthProvider = c => c === 1 ? 0 : c === 2 ? -1 : c === 3 ? undefined : 30
  {
    size: [20, 6, 249.5, 598],
    edges: [0, 4, 0, 4],
    columns: [[0, 0, 30], [2, 33, 60], [3, 96, 70], [4, 169, 30]],
    cells: [20, [0, 0, 0, "a0"], [4, 4, 84, "e4"]],
    reuse: [96, 64],
    said: [],
  },
  // said = [sizes(0, 0), sizes(1, 0), sizes(2, 0), sizes(3, 0), sizes(4, 0)]
  {
    said: [[30, 40, -1, 40, 20, 40], [-1, -1, 80, 40, 20, 40], [60, 60, -1, 40, 20, 40], [70, 70, -1, 40, 20, 40], [30, 80, -1, 40, 20, 40]],
  },
  // tv.rowHeightProvider = r => r === 0 ? 0 : r === 1 ? -5 : r === 2 ? undefined : r === 3 ? 12.5 : NaN
  {
    size: [20, 6, 249.5, 487.25],
    edges: [0, 4, 1, 6],
    rows: [[1, 0, 25], [2, 27, 30], [3, 59, 12.5], [4, 73.5, 25], [5, 100.5, 30], [6, 132.5, 20]],
    cells: [24, [1, 0, 1, "a1"], [6, 4, 86, "e6"]],
    reuse: [112, 84],
    said: [],
  },
  // said = [sizes(0, 0), sizes(0, 1), sizes(0, 2), sizes(0, 3), sizes(0, 4)]
  {
    said: [[30, 40, -1, -1, -1, 40], [30, 40, -1, 25, 25, -1], [30, 40, -1, 30, 30, -1], [30, 40, -1, 12.5, 20, -1], [30, 40, -1, 25, 25, -1]],
  },
  // tv.columnWidthProvider = undefined; tv.rowHeightProvider = undefined
  {
    size: [20, 6, 390, 511],
    place: [0, 0, 0, -27],
    edges: [0, 3, 1, 6],
    columns: [[0, 0, 40], [1, 43, 80], [2, 126, 60], [3, 189, 70]],
    rows: [[1, 0, 25], [2, 27, 30], [3, 59, 20], [4, 81, 25], [5, 108, 30], [6, 140, 20]],
    cells: [24, [1, 0, 1, "a1"], [6, 3, 66, "d6"]],
    reuse: [118, 90],
    said: [],
  },
  // tv.clearColumnWidths(); tv.clearRowHeights()
  {
    size: [20, 6, 345, 511],
    columns: [[0, 0, 40], [1, 43, 50], [2, 96, 60], [3, 159, 70]],
  },
  // said = [point(tv.cellAtPosition(50, 30)), point(tv.cellAtPosition(Qt.point(42, 21))),
  // point(tv.cellAtPosition(42, 21, true)), point(tv.cellAtPosition(1000, 30)), point(tv.cellAtPosition(-5, -5)),
  // point(tv.cellAtPosition(41, 5, true)), point(tv.cellAtPosition(Qt.point(41, 5), true)), tv.index(2, 3).valid,
  // tv.index(2, 3).row, tv.index(2, 3).column, tv.modelIndex(Qt.point(3, 2)) === tv.index(2, 3),
  // point(tv.cellAtIndex(tv.index(2, 3))), tv.rowAtIndex(tv.index(2, 3)), tv.columnAtIndex(tv.index(2, 3)),
  // tv.index(99, 99).valid, point(tv.cellAtIndex(tv.index(99, 99))), tv.isColumnLoaded(0), tv.isColumnLoaded(5),
  // tv.isRowLoaded(0), tv.isRowLoaded(1)]
  {
    said: [[1, 2], [-1, -1], [1, 1], [-1, -1], [-1, -1], [0, 1], [0, 1], true, 2, 3, true, [3, 2], 2, 3, false, [-1, -1], true, false, false, true],
  },
  // tv.positionViewAtCell(Qt.point(5, 15), TableView.AlignCenter)
  {
    place: [180, 340, 0, -27],
    edges: [3, 5, 12, 18],
    columns: [[3, 134, 70], [4, 207, 80], [5, 290, 90]],
    rows: [[12, 324, 20], [13, 346, 25], [14, 373, 30], [15, 405, 20], [16, 427, 25], [17, 454, 30], [18, 486, 20]],
    cells: [21, [12, 3, 72, "d12"], [18, 5, 118, "f18"]],
    reuse: [143, 112],
    said: [],
  },
  // tv.positionViewAtRow(10, TableView.AlignTop)
  {
    place: [180, 270, 0, -27],
    edges: [3, 5, 10, 15],
    rows: [[10, 270, 25], [11, 297, 30], [12, 329, 20], [13, 351, 25], [14, 378, 30], [15, 410, 20]],
    cells: [18, [10, 3, 70, "d10"], [15, 5, 115, "f15"]],
    reuse: [152, 118],
  },
  // tv.positionViewAtColumn(3, TableView.AlignRight)
  {
    place: [4, 270, -25, -27],
    edges: [0, 3, 10, 15],
    columns: [[0, -25, 40], [1, 18, 50], [2, 71, 60], [3, 134, 70]],
    cells: [24, [10, 0, 10, "a10"], [15, 3, 75, "d15"]],
    reuse: [164, 136],
  },
  // tv.positionViewAtCell(Qt.point(0, 0), TableView.AlignLeft | TableView.AlignTop)
  {
    place: [-25, 0, -25, 0],
    edges: [0, 3, 0, 5],
    rows: [[0, 0, 20], [1, 22, 25], [2, 49, 30], [3, 81, 20], [4, 103, 25], [5, 130, 30]],
    cells: [24, [0, 0, 0, "a0"], [5, 3, 65, "d5"]],
    reuse: [188, 160],
  },
  // tv.positionViewAtRow(19, TableView.AlignBottom); tv.positionViewAtColumn(5, TableView.AlignRight)
  {
    place: [180, 388, -25, 0],
    edges: [3, 5, 14, 19],
    columns: [[3, 134, 70], [4, 207, 80], [5, 290, 90]],
    rows: [[14, 378, 30], [15, 410, 20], [16, 432, 25], [17, 459, 30], [18, 491, 20], [19, 513, 25]],
    cells: [18, [14, 3, 74, "d14"], [19, 5, 119, "f19"]],
    reuse: [212, 178],
  },
  // tv.positionViewAtRow(5, TableView.Contain); tv.positionViewAtColumn(1, TableView.Visible)
  {
    place: [58, 135, -25, 0],
    edges: [1, 4, 5, 10],
    columns: [[1, 58, 50], [2, 111, 60], [3, 174, 70], [4, 247, 80]],
    rows: [[5, 135, 30], [6, 167, 20], [7, 189, 25], [8, 216, 30], [9, 248, 20], [10, 270, 25]],
    cells: [24, [5, 1, 25, "b5"], [10, 4, 90, "e10"]],
    reuse: [230, 202],
  },
  // tv.positionViewAtCell(0, 0, TableView.AlignLeft | TableView.AlignTop)
  {
    place: [15, 0, 15, 0],
    edges: [0, 3, 0, 5],
    columns: [[0, 15, 40], [1, 58, 50], [2, 111, 60], [3, 174, 70]],
    rows: [[0, 0, 20], [1, 22, 25], [2, 49, 30], [3, 81, 20], [4, 103, 25], [5, 130, 30]],
    cells: [24, [0, 0, 0, "a0"], [5, 3, 65, "d5"]],
    reuse: [256, 228],
  },
  // tv.positionViewAtColumn(3, TableView.AlignRight)
  {
    place: [44, 0, 15, 0],
  },
  // tv.positionViewAtRow(5, TableView.AlignVCenter, 7)
  {
    place: [44, 77, 15, 0],
    edges: [0, 3, 2, 8],
    rows: [[2, 49, 30], [3, 81, 20], [4, 103, 25], [5, 130, 30], [6, 162, 20], [7, 184, 25], [8, 211, 30]],
    cells: [28, [2, 0, 2, "a2"], [8, 3, 68, "d8"]],
    reuse: [264, 240],
  },
  // tv.positionViewAtColumn(1, TableView.AlignLeft, -4, Qt.rect(5, 0, 10, 10))
  {
    place: [59, 77, 15, 0],
    edges: [1, 4, 2, 8],
    columns: [[1, 58, 50], [2, 111, 60], [3, 174, 70], [4, 247, 80]],
    cells: [28, [2, 1, 22, "b2"], [8, 4, 88, "e8"]],
    reuse: [271, 247],
  },
  // tv.positionViewAtRow(8, TableView.AlignTop, 0, Qt.rect(0, 5, 10, 10))
  {
    place: [59, 216, 15, 0],
    edges: [1, 4, 8, 13],
    rows: [[8, 211, 30], [9, 243, 20], [10, 265, 25], [11, 292, 30], [12, 324, 20], [13, 346, 25]],
    cells: [24, [8, 1, 28, "b8"], [13, 4, 93, "e13"]],
    reuse: [295, 267],
  },
  // tv.positionViewAtCell(Qt.point(2, 3), TableView.Visible)
  {
    place: [59, 81, 15, 0],
    edges: [1, 4, 3, 8],
    rows: [[3, 81, 20], [4, 103, 25], [5, 130, 30], [6, 162, 20], [7, 184, 25], [8, 211, 30]],
    cells: [24, [3, 1, 23, "b3"], [8, 4, 88, "e8"]],
    reuse: [315, 286],
  },
  // tv.positionViewAtCell(Qt.point(5, 12), TableView.Visible)
  {
    place: [220, 194, 15, 0],
    edges: [3, 5, 7, 12],
    columns: [[3, 174, 70], [4, 247, 80], [5, 330, 90]],
    rows: [[7, 184, 25], [8, 211, 30], [9, 243, 20], [10, 265, 25], [11, 292, 30], [12, 324, 20]],
    cells: [18, [7, 3, 67, "d7"], [12, 5, 112, "f12"]],
    reuse: [360, 325],
  },
  // tv.positionViewAtCell(Qt.point(0, 2), TableView.Contain)
  {
    place: [0, 54, 0, 0],
    edges: [0, 3, 2, 7],
    columns: [[0, 0, 40], [1, 43, 50], [2, 96, 60], [3, 159, 70]],
    rows: [[2, 54, 30], [3, 86, 20], [4, 108, 25], [5, 135, 30], [6, 167, 20], [7, 189, 25]],
    cells: [24, [2, 0, 2, "a2"], [7, 3, 67, "d7"]],
    reuse: [377, 348],
  },
  // tv.positionViewAtCell(Qt.point(4, 9), TableView.Contain)
  {
    place: [112, 113, 0, 0],
    edges: [2, 4, 4, 9],
    columns: [[2, 96, 60], [3, 159, 70], [4, 232, 80]],
    rows: [[4, 103, 25], [5, 130, 30], [6, 162, 20], [7, 184, 25], [8, 211, 30], [9, 243, 20]],
    cells: [18, [4, 2, 44, "c4"], [9, 4, 89, "e9"]],
    reuse: [422, 387],
  },
  // said = [point(tv.cellAtPosition(50, 30)), point(tv.cellAtPosition(tv.contentX + 50, tv.contentY + 30))]
  // tv.positionViewAtIndex(tv.index(1, 1), TableView.AlignLeft | TableView.AlignTop)
  {
    place: [43, 27, 0, 0],
    edges: [1, 4, 1, 6],
    columns: [[1, 43, 50], [2, 96, 60], [3, 159, 70], [4, 232, 80]],
    rows: [[1, 27, 25], [2, 54, 30], [3, 86, 20], [4, 108, 25], [5, 135, 30], [6, 167, 20]],
    cells: [24, [1, 1, 21, "b1"], [6, 4, 86, "e6"]],
    reuse: [434, 405],
    said: [[-1, -1], [3, 5]],
  },
  // sel.setCurrentIndex(tv.index(2, 1), ItemSelectionModel.NoUpdate)
  {
    current: [2, 1],
    said: [],
  },
  // sel.select(tv.index(3, 2), ItemSelectionModel.Select) sel.select(tv.index(1, 2), ItemSelectionModel.Select)
  // sel.select(tv.index(1, 1), ItemSelectionModel.Select) said = [at(2, 3).selected, at(1, 2).current, at(2,
  // 2).selected, at(2, 2).current, at(1, 1).selected]
  {
    selected: [[3, 2], [1, 2], [1, 1]],
    said: [true, true, false, false, true],
  },
  // grid.removeRow(0, 2)
  {
    size: [18, 6, 345, 484],
    cells: [24, [1, 1, 19, "b3"], [6, 4, 78, "e8"]],
    current: [0, 1],
    selected: [[1, 2]],
    reuse: [442, 413],
    said: [],
  },
  // grid.insertRow(0, { a: "x", b: "x", c: "x", d: "x", e: "x", f: "x" })
  {
    size: [19, 6, 345, 511],
    cells: [24, [1, 1, 20, "b2"], [6, 4, 82, "e7"]],
    current: [1, 1],
    selected: [[2, 2]],
    reuse: [446, 417],
  },
  // grid.setData(grid.index(1, 1), "changed", "display") said = [grid.data(grid.index(1, 1), "display"), at(1,
  // 1).display]
  {
    cells: [24, [1, 1, 20, "changed"], [6, 4, 82, "e7"]],
    said: ["changed", "changed"],
  },
  // grid.clear()
  {
    size: [0, 6, 0, 0],
    edges: [-1, -1, -1, -1],
    columns: [],
    rows: [],
    cells: [0, null, null],
    current: [-1, -1],
    selected: [],
    said: [],
  },
  // tv.positionViewAtCell(Qt.point(0, 0), TableView.AlignLeft | TableView.AlignTop)
  {},
  // grid.appendRow({ a: "x", b: "x", c: "x", d: "x", e: "x", f: "x" })
  {
    size: [1, 6, 380, 20],
    edges: [1, 4, 0, 0],
    columns: [[1, 43, 50], [2, 96, 60], [3, 159, 70], [4, 232, 80]],
    rows: [[0, 0, 20]],
    cells: [4, [0, 1, 1, "x"], [0, 4, 4, "x"]],
    reuse: [448, 423],
  },
  // grid.fill(4)
  {
    size: [4, 6, 380, 101],
    edges: [1, 4, 1, 3],
    rows: [[1, 22, 25], [2, 49, 30], [3, 81, 20]],
    cells: [12, [1, 1, 5, "b1"], [3, 4, 19, "e3"]],
    reuse: [456, 443],
  },
  // tv.contentX = 0; tv.contentY = 0
  {
    place: [0, 0, 0, 0],
    edges: [0, 3, 0, 3],
    columns: [[0, 0, 40], [1, 43, 50], [2, 96, 60], [3, 159, 70]],
    rows: [[0, 0, 20], [1, 22, 25], [2, 49, 30], [3, 81, 20]],
    cells: [16, [0, 0, 0, "a0"], [3, 3, 15, "d3"]],
    reuse: [459, 450],
  },
  // tv.rowSpacing = 10; tv.columnSpacing = 0; break // One at a time: Qt lays out for both at the next frame, and
  // here // each is laid out for as it is assigned.
  {
    size: [4, 6, 330, 125],
    columns: [[0, 0, 40], [1, 40, 50], [2, 90, 60], [3, 150, 70]],
    rows: [[0, 0, 20], [1, 30, 25], [2, 65, 30], [3, 105, 20]],
  },
  // root.width = 320
  {
    size: [4, 6, 390, 125],
    edges: [0, 5, 0, 3],
    columns: [[0, 0, 40], [1, 40, 50], [2, 90, 60], [3, 150, 70], [4, 220, 80], [5, 300, 90]],
    cells: [24, [0, 0, 0, "a0"], [3, 5, 23, "f3"]],
  },
  // root.height = 60
  {
    size: [4, 6, 390, 120],
    edges: [0, 5, 0, 1],
    rows: [[0, 0, 20], [1, 30, 25]],
    cells: [12, [0, 0, 0, "a0"], [1, 5, 21, "f1"]],
    reuse: [471, 450],
  },
];

test("a TableView lays out the cells in view, and answers for them as Qt's does", async ({ page }) => {
  await open(page, "tableview");
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
