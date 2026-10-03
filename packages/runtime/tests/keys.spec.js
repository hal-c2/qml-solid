// Focus and keys, typed on the browser's own keyboard. What is expected is
// what Qt 6.11 logs for the same scene and the same keys.
import { expect, open, test } from "./open.js";

const log = (page) => page.evaluate(() => window.objects.log.splice(0));
// The items of the scene that have active focus.
const active = (page) =>
  page.evaluate(() => Object.keys(window.objects).filter((name) => window.objects[name].activeFocus === true));
const press = async (page, key) => {
  await page.keyboard.press(key);
  return log(page);
};
const Key = { Left: 16777234, Right: 16777236, Tab: 16777217, Backtab: 16777218, Shift: 16777248, Control: 16777249 };

test("of the items that ask for focus in a scope, the first has it", async ({ page }) => {
  await open(page, "keys");
  const state = await page.evaluate(() => {
    const names = ["first", "second", "third", "nested", "scope", "inScopeA", "inScopeB", "scope2", "s2b"];
    return names.map((name) => [name, window.objects[name].focus, window.objects[name].activeFocus]);
  });
  expect(state).toEqual([
    ["first", true, true],
    ["second", false, false],
    ["third", false, false],
    ["nested", false, false],
    ["scope", false, false],
    // In a scope that has no focus, an item has focus and no keys.
    ["inScopeA", true, false],
    ["inScopeB", false, false],
    ["scope2", false, false],
    ["s2b", true, false],
  ]);
  await page.evaluate(() => (window.objects.second.focus = true));
  expect(await log(page)).toEqual(["first focus false", "first active false", "second focus true", "second active true"]);
  expect(await active(page)).toEqual(["second"]);
  // An item in one that is no scope shares the scope around them.
  await page.evaluate(() => (window.objects.nested.focus = true));
  expect(await active(page)).toEqual(["nested"]);
  expect(await page.evaluate(() => [window.objects.second.focus, window.objects.third.focus])).toEqual([false, false]);
});

test("a scope gives its focus to the item that has it inside", async ({ page }) => {
  await open(page, "keys");
  await page.evaluate(() => (window.objects.scope.focus = true));
  expect(await log(page)).toEqual([
    "first focus false",
    "first active false",
    "scope focus true",
    "scope active true",
    "inScopeA active true",
  ]);
  expect(await active(page)).toEqual(["scope", "inScopeA"]);
  await page.evaluate(() => window.objects.inScopeB.forceActiveFocus());
  await log(page);
  await page.evaluate(() => (window.objects.scope.focus = false));
  expect(await log(page)).toEqual(["inScopeB active false", "scope focus false", "scope active false"]);
  // The item keeps the focus of its scope, for when the scope has it again.
  expect(await page.evaluate(() => window.objects.inScopeB.focus)).toBe(true);
  expect(await active(page)).toEqual([]);
  await page.evaluate(() => window.objects.inScopeA.forceActiveFocus());
  expect(await log(page)).toEqual([
    "inScopeB focus false",
    "inScopeA focus true",
    "scope focus true",
    "scope active true",
    "inScopeA active true",
  ]);
  await page.evaluate(() => (window.objects.inScopeA.focus = false));
  expect(await log(page)).toEqual(["inScopeA focus false", "inScopeA active false"]);
  expect(await active(page)).toEqual(["scope"]);
});

test("a key goes to the item with active focus, then up while nobody accepts it", async ({ page }) => {
  await open(page, "keys");
  await page.evaluate(() => (window.objects.second.focus = true));
  await log(page);
  expect(await press(page, "x")).toEqual([
    "second pressed key=88 text='x' mod=0 rep=false acc=false",
    "root pressed 88",
    "second released key=88 acc=false",
  ]);
  // The handler of the very key accepts it, unless it says it does not.
  expect(await press(page, "Enter")).toEqual(["second return acc=true", "second released key=16777220 acc=false"]);
  expect(await press(page, "ArrowLeft")).toEqual([
    "second left",
    `second pressed key=${Key.Left} text='' mod=0 rep=false acc=false`,
    `root pressed ${Key.Left}`,
    `second released key=${Key.Left} acc=false`,
  ]);
  expect(await press(page, "1")).toEqual(["second digit1", "second released key=49 acc=false"]);
  expect(await press(page, " ")).toEqual(["second space", "second released key=32 acc=false"]);
  expect(await press(page, "Shift+Z")).toEqual([
    `second pressed key=${Key.Shift} text='' mod=33554432 rep=false acc=false`,
    `root pressed ${Key.Shift}`,
    "second pressed key=90 text='Z' mod=33554432 rep=false acc=false",
    "root pressed 90",
    "second released key=90 acc=false",
    `second released key=${Key.Shift} acc=false`,
  ]);
  await page.keyboard.down("q");
  await page.keyboard.down("q");
  await page.keyboard.up("q");
  expect(await log(page)).toEqual([
    "second pressed key=81 text='q' mod=0 rep=false acc=false",
    "root pressed 81",
    "second pressed key=81 text='q' mod=0 rep=true acc=false",
    "root pressed 81",
    "second released key=81 acc=false",
  ]);
  await page.evaluate(() => (window.objects.nested.focus = true));
  await log(page);
  expect(await press(page, "b")).toEqual(["nested pressed 66", "third pressed 66", "root pressed 66"]);
  expect(await press(page, "c")).toEqual(["nested pressed 67"]);
});

