// A signal handler among a state's changes, with what Qt logs for the same
// scene.
import { expect, open, test } from "./open.js";

const QT = [
  "plain 0",
  "plain prod",
  "own width 1",
  "on 3",
  "on prod",
  "called you",
  "on width 2",
  "further 7",
  "on prod",
  "called you",
  "on width 3",
  "on 11",
  "on prod",
  "called you",
  "on width 4",
  "plain 15",
  "plain prod",
  "own width 5",
];

test("a state's handler of a signal is the signal's while the state is the item's", async ({ page }) => {
  await open(page, "replaced");
  expect(await page.evaluate(() => window.scene.read())).toEqual(QT);
});
