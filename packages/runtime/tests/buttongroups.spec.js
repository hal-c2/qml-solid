// Buttons in groups and buttons with actions. What is expected is what Qt
// 6.11 answers for the same scene (`qml6`), and what it notes when a QtTest
// `TestCase` makes the same clicks and calls.
import { advance, call, read, said, set, still as base } from "./notes.js";
import { expect, open, test } from "./open.js";

const still = (page) => base(page, "buttongroups");

// Where the buttons are in the scene.
const at = {
  g1: [10, 10],
  g2: [10, 40],
  g3: [10, 70],
  l2: [10, 135],
  all: [110, 10],
  m1: [110, 40],
  m2: [110, 70],
  ab: [210, 10],
  ab2: [210, 40],
  bx1: [210, 80],
  bx2: [210, 110],
};

async function click(page, name) {
  await page.mouse.move(at[name][0] + 5, at[name][1] + 5);
  await page.mouse.down();
  await page.mouse.up();
  await advance(page, 500);
}

const checkedButton = (page, group) => page.evaluate((group) => window.scene.name(window.scene[group].checkedButton), group);

test("groups and actions are what Qt says they are", async ({ page }) => {
  await open(page, "buttongroups");
  expect(await page.evaluate(() => window.scene.answers())).toEqual([
    [true, false, false, "g1", 3, true, 1],
    [true, false, "l1", 2, 1],
    [1, 1, false, true, false, null, 2],
    ["Act", "edit", "#0000ff", true, false, true, "Ctrl+E"],
    ["Act", "edit", "#0000ff", true, false, true, true],
    ["own", "own", "#0000ff", true],
    [true, false, "x1", 2, true, true, true, false, "x1"],
    [false, 1, null],
  ]);
});

test("one button of a group is checked", async ({ page }) => {
  await still(page);
  await click(page, "g3");
  await said(page, ["g1.checked false", "g3.checked true", "grp.checkedButton g3", "g3.toggled", "grp.clicked g3"]);
  expect(await read(page, "g1.checked", "g2.checked", "g3.checked", "grp.checkState")).toEqual([false, false, true, 1]);
  await click(page, "g3");
  await said(page, ["grp.clicked g3"]);
  expect(await read(page, "g3.checked")).toEqual([true]);
  await page.evaluate(() => (window.scene.grp.checkedButton = window.scene.g1));
  await said(page, ["g3.checked false", "g1.checked true", "grp.checkedButton g1"]);
  await set(page, "grp.checkedButton", null);
  await said(page, ["g1.checked false", "grp.checkedButton none"]);
  expect(await read(page, "g1.checked", "grp.checkState")).toEqual([false, 0]);
  await set(page, "g2.checked", true);
  await said(page, ["g2.checked true", "grp.checkedButton g2"]);

  // The checked one that leaves the group is checked no longer, and is a
  // button of its own from then on.
  await call(page, "grp.removeButton", "@g2");
  await said(page, ["g2.checked false", "grp.checkedButton none"]);
  expect(await read(page, "g2.checked", "grp.buttons.length")).toEqual([false, 2]);
  await click(page, "g2");
  await click(page, "g1");
  await said(page, ["g2.checked true", "g2.toggled", "g1.checked true", "grp.checkedButton g1", "g1.toggled", "grp.clicked g1"]);
  expect(await read(page, "g1.checked", "g2.checked", "g3.checked")).toEqual([true, true, false]);
  await call(page, "grp.addButton", "@g2");
  await said(page, ["g1.checked false", "grp.checkedButton g2"]);
  expect(await read(page, "g1.checked", "g2.checked")).toEqual([false, true]);
  await set(page, "grp.checkState", 0);
  await said(page, ["g2.checked false", "grp.checkedButton none"]);

  // A group that excludes nothing says how many are checked.
  await set(page, "grp.exclusive", false);
  await click(page, "g1");
  await click(page, "g2");
  await said(page, ["g1.checked true", "g1.toggled", "grp.clicked g1", "g2.checked true", "g2.toggled", "grp.clicked g2"]);
  expect(await read(page, "g1.checked", "g2.checked", "grp.checkState")).toEqual([true, true, 1]);
  expect(await checkedButton(page, "grp")).toBe("none");
  await click(page, "g3");
  await said(page, ["g3.checked true", "g3.toggled", "grp.clicked g3"]);
  expect(await read(page, "grp.checkState")).toEqual([2]);

  // Check boxes in a group exclude each other too.
  await click(page, "l2");
  await said(page, ["listed.checkedButton l2"]);
  expect(await read(page, "l1.checked", "l2.checked", "listed.checkState")).toEqual([false, true, 1]);
  await click(page, "l2");
  await said(page, []);
  expect(await read(page, "l1.checked", "l2.checked")).toEqual([false, true]);
});

