import { expect, open, test } from "./open.js";

function near(actual, expected, path = "", within = 0.0002) {
  if (typeof expected === "number") expect(Math.abs(actual - expected), `${path}: ${actual} for ${expected}`).toBeLessThan(within);
  else if (Array.isArray(expected)) {
    expect(actual, path).toHaveLength(expected.length);
    expected.forEach((value, index) => near(actual[index], value, `${path}[${index}]`, within));
  } else if (expected && typeof expected === "object") {
    for (const [key, value] of Object.entries(expected)) near(actual[key], value, `${path}.${key}`, within);
  } else expect(actual, path).toBe(expected);
}

// Time in a scene stands still. The engine is fetched when the world is
// made: frames are let pass until the world has told of its first, and
// from then on a frame of the page is a frame of the world.
async function begin(page, scene) {
  await open(page, `${scene}&still`);
  await page.waitForFunction(() => {
    window.clock.advance(16);
    return window.scene.read().frames >= 1;
  });
}

// Lets frames pass until the world has told of so many.
const until = (page, frames) =>
  page.evaluate((frames) => {
    while (window.scene.read().frames < frames) window.clock.advance(16);
    return window.scene.read();
  }, frames);

test("a world drops a box and a ball as Qt's does", async ({ page }) => {
  await open(page, "physics&still");
  // As Qt prints them, before anything has moved.
  near(await page.evaluate(() => window.scene.defaults()), {
    world: [[0, -981, 0], true, false, 100, 1000, 0.001],
    box: [1, 0.001, 0, false, true, 0, 0, false],
    reports: [false, true, false, false],
    filters: [0, 0, true],
    material: [0.5, 0.5, 0.5],
    inertia: [[0, 0, 0], [0, 0, 0], [1, 0, 0, 0], 0],
    kinematic: [[0, 0, 0], [1, 0, 0, 0], [0, 0, 0], [0, 0, 0]],
  });

  await begin(page, "physics");
  // The first frame is told of before a body has moved: they join the
  // world when its first step, an empty one, is over.
  near(await page.evaluate(() => window.scene.read()), { frames: 1, box: [0, 200, 0], ball: [300, 200, 0], sleeping: [false, false] });
  // Falling is the same in any engine: Qt's own numbers.
  for (const [frames, y] of [
    [2, 199.9019],
    [3, 199.7057],
    [4, 199.4114],
    [11, 194.6045],
    [21, 179.399],
    [41, 119.558],
    [46, 98.4665],
  ]) {
    near(await until(page, frames), { box: [0, y, 0], ball: [300, y, 0] }, `frame ${frames}`, 0.002);
  }
  near((await page.evaluate(() => window.scene.read())).steps, [10, 10, 10], "steps", 1e-4);

  // The box lands flat on the floor in the frame Qt's does, and is told
  // what it hit: the floor, at its four corners. Qt's push at the first is
  // 203255 upward; its engine is an older one, and this one's is within a
  // hundredth of that.
  const landed = await until(page, 57);
  expect(landed.contacts).toHaveLength(1);
  expect(landed.contacts[0]).toMatchObject({ frame: 56, body: "floor", counts: [4, 4, 4] });
  near(landed.contacts[0], { position: [50, 0, 50], normal: [0, 1, 0] }, "contact", 0.01);
  near(landed.contacts[0].impulse[1], 203255, "impulse", 2100);

  // How high each bounces is the engine's own, and so is how far the box
  // wanders while it does: where they come to rest is not. Qt's box sleeps
  // by frame 181 at a height of 50.0001, when its ball is still bouncing;
  // the ball sleeps by frame 301 at 24.9999.
  const resting = await until(page, 201);
  near(resting.box[1], 50.0001, "box", 0.01);
  expect(resting.sleeping).toEqual([true, false]);
  const rested = await until(page, 301);
  near(rested.ball, [300.0013, 24.9999, -0.0012], "ball", 0.01);
  expect(rested.sleeping).toEqual([true, true]);
  // A touch is told of once, when it begins: the box touched the floor
  // twice in all that.
  expect(rested.contacts.map((contact) => contact.frame).slice(0, 2)).toEqual([56, 106]);
});

