// What is expected here is what Qt 6.11 answers for the same QML, run with
// `qml6` and asked after each step.
import { expect, open, test } from "./open.js";

// A cell: what it shows, `current`, `selected`, `editing`, and whether its
// `tableView` is the table.
const cell = (shown, current = false, selected = false) => [shown, current, selected, false, true];

// What `read()` answers at the start, part by part.
const START = {
  said: [cell("cat"), cell("black"), cell("dog"), cell("brown")],
  typed: [cell("not"), cell("not"), cell("not"), cell("not")],
  styled: [cell("0,0 cat"), cell("0,1 black"), cell("1,0 dog"), cell("1,1 brown")],
  // A header's `headerView` and its `tableView` are both the header.
  heads: [["first", true, true], ["second", true, true]],
};

// Each step, and the parts it changes.
const STEPS = [
  // said.selectionModel.setCurrentIndex(said.index(1, 0), ItemSelectionModel.Select)
  { said: [cell("cat"), cell("black"), cell("dog", true, true), cell("brown")] },
  // typed.selectionModel.setCurrentIndex(typed.index(0, 1), ItemSelectionModel.Select)
  { typed: [cell("not"), cell("current", true, true), cell("not"), cell("not")] },
  // styled.selectionModel.select(styled.index(1, 1), ItemSelectionModel.Select)
  { styled: [cell("0,0 cat"), cell("0,1 black"), cell("1,0 dog"), cell("1,1 brown", false, true)] },
];

test("a table gives a delegate what it requires, wherever that is said", async ({ page }) => {
  await open(page, "tablerequired");
  const read = () => page.evaluate(() => window.scene.read());
  let expected = START;
  expect(await read()).toEqual(expected);
  for (const [index, changed] of STEPS.entries()) {
    await page.evaluate((index) => {
      window.scene.step(index);
      window.flush();
    }, index);
    expected = { ...expected, ...changed };
    expect(await read(), `step ${index}`).toEqual(expected);
  }
});
