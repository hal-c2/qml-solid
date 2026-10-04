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

test("bodies are told what they touch and what they come into, when they ask", async ({ page }) => {
  await begin(page, "physicstrigger");
  const read = await until(page, 150);
  // As Qt tells it, in Qt's order, with the frame each was told in. A body
  // hears of a touch when it receives and the other sends; the one that
  // was not the first of the two is told the way the touch faces turned
  // round. A trigger tells of a body that sends, and a body that receives
  // is told of the trigger; one that does neither passes unnoticed.
  expect(read.told).toEqual([
    [6, "hears", "bodyContact", "floor", 1, 1],
    [6, "floor", "bodyContact", "sends", 1, -1],
    [26, "zone", "bodyEntered", "both", 1],
    [26, "both", "enteredTriggerBody", "zone"],
    [26, "zone", "bodyEntered", "sender", 2],
    [26, "receiver", "enteredTriggerBody", "zone"],
    [39, "zone", "bodyExited", "both", 1],
    [39, "both", "exitedTriggerBody", "zone"],
    [39, "zone", "bodyExited", "sender", 0],
    [39, "receiver", "exitedTriggerBody", "zone"],
  ]);
  expect(read.counts).toEqual([2, 0]);
  // Nothing pulls a trigger down.
  expect(read.zone).toEqual([0, 100, 0]);
  // What is in group 1 passed through the slab that ignores it and lies on
  // the floor; what is in group 2 lies on the slab; what ignores group 0
  // fell through both, and is falling.
  near(read.rest, [-2990.001, -2880, -3946.268], "rest", 0.02);
});

