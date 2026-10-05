import { expect, open, test } from "./open.js";

// Qt's own answers. A page pushed with `{ toyIndex: … }` reads what that
// makes of its model in `Component.onCompleted`: of a StackView's item, of
// what `createObject` makes and of what a Loader's `setSource` loads.
test("what is given an alias as an object is made is there when it is complete", async ({ page }) => {
  await open(page, "pushedalias");
  expect(await page.evaluate(() => window.scene.read())).toEqual(["2:cat", "2:cat", "1:bee", "1:bee", "0:ant", "0:ant", "2:cat", "2:cat", 400, 300]);
});
