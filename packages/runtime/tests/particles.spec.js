import { expect, test } from "./open.js";

async function show(page, part) {
  await page.goto(`/?scene=particles&part=${part}`);
  await page.waitForFunction(() => window.ready);
}

const advance = (page, ms) => page.evaluate((ms) => window.objects.clock.advance(ms), ms);
// The pictures of these painters are there.
const ready = (page, ...names) =>
  page.waitForFunction((names) => names.every((name) => window.objects.scene[name].status === 1), names);
const live = (page, group = "") => page.evaluate((group) => window.objects.live(window.objects.scene.system, group), group);
const pixel = (page, painter, x, y) =>
  page.evaluate(([painter, x, y]) => window.objects.pixel(window.objects.scene[painter], x, y), [painter, x, y]);
// One particle from an emitter that emits none by itself, `ms` old.
async function burst(page, emitter, ms, count = 1) {
  await page.evaluate(([emitter, count]) => window.objects.scene[emitter].burst(count), [emitter, count]);
  await advance(page, 16);
  if (ms) await advance(page, ms);
}

const WHITE = [255, 255, 255, 255];
const CLEAR = [0, 0, 0, 0];

test("an emitter emits its rate, each particle when it was due", async ({ page }) => {
  await show(page, "Stream");
  const read = () =>
    page.evaluate(() => {
      const { live, scene } = window.objects;
      return [live(scene.system).map((particle) => Math.round(particle.t * 1000)), scene.emitted, scene.system.empty];
    });
  // The first frame is when it starts: nothing was due before.
  await advance(page, 16);
  expect(await read()).toEqual([[], 0, true]);
  await advance(page, 16);
  expect(await read()).toEqual([[16], 1, false]);
  await advance(page, 976);
  expect(await read()).toEqual([[16, 116, 216, 316, 416, 516, 616, 716, 816, 916], 10, false]);
  // A second later the first ten are gone and ten others are there.
  await advance(page, 1000);
  expect(await read()).toEqual([[1016, 1116, 1216, 1316, 1416, 1516, 1616, 1716, 1816, 1916], 20, false]);
});

test("a particle is where its velocity and acceleration take it, at the size its age gives it", async ({ page }) => {
  await show(page, "Stream");
  await ready(page, "painter");
  await page.evaluate(() => (window.objects.scene.stream.enabled = false));
  await burst(page, "stream", 500);
  const [particle] = await live(page);
  expect(particle).toMatchObject({ x: 150, y: 75, vx: 100, vy: 100, size: 20, endSize: 40 });
  expect(particle.age).toBeCloseTo(0.5);
  // Between its two sizes by the square of how far through its life it is:
  // 25 across, around where it is.
  expect(await pixel(page, "painter", 150, 75)).toEqual(WHITE);
  expect(await pixel(page, "painter", 139, 64)).toEqual(WHITE);
  expect(await pixel(page, "painter", 161, 86)).toEqual(WHITE);
  expect(await pixel(page, "painter", 135, 75)).toEqual(CLEAR);
  expect(await pixel(page, "painter", 164, 75)).toEqual(CLEAR);
  expect(await pixel(page, "painter", 150, 60)).toEqual(CLEAR);
  // The canvas is the system's size, where the system is.
  const box = await page.evaluate(() => {
    const { x, y, width, height } = window.objects.scene.painter.$canvas.getBoundingClientRect();
    return { x, y, width, height };
  });
  expect(box).toEqual({ x: 0, y: 0, width: 400, height: 300 });
});