test("a program moves, resets, holds and stops bodies as in Qt", async ({ page }) => {
  await begin(page, "physicskinematic");
  const { seen, stopped } = await until(page, 40);
  // A kinematic body is where `position` says for the world's first frame,
  // and from the next where `kinematicPosition` does: nothing, when nothing
  // was said. What is assigned in a frame is seen two frames on.
  near(
    seen.kin,
    [
      [0, 50, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [100, 20, 0, 0.707, 0, 0.707, 0],
      [100, 20, 0, 0.707, 0, 0.707, 0],
    ],
    "kin",
    0.002,
  );
  near(seen.placed, [[500, 300, 0], ...Array(5).fill([500, 10, 0])], "placed", 0.002);
  // A body made in frame 5 is the world's when frame 6 is over, and has
  // fallen by frame 7.
  near(seen.late, [0, 0, -0.0981, -0.2943, -0.5886], "late", 0.0002);
  // Frames 10 to 13: `reset` in frame 10 has put the body there, turned
  // and at rest, by frame 12. Its position is in the body's parent.
  near(
    seen.fallen,
    [
      [1000, -4.414, 0, 1, 0, 0, 0],
      [1000, -5.395, 0, 1, 0, 0, 0],
      [1000, 299.902, 0, 0.924, 0, 0, 0.383],
      [1000, 299.706, 0, 0.924, 0, 0, 0.383],
    ],
    "fallen",
    0.002,
  );
  near(
    seen.inside,
    [
      [0, -2.207, 0],
      [0, -2.698, 0],
      [10, -0.049, 0],
      [10, -0.147, 0],
    ],
    "inside",
    0.002,
  );
  // Let into the world, or pulled, from frame 10.
  near(seen.off, [0, 0, -0.098, -0.294], "off", 0.002);
  near(seen.floating, [0, 0, -0.098, -0.294], "floating", 0.002);
  // Sent off along `x` and `y` and spinning about all three, a body held
  // along `y` and from turning about `x` and `z` goes along `x` and turns
  // about `y`.
  near(seen.sent, [[6000.801, 0, 0, 0.999, 0, 0.04, 0]], "sent", 0.002);
  // A body is put where it is in its parent: this one's is turned a
  // quarter and twice the size.
  near(seen.child, [[46.763, 0, 0, 1, 0, 0, 0]], "child", 0.002);
  // A world that is not running tells of no frame, and goes on from where
  // it was when it runs again.
  expect(stopped).toBe(20);
  near(seen.paused, [295.585, 294.604, 293.525], "paused", 0.002);
});

test("a character falls, walks, climbs and is put somewhere as in Qt", async ({ page }) => {
  await begin(page, "physicscharacter");
  const { seen, hits } = await until(page, 180);
  // Where each was, and what it touched (4 is under it, 1 beside it), when
  // these frames were done. Qt's engine is an older one than the page's,
  // and has a character at rest far from the middle of the scene a little
  // higher than it has one in the middle: by 0.003 at most.
  const frames = {
    // Falls to the floor, is told to walk in frame 40 and does from 42,
    // meets a wall, and in frame 110 is put in the air somewhere else,
    // where it falls again and steers as it does.
    walker: { 1: [0, 100, 0, 0], 2: [0, 99.951, 0, 0], 20: [0, 82.293, 0, 0], 22: [0, 78.369, 0, 0], 23: [0, 76.26, 0, 4], 24: [0, 75.1, 0, 4], 41: [0, 75.1, 0, 4], 42: [2, 75.1, 0, 4], 77: [72, 75.1, 0, 4], 78: [74, 75.1, 0, 5], 79: [74.9, 75.1, 0, 5], 111: [74.9, 75.1, 0, 5], 112: [0, 300, 500, 0], 113: [2, 299.951, 500, 0], 179: [134, 79.815, 500, 4], 180: [136, 75.1, 500, 4] },
    // Nothing pulls it: it goes where it is told at the speed it is told.
    flier: { 1: [0, 500, 2000, 0], 2: [1, 500, 2000, 0], 41: [40, 500, 2000, 0], 42: [40, 500.5, 1999, 0], 43: [40, 501, 1998, 0], 180: [40, 569.5, 1861, 0] },
    // With no `midAirControl` it falls where it is, and walks when it lands.
    stiff: { 2: [0, 199.951, 4000, 0], 50: [0, 82.231, 4000, 0], 51: [0, 77.375, 4000, 4], 52: [0, 75.102, 4000, 4], 53: [1, 75.102, 4000, 4], 180: [128, 75.102, 4000, 4] },
    // Scaled by 2, 3 and 1: 50 across and 300 tall between its round ends.
    big: { 2: [0, 399.951, 6000, 0], 63: [0, 211.452, 6000, 0], 64: [0, 205.321, 6000, 4], 65: [0, 200.102, 6000, 4], 180: [0, 200.102, 6000, 4] },
    // Up a step 20 high, and then one 40 higher.
    climber: { 4: [0, 75.559, 8000, 0], 5: [0, 75.215, 8000, 4], 60: [19, 75.103, 8000, 4], 70: [29, 83.665, 8000, 4], 91: [50, 95.1, 8000, 4], 165: [124, 95.1, 8000, 4], 166: [125, 110.113, 8000, 4], 180: [139, 132.55, 8000, 4] },
    // In a parent turned and twice the size: half as fast, in the parent.
    child: { 1: [10, 0, 0, 0], 41: [10, 0, 0, 0], 42: [10.5, 0, 0, 0], 180: [79.5, 0, 0, 0] },
  };
  for (const [name, at] of Object.entries(frames)) {
    for (const [frame, expected] of Object.entries(at)) near(seen[name][frame - 1], expected, `${name} at ${frame}`, 0.005);
  }
  // What `shapeHit` told the walker: the frame before the one it is told
  // in, what it walked into, where, how far it was going, and which way
  // the other faces.
  near(
    hits,
    [
      [22, "floor", [0, 0, 0], [0, -2.207, 0], [0, 1, 0]],
      [23, "floor", [0, 0, 0], [0, -0.049, 0], [0, 1, 0]],
      [24, "floor", [0, 0, 0], [0, -0.049, 0], [0, 1, 0]],
      [77, "wall", [100, 50.1, 0], [2, 0, 0], [-1, 0, 0]],
    ],
    "hits",
    0.002,
  );
});
