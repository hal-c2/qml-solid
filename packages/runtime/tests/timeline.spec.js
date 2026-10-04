// QtQuick.Timeline. Every number here is what Qt 6.11 gave for the same QML.
import { test as plain } from "@playwright/test";
import { expect, open, test } from "./open.js";

const at = (page, frame) => page.evaluate((frame) => window.scene.at(frame), frame);
const read = (page) => page.evaluate(() => window.scene.read());
const advance = (page, ms) => page.evaluate((ms) => window.clock.advance(ms), ms);

test("a disabled timeline does nothing; enabled, each property is what its keyframes say", async ({ page }) => {
  await open(page, "timeline");
  expect(await read(page)).toEqual([40, "#ff0000", true, "start"]);
  expect(await at(page, 50)).toEqual([40, "#ff0000", true, "start"]);
  await page.evaluate(() => (window.objects.timeline.enabled = true));
  expect(await read(page)).toEqual([156.25, "#bf7f7f7f", false, "thirty"]);
  // Before its first keyframe a property is on the way there from the value
  // it had, and past the last it stays. A colour is mixed channel by channel,
  // and what cannot be mixed jumps when its keyframe is reached.
  const rows = [
    [-10, 40, "#ff0000", true, "start"],
    [0, 40.000299998500005, "#0000ff", true, "start"],
    [10, 70.00014999925, "#f21919e5", true, "start"],
    [20, 100, "#e53333cc", true, "start"],
    [30, 106.25, "#d84c4cb2", false, "thirty"],
    [40, 125, "#cc666699", false, "thirty"],
    [50, 156.25, "#bf7f7f7f", false, "thirty"],
    [60, 200, "#b2999966", false, "thirty"],
    [69, 110, "#a7afaf4f", false, "thirty"],
    [70, 100, "#a6b2b24c", true, "seventy"],
    [80, 0, "#99cccc33", true, "seventy"],
    [90, 0, "#8ce5e519", true, "seventy"],
    [100, 0, "#80ffff00", true, "seventy"],
    [150, 0, "#80ffff00", true, "seventy"],
  ];
  for (const [frame, ...values] of rows) expect(await at(page, frame), `frame ${frame}`).toEqual(values);
});

test("a timeline takes a bound property over and gives the binding back", async ({ page }) => {
  await open(page, "timeline");
  const steps = await page.evaluate(() => {
    const { timeline } = window.objects;
    const scene = window.scene;
    const seen = [];
    timeline.currentFrame = 150;
    timeline.enabled = true;
    // The binding does not decide while the timeline has the property.
    scene.base = 60;
    seen.push(scene.read());
    seen.push(scene.at(10));
    timeline.enabled = false;
    seen.push(scene.read());
    // Given back, the binding is a binding.
    scene.base = 70;
    seen.push(scene.read());
    // Taken again, the way to the first keyframe starts from what it is now.
    timeline.enabled = true;
    seen.push(scene.read());
    return seen;
  });
  expect(steps).toEqual([
    [0, "#80ffff00", true, "seventy"],
    [70.00014999925, "#f21919e5", true, "start"],
    [60, "#ff0000", true, "start"],
    [70, "#ff0000", true, "start"],
    [85.000074999625, "#f21919e5", true, "start"],
  ]);
});

