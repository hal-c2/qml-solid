// A SelectionRectangle on a table. What is expected here is what Qt 6.11
// answers for the same QML when a QtTest `TestCase` makes the same moves with
// its mouse.
import { test as plain } from "@playwright/test";
import { act, follow, read, still } from "./follow.js";
import { expect, test } from "./open.js";

// A table that is dragged over, and the handles that are.
const HANDLES = [
  [
    [],
    {
      active: [false, false, 2],
      selected: "",
      current: [-1, -1],
      first: null,
      second: null,
      content: [0, 0],
      shown: [false, false],
      said: [],
    },
  ],
  // A press makes the cell under it the current one.
  [
    [["press", 30, 20]],
    {
      current: [0, 0],
    },
  ],
  // A drag, once it is one, selects from where the press was, and the handles are made.
  [
    [["move", 60, 40]],
    {
      active: [true, true, 2],
      selected: "0,0",
      first: [-6, -6, 100, true, false, true],
      second: [44, 24, 100, true, false, true],
      said: ["selection true false", "active true", "dragging true"],
    },
  ],
  // The selection is the cells between the press and the pointer,
  [
    [["move", 130, 90]],
    {
      selected: "0,0 0,1 0,2 1,0 1,1 1,2 2,0 2,1 2,2",
      current: [2, 2],
      second: [148, 88, 100, true, false, true],
      shown: [true, false],
      said: ["selection true false"],
    },
  ],
  // and it shrinks as it grows.
  [
    [["move", 190, 60]],
    {
      selected: "0,0 0,1 0,2 0,3 1,0 1,1 1,2 1,3",
      current: [1, 3],
      second: [200, 56, 100, true, false, true],
      said: ["selection false true", "selection true false"],
    },
  ],
  [
    [["release", 190, 60]],
    {
      active: [true, false, 2],
      said: ["dragging false"],
    },
  ],
  // A new drag begins a new selection, in whichever direction it goes.
  [
    [["press", 200, 100], ["move", 150, 70], ["move", 90, 30]],
    {
      active: [true, true, 2],
      selected: "0,1 0,2 0,3 1,1 1,2 1,3 2,1 2,2 2,3",
      current: [0, 1],
      first: [46, -6, 100, true, false, true],
      second: [200, 88, 100, true, false, true],
      said: ["selection false true", "active false", "selection true false", "active true", "dragging true", "selection true false"],
    },
  ],
  [
    [["release", 90, 30]],
    {
      active: [true, false, 2],
      said: ["dragging false"],
    },
  ],
  // A press on a handle selects nothing,
  [
    [["press", 226, 104], ["move", 232, 110]],
    {
      said: [],
    },
  ],
  // and a drag of it moves the corner it is at: the bottom right one,
  [
    [["move", 240, 125], ["move", 240, 150]],
    {
      active: [true, true, 2],
      selected: "0,1 0,2 0,3 0,4 1,1 1,2 1,3 1,4 2,1 2,2 2,3 2,4 3,1 3,2 3,3 3,4 4,1 4,2 4,3 4,4",
      current: [4, 4],
      second: [252, 152, 100, true, true, true],
      said: ["selection true false", "dragging true", "selection true false"],
    },
  ],
  [
    [["release", 240, 150]],
    {
      active: [true, false, 2],
      second: [252, 152, 100, true, false, true],
      said: ["dragging false"],
    },
  ],
  // and the top left one.
  [
    [["press", 72, 10], ["move", 80, 30], ["move", 130, 80]],
    {
      active: [true, true, 2],
      selected: "2,2 2,3 2,4 3,2 3,3 3,4 4,2 4,3 4,4",
      current: [2, 2],
      first: [98, 58, 100, true, true, true],
      shown: [false, false],
      said: ["dragging true", "selection false true"],
    },
  ],
  [
    [["release", 130, 80]],
    {
      active: [true, false, 2],
      first: [98, 58, 100, true, false, true],
      said: ["dragging false"],
    },
  ],
  // With Shift held, a press extends the selection from its first corner.
  [
    [["press", 240, 50, "shift"]],
    {
      selected: "1,2 1,3 1,4 2,2 2,3 2,4",
      current: [1, 4],
      first: [98, 26, 100, true, false, true],
      second: [252, 88, 100, true, false, true],
      said: ["selection false true", "selection true false"],
    },
  ],
  [
    [["release", 240, 50, "shift"]],
    {
      said: [],
    },
  ],
  // With Control held, a press selects its cell and keeps what was selected.
  [
    [["press", 30, 120, "ctrl"]],
    {
      selected: "1,2 1,3 1,4 2,2 2,3 2,4 3,0",
      current: [3, 0],
      first: [-6, 90, 100, true, false, true],
      second: [44, 120, 100, true, false, true],
      said: ["selection true false"],
    },
  ],
  [
    [["release", 30, 120, "ctrl"]],
    {
      said: [],
    },
  ],
  // A press without either clears the selection.
  [
    [["press", 100, 100]],
    {
      active: [false, false, 2],
      selected: "",
      current: [2, 1],
      first: [-6, 90, 100, false, false, true],
      second: [44, 120, 100, false, false, true],
      said: ["selection false true", "active false"],
    },
  ],
  [
    [["release", 100, 100]],
    {
      said: [],
    },
  ],
  // A drag again.
  [
    [["press", 30, 20], ["move", 60, 60], ["move", 100, 60], ["release", 100, 60]],
    {
      active: [true, false, 2],
      selected: "0,0 0,1 1,0 1,1",
      current: [1, 1],
      first: [-6, -6, 100, true, false, true],
      second: [96, 56, 100, true, false, true],
      shown: [true, true],
      said: ["selection true false", "active true", "dragging true", "selection true false", "dragging false"],
    },
  ],
  // What somebody else selects is no rectangle of its: it is active no longer.
  [
    [["step", 0]],
    {
      active: [false, false, 2],
      selected: "0,0 0,1 1,0 1,1 3,5",
      first: [-6, -6, 100, false, false, true],
      second: [96, 56, 100, false, false, true],
      said: ["selection true false", "active false"],
    },
  ],
  // The next drag begins anew.
  [
    [["press", 30, 20], ["move", 60, 60], ["move", 100, 60], ["release", 100, 60]],
    {
      active: [true, false, 2],
      selected: "0,0 0,1 1,0 1,1",
      first: [-6, -6, 100, true, false, true],
      second: [96, 56, 100, true, false, true],
      said: ["selection false true", "selection true false", "active true", "dragging true", "selection true false", "dragging false"],
    },
  ],
  // In PressAndHold mode,
  [
    [["step", 1]],
    {
      active: [true, false, 1],
      said: [],
    },
  ],
  // a drag selects nothing: it is the tap of a table, which clears the selection,
  [
    [["press", 30, 20], ["move", 60, 60], ["move", 100, 60], ["release", 100, 60]],
    {
      active: [false, false, 1],
      selected: "",
      current: [0, 0],
      first: [-6, -6, 100, false, false, true],
      second: [96, 56, 100, false, false, true],
      shown: [false, false],
      said: ["selection false true", "active false"],
    },
  ],
  // a held press selects the cell under it,
  [
    [["press", 150, 60], ["wait", 1000]],
    {
      active: [true, false, 1],
      selected: "1,2",
      current: [1, 2],
      first: [98, 26, 100, true, false, true],
      second: [148, 56, 100, true, false, true],
      said: ["selection true false", "active true"],
    },
  ],
  [
    [["release", 150, 60]],
    {
      said: [],
    },
  ],
  // and one with Shift held extends the selection.
  [
    [["press", 100, 100, "shift"], ["wait", 1000]],
    {
      selected: "1,1 1,2 2,1 2,2",
      current: [2, 1],
      first: [46, 26, 100, true, false, true],
      second: [148, 88, 100, true, false, true],
      shown: [true, false],
      said: ["selection true false"],
    },
  ],
  [
    [["release", 100, 100, "shift"]],
    {
      said: [],
    },
  ],
  // Disabled, it is active no longer. What is selected stays.
  [
    [["step", 2]],
    {
      active: [false, false, 1],
      first: [46, 26, 100, false, false, true],
      second: [148, 88, 100, false, false, true],
      said: ["active false"],
    },
  ],
];

