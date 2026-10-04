// What a test does to a scene as a QtTest `TestCase` did it under Qt: a move
// is `[what, x, y, key held]`, and a step is the moves and the parts of what
// the scene's `read()` answers that they change: at first, all of them.
import { expect, open } from "./open.js";

const KEYS = { shift: "Shift", ctrl: "Control" };

export async function act(page, [what, x, y, held]) {
  if (what === "step") {
    return page.evaluate((index) => {
      window.scene.step(index);
      window.flush();
    }, x);
  }
  // Time stands still, but for what the test lets pass.
  if (what === "wait") return page.evaluate((ms) => window.clock.advance(ms), x);
  if (held) await page.keyboard.down(KEYS[held]);
  if (what === "press") {
    await page.mouse.move(x, y);
    await page.mouse.down();
  } else if (what === "move") await page.mouse.move(x, y);
  else await page.mouse.up();
  if (held) await page.keyboard.up(KEYS[held]);
}

export const read = (page) => page.evaluate(() => window.scene.read());

export async function still(page, scene) {
  await open(page, scene);
  await page.evaluate(() => window.clock.stop());
}

export async function follow(page, scene, steps) {
  await still(page, scene);
  let expected = {};
  for (const [index, [moves, changed]] of steps.entries()) {
    for (const move of moves) await act(page, move);
    expected = { ...expected, ...changed };
    expect(await read(page), `step ${index}`).toEqual(expected);
  }
}
