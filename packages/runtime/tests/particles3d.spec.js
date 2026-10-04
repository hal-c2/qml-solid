// QtQuick3D.Particles3D. What is expected is what Qt 6.11 answers for the
// same scene: each `particles3d*.qml` scene is run by `qml6` too, has done
// to it what `act` does a step at a time, and is asked what `read` says
// after each. `fixtures/particles3d.json` is what it said: for each scene
// its answer before anything was done, and then after each step.
//
// And what Qt 6.11 draws of the same scene: `fixtures/particles3ddrawn.json`
// has, for a scene after so many steps, the colour Qt's picture of it has
// at every fifth pixel each way, where the pixels about that one are all
// of that colour (`drawn`, by colour, and `ground` for all the rest), and
// the places where they are not (`unsure`: an edge, which is not compared).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, open, test } from "./open.js";
import { pixels } from "./pixels.js";

const qt = JSON.parse(readFileSync(join(import.meta.dirname, "fixtures/particles3d.json"), "utf8"));
const pictures = JSON.parse(readFileSync(join(import.meta.dirname, "fixtures/particles3ddrawn.json"), "utf8"));

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

// The same but for a last digit: what a scene says of a turn or a colour
// is rounded to a thousandth, and what is half way between two rounds
// either way.
function about(said, expected, step, where = "") {
  if (typeof expected === "number") return expect(Math.abs(said - expected), `after step ${step}, ${where}: ${said}, not ${expected}`).toBeLessThan(0.0015);
  expect(Object.keys(said ?? {}), `after step ${step}, ${where}`).toEqual(Object.keys(expected));
  for (const key of Object.keys(expected)) about(said[key], expected[key], step, `${where}.${key}`);
}

// Where the page is not of the colour Qt's picture has there, give or take
// what two programs that draw the same may differ by.
const EVERY = 5;
const NEAR = 10;
async function unlike(page, { ground, unsure, drawn }) {
  const expected = new Map();
  for (let y = 2; y < 298; y += EVERY) for (let x = 2; x < 398; x += EVERY) expected.set(`${x},${y}`, ground);
  for (let at = 0; at < unsure.length; at += 2) expected.delete(`${unsure[at]},${unsure[at + 1]}`);
  for (const [colour, places] of Object.entries(drawn)) for (let at = 0; at < places.length; at += 2) expected.set(`${places[at]},${places[at + 1]}`, colour);
  const places = [...expected.keys()];
  const seen = await pixels(
    page,
    places.map((place) => place.split(",").map(Number)),
  );
  const wrong = [];
  places.forEach((place, index) => {
    const here = seen[index].split(" ").map(Number);
    const there = expected.get(place).split(" ").map(Number);
    if (here.some((part, channel) => Math.abs(part - there[channel]) > NEAR)) wrong.push(`${place}: ${seen[index]}, not ${expected.get(place)}`);
  });
  return wrong;
}

// Opens a scene with its time standing still, does to it what was done to
// Qt's, and after each number of steps Qt's was drawn at, has drawn what
// Qt drew.
async function drawsAsQt(page, scene) {
  await page.setViewportSize({ width: 400, height: 300 });
  await open(page, `${scene}&still`);
  let done = 0;
  for (const [steps, picture] of Object.entries(pictures[scene])) {
    for (; done < Number(steps); done++) await act(page, done);
    await expect.poll(async () => (await unlike(page, picture)).slice(0, 8), { message: `after ${steps} steps`, timeout: 5000 }).toEqual([]);
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

// A system declared with a time of 1100 is at nought all the same: only
// its burst at nought is there to begin with, and the first time it is
// given another time everything since nought comes at once.
test("a system declared with a time begins at nought, as Qt's does", async ({ page }) => {
  await follow(page, "particles3dlate");
});

// What Qt 6.11 answers for the same scene, of one particle of each kind at
// thirteen times, on to past its life and back: where it is, how big, how
// turned and of what colour. There at the very end of its life and not
// after; growing from `particleScale` to `particleEndScale` and turning by
// `particleRotationVelocity`; fading in and out by its colour's alpha, by
// its size, or not at all; a life that goes backwards; looking at a point
// and the way it set out; placed and turned as its emitter is in its
// system, and nowhere when it is not the system's own; and the ways a
// direction is said.
test("a particle looks at a time as Qt's does", async ({ page }) => {
  await follow(page, "particles3dlooks", about);
});

// What Qt 6.11 answers for the same scene, of one particle of each kind at
// eleven times and with an affector enabled and disabled between them:
// `Gravity3D` and its direction; only the kinds an affector names, and
// nothing of one that is not enabled; `Attractor3D` by the end of a life
// or by its `duration`, staying or hidden; `PointRotator3D`; `Wander3D`
// all as one, easing in and out; `Repeller3D`; every `type` of
// `ScaleAffector3D`; an affector outside its system; and one that is
// turned, which changes nothing.
test("affectors move particles as Qt's do", async ({ page }) => {
  await follow(page, "particles3daffected");
});

// What Qt 6.11 answers for the same scene, as its time is set forward,
// back and forward again: a `TrailEmitter3D` emits so many a second where
// each particle it follows is, spread over the time since it last did;
// bursts when a particle starts and when it ends, of a model every time it
// is looked at and of a sprite once; bursts at a time, at every particle;
// bursts asked for; and turned as the emitter is, not placed.
test("particles are emitted where others are, as in Qt", async ({ page }) => {
  await follow(page, "particles3dtrails");
});

// What Qt 6.11 answers for the same scene: emitters and affectors do their
// work the last declared first; an emitter with bursts empties its kind
// before its first; what a trail emitter emits is there at once or the
// next time by which kind its system came to first; a rate that was
// nought counts from when it is set; and bursts at a time come at the
// system's `time`, whatever its `startTime` and their `triggerMode`.
test("emitters and affectors work in the order Qt's do", async ({ page }) => {
  await follow(page, "particles3dorder");
});

// What Qt 6.11 answers for the same scene, in which the time goes by
// itself and a fifth of a second is let pass before each answer: a system
// that is running has emitted what its time gives; paused, its time stands
// and comes on again from there; stopped, it stands and what there is
// stays; set running again it begins again from nought with nothing in
// it; and to stop it or start it is to have it not paused.
test("a running system goes, pauses and begins again as Qt's does", async ({ page }) => {
  await open(page, "particles3drunning&still");
  const pass = () => page.evaluate(() => window.clock.advance(200));
  const [first, ...steps] = qt.particles3drunning;
  await pass();
  expect(await read(page), "before any step").toEqual(first);
  for (let step = 0; step < steps.length; step++) {
    await act(page, step);
    await pass();
    expect(await read(page), `after step ${step}`).toEqual(steps[step]);
  }
});

// Not Qt's answer, whose time is not a test's to move, but what follows
// from the scene: what was emitted at the start going right at 100 a
// second is drawn 100 to the right after a second, a model and a sprite,
// and stays there while no time passes.
test("a running system is drawn where its time has brought it", async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 300 });
  await open(page, "particles3drunning&still");
  const seen = () => pixels(page, [[200, 250], [300, 250], [200, 200], [300, 200]]);
  await expect.poll(seen).toEqual(["255 255 255", "0 0 0", "255 0 0", "0 0 0"]);
  await page.evaluate(() => window.clock.advance(1000));
  await expect.poll(seen).toEqual(["0 0 0", "255 255 255", "0 0 0", "255 0 0"]);
  await page.evaluate(() => window.clock.advance(0));
  expect(await seen()).toEqual(["0 0 0", "255 255 255", "0 0 0", "255 0 0"]);
});

