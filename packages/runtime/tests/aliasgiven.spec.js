import { expect, open, test } from "./open.js";

// The binding reads the alias before the object it is an alias of is made:
// what the instance gives is there to read all the same, and no warning of
// a null one is told.
test("what an instance gives an alias is read by bindings made before its target", async ({ page }) => {
  await open(page, "aliasgiven");
  const read = () => page.evaluate(() => window.scene.read());
  expect(await read()).toEqual([60, true, false]);
  await page.evaluate(() => window.scene.step(0));
  expect(await read()).toEqual([80, true, false]);
  await page.evaluate(() => window.scene.step(1));
  expect(await read()).toEqual([160, false, true]);
});
