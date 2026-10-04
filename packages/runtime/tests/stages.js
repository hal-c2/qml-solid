// A scene that Qt was asked too: `read()` is what it answers, at first and
// after each `step(i)`. `expected` is what Qt 6.11 answered, a row a stage.
import { expect } from "./open.js";

const read = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.scene.read())));

export async function stages(page, expected) {
  await expect.poll(() => read(page)).not.toBeNull();
  for (let at = 0; at < expected.length; at++) {
    expect(await read(page), at ? `after step ${at - 1}` : "at first").toEqual(expected[at]);
    if (at < expected.length - 1) await page.evaluate((index) => window.scene.step(index), at);
  }
}
