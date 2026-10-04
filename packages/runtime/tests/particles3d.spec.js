// QtQuick3D.Particles3D. What is expected is what Qt 6.11 answers for the
// same scene: each `particles3d*.qml` scene is run by `qml6` too, has done
// to it what `act` does a step at a time, and is asked what `read` says
// after each. `fixtures/particles3d.json` is what it said: for each scene
// its answer before anything was done, and then after each step.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, open, test } from "./open.js";

const qt = JSON.parse(readFileSync(join(import.meta.dirname, "fixtures/particles3d.json"), "utf8"));

// What a scene says, as Qt's said it: as JSON, which has no nought that
// is less than nought.
const read = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.scene.read())));
const act = (page, step) => page.evaluate((step) => window.scene.act(step), step);

// Opens a scene with its time standing still and does to it what was done
// to Qt's, a step at a time: what it says after each is what Qt said.
async function follow(page, scene, compare = (said, expected, step) => expect(said, `after step ${step}`).toEqual(expected)) {
  await open(page, `${scene}&still`);
  const [first, ...steps] = qt[scene];
  compare(await read(page), first, "none");
  for (let step = 0; step < steps.length; step++) {
    await act(page, step);
    compare(await read(page), steps[step], step);
  }
}

// When each particle of a system started, as its time is set to 1000, back
// to 300, on to 600 and 1200 and so on: so many a second spread evenly over
// the time since the last, again what was emitted once when the time comes
// by again, no more than a life's worth made up for, no more than there is
// room for, bursts from the start and bursts when their time comes, an
// emitter enabled late, a start time, bursts asked for, and a reset.
test("a system has emitted by a time what Qt's has", async ({ page }) => {
  await follow(page, "particles3d");
});