// What Qt 6.11 draws of the same scene: a sprite lies in the scene, turned
// as its particle is, or faces the eye turned the other way round; is moved
// aside by its offsets; is half there by its colour, over what is behind
// it, lightening it (`Screen`) or darkening it (`Multiply`); and is as
// much there as its system is.
test("sprites are drawn as Qt draws them", async ({ page }) => {
  await drawsAsQt(page, "particles3dsprites");
});

// What Qt 6.11 draws of the same scene: offsets are so many times the
// particle's own size; a sprite is hidden by a model that is nearer and
// does not hide one that is farther but drawn after it; and of two systems
// the nearer is drawn over the farther.
test("sprites are behind what is nearer, as in Qt", async ({ page }) => {
  await drawsAsQt(page, "particles3ddepth");
});

// What Qt 6.11 draws of the same scene, a row a second into its life and
// then as the table fills and its places are taken again: in the order of
// the table, from the place last written back through it (`SortNewest`),
// and from that place on through it (`SortOldest`).
test("sprites are drawn in the order Qt draws them in", async ({ page }) => {
  await drawsAsQt(page, "particles3dsorted");
});

// What Qt 6.11 draws of the same scene: with `SortDistance` the farthest
// along the way the eye looks is drawn first, whichever way the particles
// go and wherever the system is.
test("sprites sorted by distance are drawn the farthest first, as in Qt", async ({ page }) => {
  await drawsAsQt(page, "particles3dfar");
});

// What Qt 6.11 draws of the same scene at three times: a picture's greys
// and what is seen through of it; the frames of a sequence over a
// particle's life, one going over into the next, backwards, to and fro,
// from a frame in a time of its own, and staying at one; and a colour
// table read across over the particle's life.
test("a sprite goes through its frames and its colour table as Qt's does", async ({ page }) => {
  await drawsAsQt(page, "particles3dframes");
});

// What Qt 6.11 draws of the same scene at four times: a colour table at
// its edges; to and fro through the frames in a time of its own; a sprite
// turned towards a point and towards the way it set out, and one that
// faces the eye not turned so; a particle that goes backwards fading in at
// the end of its life; and one that grows as it comes.
test("sprites are turned towards things and fade as Qt's do", async ({ page }) => {
  await drawsAsQt(page, "particles3dturned");
});

// What Qt 6.11 draws of the same scene at two times: a sprite turned about
// three axes; and a model for each particle, tinted by the particle's
// colour, turned and sized as it is, where the delegate put it, each model
// there is in the delegate, fading and growing.
test("a model is drawn for each particle as Qt draws it", async ({ page }) => {
  await drawsAsQt(page, "particles3dmodels");
});

// What Qt 6.11 draws of the same scene, its time set at each step: nothing
// of a line until it has two points; a point put down each time the
// particle has come `lengthDeltaMin` from the last; a line of one piece so
// long behind its particle; narrower and fainter by `scaleMultiplier` and
// `alphaFade` at each point; no longer than `length`; across the way it
// goes in its system or before the eye; and still there for
// `eolFadeOutDuration` after its particle.
test("lines are drawn as Qt draws them", async ({ page }) => {
  await drawsAsQt(page, "particles3dlines");
});