test("a property is interpolated as its type is", async ({ page }) => {
  await open(page, "timelinetypes");
  // Vectors and quaternions in single precision, the quaternion along the
  // arc; a bool and a string jump at the keyframe.
  const rows = [
    [0, { level: 1.5000084999915, tint: "#102030", v2: "QVector2D(1.00001, 2.00002)", v3: "QVector3D(1.00001, 2.00002, 3.00003)", v4: "QVector4D(1.00001, 2.00002, 3.00003, 4.00004)", quat: "QQuaternion(1, 0, 7.85398e-07, 0)", pt: "QPointF(1.00001, 2.00002)", sz: "QSizeF(10.0001, 20.0002)", rc: "QRectF(1.00001, 2.00002, 30.0001, 40.0001)", flag: false, text: "a", dbl: 2.00000999999 }],
    [25, { level: 3.625006374993625, tint: "#4b535b", v2: "QVector2D(3.50001, 7.00001)", v3: "QVector3D(0.750007, 7.00001, 10.5)", v4: "QVector4D(3.50001, 7.00001, 10.5, 14)", quat: "QQuaternion(0.980785, 0, 0.195091, 0)", pt: "QPointF(3.50001, 7.00001)", sz: "QSizeF(35.0001, 70.0001)", rc: "QRectF(3.50001, 7.00001, 55.0001, 65.0001)", flag: false, text: "a", dbl: 4.5000074999925 }],
    [33, { level: 4.305005694994305, tint: "#5e6369", v2: "QVector2D(4.30001, 8.60001)", v3: "QVector3D(0.670006, 8.60001, 12.9)", v4: "QVector4D(4.30001, 8.60001, 12.9, 17.2)", quat: "QQuaternion(0.9666, 0, 0.25629, 0)", pt: "QPointF(4.30001, 8.60001)", sz: "QSizeF(43.0001, 86.0001)", rc: "QRectF(4.30001, 8.60001, 63.0001, 73.0001)", flag: false, text: "a", dbl: 5.3000066999933 }],
    [50, { level: 5.75000424999575, tint: "#878786", v2: "QVector2D(6, 12)", v3: "QVector3D(0.500005, 12, 18)", v4: "QVector4D(6, 12, 18, 24)", quat: "QQuaternion(0.92388, 0, 0.382684, 0)", pt: "QPointF(6, 12)", sz: "QSizeF(60, 120)", rc: "QRectF(6, 12, 80, 90)", flag: false, text: "a", dbl: 7.000004999995 }],
    [63, { level: 6.855003144996855, tint: "#a6a19c", v2: "QVector2D(7.3, 14.6)", v3: "QVector3D(0.370003, 14.6, 21.9)", v4: "QVector4D(7.3, 14.6, 21.9, 29.2)", quat: "QQuaternion(0.880063, 0, 0.474857, 0)", pt: "QPointF(7.3, 14.6)", sz: "QSizeF(73, 146)", rc: "QRectF(7.3, 14.6, 93, 103)", flag: false, text: "a", dbl: 8.3000036999963 }],
    [75, { level: 7.875002124997875, tint: "#c3bab1", v2: "QVector2D(8.5, 17)", v3: "QVector3D(0.250002, 17, 25.5)", v4: "QVector4D(8.5, 17, 25.5, 34)", quat: "QQuaternion(0.83147, 0, 0.555571, 0)", pt: "QPointF(8.5, 17)", sz: "QSizeF(85, 170)", rc: "QRectF(8.5, 17, 105, 115)", flag: false, text: "a", dbl: 9.5000024999975 }],
    [99.99, { level: 9.999150000849998, tint: "#feeddc", v2: "QVector2D(10.999, 21.998)", v3: "QVector3D(0.000100001, 21.998, 32.997)", v4: "QVector4D(10.999, 21.998, 32.997, 43.996)", quat: "QQuaternion(0.707163, 0, 0.707051, 0)", pt: "QPointF(10.999, 21.998)", sz: "QSizeF(109.99, 219.98)", rc: "QRectF(10.999, 21.998, 129.99, 139.99)", flag: false, text: "a", dbl: 11.999000000999999 }],
    [100, { level: 10, tint: "#ffeedd", v2: "QVector2D(11, 22)", v3: "QVector3D(0, 22, 33)", v4: "QVector4D(11, 22, 33, 44)", quat: "QQuaternion(0.707107, 0, 0.707107, 0)", pt: "QPointF(11, 22)", sz: "QSizeF(110, 220)", rc: "QRectF(11, 22, 130, 140)", flag: true, text: "b", dbl: 12 }],
    [120, { level: 10, tint: "#ffeedd", v2: "QVector2D(11, 22)", v3: "QVector3D(0, 22, 33)", v4: "QVector4D(11, 22, 33, 44)", quat: "QQuaternion(0.707107, 0, 0.707107, 0)", pt: "QPointF(11, 22)", sz: "QSizeF(110, 220)", rc: "QRectF(11, 22, 130, 140)", flag: true, text: "b", dbl: 12 }],
  ];
  for (const [frame, values] of rows) expect(await at(page, frame), `frame ${frame}`).toEqual(values);
});