test("a check box and a group bound to each other check all or none", async ({ page }) => {
  await still(page);
  const state = () => read(page, "multi.checkState", "all.checkState", "all.checked", "m1.checked", "m2.checked");
  await click(page, "m2");
  await said(page, ["m2.checked true", "multi.checkState 2", "all.checkState 2"]);
  expect(await state()).toEqual([2, 2, true, true, true]);
  await click(page, "all");
  await said(page, ["all.checkState 0", "m2.checked false", "m1.checked false", "multi.checkState 0"]);
  expect(await state()).toEqual([0, 0, false, false, false]);
  await click(page, "all");
  await said(page, ["all.checkState 2", "m2.checked true", "m1.checked true", "multi.checkState 2"]);
  expect(await state()).toEqual([2, 2, true, true, true]);
  await click(page, "m1");
  await said(page, ["m1.checked false", "multi.checkState 1", "all.checkState 1"]);
  expect(await state()).toEqual([1, 1, false, false, true]);
  await click(page, "all");
  await said(page, ["all.checkState 2", "m1.checked true", "multi.checkState 2"]);
  expect(await state()).toEqual([2, 2, true, true, true]);
});

test("a button does its action, and is what the action is", async ({ page }) => {
  await still(page);
  const checked = () => read(page, "act.checked", "ab.checked", "ab2.checked");
  // Every button of the action is clicked when it is triggered. Qt tells
  // them in the order it heard of them, which is last first.
  await click(page, "ab");
  await said(page, ["act.checked true", "ab.checked true", "ab.toggled", "act.toggled Act", "act.triggered Act", "ab.clicked", "ab2.clicked"]);
  expect(await checked()).toEqual([true, true, true]);
  await click(page, "ab2");
  await said(page, ["act.checked false", "ab.checked false", "act.toggled own", "act.triggered own", "ab.clicked", "ab2.clicked"]);
  expect(await checked()).toEqual([false, false, false]);
  await call(page, "act.trigger");
  await said(page, ["act.checked true", "ab.checked true", "act.toggled none", "act.triggered none", "ab.clicked", "ab2.clicked"]);
  await call(page, "act.toggle");
  await said(page, ["act.checked false", "ab.checked false", "act.toggled none"]);
  await set(page, "act.checked", true);
  await said(page, ["act.checked true", "ab.checked true"]);
  await set(page, "ab.checked", false);
  await said(page, ["act.checked false", "ab.checked false"]);
  expect(await checked()).toEqual([false, false, false]);
  await call(page, "ab.toggle");
  await said(page, ["act.checked true", "ab.checked true"]);

  // Its key does it too. Which of its buttons is said to have: the first
  // here, the last in Qt.
  await page.keyboard.press("Control+e");
  await said(page, ["act.checked false", "ab.checked false", "act.toggled Act", "act.triggered Act", "ab.clicked", "ab2.clicked"]);

  await page.evaluate(() => {
    window.scene.act.text = "New";
    window.scene.act.icon.name = "new";
  });
  await said(page, []);
  expect(await read(page, "ab.text", "ab.icon.name", "ab2.text", "ab2.icon.name")).toEqual(["New", "new", "own", "own"]);
});

