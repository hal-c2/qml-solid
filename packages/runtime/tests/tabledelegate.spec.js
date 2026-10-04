// The delegate a style has for the cells of a table, under the pointer.
// What is expected here is what Qt 6.11 answers for the same QML when a
// QtTest `TestCase` makes the same moves with its mouse.
import { follow } from "./follow.js";
import { test } from "./open.js";

const STEPS = [
  [
    [],
    {
      first: [false, false, false, false, false, true],
      second: [false, false, false, false, false, true],
      selected: "",
      current: [-1, -1],
      active: [false, false],
      said: [],
    },
  ],
  // A press is left to the table, which makes the cell the current one, and the delegate is pressed.
  [
    [["press", 82, 52]],
    {
      second: [true, false, false, true, true, true],
      current: [1, 1],
      said: ["pressed 1,1 true"],
    },
  ],
  // Let go, it is clicked.
  [
    [["release", 82, 52]],
    {
      second: [true, false, false, false, false, true],
      said: ["pressed 1,1 false", "clicked 1,1"],
    },
  ],
  // A press that moves a little is a click still.
  [
    [["wait", 600], ["press", 30, 20], ["move", 34, 22], ["release", 34, 22]],
    {
      first: [true, false, false, false, false, true],
      second: [false, false, false, false, false, true],
      current: [0, 0],
      said: ["pressed 0,0 true", "pressed 0,0 false", "clicked 0,0"],
    },
  ],
  // A drag is the SelectionRectangle's: the delegate is let go, and says it was clicked.
  [
    [["wait", 600], ["press", 82, 52], ["move", 100, 70]],
    {
      first: [false, false, false, false, false, true],
      second: [true, true, false, false, false, true],
      selected: "1,1",
      current: [1, 1],
      active: [true, true],
      said: ["pressed 1,1 true", "pressed 1,1 false", "clicked 1,1"],
    },
  ],
  [
    [["move", 140, 100]],
    {
      second: [false, true, false, false, false, true],
      selected: "1,1 1,2 2,1 2,2",
      current: [2, 2],
      said: [],
    },
  ],
  [
    [["release", 140, 100]],
    {
      active: [true, false],
    },
  ],
  // With Control held the delegate hears nothing: the SelectionRectangle selects its cell.
  [
    [["wait", 600], ["press", 30, 20, "ctrl"]],
    {
      first: [true, true, false, false, false, true],
      selected: "1,1 1,2 2,1 2,2 0,0",
      current: [0, 0],
    },
  ],
  [
    [["release", 30, 20, "ctrl"]],
    {},
  ],
  // In a table that does not follow the pointer the delegate is a button, and no cell is made current.
  [
    [["wait", 600], ["step", 0], ["press", 30, 20]],
    {
      first: [true, true, false, true, true, true],
      said: ["pressed 0,0 true"],
    },
  ],
  [
    [["release", 30, 20]],
    {
      first: [true, true, false, false, false, true],
      said: ["pressed 0,0 false", "clicked 0,0"],
    },
  ],
  // A drag takes the press from it.
  [
    [["wait", 600], ["press", 30, 20], ["move", 60, 40], ["move", 140, 100]],
    {
      first: [false, true, false, false, false, true],
      selected: "0,0 0,1 0,2 1,0 1,1 1,2 2,0 2,1 2,2",
      current: [2, 2],
      active: [true, true],
      said: ["pressed 0,0 true", "pressed 0,0 false"],
    },
  ],
  [
    [["release", 140, 100]],
    {
      active: [true, false],
      said: [],
    },
  ],
];

test("a table's delegate leaves the press to the table and to what selects in it", async ({ page }) => {
  await follow(page, "tabledelegate", STEPS);
});