test("keyframes are in Qt's order, and each curve is that of the way to its keyframe", async ({ page }) => {
  await open(page, "timelineorder");
  // a: written out of order, three of them at frame 40, of which the first
  // is the one reached and the last the one left. b: a bezier curve given
  // without a type, then InOutQuad. c: OutBack, then OutElastic with an
  // amplitude and a period. big: forty keyframes, as `std::sort` leaves them.
  const rows = [
    [0, 1, 1, 1, 1],
    [9.9999, 1, 1, 1, 1],
    [10, 1.0001899981000186, 0.999990000099999, 0.999990000099999, 1037],
    [15, 10.50009499905001, 0.4999950000499995, 0.4999950000499995, 1019],
    [20, 20, 0, 0, 1035],
    [25, 115, 57.229004708314655, 49.29246484375002, 1033.5],
    [30, 210, 84.35140402233199, 81.74096875000001, 1031],
    [39, 381, 97.2797426682524, 107.80709190625, 1020.8],
    [40, 400, 97.78262424554669, 108.76975, 1023],
    [41, 3803, 98.20170011750346, 109.43855934375, 1032.3],
    [45, 3015, 99.27648113276419, 109.68185546875, 1029.5],
    [50, 2030, 99.82712227295805, 106.41365625000002, 1026],
    [55, 1045, 99.9820482688559, 102.13106640625, 1015],
    [59, 257, 99.99987406361147, 100.10212753125, 1003],
    [60, 60, 100, 100, 1000],
    [61, 60, 99.875, 34.96643909959849, 1031.7],
    [65, 60, 96.875, -72.82376575609851, 1022.5],
    [70, 60, 87.5, -17.677669529663703, 1011],
    [75, 60, 71.875, 12.873544649419472, 1027.5],
    [80, 60, 50, 3.125, 1039],
    [85, 60, 28.125, -2.2757426798780642, 1039],
    [90, 60, 12.5, -0.5524271728019983, 1039],
    [100, 60, 0, 0, 1039],
  ];
  for (const [frame, ...values] of rows) {
    const found = await at(page, frame);
    values.forEach((value, index) => expect(found[index], `frame ${frame}, ${"abc"[index] ?? "big"}`).toBeCloseTo(value, 9));
  }
});

test("a group gives back what it took, where the property still reads what it wrote", async ({ page }) => {
  await open(page, "timelinetakes&still");
  // A timeline that is enabled has its properties before anything is told
  // that it is complete.
  expect(await page.evaluate(() => window.scene.atCompleted)).toBe(90.00004999995);
  const steps = await page.evaluate(() => {
    const { a, first, second } = window.objects;
    const scene = window.scene;
    const seen = [scene.read()];
    const step = (work) => {
      work();
      seen.push(scene.read());
    };
    step(() => {
      // Assigned, `x` is bound no more.
      a.x = 20;
      first.currentFrame = 50;
      first.enabled = true;
    });
    step(() => {
      // Something else writes while the timeline has the property.
      a.y = 500;
      a.opacity = 0.25;
      scene.base = 60;
    });
    step(() => (first.enabled = false));
    step(() => (scene.base = 80));
    step(() => (second.enabled = false));
    step(() => (second.enabled = true));
    step(() => (scene.base = 90));
    step(() => (second.currentFrame = 0));
    step(() => (second.enabled = false));
    step(() => {
      first.currentFrame = 100;
      first.enabled = true;
    });
    return seen;
  });
  const early = 90.00004999995;
  const between = 55.00004999995;
  // x, y, width and opacity of the first; the one with two groups; the one
  // with a Behavior; the one of the timeline enabled from the start.
  expect(steps).toEqual([
    [40, 40, 40, 0.5, 5, 5, early],
    // The second group on a property starts from what the first wrote.
    [80.00005999994, early, early, 0.75000024999975, 1005, 5, early],
    [80.00005999994, 500, early, 0.25, 1005, 5, early],
    // The value assigned before, the values written since, the binding; and
    // of two groups only the last finds what it wrote.
    [20, 500, 60, 0.25, between, 5, early],
    [20, 500, 80, 0.25, between, 5, early],
    [20, 500, 80, 0.25, between, 5, 80],
    [20, 500, 80, 0.25, between, 5, 110.00002999997],
    [20, 500, 90, 0.25, between, 5, 110.00002999997],
    [20, 500, 90, 0.25, between, 5, 80.00005999994],
    [20, 500, 90, 0.25, between, 5, 90],
    [140, 140, 140, 1, 1005, 5, 90],
  ]);
  // What a timeline writes a Behavior animates, and it goes on when the
  // timeline lets go: the property does not read what was written.
  await advance(page, 500);
  const slow = (await read(page))[5];
  expect(slow).toBeGreaterThan(5);
  expect(slow).toBeLessThan(105);
  await page.evaluate(() => (window.objects.first.enabled = false));
  expect(await read(page)).toEqual([20, 500, 90, 0.25, 105, slow, 90]);
  await advance(page, 1500);
  expect(await read(page)).toEqual([20, 500, 90, 0.25, 105, 105, 90]);
});

