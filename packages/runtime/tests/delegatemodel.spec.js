// What is expected here is what Qt 6.11 answers for the same QML (`qml6`).
import { expect, open, test } from "./open.js";

const row = (name, index, count) => [name, index, true, false, "items", false, count, count, "items", 0, true, name];
const LONE = [-1, false, null, ""];

test("a delegate finds its row and its view's DelegateModel", async ({ page }) => {
  await open(page, "delegatemodel");
  const read = () => page.evaluate(() => window.scene.read());
  const step = (index) => page.evaluate((index) => window.scene.step(index), index);
  expect(await read()).toEqual([row("a", 0, 3), row("c", 2, 3), ["b", 1, true, 3], ["a0", true, 0], ["b1", true, 20], LONE, [3, 3, 3, 1]]);

  // A row that moved is elsewhere in `items`.
  await step(0);
  expect(await read()).toEqual([row("a", 2, 3), row("c", 1, 3), ["c", 1, true, 3], ["a2", true, 40], ["b0", true, 0], LONE, [3, 3, 3, 1]]);

  await step(1);
  expect(await read()).toEqual([row("a", 2, 4), row("c", 1, 4), ["c", 1, true, 4], ["a2", true, 40], ["b0", true, 0], LONE, [4, 4, 4, 1]]);
});
