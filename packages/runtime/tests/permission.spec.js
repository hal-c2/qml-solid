import { expect, open, test } from "./open.js";

const UNDETERMINED = 0;
const GRANTED = 1;
const DENIED = 2;

const read = (page) => page.evaluate(() => window.scene.read());
const status = (page, status) => page.waitForFunction((status) => window.scene.permission.status === status, status);

test("a LocationPermission is granted where the browser grants it", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 52.37, longitude: 4.9 });
  await open(page, "permission");
  // Qt's names for the answers and for what is asked.
  expect(await page.evaluate(() => window.scene.names())).toEqual([0, 1, 2, 0, 1, 0, 1]);
  await status(page, GRANTED);
  // What Qt says on a desktop, where nothing is forbidden.
  expect(await read(page)).toEqual([GRANTED, 1, 0, GRANTED, 0, 0]);
  expect(await page.evaluate(() => window.scene.permission.request())).toBeUndefined();
  expect(await read(page)).toEqual([GRANTED, 1, 0, GRANTED, 0, 0]);
  expect(await page.evaluate(() => window.scene.seen)).toEqual(["status 1"]);
});

test("a LocationPermission is undetermined until the browser is asked, and all of them hear its answer", async ({
  page,
}) => {
  await open(page, "permission");
  expect(await read(page)).toEqual([UNDETERMINED, 1, 0, UNDETERMINED, 0, 0]);
  // Nobody is there to answer a browser under test: it says no.
  await page.evaluate(() => window.scene.other.request());
  await status(page, DENIED);
  expect(await read(page)).toEqual([DENIED, 1, 0, DENIED, 0, 0]);
  expect(await page.evaluate(() => window.scene.seen)).toEqual(["status 2"]);
});
