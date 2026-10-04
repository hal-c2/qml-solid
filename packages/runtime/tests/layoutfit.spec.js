import { expect, open, test } from "./open.js";

// What Qt 6.11 answers for the same scene.
test("A layout gives no size to an item that has it already", async ({ page }) => {
  await open(page, "layoutfit");
  const read = () => page.evaluate(() => window.scene.read());
  const pad = (left) => page.evaluate((left) => window.scene.pad(left), left);
  // The icon is a picture, which the browser has later than Qt.
  await expect.poll(read).toEqual([60, 96, 0, 18, 60, 60, 60, 60, 60, 60, 60, 24, 24, 60, 60, 60, 60]);
  await pad(10);
  expect(await read()).toEqual([60, 96, 0, 18, 60, 60, 60, 60, 60, 60, 60, 24, 32, 60, 60, 60, 60]);
  await pad(30);
  expect(await read()).toEqual([60, 96, 0, 18, 72, 60, 72, 60, 72, 60, 60, 24, 24, 72, 60, 72, 60]);
  await pad(18);
  expect(await read()).toEqual([60, 96, 0, 18, 60, 60, 60, 60, 60, 60, 60, 24, 24, 60, 60, 60, 60]);
});