test("a system that is paused keeps its particles, and one that is stopped has none", async ({ page }) => {
  await show(page, "Stream");
  await ready(page, "painter");
  const read = () =>
    page.evaluate(() => {
      const { clock, live, scene } = window.objects;
      return [live(scene.system).length, scene.system.$sim.now, scene.system.empty, clock.running];
    });
  await advance(page, 500);
  expect(await read()).toEqual([5, 500, false, true]);
  await page.evaluate(() => (window.objects.scene.system.paused = true));
  await advance(page, 500);
  expect(await read()).toEqual([5, 500, false, false]);
  await page.evaluate(() => window.objects.scene.system.resume());
  await advance(page, 100);
  expect(await read()).toEqual([6, 600, false, true]);
  expect(await page.evaluate(() => window.objects.scene.painter.$canvas.width)).toBe(400);
  // Stopped: no particles, and when it starts again its time does too.
  await page.evaluate(() => (window.objects.scene.system.running = false));
  await advance(page, 16);
  expect(await read()).toEqual([0, 0, true, false]);
  expect(await page.evaluate(() => window.objects.scene.painter.$canvas.width)).toBe(0);
  await page.evaluate(() => window.objects.scene.system.start());
  await advance(page, 32);
  expect(await read()).toEqual([1, 32, false, true]);
  // Stopping takes a pause with it, as in Qt.
  await page.evaluate(() => {
    const { system } = window.objects.scene;
    system.pause();
    system.restart();
  });
  expect(await page.evaluate(() => window.objects.scene.system.paused)).toBe(false);
  await advance(page, 32);
  expect(await read()).toEqual([1, 32, false, true]);
});

test("nothing runs when no particle is alive and no emitter emits", async ({ page }) => {
  await show(page, "Stream");
  await ready(page, "painter");
  const read = () =>
    page.evaluate(() => {
      const { clock, live, scene } = window.objects;
      return [live(scene.system).length, scene.system.empty, clock.running, scene.painter.$canvas.width];
    });
  await advance(page, 500);
  expect(await read()).toEqual([5, false, true, 400]);
  await page.evaluate(() => (window.objects.scene.stream.enabled = false));
  await advance(page, 2000);
  // The canvas has no pixels to keep either.
  expect(await read()).toEqual([0, true, false, 0]);
  await advance(page, 1000);
  expect(await page.evaluate(() => window.objects.scene.system.$sim.now)).toBeLessThan(1500);
  await page.evaluate(() => window.objects.scene.stream.burst(3));
  expect((await read())[2]).toBe(true);
  await advance(page, 16);
  expect(await read()).toEqual([3, false, true, 400]);
});

test("a burst is emitted at once, where the emitter is or where it is told", async ({ page }) => {
  await show(page, "Bursts");
  await ready(page, "sparks");
  await burst(page, "burster", 0, 7);
  let sparks = await live(page, "spark");
  expect(sparks.map(({ x, y, t }) => [x, y, Math.round(t * 1000)])).toEqual(Array(7).fill([50, 50, 16]));
  expect(await pixel(page, "sparks", 50, 50)).toEqual(WHITE);
  expect(await pixel(page, "sparks", 200, 100)).toEqual(CLEAR);
  await page.evaluate(() => window.objects.scene.burster.burst(5, 200, 100));
  await advance(page, 16);
  sparks = await live(page, "spark");
  expect(sparks.slice(7).map(({ x, y }) => [x, y])).toEqual(Array(5).fill([200, 100]));
  expect(await pixel(page, "sparks", 200, 100)).toEqual(WHITE);
});

test("a pulse emits for as long as it lasts, and no more than the emitter may have", async ({ page }) => {
  await show(page, "Bursts");
  // A picture that comes later is painted in a frame of its own.
  await ready(page, "sparks", "late");
  await page.evaluate(() => window.objects.scene.burster.pulse(100));
  await advance(page, 48);
  // A thousand a second, sixteen a frame, from the frame after it began.
  expect((await live(page, "spark")).length).toBe(30);
  await advance(page, 152);
  expect((await live(page, "spark")).length).toBe(30);
  await advance(page, 500);
  expect((await live(page, "spark")).length).toBe(0);
  expect(await page.evaluate(() => window.objects.clock.running)).toBe(false);
});

test("an emitter with a start time begins as if it had been emitting that long", async ({ page }) => {
  await show(page, "Bursts");
  await page.evaluate(() => (window.objects.scene.old.enabled = true));
  await advance(page, 16);
  const old = await live(page, "old");
  expect(old.map(({ t }) => Math.round(t * 1000))).toEqual([-934, -834, -734, -634, -534, -434, -334, -234, -134, -34]);
});