test("states enable a timeline and move it; keyframes and groups change under it", async ({ page }) => {
  await open(page, "timelinestates&still");
  const steps = await page.evaluate(() => {
    const { timeline, gx, k1, k2, other } = window.objects;
    const scene = window.scene;
    const seen = [scene.read()];
    const step = (work) => {
      work();
      seen.push(scene.read());
    };
    step(() => scene.to("half"));
    step(() => scene.to("end"));
    step(() => scene.to(""));
    step(() => (scene.base = 50));
    step(() => scene.to("half"));
    step(() => (k2.value = 400));
    step(() => (k2.frame = 50));
    step(() => (k1.frame = 60));
    step(() => scene.inQuad());
    step(() => (timeline.currentFrame = 55));
    step(() => (timeline.startFrame = 40));
    step(() => (timeline.currentFrame = 45));
    step(() => (gx.target = other));
    step(() => (timeline.currentFrame = 50));
    step(() => (gx.property = "y"));
    step(() => (timeline.currentFrame = 55));
    step(() => scene.to(""));
    step(() => scene.to("run"));
    return seen;
  });
  const x = 53.12509375023438;
  const moved = 30.250232499418757;
  // enabled, currentFrame, the box's x and y, the other's x and y.
  expect(steps).toEqual([
    [false, 0, 40, 5, 7, 5],
    [true, 50, 150, 200, 7, 5],
    [true, 100, 200, 300, 7, 5],
    [false, 0, 40, 5, 7, 5],
    [false, 0, 50, 5, 7, 5],
    [true, 50, 150, 200, 7, 5],
    // A keyframe's value, then its frame.
    [true, 50, 250, 200, 7, 5],
    [true, 50, 400, 200, 7, 5],
    // The first is now after the second, and they stay in the order they
    // were: nothing sorts them again.
    [true, 50, 91.66668055553241, 200, 7, 5],
    [true, 50, 84.72224537033566, 200, 7, 5],
    [true, 55, 92.01390162035011, 210, 7, 5],
    // `startFrame` is read when something is written, and writes nothing.
    [true, 55, 92.01390162035011, 210, 7, 5],
    [true, 45, x, 190, 7, 5],
    // Another target, another property: taken at once, written at the next
    // frame, and what was written to the one before is left there.
    [true, 45, x, 190, 7, 5],
    [true, 50, x, 200, moved, 5],
    [true, 50, x, 200, moved, 5],
    [true, 55, x, 210, moved, 58.43767812425782],
    [false, 0, x, 5, moved, 5],
    [true, 0, x, 100, moved, 5],
  ]);
  // The state that runs the animation: to the end, and the frame stays
  // there when the state is left, as nothing of the state's set it.
  await advance(page, 200);
  await advance(page, 16);
  expect(await read(page)).toEqual([true, 100, x, 300, moved, 400]);
  expect(await page.evaluate(() => window.scene.to(""))).toEqual([false, 100, x, 5, moved, 5]);
});