test("Tab that nobody accepts moves focus to the next tab stop", async ({ page }) => {
  await open(page, "keys");
  await page.evaluate(() => (window.objects.second.focus = true));
  await log(page);
  expect(await press(page, "Tab")).toEqual([
    "second tab",
    `second pressed key=${Key.Tab} text='\t' mod=0 rep=false acc=false`,
    `root pressed ${Key.Tab}`,
    "second focus false",
    "second active false",
  ]);
  expect(await active(page)).toEqual(["scope2", "s2a"]);
  const chain = await page.evaluate(() => {
    const { s2a, s2b, s2c, s2d, s2e, s2f } = window.objects;
    const name = (item) => Object.keys(window.objects).find((name) => window.objects[name] === item);
    return [
      name(s2b.nextItemInFocusChain()),
      name(s2b.nextItemInFocusChain(false)),
      name(s2d.nextItemInFocusChain()),
      name(s2e.nextItemInFocusChain()),
      name(s2a.nextItemInFocusChain(false)),
    ];
  });
  // One that is not shown is passed over; a child comes after its parent.
  expect(chain).toEqual(["s2d", "s2a", "s2e", "s2a", "s2e"]);
  await page.evaluate(() => window.objects.s2b.forceActiveFocus());
  const stops = [];
  for (const key of ["Tab", "Tab", "Tab", "Tab", "Shift+Tab", "Shift+Tab"]) {
    await page.keyboard.press(key);
    stops.push((await active(page))[1]);
  }
  expect(stops).toEqual(["s2d", "s2e", "s2a", "s2b", "s2a", "s2e"]);
});

test("KeyNavigation leads focus where the arrows point, and back", async ({ page }) => {
  await open(page, "keys");
  await page.evaluate(() => (window.objects.scope.focus = true));
  await log(page);
  expect(await press(page, "b")).toEqual(["inScopeA pressed 66", "scope pressed 66", "root pressed 66"]);
  expect(await press(page, "ArrowRight")).toEqual([
    `inScopeA pressed ${Key.Right}`,
    "inScopeA focus false",
    "inScopeA active false",
    "inScopeB focus true",
    "inScopeB active true",
  ]);
  // The way back was never declared: it is the way there, reversed.
  expect(await press(page, "ArrowLeft")).toEqual([
    `inScopeB pressed ${Key.Left}`,
    "inScopeB focus false",
    "inScopeB active false",
    "inScopeA focus true",
    "inScopeA active true",
  ]);
  expect(await press(page, "Tab")).toEqual([
    `inScopeA pressed ${Key.Tab}`,
    "inScopeA focus false",
    "inScopeA active false",
    "inScopeB focus true",
    "inScopeB active true",
  ]);
  expect(await press(page, "Shift+Tab")).toEqual([
    `inScopeB pressed ${Key.Shift}`,
    `scope pressed ${Key.Shift}`,
    `root pressed ${Key.Shift}`,
    `inScopeB pressed ${Key.Backtab}`,
    "inScopeB focus false",
    "inScopeB active false",
    "inScopeA focus true",
    "inScopeA active true",
  ]);
});

test("Keys forwards to other items, comes after the item if told to, and can be turned off", async ({ page }) => {
  await open(page, "keys");
  await page.evaluate(() => window.objects.fwd.forceActiveFocus());
  await log(page);
  expect(await press(page, "b")).toEqual(["fwdTarget pressed 66"]);
  expect(await press(page, "e")).toEqual(["fwdTarget pressed 69", "fwd pressed 69", "root pressed 69"]);
  await page.evaluate(() => window.objects.after.forceActiveFocus());
  expect(await press(page, "z")).toEqual(["after pressed", "root pressed 90"]);
  await page.evaluate(() => window.objects.muted.forceActiveFocus());
  expect(await press(page, "z")).toEqual(["root pressed 90"]);
});