test("a painter and an emitter take the system they are given later", async ({ page }) => {
  await show(page, "Bursts");
  await ready(page, "late");
  await advance(page, 100);
  expect(await live(page, "late")).toEqual([]);
  await page.evaluate(() => {
    const { late, lateEmitter, system } = window.objects.scene;
    late.system = lateEmitter.system = system;
  });
  await advance(page, 116);
  const particles = await live(page, "late");
  expect(particles.length).toBeGreaterThanOrEqual(10);
  expect(particles.every(({ x, y }) => x === 300 && y === 200)).toBe(true);
  expect(await pixel(page, "late", 300, 200)).toEqual([255, 0, 0, 255]);
  // Taken away again, it paints nothing and the system forgets it.
  await page.evaluate(() => (window.objects.scene.late.system = null));
  await advance(page, 16);
  expect(await page.evaluate(() => window.objects.scene.late.$canvas.width)).toBe(0);
});

test("a picture is multiplied by its particle's colour", async ({ page }) => {
  await show(page, "Painting");
  await ready(page, "tinted", "second");
  await burst(page, "tint", 100);
  expect(await pixel(page, "tinted", 50, 50)).toEqual([255, 128, 0, 255]);
  // The second painter of the group has its own colours, and its canvas is
  // over the system though the painter is elsewhere.
  expect(await pixel(page, "second", 50, 50)).toEqual([0, 0, 255, 255]);
  expect(await pixel(page, "second", 80, 50)).toEqual(CLEAR);
  const left = await page.evaluate(() => window.objects.scene.second.$canvas.getBoundingClientRect().x);
  expect(left).toBe(0);
  expect((await live(page, "tint"))[0].color).toEqual([255, 128, 0, 255]);
  // A colour assigned later is the colour of what is emitted after.
  await page.evaluate(() => (window.objects.scene.tinted.color = "#00ff00"));
  await page.evaluate(() => window.objects.scene.tint.burst(1, 80, 50));
  await advance(page, 16);
  expect(await pixel(page, "tinted", 50, 50)).toEqual([255, 128, 0, 255]);
  expect(await pixel(page, "tinted", 80, 50)).toEqual([0, 255, 0, 255]);
  // Its picture is the one it had.
  expect(await page.evaluate(() => window.objects.scene.tinted.status)).toBe(1);
});

test("a particle fades or grows in and out as its painter's entry effect says", async ({ page }) => {
  await show(page, "Painting");
  await ready(page, "faded", "scaled");
  await page.evaluate(() => window.objects.scene.grow.burst(1));
  await burst(page, "fade", 50);
  // A twentieth of its life: half way in.
  let alpha = (await pixel(page, "faded", 150, 50))[3];
  expect(alpha).toBeGreaterThan(120);
  expect(alpha).toBeLessThan(136);
  expect(await pixel(page, "scaled", 250, 50)).toEqual(WHITE);
  expect(await pixel(page, "scaled", 257, 50)).toEqual(CLEAR);
  await advance(page, 450);
  expect(await pixel(page, "faded", 150, 50)).toEqual(WHITE);
  expect(await pixel(page, "scaled", 257, 50)).toEqual(WHITE);
  // An eighth of its life left: half way out.
  await advance(page, 375);
  alpha = (await pixel(page, "faded", 150, 50))[3];
  expect(alpha).toBeGreaterThan(120);
  expect(alpha).toBeLessThan(136);
  expect(await pixel(page, "scaled", 257, 50)).toEqual(CLEAR);
});

test("a particle shows the frame of its sprite that is due, and then the sprite that follows", async ({ page }) => {
  await show(page, "Painting");
  await page.waitForFunction(() => window.objects.scene.animated.sprites.every((sprite) => sprite.$image));
  const RED = [255, 0, 0, 255];
  const GREEN = [0, 255, 0, 255];
  const BLUE = [0, 0, 255, 255];
  const shown = () => pixel(page, "animated", 50, 150);
  await burst(page, "sprite", 50);
  expect(await shown()).toEqual(RED);
  await advance(page, 100);
  expect(await shown()).toEqual(GREEN);
  await advance(page, 100);
  expect(await shown()).toEqual(BLUE);
  await advance(page, 100);
  expect(await shown()).toEqual(WHITE);
  // The second sprite: the last two frames of the sheet, twice as slow.
  await advance(page, 100);
  expect(await shown()).toEqual(BLUE);
  await advance(page, 200);
  expect(await shown()).toEqual(WHITE);
  // Nothing follows it but itself.
  await advance(page, 200);
  expect(await shown()).toEqual(BLUE);
});