test("a TimelineAnimation moves its timeline, stops the others and says when it has finished", async ({ page }) => {
  await open(page, "timelineanimation&still");
  const take = () => page.evaluate(() => window.scene.take());
  const act = (name, method) => page.evaluate(([name, method]) => window.objects[name][method](), [name, method]);
  // Its target is the timeline it is in, its property `currentFrame`.
  expect(await page.evaluate(() => window.scene.made)).toBe("true currentFrame 0");
  // Each line: who, what; currentFrame and the value it makes; which of the
  // four are running; `loops` of the two that ping-pong; `from` and `to` of
  // the first of those.
  await act("plain", "start");
  expect(await take()).toEqual(["plain started 0 0 1000 1 2 20 80", "plain running true 10 100 1000 1 2 20 80"]);
  await advance(page, 200);
  expect(await take()).toEqual([
    "plain stopped 90 900 0000 1 2 20 80",
    "plain finished 90 900 0000 1 2 20 80",
    "plain running false 90 900 0000 1 2 20 80",
  ]);
  // Stopped by hand it has finished too, where it is.
  await act("plain", "start");
  await advance(page, 100);
  await act("plain", "stop");
  expect(await take()).toEqual([
    "plain started 90 900 1000 1 2 20 80",
    "plain running true 10 100 1000 1 2 20 80",
    "plain stopped 50 500 0000 1 2 20 80",
    "plain finished 50 500 0000 1 2 20 80",
    "plain running false 50 500 0000 1 2 20 80",
  ]);
  // There and back: two runs, the second with `from` and `to` changed
  // round, and finished only after it.
  await act("pong", "start");
  expect(await take()).toEqual(["pong started 50 500 0100 1 2 20 80", "pong running true 20 200 0100 1 2 20 80"]);
  await advance(page, 200);
  expect(await take()).toEqual([
    "pong stopped 80 800 0000 1 2 20 80",
    "pong started 80 800 0100 1 2 80 20",
    "pong running true 80 800 0100 1 2 80 20",
  ]);
  await advance(page, 200);
  expect(await take()).toEqual([
    "pong stopped 20 200 0000 1 2 80 20",
    "pong finished 20 200 0000 1 2 20 80",
    "pong running false 20 200 0000 1 2 20 80",
  ]);
  // Twice there and back: `loops` reads 1 while it goes on.
  await act("pong2", "start");
  expect(await take()).toEqual(["pong2 started 20 200 0010 1 2 20 80", "pong2 running true 20 200 0010 1 1 20 80"]);
  for (const [from, to] of [
    [80, 800],
    [20, 200],
    [80, 800],
  ]) {
    await advance(page, 200);
    expect(await take()).toEqual([
      `pong2 stopped ${from} ${to} 0000 1 1 20 80`,
      `pong2 started ${from} ${to} 0010 1 1 20 80`,
      `pong2 running true ${from} ${to} 0010 1 1 20 80`,
    ]);
  }
  await advance(page, 200);
  expect(await take()).toEqual([
    "pong2 stopped 20 200 0000 1 1 20 80",
    "pong2 finished 20 200 0000 1 2 20 80",
    "pong2 running false 20 200 0000 1 2 20 80",
  ]);
  // Stopped by hand on its way there it is over, and starts from the
  // beginning the next time.
  await act("pong", "start");
  await advance(page, 100);
  await act("pong", "stop");
  expect(await take()).toEqual([
    "pong started 20 200 0100 1 2 20 80",
    "pong running true 20 200 0100 1 2 20 80",
    "pong stopped 50 500 0000 1 2 20 80",
    "pong finished 50 500 0000 1 2 20 80",
    "pong running false 50 500 0000 1 2 20 80",
  ]);
  await act("pong", "start");
  await advance(page, 200);
  await advance(page, 200);
  expect(await take()).toEqual([
    "pong started 50 500 0100 1 2 20 80",
    "pong running true 20 200 0100 1 2 20 80",
    "pong stopped 80 800 0000 1 2 20 80",
    "pong started 80 800 0100 1 2 80 20",
    "pong running true 80 800 0100 1 2 80 20",
    "pong stopped 20 200 0000 1 2 80 20",
    "pong finished 20 200 0000 1 2 20 80",
    "pong running false 20 200 0000 1 2 20 80",
  ]);
  // One that starts stops the one that is running, before its own first
  // frame.
  await act("forever", "start");
  await advance(page, 100);
  await act("plain", "start");
  expect(await take()).toEqual([
    "forever started 20 200 0001 1 2 20 80",
    "plain started 50 500 1001 1 2 20 80",
    "forever stopped 50 500 1000 1 2 20 80",
    "forever finished 50 500 1000 1 2 20 80",
    "plain running true 10 100 1000 1 2 20 80",
  ]);
});