// A table that is asked how it is to select.
const MODES = [
  [
    [],
    {
      active: [false, false],
      selected: "",
      current: [-1, -1],
      content: [0, 0],
      handles: 0,
      said: [],
    },
  ],
  // Asked to select rows, a drag selects the rows it goes over,
  [
    [["step", 0], ["press", 30, 20], ["move", 60, 40], ["move", 100, 60]],
    {
      active: [true, true],
      selected: "0,0 0,1 0,2 0,3 0,4 0,5 1,0 1,1 1,2 1,3 1,4 1,5",
      current: [1, 1],
      said: ["active true", "dragging true"],
    },
  ],
  [
    [["release", 100, 60]],
    {
      active: [true, false],
      said: ["dragging false"],
    },
  ],
  // and a press with Shift held the rows up to it.
  [
    [["press", 150, 120, "shift"], ["release", 150, 120, "shift"]],
    {
      selected: "0,0 0,1 0,2 0,3 0,4 0,5 1,0 1,1 1,2 1,3 1,4 1,5 2,0 2,1 2,2 2,3 2,4 2,5 3,0 3,1 3,2 3,3 3,4 3,5",
      current: [3, 2],
      said: [],
    },
  ],
  // Asked to select columns, the columns: of all the rows there are.
  [
    [["step", 1], ["press", 30, 20], ["move", 60, 40], ["move", 100, 60]],
    {
      active: [true, true],
      selected: "0,0 0,1 1,0 1,1 2,0 2,1 3,0 3,1 4,0 4,1 5,0 5,1 6,0 6,1 7,0 7,1 8,0 8,1 9,0 9,1 10,0 10,1 11,0 11,1 12,0 12,1 13,0 13,1 14,0 14,1 15,0 15,1 16,0 16,1 17,0 17,1 18,0 18,1 19,0 19,1",
      current: [1, 1],
      said: ["active false", "active true", "dragging true"],
    },
  ],
  [
    [["release", 100, 60]],
    {
      active: [true, false],
      said: ["dragging false"],
    },
  ],
  // Asked to select one cell, a drag selects the one it began in,
  [
    [["step", 2], ["press", 30, 20], ["move", 60, 40], ["move", 100, 60]],
    {
      active: [true, true],
      selected: "0,0",
      current: [0, 0],
      said: ["active false", "active true", "dragging true"],
    },
  ],
  [
    [["release", 100, 60]],
    {
      active: [true, false],
      said: ["dragging false"],
    },
  ],
  // a press with Control held another instead,
  [
    [["press", 150, 120, "ctrl"], ["release", 150, 120, "ctrl"]],
    {
      selected: "3,2",
      current: [3, 2],
      said: [],
    },
  ],
  // and one with Shift held nothing more.
  [
    [["press", 200, 20, "shift"], ["release", 200, 20, "shift"]],
    {},
  ],
  // Asked for one selection, a drag selects its cells,
  [
    [["step", 3], ["press", 30, 20], ["move", 60, 40], ["move", 100, 60], ["release", 100, 60]],
    {
      selected: "0,0 0,1 1,0 1,1",
      current: [1, 1],
      said: ["active false", "active true", "dragging true", "dragging false"],
    },
  ],
  // a press with Control held its cell alone,
  [
    [["press", 150, 120, "ctrl"], ["release", 150, 120, "ctrl"]],
    {
      selected: "3,2",
      current: [3, 2],
      said: [],
    },
  ],
  // and one with Shift held from there to its cell.
  [
    [["press", 200, 20, "shift"], ["release", 200, 20, "shift"]],
    {
      selected: "0,2 0,3 1,2 1,3 2,2 2,3 3,2 3,3",
      current: [0, 3],
    },
  ],
  // Asked for as many as there are, a drag selects its cells.
  [
    [["step", 4], ["press", 30, 20], ["move", 60, 40], ["move", 130, 90], ["release", 130, 90]],
    {
      selected: "0,0 0,1 0,2 1,0 1,1 1,2 2,0 2,1 2,2",
      current: [2, 2],
      said: ["active false", "active true", "dragging true", "dragging false"],
    },
  ],
  // With Control held, a press on a cell that is selected takes it out,
  [
    [["press", 80, 50, "ctrl"]],
    {
      selected: "0,0 0,1 0,2 1,0 1,2 2,0 2,1 2,2",
      current: [1, 1],
      said: [],
    },
  ],
  // and a drag from there takes out the cells it goes over.
  [
    [["move", 100, 70, "ctrl"], ["move", 130, 90, "ctrl"]],
    {
      active: [true, true],
      selected: "0,0 0,1 0,2 1,0 2,0",
      current: [2, 2],
      said: ["dragging true"],
    },
  ],
  [
    [["release", 130, 90, "ctrl"]],
    {
      active: [true, false],
      said: ["dragging false"],
    },
  ],
  // A drag from a cell that is not selected adds its cells.
  [
    [["press", 200, 120, "ctrl"], ["move", 220, 130, "ctrl"], ["move", 240, 150, "ctrl"], ["release", 240, 150, "ctrl"]],
    {
      selected: "0,0 0,1 0,2 1,0 2,0 3,3 3,4 4,3 4,4",
      current: [4, 4],
      said: ["dragging true", "dragging false"],
    },
  ],
  // A table that selects nothing says so when a drag begins.
  [
    [["step", 5], ["press", 30, 20], ["move", 60, 40], ["move", 100, 60]],
    {
      current: [0, 0],
      said: [],
    },
  ],
  [
    [["release", 100, 60]],
    {},
  ],
  // And so does one that has no selection model, once: it is active no longer.
  [
    [["step", 6], ["press", 30, 20], ["move", 60, 40], ["move", 100, 60]],
    {
      active: [false, false],
      said: ["active false"],
    },
  ],
  [
    [["release", 100, 60]],
    {
      said: [],
    },
  ],
  [
    [["press", 30, 20], ["move", 60, 40], ["move", 100, 60], ["release", 100, 60]],
    {},
  ],
  // In a table that flicks, a press that is held selects the cell under it.
  [
    [["step", 7], ["press", 100, 60], ["wait", 1000]],
    {
      active: [true, false],
      selected: "1,1",
      current: [1, 1],
      said: ["active true"],
    },
  ],
  [
    [["release", 100, 60]],
    {
      said: [],
    },
  ],
  // A target that is no table cannot be selected in, which it says. It stays active, as it was.
  [
    [["step", 8]],
    {},
  ],
  // A tap in the table clears what is selected there, as it does without a SelectionRectangle.
  [
    [["press", 30, 20], ["move", 60, 40], ["move", 100, 60], ["release", 100, 60]],
    {
      selected: "",
      current: [0, 0],
    },
  ],
  [
    [["step", 9]],
    {},
  ],
  // With the table as the target again, a drag selects.
  [
    [["press", 30, 20], ["move", 60, 40], ["move", 100, 60], ["release", 100, 60]],
    {
      selected: "0,0 0,1 1,0 1,1",
      current: [1, 1],
      said: ["active false", "active true", "dragging true", "dragging false"],
    },
  ],
];

