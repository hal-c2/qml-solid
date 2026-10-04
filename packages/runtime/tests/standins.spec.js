import { expect, open, test } from "./open.js";

// `Meter` and `Engine` are in no file next to the scene: the module it
// imports is one of QML that stands in for a program's C++, which the build
// is told of.
test("a type the program has in C++ is the QML that stands in for it", async ({ page }) => {
  await open(page, "standins");
  const read = () => page.evaluate(() => window.scene.read());
  expect(await read()).toEqual([4, "4 of 10", 10, []]);
  await page.evaluate(() => window.scene.step(0));
  expect(await read()).toEqual([7, "7 of 10", 10, []]);
  await page.evaluate(() => window.scene.step(1));
  expect(await read()).toEqual([10, "10 of 10", 10, [10]]);
  await page.evaluate(() => window.scene.step(2));
  expect(await read()).toEqual([10, "10 of 12", 12, [10]]);
});