plain("a group's keyframes are read from its source, and Qt's warnings said", async ({ page }) => {
  const warnings = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  await page.route("**/assets/missing.qad*", (route) => route.fulfill({ status: 404, body: "no" }));
  await open(page, "timelinesource");
  // The keyframes of the file are the group's, after those written in it.
  await page.waitForFunction(() => window.scene.count() === 4);
  await expect.poll(() => warnings.length).toBe(5);
  expect(warnings.filter((text) => text === 'Corrupt keyframeSource "invalid data size"')).toHaveLength(1);
  expect(warnings.filter((text) => /^Unable to open keyframeSource: ".*missing\.qad"$/.test(text))).toHaveLength(1);
  // A group with nothing to write says so: the two whose file gave them
  // nothing, and the one that was given no keyframes.
  expect(warnings.filter((text) => text === 'Cannot set property "bad"')).toHaveLength(2);
  expect(warnings.filter((text) => text === 'Cannot set property "none"')).toHaveLength(1);
  // n, v, q, c, flag, mixed, bad, none. A file's keyframes are sorted with
  // the ones written in the group, and have their easing curves.
  const rows = [
    [0, 10.5, "QVector3D(1.5, 2.5, 3.5)", "QQuaternion(1, 0, 0, 0)", "#0000ff", false, 10.5, 1, 1],
    [25, 32.875, "QVector3D(5.875, 11.25, 16.625)", "QQuaternion(0.980785, 0, 0.19509, 0)", "#df3f3fbf", false, 32.875, 1, 1],
    [50, 100, "QVector3D(9, 17.5, 26)", "QQuaternion(0.92388, 0, 0.382684, 0)", "#bf7f7f7f", true, 100, 1, 1],
    [60, 80.05, "QVector3D(9.9, 19.3, 28.7)", "QQuaternion(0.891007, 0, 0.453991, 0)", "#b2999966", true, 460, 1, 1],
    [75, 50.125, "QVector3D(10.875, 21.25, 31.625)", "QQuaternion(0.83147, 0, 0.55557, 0)", "#9fbfbf3f", true, 1000, 1, 1],
    [90, 20.19999999999999, "QVector3D(11.4, 22.3, 33.2)", "QQuaternion(0.760406, 0, 0.649448, 0)", "#8ce5e519", false, 400.15, 1, 1],
    [100, 0.25, "QVector3D(11.5, 22.5, 33.5)", "QQuaternion(0.707107, 0, 0.707107, 0)", "#80ffff00", false, 0.25, 1, 1],
  ];
  for (const [frame, ...values] of rows) expect(await at(page, frame), `frame ${frame}`).toEqual(values);
});

test("a timeline places a node: its position, its turn, its scale and its angles", async ({ page }) => {
  await open(page, "timelinenodes");
  // position and x, y, z; rotation and the angles it makes; scale and its x;
  // the angles of which one is animated, and the turn they make; the angles
  // animated as one.
  const before = ["QVector3D(1, 2, 3)", "1 2 3", "QQuaternion(0.707107, 0, 0.707107, 0)", "QVector3D(0, 90, 0)", "QVector3D(2, 2, 2)", 2, "QVector3D(10, 20, 30)", "QQuaternion(0.951549, 0.127679, 0.144878, 0.239298)", "QVector3D(10, 20, 30)"];
  expect(await read(page)).toEqual(before);
  await page.evaluate(() => (window.objects.timeline.enabled = true));
  const rows = [
    [0, "QVector3D(10, 20, 30)", "10 20 30", "QQuaternion(1, 0, 0, 0)", "QVector3D(0, 0, 0)", "QVector3D(2, 2.00001, 2.00001)", 2.0000040531158447, "QVector3D(0, 20, 30)", "QQuaternion(0.951251, 0.0449435, 0.167731, 0.254887)", "QVector3D(10, 20, 30)"],
    [25, "QVector3D(35, 70, 105)", "35 70 105", "QQuaternion(0.92388, 0, 0.382683, 0)", "QVector3D(0, 45, 0)", "QVector3D(3, 4, 5.00001)", 3.000001907348633, "QVector3D(22.5, 20, 30)", "QQuaternion(0.941741, 0.22966, 0.114782, 0.217267)", "QVector3D(17.5, 27.5, 37.5)"],
    [50, "QVector3D(60, 120, 180)", "60 120 180", "QQuaternion(0.707107, 0, 0.707107, 0)", "QVector3D(0, 90, 0)", "QVector3D(4, 6, 8)", 4, "QVector3D(45, 20, 30)", "QQuaternion(0.896041, 0.40555, 0.0574224, 0.171297)", "QVector3D(25, 35, 45)"],
    [75, "QVector3D(85, 170, 255)", "85 170 255", "QQuaternion(0.382683, 0, 0.92388, 0)", "QVector3D(0, 135, 0)", "QVector3D(4, 6, 8)", 4, "QVector3D(67.5, 20, 30)", "QQuaternion(0.815906, 0.565856, -0.00214419, 0.118744)", "QVector3D(32.5, 42.5, 52.5)"],
    [100, "QVector3D(110, 220, 330)", "110 220 330", "QQuaternion(0, 0, 1, 0)", "QVector3D(0, 180, 0)", "QVector3D(4, 6, 8)", 4, "QVector3D(90, 20, 30)", "QQuaternion(0.704416, 0.704416, -0.0616284, 0.0616284)", "QVector3D(40, 50, 60)"],
  ];
  for (const [frame, ...values] of rows) expect(await at(page, frame), `frame ${frame}`).toEqual(values);
  await page.evaluate(() => (window.objects.timeline.enabled = false));
  expect(await read(page)).toEqual(before);
});