test("a particle is turned by its painter's rotation, which does not turn the painter", async ({ page }) => {
  await show(page, "Painting");
  await ready(page, "turning");
  await burst(page, "turn", 100);
  // The picture's top half is what there is of it: turned a quarter, its
  // right half.
  expect(await pixel(page, "turning", 155, 145)).toEqual(WHITE);
  expect(await pixel(page, "turning", 155, 155)).toEqual(WHITE);
  expect(await pixel(page, "turning", 145, 145)).toEqual(CLEAR);
  expect(await pixel(page, "turning", 145, 155)).toEqual(CLEAR);
  expect((await live(page, "turn"))[0].rotation).toBeCloseTo(Math.PI / 2);
  const box = await page.evaluate(() => {
    const { x, y, width, height } = window.objects.scene.turning.$canvas.getBoundingClientRect();
    return [x, y, width, height].map(Math.round);
  });
  expect(box).toEqual([0, 0, 400, 300]);
});

test("a colour varies from particle to particle by as much as it is told", async ({ page }) => {
  await show(page, "Painting");
  await ready(page, "varied");
  await page.evaluate(() => window.objects.scene.system.$seed(3));
  await burst(page, "vary", 100, 20);
  const colours = (await live(page, "vary")).map((particle) => particle.color);
  expect(colours.length).toBe(20);
  for (const [red, green, blue, alpha] of colours) {
    expect(red).toBeGreaterThanOrEqual(64);
    expect(red).toBeLessThan(192);
    expect(green).toBeGreaterThanOrEqual(32);
    expect(green).toBeLessThan(160);
    expect(blue).toBeGreaterThanOrEqual(16);
    expect(blue).toBeLessThan(144);
    expect(alpha).toBe(127);
  }
  expect(new Set(colours.map(String)).size).toBeGreaterThan(15);
  expect((await pixel(page, "varied", 250, 150))[3]).toBeGreaterThan(0);
});

test("affectors change the course of the particles of their groups", async ({ page }) => {
  await show(page, "Affectors");
  await page.evaluate(() => {
    const { scene } = window.objects;
    scene.system.$seed(11);
    for (const name of ["fall", "drop", "slow", "pull", "custom", "push"]) scene[name].burst(1);
    scene.wander.burst(5);
    scene.swirl.burst(10);
  });
  await advance(page, 16);
  await advance(page, 500);
  // Gravity: a hundred a second downwards, for the frames it has lived.
  const [fall] = await live(page, "fall");
  expect(fall.vx).toBeCloseTo(0);
  expect(fall.vy).toBeCloseTo(51.6);
  expect(fall.x).toBeCloseTo(20);
  // Once: a second's worth, one time.
  const [drop] = await live(page, "drop");
  expect(drop.vy).toBeCloseTo(100);
  expect(await page.evaluate(() => window.objects.scene.hits)).toBe(1);
  // Friction: a part of its speed every frame.
  const [slow] = await live(page, "slow");
  expect(slow.vx).toBeCloseTo(100 * (1 - 2 * 0.016) ** 32 * (1 - 2 * 0.004));
  // Attractor: two pixels a second towards its point.
  const [pull] = await live(page, "pull");
  expect(pull.x).toBeCloseTo(100 + 2 * 0.516);
  expect(pull.y).toBeCloseTo(250);
  // Affector: what its handler does, and what its directions say.
  const [custom] = await live(page, "custom");
  expect(custom.vx).toBeCloseTo(40);
  expect(custom.color[0]).toBe(127);
  expect(await page.evaluate(() => window.objects.scene.calls)).toBeGreaterThan(30);
  const [push] = await live(page, "push");
  expect(push.vx).toBeCloseTo(10);
  expect(push.vy).toBeCloseTo(-5);
  // Wander: sideways only, and never faster than its variance.
  const wander = await live(page, "wander");
  expect(wander.length).toBe(5);
  for (const { vx, vy } of wander) {
    expect(Math.abs(vx)).toBeLessThan(50);
    expect(vy).toBe(0);
  }
  expect(new Set(wander.map(({ vx }) => vx)).size).toBe(5);
  // Turbulence: every particle is pushed, each its own way.
  const swirl = await live(page, "swirl");
  expect(swirl.filter(({ vx, vy }) => vx !== 0 || vy !== 0).length).toBeGreaterThan(5);
});