test("a shortcut takes its key before any item is asked", async ({ page }) => {
  await open(page, "keys");
  await page.evaluate(() => window.objects.fwd.forceActiveFocus());
  await log(page);
  expect(await press(page, "a")).toEqual(["shortcut A"]);
  const control = [`fwdTarget pressed ${Key.Control}`, `fwd pressed ${Key.Control}`, `root pressed ${Key.Control}`];
  expect(await press(page, "Control+k")).toEqual([...control, "shortcut ctrl+k"]);
  expect(await press(page, "F5")).toEqual(["shortcut j/f5"]);
  expect(await press(page, "Control+j")).toEqual([...control, "shortcut j/f5"]);
  expect(await press(page, "Control+o")).toEqual([...control, "shortcut open"]);
  // Two for one key take turns, and say they are not alone.
  expect(await press(page, "Control+d")).toEqual([...control, "other of two"]);
  expect(await press(page, "Control+d")).toEqual([...control, "one of two"]);
  expect(await press(page, "Control+d")).toEqual([...control, "other of two"]);
  const texts = await page.evaluate(() => {
    const { opener, letter } = window.objects;
    return [opener.nativeText, opener.portableText, letter.portableText];
  });
  expect(texts).toEqual(["Ctrl+O", "Ctrl+O", "A"]);
  // One that is turned off leaves the key to the items.
  await page.evaluate(() => (window.objects.letter.enabled = false));
  expect(await press(page, "a")).toEqual(["fwdTarget pressed 65", "fwd pressed 65", "root pressed 65"]);
});

const focused = (page, name) => page.evaluate((name) => document.activeElement === window.objects[name].$input, name);

test("a text field has the page's focus while it has active focus, and only then", async ({ page }) => {
  await open(page, "keysfield");
  expect(await page.evaluate(() => [window.objects.field.focus, window.objects.field.activeFocus])).toEqual([true, false]);
  expect(await focused(page, "field")).toBe(false);
  await page.evaluate(() => (window.objects.scope.focus = true));
  expect(await log(page)).toEqual(["field active true"]);
  expect(await focused(page, "field")).toBe(true);
  await page.evaluate(() => window.objects.other.forceActiveFocus());
  expect(await log(page)).toEqual(["field active false", "other active true"]);
  expect(await focused(page, "field")).toBe(false);
  // A click into the field is a click on what the page would focus.
  const box = await page.evaluate(() => {
    const { x, y } = window.objects.field.$input.getBoundingClientRect();
    return { x, y };
  });
  await page.mouse.click(box.x + 5, box.y + 5);
  expect(await log(page)).toEqual(["other active false", "field active true"]);
  expect(await page.evaluate(() => [window.objects.scope.activeFocus, window.objects.field.activeFocus])).toEqual([true, true]);
  await page.mouse.click(5, 130);
  expect(await page.evaluate(() => window.objects.notes.activeFocus)).toBe(true);
  expect(await focused(page, "notes")).toBe(true);
  expect(await log(page)).toEqual(["field active false"]);
});

test("a key typed into a field is offered to Keys first, and to its parents if the field has no use for it", async ({
  page,
}) => {
  await open(page, "keysfield");
  await page.evaluate(() => window.objects.field.forceActiveFocus());
  await page.keyboard.press("End");
  await log(page);
  expect(await press(page, "c")).toEqual(["field pressed 67"]);
  // What `Keys` accepts is not typed.
  expect(await press(page, "x")).toEqual(["field pressed 88"]);
  expect(await page.evaluate(() => window.objects.field.text)).toBe("abc");
  // Return is the field's, and its parents' after it.
  expect(await press(page, "Enter")).toEqual(["field pressed 16777220", "accepted abc", "root pressed 16777220"]);
  // The end of the text is as far as the cursor goes: the key goes on.
  expect(await press(page, "ArrowRight")).toEqual([`field pressed ${Key.Right}`, `root pressed ${Key.Right}`]);
  expect(await press(page, "ArrowLeft")).toEqual([`field pressed ${Key.Left}`]);
  expect(await page.evaluate(() => window.objects.field.cursorPosition)).toBe(2);
  // Down means nothing in one line, so it leads where KeyNavigation says.
  expect(await press(page, "ArrowDown")).toEqual(["field pressed 16777237", "field active false", "other active true"]);
  expect(await focused(page, "field")).toBe(false);
  expect(await press(page, "y")).toEqual(["other pressed 89", "root pressed 89"]);
  expect(await page.evaluate(() => window.objects.field.text)).toBe("abc");
});

test("a TextEdit takes Return for a new line and leaves what it has a handler for", async ({ page }) => {
  await open(page, "keysfield");
  await page.evaluate(() => window.objects.notes.forceActiveFocus());
  await page.keyboard.type("hi");
  await page.keyboard.press("Enter");
  await page.keyboard.type("x");
  expect(await page.evaluate(() => window.objects.notes.text)).toBe("hi\nx");
  expect(await log(page)).toEqual([]);
  expect(await press(page, "Escape")).toEqual(["notes escape"]);
});

test("a Window says which of its items the keys go to", async ({ page }) => {
  await open(page, "window");
  const got = await page.evaluate(() => {
    const { win, grand } = window.objects;
    const before = win.activeFocusItem;
    grand.forceActiveFocus();
    return [before, win.activeFocusItem === grand, grand.activeFocus];
  });
  expect(got).toEqual([null, true, true]);
});
