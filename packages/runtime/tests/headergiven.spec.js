// What is expected of `across` and `down` is what Qt 6.11 answers for a
// header view given a TableModel; of `titles` and `rows`, what follows for
// a model that names its header.
import { expect, open, test } from "./open.js";

test("a header view given a table model shows the model's header", async ({ page }) => {
  await open(page, "headergiven");
  const read = () => page.evaluate(() => window.scene.read());
  const START = {
    across: [1, 6, "display"],
    acrossCells: [
      [0, 0, 0, 1, 1, 0, 0],
      [1, 0, 30, 2, 2, 0, 1],
      [2, 0, 60, 3, 3, 0, 2],
      [3, 0, 90, 4, 4, 0, 3],
      [4, 0, 120, 5, 5, 0, 4],
      [5, 0, 150, 6, 6, 0, 5],
    ],
    down: [2, 1, "display"],
    downCells: [
      [0, 0, 0, 1, 0, 0],
      [0, 1, 15, 2, 1, 0],
    ],
    titles: ["A", "B", "C", "D", "E", "F"],
    rows: ["r0", "r1"],
  };
  expect(await read()).toEqual(START);
  await page.evaluate(() => {
    window.scene.step(0);
    window.flush();
  });
  expect(await read()).toEqual({
    ...START,
    down: [3, 1, "display"],
    downCells: [...START.downCells, [0, 2, 30, 3, 2, 0]],
    rows: ["r0", "r1", "r2"],
  });
});