test("Age ends the particles that come into it", async ({ page }) => {
  await show(page, "Affectors");
  await burst(page, "aged", 496);
  // Not there yet.
  let [aged] = await live(page, "aged");
  expect(aged.x).toBeCloseTo(199.6);
  expect(aged.life - aged.age).toBeCloseTo(4.504);
  await advance(page, 16);
  [aged] = await live(page, "aged");
  expect(aged.x).toBeCloseTo(201.2);
  expect(aged.vx).toBeCloseTo(100);
  expect(aged.life - aged.age).toBeCloseTo(0.1);
  // As long as it is in there it has that much left, as in Qt; it ends
  // that long after it has left.
  await advance(page, 112);
  [aged] = await live(page, "aged");
  expect(aged.x).toBeCloseTo(212.4);
  expect(aged.life - aged.age).toBeCloseTo(0.1);
  await advance(page, 960);
  [aged] = await live(page, "aged");
  expect(aged.x).toBeCloseTo(308.4);
  expect(aged.life - aged.age).toBeCloseTo(0.004);
  await advance(page, 16);
  expect(await live(page, "aged")).toEqual([]);
});

test("particles are emitted inside the emitter's shape, in the system's coordinates", async ({ page }) => {
  await show(page, "Shapes");
  await page.waitForFunction(() => window.objects.scene.mask.shape.$image);
  await page.evaluate(() => {
    const { scene } = window.objects;
    scene.system.$seed(1);
    for (const name of ["box", "ellipse", "ring", "line", "mask"]) scene[name].burst(200);
    scene.moved.burst(1);
  });
  await advance(page, 16);
  const spread = (values) => [Math.min(...values), Math.max(...values)];
  const box = await live(page, "box");
  expect(box.length).toBe(200);
  let [low, high] = spread(box.map(({ x }) => x));
  expect(low).toBeGreaterThanOrEqual(10);
  expect(low).toBeLessThan(15);
  expect(high).toBeLessThanOrEqual(110);
  expect(high).toBeGreaterThan(105);
  [low, high] = spread(box.map(({ y }) => y));
  expect(low).toBeGreaterThanOrEqual(10);
  expect(high).toBeLessThanOrEqual(70);
  const ellipse = await live(page, "ellipse");
  expect(ellipse.length).toBe(200);
  for (const { x, y } of ellipse) expect(((x - 200) / 50) ** 2 + ((y - 40) / 30) ** 2).toBeLessThanOrEqual(1);
  // Outside the rectangle the ellipse would fit in at half its size: it is
  // filled to its edge.
  expect(ellipse.some(({ x, y }) => Math.abs(x - 200) > 25 || Math.abs(y - 40) > 15)).toBe(true);
  for (const { x, y } of await live(page, "ring")) expect(Math.hypot(x - 330, y - 60)).toBeCloseTo(50);
  for (const { x, y } of await live(page, "line")) expect(x - 10).toBeCloseTo(100 - (100 / 60) * (y - 100));
  // The mask's top half is what it has.
  const mask = await live(page, "mask");
  expect(mask.length).toBe(200);
  for (const { x, y } of mask) {
    expect(x).toBeGreaterThanOrEqual(150);
    expect(x).toBeLessThan(230);
    expect(y).toBeGreaterThanOrEqual(100);
    expect(y).toBeLessThan(140);
  }
  expect(spread(mask.map(({ y }) => y))[1]).toBeGreaterThan(130);
  expect((await live(page, "moved")).map(({ x, y }) => [x, y])).toEqual([[220, 210]]);
});

