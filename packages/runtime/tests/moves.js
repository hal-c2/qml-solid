// Plays to a scene what a QtTest `TestCase` did to the same scene under
// Qt 6.11, move by move, and expects what Qt noted (`take()`) and answered
// (`state()`) after each.
//
// A move is `step N` (the scene's own), `move X Y`, `press X Y`,
// `release X Y`, `rpress X Y` and `rrelease X Y` with the right button,
// `key Name`, `alt Letter` (the letter with Alt held), `wheel X Y DELTA` and
// `wait MS`. Qt's mouse was moved to where it pressed before the press, and
// where it let go before and after: QtTest leaves what hovers as it was
// until a move, and a real mouse does not.
import { expect, open } from "./open.js";

const KEYS = { Backtab: "Shift+Tab", Return: "Enter", Up: "ArrowUp", Down: "ArrowDown", Left: "ArrowLeft", Right: "ArrowRight" };
const advance = (page, ms) => page.evaluate((ms) => window.clock.advance(ms), ms);

async function make(page, move) {
  const [what, ...args] = move.split(" ");
  const [x, y, z] = args.map(Number);
  switch (what) {
    case "step":
      return page.evaluate((index) => window.scene.step(index), x);
    case "move":
      return page.mouse.move(x, y);
    case "press":
    case "rpress":
      await page.mouse.move(x, y);
      return page.mouse.down({ button: what === "press" ? "left" : "right" });
    case "release":
    case "rrelease":
      await page.mouse.move(x, y);
      await page.mouse.up({ button: what === "release" ? "left" : "right" });
      // Time enough for the next press not to be the second of a double
      // click: QtTest does the same.
      return advance(page, 500);
    case "key":
      return page.keyboard.press(KEYS[args[0]] ?? (args[0].length === 1 ? `Key${args[0]}` : args[0]));
    case "alt":
      return page.keyboard.press(`Alt+Key${args[0]}`);
    case "wheel":
      await page.mouse.move(x, y);
      // A notch of Qt's wheel is 120, and a browser's 100 pixels the other
      // way.
      return page.mouse.wheel(0, (-z / 120) * 100);
    case "wait":
      return advance(page, x);
  }
}

// `moves` is a list of `[move, noted, state]`, the first with no move: how
// the scene starts.
export async function play(page, scene, moves) {
  await open(page, scene);
  await page.evaluate(() => window.clock.stop());
  for (let index = 0; index < moves.length; index++) {
    const [move, noted, state] = moves[index];
    await make(page, move);
    const got = await page.evaluate(() => JSON.parse(JSON.stringify([window.scene.take(), window.scene.state()])));
    expect(got, `${index}: ${move || "at first"}`).toEqual([noted, state]);
  }
}
