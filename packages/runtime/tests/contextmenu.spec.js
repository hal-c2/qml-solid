// ContextMenu. What is noted is what Qt 6.11 notes when QtTest clicks the
// same places with the right button.
import { take } from "./notes.js";
import { expect, open, test } from "./open.js";

const at = { outer: [20, 20], inner: [50, 30], silent: [50, 80], field: [20, 160] };
const ask = (page, name, x, y, button = "right") => page.mouse.click(at[name][0] + x, at[name][1] + y, { button });

test("an item is asked for its menu where the right button was, and a field where its cursor is", async ({ page }) => {
  await open(page, "contextmenu");
  await expect.poll(() => page.evaluate(() => window.scene.ready)).toBe(true);
  await ask(page, "outer", 5, 6);
  expect(await take(page)).toEqual(["outer 5,6"]);
  await ask(page, "inner", 5, 6);
  expect(await take(page)).toEqual(["inner 5,6"]);
  // One that has neither a menu nor anyone listening keeps it from what it is in.
  await ask(page, "silent", 7, 8);
  expect(await take(page)).toEqual([]);
  await ask(page, "outer", 5, 6, "left");
  expect(await take(page)).toEqual([]);
  await page.mouse.click(300, 250, { button: "right" });
  expect(await take(page)).toEqual([]);

  // Beside the text, so that the page does not move the cursor to the mouse.
  await ask(page, "field", 100, 25);
  expect(await take(page)).toEqual(["field 29,11"]);
  await page.evaluate(() => (window.scene.field.cursorPosition = 1));
  await ask(page, "field", 100, 25);
  expect(await take(page)).toEqual(["field 13,11"]);
  await page.evaluate(() => (window.scene.field.horizontalAlignment = 2));
  await ask(page, "field", 100, 25);
  expect(await take(page)).toEqual(["field 185,11"]);
  await page.evaluate(() => (window.scene.field.verticalAlignment = 128));
  await ask(page, "field", 100, 2);
  expect(await take(page)).toEqual(["field 185,17"]);
});

// The menu is Qt's `Menu`, which is not written here: what stands in for it
// says what it was asked.
test("the menu of a ContextMenu is made when it is asked for, and popped up in its item", async ({ page }) => {
  await open(page, "contextmenu");
  const made = () => page.evaluate(() => window.scene.made);
  expect(await made()).toBe(0);
  await page.mouse.click(260, 30, { button: "right" });
  expect(await made()).toBe(1);
  expect(await take(page)).toEqual(["popup 10,10 true"]);
  await page.mouse.click(270, 45, { button: "right" });
  expect(await made()).toBe(1);
  expect(await take(page)).toEqual(["popup 20,25 true"]);
});