// What Qt warns of meanwhile. It calls the table a QQuickTableView in a file
// that imports QtQuick.Templates, and a TableView in one that does not.
const WARNED = [
  "QML TableView: Cannot start selection: TableView.selectionBehavior == TableView.SelectionDisabled",
  "QML TableView: Cannot start selection: no SelectionModel assigned!",
  "QML SelectionRectangle: the assigned target is not supported by the control",
];

test("a SelectionRectangle selects the cells a drag goes over, and has handles to drag on", async ({ page }) => {
  await follow(page, "selectionrectangle", HANDLES);
});

plain("a SelectionRectangle selects what the table is asked to select, and says what cannot be", async ({ page }) => {
  const warned = [];
  page.on("pageerror", (error) => warned.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") warned.push(message.text());
  });
  await follow(page, "selectionmodes", MODES);
  expect(warned).toEqual(WARNED);
});

// Qt moves the content a step whenever a timer of a millisecond gets to
// fire, and how far that is in a given time is not the same twice. What is
// expected here is what it answers but for how far: 2.8, 9.4 and 16 for the
// same moves and a fifth of a second between them.
test("a drag that leaves the table takes the content with it", async ({ page }) => {
  await still(page, "selectionrectangle");
  const rows = async () => {
    const { selected, content, current, second } = await read(page);
    return [selected, current, second.slice(0, 2), content[1]];
  };
  for (const move of [["press", 30, 20], ["move", 60, 60], ["move", 100, 200]]) await act(page, move);
  const first = await rows();
  expect(first.slice(0, 3)).toEqual(["0,0 0,1 1,0 1,1 2,0 2,1 3,0 3,1 4,0 4,1", [4, 1], [96, 152]]);
  expect(first[3]).toBeGreaterThan(0);
  await act(page, ["wait", 24]);
  const second = await rows();
  expect(second.slice(0, 3)).toEqual(first.slice(0, 3));
  expect(second[3]).toBeGreaterThan(first[3] + 5);
  // The row that comes into the view is selected too.
  await act(page, ["wait", 24]);
  const third = await rows();
  expect(third.slice(0, 3)).toEqual(["0,0 0,1 1,0 1,1 2,0 2,1 3,0 3,1 4,0 4,1 5,0 5,1", [5, 1], [96, 184]]);
  expect(third[3]).toBeGreaterThan(second[3] + 5);
  // Inside the view again, the content stays where it is.
  await act(page, ["move", 100, 100]);
  await act(page, ["wait", 100]);
  const fourth = await rows();
  expect(fourth).toEqual(["0,0 0,1 1,0 1,1 2,0 2,1 3,0 3,1", [3, 1], [96, 120], third[3]]);
  await act(page, ["release", 100, 100]);
  await act(page, ["wait", 100]);
  expect(await rows()).toEqual(fourth);
});