test("a body is as heavy as its density, shapes and scale make it", async ({ page }) => {
  await begin(page, "physicsmass");
  const read = await until(page, 15);
  // Where Qt has each, eleven steps after it was pushed where nothing pulls,
  // and how it is turned.
  near(
    read.bodies,
    {
      // Pushed in `Component.onCompleted`, a body that goes by the world's
      // density is pushed before it has been weighed: as a body of mass 1.
      early: [14, 0, 0, 1, 0, 0, 0],
      // One given a density was weighed when it was given it.
      earlyDense: [7, 0, 1000, 1, 0, 0, 0],
      box: [11, 0, 2000, 0.999, 0, 0, 0.033],
      dense: [55, 0, 3000, 1, 0, 0, 0],
      heavy: [2.2, 0, 4000, 1, 0, 0, 0],
      capsule: [10.1, 0, 5000, 1, 0, 0, 0],
      // A scale is part of the shape: twice as long is twice as heavy.
      scaled: [5.5, 0, 6000, 1, 0, 0, 0],
      // A ball is scaled by `x` alone, a capsule's width by `y` and its
      // length by `x`.
      ball: [2.626, 0, 7000, 1, 0, 0, 0],
      capsuleScaled: [4.863, 0, 8000, 1, 0, 0, 0],
      offset: [0.169, -8.223, 9000, 1, 0, 0, 0.021],
      tensor: [5.5, 0, 10000, 0.998, 0, 0, 0.055],
      matrix: [0, 0, 11000, 0.993, 0.114, -0.019, 0],
      two: [7.22, 0, 12000, 1, 0, 0, 0],
      // A force pushes for the one frame it was applied in.
      forced: [11, 0, 13000, 0.999, 0, 0.033, 0],
      pushedAt: [11, 0, 14000, 0.986, 0, 0, -0.164],
      forcedAt: [11, 0, 15000, 0.986, 0, 0, -0.164],
      sent: [5.5, 0, 16000, 0.998, 0, 0.055, 0],
      light: [2.75, 0, 17000, 1, 0, 0, 0],
    },
    "bodies",
    0.002,
  );
  // `mass` is what was given, not what a density came to; a mass below
  // nothing was not taken.
  near(read.masses, [1, 1, 5, 4, 0.002], "masses", 1e-6);
  // A shape made for `collisionShapes` is inside its body.
  expect(read.parent).toEqual([true, 2]);
});

test("a mesh's triangles, a mesh's hull and a picture of heights are shapes", async ({ page }) => {
  // The world's first frame waits for the files.
  await begin(page, "physicsmesh");
  const read = await until(page, 150);
  // A hull is as heavy as what it encloses: a pyramid a third of its box,
  // twice that when it is twice as long. Eleven steps after the push.
  near(read.early, { hullFree: [33, 2000, 0, false], hullScaled: [16.5, 4000, 0, false] }, "early", 0.01);
  // Where Qt has each at rest. The tray, scaled to twice its height, is 40
  // up, and the ball on it has a radius of 10. The pyramid stands on the
  // plane. The dark half of the picture is 24.9 under the middle of the
  // ground and the bright half as far above it, along `x`; scaled, the
  // ground is as high as its `extents` say.
  near(
    read.late,
    {
      onTray: [0, 50, 0, true],
      hull: [1000, 0.001, -0.001, true],
      low: [2970, 480.099, 10, true],
      high: [3030, 529.901, 10, true],
      onWide: [5100, 517.45, -30, true],
    },
    "late",
    0.02,
  );
  // A picture wider than it is high makes ground wider than it is deep.
  expect(read.extents).toEqual([100, 100, 50, 200, 50, 100]);
});