test("a direction gives each particle its velocity or acceleration", async ({ page }) => {
  await show(page, "Shapes");
  await page.evaluate(() => {
    const { scene } = window.objects;
    scene.system.$seed(2);
    scene.angled.burst(50);
    scene.aimed.burst(1);
    scene.summed.burst(1);
  });
  await advance(page, 16);
  const angled = await live(page, "angled");
  for (const { vx, vy } of angled) {
    const speed = Math.hypot(vx, vy);
    const angle = (Math.atan2(vy, vx) * 180) / Math.PI;
    expect(speed).toBeGreaterThanOrEqual(45);
    expect(speed).toBeLessThanOrEqual(55);
    expect(angle).toBeGreaterThanOrEqual(80);
    expect(angle).toBeLessThanOrEqual(100);
  }
  expect(new Set(angled.map(({ vx }) => vx)).size).toBe(50);
  // Towards a point of the emitter; the acceleration by how far it is.
  const aimed = await page.evaluate(() => {
    const { scene } = window.objects;
    return Array.from(scene.system.$sim.group("aimed").data.subarray(2, 6));
  });
  expect(aimed[0]).toBeCloseTo(6);
  expect(aimed[1]).toBeCloseTo(8);
  expect(aimed[2]).toBeCloseTo(60);
  expect(aimed[3]).toBeCloseTo(80);
  const [summed] = await live(page, "summed");
  expect(summed.vx).toBeCloseTo(6);
  expect(summed.vy).toBeCloseTo(1);
});

test("the same seed gives the same particles", async ({ page }) => {
  const emitted = async (seed) => {
    await show(page, "Shapes");
    await page.evaluate((seed) => {
      const { scene } = window.objects;
      scene.system.$seed(seed);
      scene.box.burst(20);
    }, seed);
    await advance(page, 16);
    return (await live(page, "box")).map(({ x, y }) => [x, y]);
  };
  const first = await emitted(5);
  expect(await emitted(5)).toEqual(first);
  expect(await emitted(6)).not.toEqual(first);
});

test("an ItemParticle makes an item for each particle and moves it with it", async ({ page }) => {
  await show(page, "Items");
  const read = () =>
    page.evaluate(() => {
      const { scene } = window.objects;
      return [
        scene.items.children.map((item) => [item.x, item.y, item.opacity, item.mine]),
        scene.attached,
        scene.detached,
      ];
    });
  await burst(page, "carrier", 0, 2);
  // Its middle is where the particle is, and it fades in.
  expect(await read()).toEqual([Array(2).fill([95, 90, 0, true]), 2, 0]);
  await advance(page, 500);
  let [items] = await read();
  expect(items.length).toBe(2);
  expect(items[0][0]).toBeCloseTo(145);
  expect(items[0][2]).toBe(1);
  const box = await page.evaluate(() => {
    const { x, y, width, height } = window.objects.scene.items.children[0].$node.getBoundingClientRect();
    return [x, y, width, height].map(Math.round);
  });
  expect(box).toEqual([145, 90, 10, 20]);
  // A frozen item's particle neither moves nor ages.
  await page.evaluate(() => {
    const { items } = window.objects.scene;
    items.freeze(items.children[0]);
  });
  await advance(page, 300);
  [items] = await read();
  expect(items[0][0]).toBeCloseTo(145);
  expect(items[1][0]).toBeCloseTo(175);
  // One that is given away is gone, and its particle with it.
  await page.evaluate(() => {
    const { items } = window.objects.scene;
    items.give(items.children[0]);
  });
  expect((await read()).slice(1)).toEqual([2, 1]);
  await advance(page, 16);
  expect((await live(page, "item")).length).toBe(1);
  await advance(page, 300);
  expect(await read()).toEqual([[], 2, 2]);
  expect(await page.evaluate(() => window.objects.clock.running)).toBe(false);
});

test("a TrailEmitter emits from every particle of the group it follows", async ({ page }) => {
  await show(page, "Items");
  await burst(page, "leader", 1050);
  const [lead] = await live(page, "lead");
  expect(lead.x).toBeCloseTo(155);
  // Ten a second that live a fifth of one: two behind it at a time.
  const trail = await live(page, "trail");
  expect(trail.length).toBe(2);
  for (const { x, y, size } of trail) {
    expect(x).toBeGreaterThan(135);
    expect(x).toBeLessThanOrEqual(155);
    expect(y).toBe(200);
    expect(size).toBe(4);
  }
  expect(await page.evaluate(() => window.objects.scene.followed)).toBeGreaterThanOrEqual(9);
  // When the particle it follows is gone, so is the trail.
  await advance(page, 1250);
  expect(await live(page, "trail")).toEqual([]);
  expect(await page.evaluate(() => window.objects.clock.running)).toBe(false);
});
