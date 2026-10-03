import { expect, open, test } from "./open.js";

// The steps are the ones Qt was taken through, and what is expected what
// it said and had after each.
test("an ItemSelectionModel keeps what is selected and what is current", async ({ page }) => {
  await open(page, "selection");
  const read = await page.evaluate(() => {
    const { scene } = window;
    const { src, sorted, sel, log } = scene;
    const Flags = sel.$type;
    const rows = () => sel.selectedIndexes.map((index) => index.row);
    const said = () => log.splice(0);
    const seen = {};
    seen.flags = [
      Flags.NoUpdate,
      Flags.Clear,
      Flags.Select,
      Flags.Deselect,
      Flags.Toggle,
      Flags.Current,
      Flags.Rows,
      Flags.Columns,
      Flags.SelectCurrent,
      Flags.ToggleCurrent,
      Flags.ClearAndSelect,
    ];
    seen.initial = [sel.hasSelection, sel.currentIndex.row, sel.currentIndex.valid, sel.selectedIndexes.length];
    const i0 = src.index(0, 0);
    const i1 = src.index(1, 0);
    const i2 = src.index(2, 0);
    const nowhere = src.index(9, 0);
    seen.index = [
      [i0.row, i0.column, i0.valid, i0.model === src, i0 === src.index(0, 0), i0.parent.valid],
      [nowhere.valid, nowhere.row, Object.keys(i0).sort()],
    ];
    sel.select(i0, Flags.Select);
    seen.select = [
      said(),
      [sel.hasSelection, sel.isSelected(i0), sel.isSelected(i1), sel.selectedIndexes.length],
      [sel.isRowSelected(0), sel.rowIntersectsSelection(0), sel.isColumnSelected(0), sel.columnIntersectsSelection(0)],
      scene.chosen,
    ];
    sel.select(i1, Flags.Toggle);
    // A binding that asks whether a cell is selected is told when it is.
    seen.toggled = [said(), rows(), scene.chosen];
    sel.select(i1, Flags.Toggle);
    seen.untoggled = [said(), rows(), scene.chosen];
    sel.select(i2, Flags.ClearAndSelect);
    seen.replaced = [said(), rows(), sel.selectedRows(0).map((index) => index.row), sel.selectedColumns(0).length];
    sel.select(i2, Flags.Select);
    sel.select(i2, Flags.NoUpdate);
    seen.same = said();
    sel.setCurrentIndex(i1, Flags.NoUpdate);
    seen.current = [said(), sel.currentIndex.row, rows()];
    sel.setCurrentIndex(i0, Flags.SelectCurrent);
    seen.selectCurrent = [said(), sel.currentIndex.row, rows()];
    sel.setCurrentIndex(i0, Flags.Select);
    sel.select(i1, Flags.Deselect);
    sel.select(nowhere, Flags.Select);
    seen.nothing = [said(), rows()];
    // What is selected and current stays with its row.
    src.remove(0);
    seen.removed = [said(), sel.currentIndex.row, sel.currentIndex.valid, rows()];
    src.insert(0, { name: "x" });
    seen.inserted = [said(), sel.currentIndex.row, rows()];
    src.move(2, 0, 1);
    seen.moved = [said(), sel.currentIndex.row, rows()];
    src.move(0, 2, 1);
    said();
    sel.clearSelection();
    seen.clearSelection = [said(), sel.currentIndex.row, sel.hasSelection];
    sel.setCurrentIndex(src.index(1, 0), Flags.Select);
    sel.clearCurrentIndex();
    seen.clearCurrent = [said(), sel.currentIndex.row, sel.hasSelection];
    sel.setCurrentIndex(src.index(1, 0), Flags.Select);
    sel.clear();
    seen.clear = [said(), sel.currentIndex.row, sel.hasSelection];
    sel.setCurrentIndex(src.index(1, 0), Flags.Select);
    sel.reset();
    seen.reset = [said(), sel.currentIndex.row, sel.hasSelection];
    sel.select(src.index(1, 0), Flags.Select | Flags.Rows);
    seen.rows = [said(), rows()];
    sel.select(src.index(3, 0), Flags.Select | Flags.Columns);
    seen.columns = [said(), rows(), sel.isColumnSelected(0)];
    // A selection being dragged out: each step replaces the one before.
    sel.select(src.index(0, 0), Flags.ClearAndSelect);
    sel.select(src.index(1, 0), Flags.SelectCurrent);
    sel.select(src.index(2, 0), Flags.SelectCurrent);
    sel.select(src.index(4, 0), Flags.Select);
    seen.dragged = [said(), rows()];
    // Another model: nothing of the one before means anything in it.
    sel.model = sorted;
    seen.model = [said(), sel.currentIndex.row, sel.hasSelection, rows()];
    // A proxy's rows are followed as any model's are.
    sel.setCurrentIndex(sorted.index(0, 0), Flags.Select);
    const first = sorted.mapToSource(sorted.index(0, 0)).row;
    const name = src.get(first).name;
    src.setProperty(first, "name", "zzz");
    seen.proxy = [said(), name, sel.currentIndex.row, rows(), sorted.rowCount()];
    return seen;
  });
  expect(read).toEqual({
    flags: [0, 1, 2, 4, 8, 16, 32, 64, 18, 24, 3],
    initial: [false, -1, false, 0],
    index: [
      [0, 0, true, true, true, false],
      [false, -1, ["column", "internalId", "model", "parent", "row", "valid"]],
    ],
    select: [["selection 1 0"], [true, true, false, 1], [true, true, false, true], false],
    toggled: [["selection 1 0"], [0, 1], true],
    untoggled: [["selection 0 1"], [0], false],
    replaced: [["selection 1 1"], [2], [2], 0],
    same: [],
    current: [["current 1 0 -1 false", "row 1 -1", "column 0 -1"], 1, [2]],
    selectCurrent: [["selection 1 0", "current 0 0 1 true", "row 0 1"], 0, [2, 0]],
    nothing: [[], [2, 0]],
    // The row after the one that went is current: it has that one's number.
    removed: [["current 0 0 0 true", "row 0 0", "selection 0 1"], 0, true, [1]],
    inserted: [[], 1, [2]],
    moved: [[], 2, [0]],
    clearSelection: [["selection 0 1"], 1, false],
    clearCurrent: [["selection 1 0", "current -1 -1 1 true", "row -1 1", "column -1 0"], -1, true],
    clear: [
      [
        "current 1 0 -1 false",
        "row 1 -1",
        "column 0 -1",
        "selection 0 1",
        "current -1 -1 1 true",
        "row -1 1",
        "column -1 0",
      ],
      -1,
      false,
    ],
    reset: [["selection 1 0", "current 1 0 -1 false", "row 1 -1", "column 0 -1"], -1, false],
    rows: [["selection 1 0"], [1]],
    columns: [["selection 4 0"], [0, 1, 2, 3, 4], true],
    dragged: [["selection 0 4", "selection 1 1", "selection 1 1", "selection 1 0"], [2, 4]],
    model: [[], -1, false, []],
    proxy: [["selection 1 0", "current 0 0 -1 false", "row 0 -1", "column 0 -1"], "Apple", 4, [4], 5],
  });
});