test("a button is as able as its action, and an action that is not does nothing", async ({ page }) => {
  await still(page);
  await set(page, "act.enabled", false);
  await said(page, ["ab.enabled false"]);
  expect(await read(page, "ab.enabled", "ab2.enabled")).toEqual([false, false]);
  await click(page, "ab");
  await call(page, "act.trigger");
  await page.keyboard.press("Control+e");
  await call(page, "ab.click");
  await said(page, []);
  expect(await read(page, "act.checked")).toEqual([false]);
  await page.evaluate(() => {
    window.scene.act.enabled = true;
    window.scene.ab.enabled = false;
  });
  expect(await read(page, "ab.enabled", "act.enabled")).toEqual([false, true]);
  await page.evaluate(() => window.scene.take());
  // A button that is disabled itself is not clicked by its action.
  await call(page, "act.trigger");
  await said(page, ["act.checked true", "ab.checked true", "act.toggled none", "act.triggered none", "ab2.clicked"]);
  await set(page, "act.checkable", false);
  await said(page, []);
  expect(await read(page, "ab.checkable", "ab2.checkable", "act.checked")).toEqual([false, false, true]);
  await click(page, "ab2");
  await said(page, ["act.triggered own", "ab2.clicked"]);
  expect(await read(page, "act.checked", "ab2.checked")).toEqual([true, true]);
});

test("one action of a group is checked", async ({ page }) => {
  await still(page);
  const checked = () => read(page, "x1.checked", "x2.checked", "bx1.checked", "bx2.checked");
  await click(page, "bx2");
  await said(page, [
    "x2.checked true",
    "x1.checked false",
    "bx1.checked false",
    "ag.checkedAction x2",
    "bx2.checked true",
    "bx2.toggled",
    "x2.triggered",
    "ag.triggered x2",
    "bx2.clicked",
  ]);
  expect(await checked()).toEqual([false, true, false, true]);
  // The checked one stays so, and is triggered all the same.
  await click(page, "bx2");
  await said(page, ["x2.triggered", "ag.triggered x2", "bx2.clicked"]);
  expect(await checked()).toEqual([false, true, false, true]);
  await call(page, "x1.trigger");
  await said(page, ["x1.checked true", "x2.checked false", "bx2.checked false", "ag.checkedAction x1", "bx1.checked true", "ag.triggered x1"]);
  expect(await checked()).toEqual([true, false, true, false]);
  await page.evaluate(() => (window.scene.ag.checkedAction = window.scene.x2));
  await said(page, ["x1.checked false", "bx1.checked false", "x2.checked true", "bx2.checked true", "ag.checkedAction x2"]);

  // A group that is disabled disables its actions, and their buttons.
  await set(page, "ag.enabled", false);
  await said(page, ["x1.enabled false"]);
  expect(await read(page, "x1.enabled", "x2.enabled", "bx1.enabled")).toEqual([false, false, false]);
  await click(page, "bx1");
  await said(page, []);
  expect(await read(page, "x1.checked")).toEqual([false]);
  await set(page, "ag.enabled", true);
  await call(page, "ag.removeAction", "@x2");
  await said(page, ["x1.enabled true", "x2.checked false", "bx2.checked false", "ag.checkedAction none"]);
  expect(await read(page, "x2.checked", "ag.actions.length")).toEqual([false, 1]);
  await set(page, "ag2.enabled", true);
  expect(await read(page, "loose.enabled")).toEqual([true]);

  // What the action gave the button stays when the action is gone, but for
  // its text.
  await set(page, "bx1.action", null);
  await said(page, []);
  expect(await read(page, "bx1.text", "bx1.checkable", "bx1.checked", "bx1.enabled")).toEqual(["", true, false, true]);
});
