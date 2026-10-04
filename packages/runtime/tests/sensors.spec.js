import { expect, open, test } from "./open.js";

const call = (page, name) => page.evaluate((name) => window.scene[name](), name);
const seen = (page) => page.evaluate(() => window.scene.seen.splice(0));

// The device is moved: what a browser tells of it, `after` milliseconds on.
const move = (page, motion, after = 0) =>
  page.evaluate(
    ([motion, after]) => {
      const event = new DeviceMotionEvent("devicemotion", motion);
      if (after) Object.defineProperty(event, "timeStamp", { value: (window.moved ??= performance.now()) + after });
      window.dispatchEvent(event);
    },
    [motion, after],
  );

const MOTION = {
  accelerationIncludingGravity: { x: 1, y: 2, z: 10.5 },
  acceleration: { x: 1, y: 2, z: 0.75 },
  rotationRate: { alpha: 30, beta: 10, gamma: 20 },
  interval: 16,
};

// What Qt 6.11 answers to `read()` of the scene, on a machine with no sensor.
const READ = [
  "QAccelerometer", "QGyroscope", 0, 0, false, false, 0, "", -1, 0, 0, 0, 1, 1, 1, false, false, 1, true,
  0, 0, 0, 0, true, 0, 0, false, 0, 1, 2, 0, 1, 2, 0, 2,
];

test("a sensor that has read nothing is as Qt's", async ({ page }) => {
  await open(page, "sensors");
  expect(await call(page, "read")).toEqual(READ);
  // Qt has no sensor on such a machine and is not active; a browser may
  // tell of one, and is listened to.
  expect(await call(page, "here")).toEqual([true, true, "devicemotion", false, ["QAccelerometer", "QGyroscope"], "devicemotion", ""]);
  expect(await seen(page)).toEqual([]);
});

test("a sensor reads how the device is moved while it is active", async ({ page }) => {
  await open(page, "sensors");
  await move(page, MOTION, 1000);
  // With the pull of the Earth, and without it: the one that is not active
  // hears nothing.
  expect(await seen(page)).toEqual(["felt 1 2 10.5", "pushed 1 2 0.75"]);
  expect(await call(page, "force")).toEqual([1, 2, 10.5, true]);

  expect(await call(page, "start")).toEqual([true, true, true, true]);
  expect(await seen(page)).toEqual(["pulled active true"]);
  // A sensor tells no more often than its `dataRate`, ten a second here.
  await move(page, MOTION, 1050);
  expect(await seen(page)).toEqual(["felt 1 2 10.5", "pulled 0 0 9.75", "turned 10 20 30"]);
  // And not of the same again when it skips duplicates.
  await move(page, { ...MOTION, rotationRate: { alpha: 3, beta: 1, gamma: 2 } }, 1200);
  expect(await seen(page)).toEqual(["felt 1 2 10.5", "pushed 1 2 0.75", "turned 1 2 3"]);

  expect(await call(page, "stop")).toEqual([false, false]);
  await move(page, { ...MOTION, accelerationIncludingGravity: { x: 0, y: 0, z: 9.75 } }, 1400);
  // Each in the order it began to listen.
  expect(await seen(page)).toEqual(["pushed 1 2 0.75", "pulled -1 -2 9"]);
});

test("a browser that tells of no value is not a reading", async ({ page }) => {
  await open(page, "sensors");
  await call(page, "start");
  const none = { x: null, y: null, z: null };
  await move(page, { accelerationIncludingGravity: none, acceleration: none, interval: 16 }, 1000);
  expect(await seen(page)).toEqual(["pulled active true"]);
});
