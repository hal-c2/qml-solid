// What the scenes of controls have in common: they note what their controls
// say, a test takes the notes, and compares them with Qt's.
import { expect } from "./open.js";

export const take = (page) => page.evaluate(() => window.scene.take());

// Properties of the scene's objects, by path: `sw.position`.
export const read = (page, ...names) =>
  page.evaluate((names) => names.map((name) => name.split(".").reduce((at, part) => at[part], window.scene)), names);

export const set = (page, name, value) =>
  page.evaluate(
    ([name, value]) => {
      const path = name.split(".");
      const last = path.pop();
      path.reduce((at, part) => at[part], window.scene)[last] = value;
    },
    [name, value],
  );

export const call = (page, name, ...given) =>
  page.evaluate(
    ([name, given]) => {
      const path = name.split(".");
      const last = path.pop();
      const of = (at) => (typeof at === "string" && at.startsWith("@") ? window.scene[at.slice(1)] : at);
      return path.reduce((at, part) => at[part], window.scene)[last](...given.map(of));
    },
    [name, given],
  );

export const advance = (page, ms) => page.evaluate((ms) => window.clock.advance(ms), ms);

// The scene with time standing still: a test moves it.
export async function still(page, scene) {
  await page.goto(`/?scene=${scene}`);
  await page.waitForFunction(() => window.ready);
  await page.evaluate(() => {
    window.clock.stop();
    window.scene.take();
  });
}

const SIGNAL =
  /^\w+\.(pressed|released|clicked|canceled|toggled|doubleClicked|pressAndHold|activated|triggered|moved|wrapped|opened|closed|completed)\b/;

// What was noted is what Qt notes, but for one thing: properties that changed
// together say so in whatever order here, where Qt's is the order it set them
// in. So those next to each other are compared sorted; signals are in order.
// `signal` is what a scene's signals are noted as, where not as `name.signal`.
export function order(notes, signal = SIGNAL) {
  const sorted = [];
  for (let from = 0; from < notes.length; ) {
    let to = from;
    while (to < notes.length && !signal.test(notes[to])) to++;
    if (to === from) sorted.push(notes[from++]);
    else sorted.push(...notes.slice(from, to).sort());
    from = Math.max(from, to);
  }
  return sorted;
}

export const said = async (page, notes, signal) =>
  expect(order(await take(page), signal)).toEqual(order(notes, signal));
