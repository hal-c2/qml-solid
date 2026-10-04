// What is expected here is what Qt 6.11 answers for the same QML: each scene
// is run by `qml6` too, and asked the same before and after every step.
import { expect, open, test } from "./open.js";

const answers = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.scene.answers())));

// `expected` is what the scene answers at first, and then after each of its
// steps.
async function stages(page, expected) {
  for (let at = 0; at < expected.length; at++) {
    expect(await answers(page), at ? `after step ${at - 1}` : "at first").toEqual(expected[at]);
    if (at < expected.length - 1) await page.evaluate((index) => window.scene.step(index), at);
  }
}

// The same with time in the test's hands: Qt was asked 400 ms after each step,
// by when a transition of 100 ms is over.
async function timed(page, expected) {
  await page.evaluate(() => window.objects.clock.stop());
  for (let at = 0; at < expected.length; at++) {
    expect(await answers(page), at ? `after step ${at - 1}` : "at first").toEqual(expected[at]);
    if (at === expected.length - 1) break;
    await page.evaluate((index) => {
      window.scene.step(index);
      window.objects.clock.advance(400);
    }, at);
  }
}

test("a Container keeps its items in a model a view shows, and one of them current", async ({ page }) => {
  await open(page, "containers");
  await stages(page, CONTAINERS);
});
test("a SwipeView makes its pages as big as its view, which follows the current one", async ({ page }) => {
  await open(page, "swipeview");
  await stages(page, SWIPEVIEW);
});
test("a TabBar shares its width among its tabs, and the one checked is current", async ({ page }) => {
  await open(page, "tabbar");
  await stages(page, TABBAR);
});

test("a StackView shows the top of what is pushed, and tells each item as it comes and goes", async ({ page }) => {
  await open(page, "stackview");
  await timed(page, STACKVIEW);
});

// Qt answers once a transition is over. What is here is the way there: the
// item that comes is where its animation has it, and no press reaches
// either item until both have arrived, as Qt's `childMouseEventFilter` has it.
test("a StackView's transitions run on the clock, and nothing in it is pressed meanwhile", async ({ page }) => {
  await open(page, "stackview");
  const state = () =>
    page.evaluate(() => {
      const { stack, presses } = window.scene;
      return [stack.busy, stack.get(0).x, stack.get(1).x, stack.get(0).visible, presses];
    });
  await page.evaluate(() => {
    window.objects.clock.stop();
    window.scene.step(0);
  });
  expect(await state()).toEqual([true, 0, 200, true, 0]);
  await page.evaluate(() => window.objects.clock.advance(50));
  expect(await state()).toEqual([true, -100, 100, true, 0]);
  await page.mouse.click(150, 50);
  await page.mouse.click(50, 50);
  expect(await state()).toEqual([true, -100, 100, true, 0]);
  await page.evaluate(() => window.objects.clock.advance(50));
  expect(await state()).toEqual([false, -200, 0, false, 0]);
  await page.mouse.click(50, 50);
  expect(await state()).toEqual([false, -200, 0, false, 1]);
});

test("a StackView that was given no transition leaves what is popped where it is", async ({ page }) => {
  await open(page, "stackbare");
  await stages(page, STACKBARE);
});

// As Qt's `wheelEvent` does: a notch down is the next tab, one up the one
// before, and a bar that is not `wheelEnabled` leaves the wheel alone.
test("scroll bars and indicators follow a Flickable, which goes where a bar is put", async ({ page }) => {
  await open(page, "scrollbars");
  await stages(page, SCROLLBARS);
});

// Qt was not asked what a mouse does: what is expected of a press, a move and
// a release is what `qquickscrollbar.cpp` does with them.
test("a ScrollBar is dragged by its handle, and shows while the mouse is on it", async ({ page }) => {
  await open(page, "scrollbars");
  const bar = (name) =>
    page.evaluate((name) => {
      const { position, pressed, hovered, active } = window.scene[name];
      return [Math.round(position * 1000) / 1000, pressed, hovered, active];
    }, name);
  await page.mouse.move(307, 30);
  expect(await bar("free")).toEqual([0.2, false, true, true]);
  // The handle is held where it was pressed, and stops at the ends.
  await page.mouse.down();
  expect(await bar("free")).toEqual([0.2, true, true, true]);
  await page.mouse.move(307, 50);
  expect(await bar("free")).toEqual([0.4, true, true, true]);
  await page.mouse.move(250, 250);
  expect(await bar("free")).toEqual([0.7, true, true, true]);
  await page.mouse.move(307, 62);
  await page.mouse.up();
  expect(await bar("free")).toEqual([0.52, false, true, true]);
  // A press beside the handle brings its middle there.
  await page.mouse.move(307, 12);
  await page.mouse.down();
  expect(await bar("free")).toEqual([0, true, true, true]);
  await page.mouse.move(307, 42);
  expect(await bar("free")).toEqual([0.25, true, true, true]);
  await page.mouse.up();
  await page.mouse.move(250, 250);
  expect(await bar("free")).toEqual([0.25, false, false, false]);

  // One of a Flickable moves what is in it, and stays where it is itself.
  await page.mouse.move(195, 10);
  await page.mouse.down();
  await page.mouse.move(195, 40);
  expect(await bar("vbar")).toEqual([0.3, true, true, true]);
  const flick = () =>
    page.evaluate(() => {
      const { flick, vdot, vbar } = window.scene;
      const { x, y, width, height } = vbar.$node.getBoundingClientRect();
      return [Math.round(flick.contentY * 1000) / 1000, Math.round(vdot.position * 1000) / 1000, flick.$viewport.scrollTop, x, y, width, height];
    });
  expect(await flick()).toEqual([150, 0.3, 150, 190, 0, 10, 100]);
  await page.mouse.up();
  await page.mouse.move(250, 250);
  await page.waitForFunction(() => !window.scene.vbar.active);
  expect(await bar("vbar")).toEqual([0.3, false, false, false]);

  // The wheel moves the Flickable, and its bars and indicators show meanwhile.
  const shown = await page.evaluate(() => window.scene.shown);
  await page.mouse.move(100, 50);
  await page.mouse.wheel(0, 100);
  await page.waitForFunction(() => window.scene.flick.contentY === 250 && !window.scene.flick.moving);
  expect(await bar("vbar")).toEqual([0.5, false, false, false]);
  expect(await page.evaluate(() => [window.scene.shown, window.scene.vdot.active])).toEqual([shown + 11, false]);

  // One that is not interactive is not there for the mouse.
  await page.evaluate(() => (window.scene.free.interactive = false));
  await page.mouse.move(307, 30);
  await page.mouse.down();
  await page.mouse.move(307, 60);
  expect(await bar("free")).toEqual([0.25, false, false, false]);
  await page.mouse.up();
});

test("a ScrollView's bars scroll it, by the mouse and by the arrow keys, and a finger makes indicators of them", async ({ page }) => {
  await open(page, "scrollbars");
  const at = (name) =>
    page.evaluate((name) => {
      const view = window.scene[name];
      const round = (value) => Math.round(value * 1000) / 1000;
      const { down, across, contentItem } = view;
      return [round(contentItem.contentX), round(contentItem.contentY), round(across.position), round(down.position)];
    }, name);
  await page.evaluate(() => window.scene.view.forceActiveFocus());
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  expect(await at("view")).toEqual([30, 76, 0.1, 0.2]);
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowLeft");
  expect(await at("view")).toEqual([0, 38, 0, 0.1]);

  // The bar is over the Flickable: the press is the bar's.
  await page.mouse.move(194, 130);
  await page.mouse.down();
  await page.mouse.move(194, 166);
  expect(await at("view")).toEqual([0, 190, 0, 0.5]);
  expect(await page.evaluate(() => [window.scene.view.down.pressed, window.scene.view.across.active])).toEqual([true, true]);
  await page.mouse.up();
  await page.mouse.move(350, 250);
  await page.waitForFunction(() => !window.scene.view.down.active);

  const interactive = () =>
    page.evaluate(() => {
      const { down, across } = window.scene.view;
      return [down.interactive, across.interactive, down.$node.style.pointerEvents, across.$node.style.pointerEvents];
    });
  const touch = await fingers(page);
  await touch("touchStart", [1, 100, 150]);
  await touch("touchEnd");
  expect(await interactive()).toEqual([false, false, "none", "none"]);
  await page.mouse.click(100, 150);
  expect(await interactive()).toEqual([true, true, "", ""]);

  // A view that does not take the wheel keeps it from its Flickable.
  await page.mouse.move(50, 240);
  await page.mouse.wheel(0, 100);
  await page.waitForFunction(() => window.scene.inner.contentY === 100 && !window.scene.given.down.active);
  expect(await at("given")).toEqual([0, 100, 0, 0.286]);
  await page.evaluate(() => (window.scene.given.wheelEnabled = false));
  await page.mouse.wheel(0, 100);
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  expect(await at("given")).toEqual([0, 100, 0, 0.286]);
});

// Fingers, as the device sends them: `touchStart` says where they are and
// `touchEnd` lifts them. Each waits for the page to have had its events.
test("a SplitView gives each item what it says it prefers, and the rest to the one that fills", async ({ page }) => {
  await open(page, "splitview");
  await stages(page, SPLITVIEW);
});

async function fingers(page) {
  const device = await page.context().newCDPSession(page);
  await page.evaluate(() => {
    window.touched = 0;
    for (const type of ["pointerdown", "pointerup", "pointercancel"]) {
      document.addEventListener(type, (event) => void (window.touched += event.pointerType === "touch"));
    }
  });
  let expected = 0;
  return async (type, ...points) => {
    expected += 1;
    await device.send("Input.dispatchTouchEvent", { type, touchPoints: points.map(([id, x, y]) => ({ id, x, y })) });
    await page.waitForFunction((expected) => window.touched >= expected, expected);
  };
}

test("the wheel steps through the tabs of a TabBar that takes it", async ({ page }) => {
  await open(page, "tabbar");
  const current = (name) => page.evaluate((name) => window.objects[name].currentIndex, name);
  await page.mouse.move(60, 115);
  await page.mouse.wheel(0, 120);
  await page.waitForFunction(() => window.objects.fixed.currentIndex === 2);
  await page.mouse.wheel(0, 120);
  await page.mouse.wheel(0, -60);
  await page.mouse.wheel(0, -60);
  await page.waitForFunction(() => window.objects.fixed.currentIndex === 1);
  expect(await page.evaluate(() => window.objects.f1.checked)).toBe(true);
  await page.mouse.move(60, 15);
  await page.mouse.wheel(0, 120);
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  expect(await current("bar")).toBe(0);
});

// The swipe is the browser's scrolling, which Qt has no part in: what is
// expected is what the style's ListView does in Qt when it is flicked.
test("the page a SwipeView is swiped to is the current one, of what is bound to it too", async ({ page }) => {
  await open(page, "swipeview");
  const swipe = (list, to) =>
    page.evaluate(([list, to]) => window.scene[list].$viewport.scrollTo({ ...to, behavior: "instant" }), [list, to]);
  const settled = (list) => page.waitForFunction((list) => !window.scene[list].moving, list);
  const state = () =>
    page.evaluate(() => {
      const { view, list, bar, paired, column } = window.scene;
      return [view.currentIndex, list.currentIndex, list.contentX, bar.currentIndex, paired.currentIndex, column.currentIndex, column.contentY];
    });
  await swipe("list", { left: 202 });
  await page.waitForFunction(() => window.scene.view.currentIndex === 1);
  await settled("list");
  expect(await state()).toEqual([1, 1, 202, 0, 0, 0, 0]);
  await swipe("column", { top: 100 });
  await page.waitForFunction(() => window.scene.paired.currentIndex === 2);
  await settled("column");
  expect(await state()).toEqual([1, 1, 202, 2, 2, 2, 100]);
  // The view still goes where the container says.
  await page.evaluate(() => {
    window.scene.view.setCurrentIndex(2);
    window.scene.bar.setCurrentIndex(1);
  });
  expect(await state()).toEqual([2, 2, 404, 1, 1, 1, 50]);
  await swipe("list", { left: 0 });
  await page.waitForFunction(() => window.scene.view.currentIndex === 0);
  await settled("list");
  expect(await state()).toEqual([0, 0, 0, 1, 1, 1, 50]);
});

const CONTAINERS = [
  [
    [3, 0, "p0 p1 p2", 3],
    [true, true, 3, 4],
    [[0, 32, 74], 3, true],
    [124, 12, 124, 12],
    [3, 3, 194, 34],
    [4, 3, 3, 4, "l0 r r l3"],
    [[0, 35, 60, 85], true, true],
    [0, 0, 125],
    [0, -1, true, false, 0],
    [false, false, false, false],
  ],
  [
    [3, 1, "p0 p1 p2", 3],
    [true, true, 3, 4],
    [[0, 32, 74], 3, true],
    [124, 12, 124, 12],
    [3, 3, 194, 34],
    [4, 2, 2, 4, "l0 r r l3"],
    [[0, 35, 60, 85], true, true],
    [0, 0, 125],
    [0, -1, true, false, 0],
    [false, false, false, false],
  ],
  [
    [3, 2, "p0 p1 p2", 3],
    [true, true, 3, 4],
    [[0, 32, 74], 3, true],
    [124, 12, 124, 12],
    [3, 3, 194, 34],
    [4, 0, 0, 4, "l0 r r l3"],
    [[0, 35, 60, 85], true, true],
    [0, 0, 125],
    [0, -1, true, false, 0],
    [false, false, false, false],
  ],
  [
    [4, 2, "made p0 p1 p2", 4],
    [true, true, 4, 5],
    [[126, 0, 32, 74], 4, true],
    [151, 12, 151, 12],
    [3, 3, 194, 34],
    [4, 2, 2, 4, "l0 r r l3"],
    [[0, 35, 60, 85], true, true],
    [0, 0, 125],
    [0, -1, true, false, 0],
    [false, false, false, false],
  ],
  [
    [4, 1, "p0 p1 made p2", 4],
    [true, true, 4, 5],
    [[0, 32, 126, 74], 4, true],
    [151, 12, 151, 12],
    [3, 3, 194, 34],
    [4, 0, 0, 4, "r l0 r l3"],
    [[0, 25, 60, 85], true, true],
    [0, 0, 125],
    [0, -1, true, false, 0],
    [false, false, false, false],
  ],
  [
    [4, 2, "p2 p0 p1 made", 4],
    [true, true, 4, 5],
    [[74, 0, 32, 126], 4, true],
    [151, 12, 151, 12],
    [3, 3, 194, 34],
    [4, 0, 0, 4, "r r l0 l3"],
    [[0, 25, 50, 85], true, true],
    [0, 0, 125],
    [0, -1, true, false, 0],
    [false, false, false, false],
  ],
  [
    [3, 1, "p2 p1 made", 3],
    [true, true, 3, 4],
    [[42, 0, 94], 3, false],
    [119, 12, 119, 12],
    [3, 3, 194, 34],
    [3, 0, 0, 3, "r r l3"],
    [[0, 25, 50], true, true],
    [0, 0, 90],
    [0, -1, true, false, 0],
    [true, true, true, false],
  ],
  [
    [3, 0, "p1 made p0", 3],
    [true, true, 3, 4],
    [[0, 42, 69], 3, true],
    [99, 12, 99, 12],
    [3, 3, 194, 34],
    [2, 1, 1, 2, "r l3"],
    [[0, 25], true, true],
    [0, 0, 65],
    [0, -1, true, false, 0],
    [true, true, false, true],
  ],
  [
    [3, 0, "p1 made p0", 3],
    [true, true, 3, 4],
    [[0, 42, 69], 3, true],
    [99, 12, 99, 12],
    [3, 3, 194, 34],
    [2, 0, 0, 2, "r l3"],
    [[0, 25], true, true],
    [0, 0, 65],
    [2, 0, false, false, 0],
    [true, true, false, true],
  ],
  [
    [3, 0, "p1 made p0", 3],
    [true, true, 3, 4],
    [[0, 42, 69], 3, true],
    [99, 12, 99, 12],
    [3, 3, 194, 34],
    [1, 0, 0, 1, "l3"],
    [[0], true, true],
    [0, 0, 40],
    [0, -1, true, false, 0],
    [true, true, false, true],
  ],
];

const SWIPEVIEW = [
  [
    [3, 0, 0, true],
    [true, 1, true, false, true],
    [50, 20, 58, 28],
    [4, 4, 192, 92],
    [0, 0, 596, -1],
    [0, 0, 192, 92],
    [202, 0, 192, 92],
    [404, 0, 192, 92],
    [],
    [0, true, false, false, true],
    [1, false, true, false, true],
    [2, false, false, false, true],
    [-1, false, false, false, false],
    [0, 0, 0, 0],
    [[0, 0, 100, 50], [0, 50, 100, 50], [0, 100, 100, 50]],
    [true, false, false, true],
  ],
  [
    [3, 1, 1, true],
    [true, 1, true, false, true],
    [60, 25, 68, 33],
    [4, 4, 192, 92],
    [202, 0, 596, -1],
    [0, 0, 192, 92],
    [202, 0, 192, 92],
    [404, 0, 192, 92],
    [],
    [0, false, false, true, true],
    [1, true, false, false, true],
    [2, false, true, false, true],
    [-1, false, false, false, false],
    [2, 2, 2, 100],
    [[0, 0, 100, 50], [0, 50, 100, 50], [0, 100, 100, 50]],
    [false, false, true, true],
  ],
  [
    [3, 2, 2, true],
    [true, 1, true, false, true],
    [0, 0, 8, 8],
    [4, 4, 192, 92],
    [404, 0, 596, -1],
    [0, 0, 192, 92],
    [202, 0, 192, 92],
    [404, 0, 192, 92],
    [],
    [0, false, false, false, true],
    [1, false, false, true, true],
    [2, true, false, false, true],
    [-1, false, false, false, false],
    [1, 1, 1, 50],
    [[0, 0, 100, 50], [0, 50, 100, 50], [0, 100, 100, 50]],
    [false, true, false, true],
  ],
  [
    [4, 3, 3, true],
    [true, 1, true, false, true],
    [0, 0, 8, 8],
    [4, 4, 192, 92],
    [606, 0, 798, -1],
    [192, 92],
    [202, 0, 192, 92],
    [404, 0, 192, 92],
    [606, 0, 192, 92],
    [0, false, false, false, true],
    [2, false, false, true, true],
    [3, true, false, false, true],
    [-1, false, false, false, false],
    [0, 0, 0, 0],
    [[0, 0, 100, 50], [0, 50, 100, 50], [0, 100, 100, 50]],
    [true, false, false, true],
  ],
  [
    [4, 3, 3, true],
    [true, 2, false, true, true],
    [0, 0, 8, 8],
    [4, 4, 192, 92],
    [0, 294, -1, 386],
    [192, 92],
    [0, 98, 192, 92],
    [0, 196, 192, 92],
    [0, 294, 192, 92],
    [0, false, false, false, true],
    [2, false, false, true, true],
    [3, true, false, false, true],
    [-1, false, false, false, false],
    [0, 2, 2, 100],
    [[0, 0, 100, 50], [0, 50, 100, 50], [0, 100, 100, 50]],
    [false, false, true, true],
  ],
  [
    [4, 1, 1, true],
    [true, 2, false, true, true],
    [50, 20, 58, 28],
    [4, 4, 142, 72],
    [0, 78, -1, 306],
    [142, 72],
    [0, 78, 142, 72],
    [0, 156, 142, 72],
    [0, 234, 142, 72],
    [0, false, false, true, true],
    [2, false, true, false, true],
    [3, false, false, false, true],
    [-1, false, false, false, false],
    [0, 2, 2, 100],
    [[0, 0, 100, 50], [0, 50, 100, 50], [0, 100, 100, 50]],
    [false, false, true, true],
  ],
  [
    [3, 0, 0, true],
    [true, 2, false, true, true],
    [70, 30, 78, 38],
    [4, 4, 142, 72],
    [0, 0, -1, 228],
    [0, 0, 142, 72],
    [0, 78, 142, 72],
    [0, 156, 142, 72],
    [],
    [0, true, false, false, true],
    [1, false, true, false, true],
    [2, false, false, false, true],
    [-1, false, false, false, false],
    [0, 0, 0, 0],
    [[0, 0, 100, 50], [0, 50, 100, 50], [0, 100, 100, 50]],
    [true, false, false, true],
  ],
];

const TABBAR = [
  [
    [3, 0, 0, 0, true],
    [184, 24, 194, 34, 34],
    [5, 5, 290, 24],
    [0, 0, 103, 24],
    [105, 0, 80, 24],
    [187, 7, 103, 10],
    [187, 7, 103, 10],
    [0, true, false, 0],
    [2, true, false, 0],
    [-1, false, false, 0],
    [true, false, false],
    [3, 1, 1, true],
    [77, 22, 77, 22],
    [[0, 0, 40, 22], [40, 0, 40, 22], [80, 0, 40, 22]],
    [[0, false, true, 1], [1, false, true, 1], [2, false, true, 1]],
  ],
  [
    [3, 2, 2, 0, true],
    [184, 24, 194, 34, 34],
    [5, 5, 290, 24],
    [0, 0, 103, 24],
    [105, 0, 80, 24],
    [187, 7, 103, 10],
    [187, 7, 103, 10],
    [0, true, false, 0],
    [2, true, false, 0],
    [-1, false, false, 0],
    [true, false, false],
    [3, 0, 1, true],
    [77, 22, 77, 22],
    [[0, 0, 40, 22], [40, 0, 40, 22], [80, 0, 40, 22]],
    [[0, false, true, 1], [1, false, true, 1], [2, false, true, 1]],
  ],
  [
    [3, 0, 0, 0, true],
    [184, 24, 194, 34, 34],
    [5, 5, 290, 24],
    [0, 0, 103, 24],
    [105, 0, 80, 24],
    [187, 7, 103, 10],
    [187, 7, 103, 10],
    [0, true, false, 0],
    [2, true, false, 0],
    [-1, false, false, 0],
    [true, false, false],
    [3, 2, 1, true],
    [77, 22, 77, 22],
    [[0, 0, 40, 22], [40, 0, 40, 22], [80, 0, 40, 22]],
    [[0, false, true, 1], [1, false, true, 1], [2, false, true, 1]],
  ],
  [
    [4, 0, 0, 0, true],
    [216, 24, 226, 34, 34],
    [5, 5, 390, 24],
    [0, 0, 101.33333333333333, 24],
    [103.333, 0, 80, 24],
    [185.333, 7, 101.33333333333333, 10],
    [288.667, 0, 101.33333333333333, 24],
    [0, true, false, 0],
    [2, true, false, 0],
    [-1, false, false, 0],
    [true, false, false],
    [3, 2, 1, true],
    [77, 22, 77, 22],
    [[0, 0, 40, 22], [40, 0, 40, 22], [80, 0, 40, 22]],
    [[0, false, true, 1], [1, false, true, 1], [2, false, true, 1]],
  ],
  [
    [4, 0, 0, 0, true],
    [248, 24, 258, 34, 34],
    [5, 5, 390, 24],
    [0, 0, 90.66666666666667, 24],
    [96.667, 0, 100, 24],
    [202.667, 7, 90.66666666666667, 10],
    [299.333, 0, 90.66666666666667, 24],
    [0, true, false, 0],
    [2, true, false, 0],
    [-1, false, false, 0],
    [true, false, false],
    [3, 2, 0, true],
    [77, 22, 77, 22],
    [[0, 0, 40, 22], [40, 0, 40, 22], [80, 0, 40, 22]],
    [[0, false, true, 0], [1, false, true, 0], [2, false, true, 0]],
  ],
  [
    [3, 0, 0, 0, false],
    [202, 24, 212, 34, 34],
    [5, 5, 390, 24],
    null,
    [0, 0, 100, 24],
    [106, 7, 139, 10],
    [251, 0, 139, 24],
    null,
    [1, true, false, 0],
    [-1, false, false, 0],
    [true, false, false],
    [3, 0, 0, true],
    [77, 22, 77, 22],
    [[0, 0, 40, 22], [40, 0, 40, 22], [80, 0, 40, 22]],
    [[1, false, true, 0], [2, false, true, 0], [0, false, true, 0]],
  ],
  [
    [3, 0, 0, 0, false],
    [202, 30, 212, 40, 40],
    [5, 5, 390, 30],
    null,
    [0, 0, 100, 30],
    [106, 10, 139, 10],
    [251, 0, 139, 30],
    null,
    [1, true, false, 0],
    [-1, false, false, 0],
    [true, false, false],
    [3, 0, 0, true],
    [77, 22, 77, 22],
    [[0, 0, 40, 22], [40, 0, 40, 22], [80, 0, 40, 22]],
    [[1, false, true, 0], [2, false, true, 0], [0, false, true, 0]],
  ],
  [
    [3, 0, 0, 0, false],
    [202, 30, 212, 40, 40],
    [5, 5, 390, 30],
    null,
    [0, 0, 100, 30],
    [106, 10, 139, 10],
    [251, 0, 139, 30],
    null,
    [1, true, false, 0],
    [-1, false, false, 0],
    [true, false, false],
    [2, 0, 0, true],
    [77, 22, 77, 22],
    [[0, 0, 40, 22], [0, 0, 60, 22], [60, 0, 60, 22]],
    [[-1, false, false, 0], [1, false, true, 0], [0, false, true, 0]],
  ],
];

const STACKVIEW = [
  [
    [1, false, false, "first"],
    [["first", 0, 0, 200, 100, true, 1, true, 0, 3, true, true]],
    ["kept", 0, 0, 50, 20, true, 1, false, -1, 0, false, false, true],
    [],
    ["depth 1", "empty false", "current first", "first activated"],
  ],
  [
    [2, false, false, "b"],
    [["first", -200, 0, 200, 100, false, 1, false, 0, 0, true, true], ["b", 0, 0, 200, 100, true, 1, true, 1, 3, true, true]],
    ["kept", 0, 0, 50, 20, true, 1, false, -1, 0, false, false, true],
    ["b", true, 200, 0, 2, 1, true],
    ["depth 2", "b activating", "first deactivating", "busy true", "current b", "b activated", "first deactivated", "busy false"],
  ],
  [
    [5, false, false, "kept"],
    [["first", -200, 0, 200, 100, false, 1, false, 0, 0, true, true], ["b", -200, 0, 200, 100, false, 1, false, 1, 0, true, true], null, null, ["kept", 0, 0, 50, 20, true, 1, true, 4, 3, true, true]],
    ["kept", 0, 0, 50, 20, true, 1, true, 4, 3, true, true, false],
    ["kept", 5, true, true, 200, 50],
    ["depth 5", "b deactivating", "busy true", "current kept", "kept activated", "b deactivated", "busy false"],
  ],
  [
    [4, false, false, "d"],
    [["first", -200, 0, 200, 100, false, 1, false, 0, 0, true, true], ["b", -200, 0, 200, 100, false, 1, false, 1, 0, true, true], null, ["d", 0, 0, 200, 100, true, 1, true, 3, 3, true, true]],
    ["kept", 0, 0, 50, 20, false, 0, false, -1, 0, false, false, true],
    [true, true, "d", 2, 1, true, 0],
    ["depth 4", "d activating", "busy true", "current d", "kept deactivated", "d activated", "busy false", "kept removed"],
  ],
  [
    [5, false, false, "file"],
    [["first", -200, 0, 200, 100, false, 1, false, 0, 0, true, true], ["b", -200, 0, 200, 100, false, 1, false, 1, 0, true, true], null, ["d", -200, 0, 200, 100, false, 1, false, 3, 0, true, true], ["file", 0, 0, 200, 100, true, 1, true, 4, 3, true, true]],
    ["kept", 0, 0, 50, 20, false, 0, false, -1, 0, false, false, true],
    ["file", false, 0, 3, false],
    ["depth 5", "d deactivating", "d deactivated", "current file"],
  ],
  [
    [1, false, false, "first"],
    [["first", 0, 0, 200, 100, true, 1, true, 0, 3, true, true]],
    ["kept", 0, 0, 50, 20, false, 0, false, -1, 0, false, false, true],
    ["file", 1, true],
    ["d removed", "b removed", "depth 1", "first activating", "busy true", "current first", "first activated", "busy false"],
  ],
  [
    [1, false, false, "r1"],
    [["r1", 0, 0, 200, 100, true, 1, true, 0, 3, true, true]],
    ["kept", 0, 0, 50, 20, false, 0, false, -1, 0, false, false, true],
    ["r1", 1, true, 2],
    ["first deactivating", "r1 activating", "busy true", "current r1", "first deactivated", "r1 activated", "busy false", "first removed"],
  ],
  [
    [2, false, false, "r3"],
    [null, ["r3", 0, 0, 60, 100, true, 1, true, 1, 3, true, true]],
    ["kept", 0, 0, 50, 20, false, 0, false, -1, 0, false, false, true],
    ["r3", 2, true],
    ["depth 2", "p1 activating", "p1 activated", "r1 deactivating", "r1 deactivated", "current p1", "depth 3", "p2 activating", "p2 activated", "p1 deactivating", "p1 deactivated", "current p2", "p1 removed", "r1 removed", "depth 2", "p2 deactivating", "busy true", "current r3", "p2 deactivated", "busy false", "p2 removed"],
  ],
  [
    [2, false, false, "r3"],
    [["r2", 0, 0, 240, 80, true, 1, false, 0, 0, true, true], ["r3", 0, 0, 60, 80, true, 1, true, 1, 3, true, true]],
    ["kept", 0, 0, 50, 20, false, 0, false, -1, 0, false, false, true],
    [true, "r2", 0, 0],
    [],
  ],
  [
    [3, false, false, "q1"],
    [["r2", 0, 0, 240, 80, true, 1, false, 0, 0, true, true], ["r3", -240, 0, 60, 80, true, 1, false, 1, 0, true, true], ["q1", 0, 0, 240, 80, true, 1, true, 2, 3, true, true]],
    ["kept", 0, 0, 50, 20, false, 0, false, -1, 0, false, false, true],
    ["q1", true, 240],
    ["depth 3", "q1 activating", "busy true", "current q1", "q1 activated", "busy false"],
  ],
  [
    [5, false, false, "kept2"],
    [["r2", 0, 0, 240, 80, true, 1, false, 0, 0, true, true], ["r3", -240, 0, 60, 80, true, 1, false, 1, 0, true, true], ["q1", -240, 0, 240, 80, false, 1, false, 2, 0, true, true], null, ["kept2", 0, 0, 50, 20, true, 0, true, 4, 3, true, true]],
    ["kept2", 0, 0, 50, 20, true, 0, true, 4, 3, true, true, false],
    ["kept2", 5, true],
    ["depth 5", "q1 deactivating", "busy true", "current kept2", "kept2 activated", "q1 deactivated", "busy false"],
  ],
  [
    [3, false, false, "q1"],
    [["r2", 0, 0, 240, 80, true, 1, false, 0, 0, true, true], ["r3", -240, 0, 60, 80, true, 1, false, 1, 0, true, true], ["q1", 0, 0, 240, 80, true, 1, true, 2, 3, true, true]],
    ["kept2", 0, 0, 50, 20, false, 0, false, -1, 0, false, false, true],
    ["kept2", 3, "q1"],
    ["depth 3", "q1 activating", "busy true", "current q1", "kept2 deactivated", "q1 activated", "busy false", "kept2 removed"],
  ],
  [
    [2, false, false, "r3"],
    [["r2", 0, 0, 240, 80, true, 1, false, 0, 0, true, true], ["r3", 0, 0, 60, 80, true, 1, true, 1, 3, true, true]],
    ["kept2", 0, 0, 50, 20, false, 0, false, -1, 0, false, false, true],
    ["q1", 2, "r3"],
    ["depth 2", "q1 deactivating", "busy true", "current r3", "q1 deactivated", "busy false", "q1 removed"],
  ],
  [
    [1, false, false, "r2"],
    [["r2", 0, 0, 240, 80, true, 1, true, 0, 3, true, true]],
    ["kept2", 0, 0, 50, 20, false, 0, false, -1, 0, false, false, true],
    ["r3", 1, "r2"],
    ["depth 1", "r2 activating", "busy true", "current r2", "r2 activated", "busy false"],
  ],
  [
    [1, false, false, "r2"],
    [["r2", 0, 0, 240, 80, true, 1, true, 0, 3, true, true]],
    ["kept2", 0, 0, 50, 20, false, 0, false, -1, 0, false, false, true],
    [true, "s1", false, 1, "r2", 0],
    ["depth 2", "s1 activating", "r2 deactivating", "busy true", "current s1", "depth 1", "s1 deactivating", "s1 deactivated", "r2 activating", "r2 activated", "busy false", "s1 removed", "current r2"],
  ],
  [
    [1, false, false, "kept3"],
    [["kept3", 0, 0, 50, 20, true, 0, true, 0, 3, true, true]],
    ["kept3", 0, 0, 50, 20, true, 0, true, 0, 3, true, true, false],
    ["kept3", 1, true],
    ["r2 deactivating", "busy true", "current kept3", "r2 deactivated", "kept3 activated", "busy false", "r2 removed"],
  ],
  [
    [0, true, false, null],
    [],
    ["kept3", 0, 0, 50, 20, false, 0, true, -1, 0, false, false, true],
    [0, true, true, null],
    ["busy true", "current null", "depth 0", "empty true", "kept3 deactivated", "busy false", "kept3 removed"],
  ],
  [
    [1, false, false, "again"],
    [["again", 0, 0, 240, 80, true, 1, true, 0, 3, true, true]],
    ["kept3", 0, 0, 50, 20, false, 0, true, -1, 0, false, false, true],
    ["again", false, 0, 3],
    ["depth 1", "empty false", "again activating", "again activated", "current again"],
  ],
  [
    [0, true, false, null],
    [],
    ["kept3", 0, 0, 50, 20, false, 0, true, -1, 0, false, false, true],
    [0, true, null],
    ["current null", "again removed", "depth 0", "empty true"],
  ],
];

const STACKBARE = [
  [
    [0, true, false, null],
    [],
    [],
    ["kept", 9, 0, 0, 20, true, -1, 0, false, false, true],
    [1, "inline", 100, 50, true, true, 3, 0, 1],
    [1, "page", 100, 50, true, true, 3, 0, 1],
    [],
    ["inline activated"],
  ],
  [
    [1, false, false, "a"],
    [["a", 7, 0, 200, 100, true, 0, 3, true, true]],
    [["a", true]],
    ["kept", 9, 0, 0, 20, true, -1, 0, false, false, true],
    [1, "inline", 100, 50, true, true, 3, 0, 1],
    [1, "page", 100, 50, true, true, 3, 0, 1],
    ["a", false, 3],
    ["depth 1", "empty false", "a activating", "a activated", "current a"],
  ],
  [
    [2, false, false, "b"],
    [["a", 7, 0, 200, 100, false, 0, 0, true, true], ["b", 7, 0, 200, 100, true, 1, 3, true, true]],
    [["a", false], ["b", true]],
    ["kept", 9, 0, 0, 20, true, -1, 0, false, false, true],
    [1, "inline", 100, 50, true, true, 3, 0, 1],
    [1, "page", 100, 50, true, true, 3, 0, 1],
    ["b", false, false],
    ["depth 2", "b activating", "b activated", "a deactivating", "a deactivated", "current b"],
  ],
  [
    [3, false, false, "kept"],
    [["a", 7, 0, 200, 100, false, 0, 0, true, true], ["b", 7, 0, 200, 100, false, 1, 0, true, true], ["kept", 9, 0, 200, 20, true, 2, 3, true, true]],
    [["a", false], ["b", false], ["kept", true]],
    ["kept", 9, 0, 200, 20, true, 2, 3, true, true, false],
    [1, "inline", 100, 50, true, true, 3, 0, 1],
    [1, "page", 100, 50, true, true, 3, 0, 1],
    ["kept", 200, 20, 9],
    ["depth 3", "b deactivating", "b deactivated", "current kept"],
  ],
  [
    [2, false, false, "b"],
    [["a", 7, 0, 200, 100, false, 0, 0, true, true], ["b", 7, 0, 200, 100, true, 1, 3, true, true]],
    [["a", false], ["b", true], ["kept", false]],
    ["kept", 9, 0, 200, 20, false, 2, 0, true, true, false],
    [1, "inline", 100, 50, true, true, 3, 0, 1],
    [1, "page", 100, 50, true, true, 3, 0, 1],
    ["kept", 2, false, false, 200],
    ["depth 2", "b activating", "b activated", "current b"],
  ],
  [
    [2, false, false, "c"],
    [["a", 7, 0, 200, 100, false, 0, 0, true, true], ["c", 7, 0, 200, 100, true, 1, 3, true, true]],
    [["a", false], ["b", false], ["kept", false], ["c", true]],
    ["kept", 9, 0, 200, 20, false, 2, 0, true, true, false],
    [1, "inline", 100, 50, true, true, 3, 0, 1],
    [1, "page", 100, 50, true, true, 3, 0, 1],
    ["c", 2],
    ["b deactivating", "b deactivated", "c activating", "c activated", "current c"],
  ],
  [
    [0, true, false, null],
    [],
    [["b", false], ["kept", false]],
    ["kept", 9, 0, 200, 20, false, 2, 0, true, true, false],
    [0, null],
    [1, "page", 100, 50, true, true, 3, 0, 1],
    [0, true, false, true, 0, 0],
    ["current null", "a removed", "c removed", "depth 0", "empty true", "inline removed"],
  ],
];

const SCROLLBARS = [
  [
    [0.3, 0.2, 0.3, 0.2, 2, false, true, false, 2, 22, 10, 30, false, true, 0, 0, 0, 0],
    [0.25, 0.5, 0.25, 0.5, 1, true, false, false, 52, 2, 25, 10, 0],
    [0, 0, 5, 1],
    [0.2, 0, 0.2, 0, 2, false, true, false, 0, 0, 10, 20, 190, 0, 10, 100, true],
    [0.5, 0, 0.5, 0, 1, true, false, false, 0, 0, 100, 8, 0, 92, 200, 8, true],
    [0.2, 0, 0.2, 0, 2, false, true, false, 0, 0, 4, 20, 196, 0, 4, 100, true],
    [0.5, 0, 0.5, 0, 1, true, false, false, 0, 0, 100, 4, 0, 96, 200, 4, true],
    [false, true, 300, 380, 0, 0, 300, 380, 300, 380, 1, 12, 9, 5, 5, 190, 90, true, true],
    [0.2368, 0, 0.2368, 0, 2, false, true, false, 0, 0, 12, 21.3158, 188, 5, 12, 90, true],
    [0.6333, 0, 0.6333, 0, 1, true, false, false, 0, 0, 120.3333, 9, 5, 91, 190, 9, true],
    [true, false, 250, 350, 0, 0, 250, 350, 250, 350, 1, 12, 9, 0, 0, 150, 60, true, true],
    [0.1714, 0, 0.1714, 0, 2, false, true, false, 0, 0, 12, 10.2857, 138, 0, 12, 60],
    [0.6, 0, 0.6, 0, 1, true, false, false, 0, 0, 90, 9, 0, 51, 150, 9],
    [false, true, 320, 80, 0, 0, 320, 80, 320, 80, 2, 12, 9, 0, 0, 100, 80],
    [1, 0, 1, 0, 2, false, true, false, 0, 0, 12, 80, 0.3125, 0, 0.3125, 0, 1, true, false, false, 0, 0, 31.25, 9],
    [false, true, -1, -1, 0, 0, -1, -1, -1, -1, 0],
  ],
  [
    [0.3, 0.2, 0.5, 0.1429, 2, false, true, false, 2, 16.2857, 10, 50, false, true, 0, 0, 0, 0.5],
    [0.25, 0.5, 0.5, 0.3333, 1, true, false, false, 35.3333, 2, 50, 10, 0.5],
    [0, 0, 5, 1],
    [0.2, 0, 0.2, 0, 2, false, true, false, 0, 0, 10, 20, 190, 0, 10, 100, true],
    [0.5, 0, 0.5, 0, 1, true, false, false, 0, 0, 100, 8, 0, 92, 200, 8, true],
    [0.2, 0, 0.2, 0, 2, false, true, false, 0, 0, 4, 20, 196, 0, 4, 100, true],
    [0.5, 0, 0.5, 0, 1, true, false, false, 0, 0, 100, 4, 0, 96, 200, 4, true],
    [false, true, 300, 380, 0, 0, 300, 380, 300, 380, 1, 12, 9, 5, 5, 190, 90, true, true],
    [0.2368, 0, 0.2368, 0, 2, false, true, false, 0, 0, 12, 21.3158, 188, 5, 12, 90, true],
    [0.6333, 0, 0.6333, 0, 1, true, false, false, 0, 0, 120.3333, 9, 5, 91, 190, 9, true],
    [true, false, 250, 350, 0, 0, 250, 350, 250, 350, 1, 12, 9, 0, 0, 150, 60, true, true],
    [0.1714, 0, 0.1714, 0, 2, false, true, false, 0, 0, 12, 10.2857, 138, 0, 12, 60],
    [0.6, 0, 0.6, 0, 1, true, false, false, 0, 0, 90, 9, 0, 51, 150, 9],
    [false, true, 320, 80, 0, 0, 320, 80, 320, 80, 2, 12, 9, 0, 0, 100, 80],
    [1, 0, 1, 0, 2, false, true, false, 0, 0, 12, 80, 0.3125, 0, 0.3125, 0, 1, true, false, false, 0, 0, 31.25, 9],
    [false, true, -1, -1, 0, 0, -1, -1, -1, -1, 0],
  ],
  [
    [0.3, 0.9, 0.5, 0.5, 2, false, true, false, 2, 52, 10, 50, false, true, 0, 0, 0, 0.5],
    [0.25, 0.9, 0.5, 0.5, 1, true, false, false, 52, 2, 50, 10, 0.5],
    [0, 0, 5, 1],
    [0.2, 0, 0.2, 0, 2, false, true, false, 0, 0, 10, 20, 190, 0, 10, 100, true],
    [0.5, 0, 0.5, 0, 1, true, false, false, 0, 0, 100, 8, 0, 92, 200, 8, true],
    [0.2, 0, 0.2, 0, 2, false, true, false, 0, 0, 4, 20, 196, 0, 4, 100, true],
    [0.5, 0, 0.5, 0, 1, true, false, false, 0, 0, 100, 4, 0, 96, 200, 4, true],
    [false, true, 300, 380, 0, 0, 300, 380, 300, 380, 1, 12, 9, 5, 5, 190, 90, true, true],
    [0.2368, 0, 0.2368, 0, 2, false, true, false, 0, 0, 12, 21.3158, 188, 5, 12, 90, true],
    [0.6333, 0, 0.6333, 0, 1, true, false, false, 0, 0, 120.3333, 9, 5, 91, 190, 9, true],
    [true, false, 250, 350, 0, 0, 250, 350, 250, 350, 1, 12, 9, 0, 0, 150, 60, true, true],
    [0.1714, 0, 0.1714, 0, 2, false, true, false, 0, 0, 12, 10.2857, 138, 0, 12, 60],
    [0.6, 0, 0.6, 0, 1, true, false, false, 0, 0, 90, 9, 0, 51, 150, 9],
    [false, true, 320, 80, 0, 0, 320, 80, 320, 80, 2, 12, 9, 0, 0, 100, 80],
    [1, 0, 1, 0, 2, false, true, false, 0, 0, 12, 80, 0.3125, 0, 0.3125, 0, 1, true, false, false, 0, 0, 31.25, 9],
    [false, true, -1, -1, 0, 0, -1, -1, -1, -1, 0],
  ],
  [
    [0.5, 0.5, 0.5, 0.5, 2, false, true, false, 2, 52, 10, 50, false, true, 0, 0, 0, 0.5],
    [0.6, 0.4, 0.6, 0.4, 1, true, false, false, 42, 2, 60, 10, 0.5],
    [0, 0, 5, 1],
    [0.2, 0, 0.2, 0, 2, false, true, false, 0, 0, 10, 20, 190, 0, 10, 100, true],
    [0.5, 0, 0.5, 0, 1, true, false, false, 0, 0, 100, 8, 0, 92, 200, 8, true],
    [0.2, 0, 0.2, 0, 2, false, true, false, 0, 0, 4, 20, 196, 0, 4, 100, true],
    [0.5, 0, 0.5, 0, 1, true, false, false, 0, 0, 100, 4, 0, 96, 200, 4, true],
    [false, true, 300, 380, 0, 0, 300, 380, 300, 380, 1, 12, 9, 5, 5, 190, 90, true, true],
    [0.2368, 0, 0.2368, 0, 2, false, true, false, 0, 0, 12, 21.3158, 188, 5, 12, 90, true],
    [0.6333, 0, 0.6333, 0, 1, true, false, false, 0, 0, 120.3333, 9, 5, 91, 190, 9, true],
    [true, false, 250, 350, 0, 0, 250, 350, 250, 350, 1, 12, 9, 0, 0, 150, 60, true, true],
    [0.1714, 0, 0.1714, 0, 2, false, true, false, 0, 0, 12, 10.2857, 138, 0, 12, 60],
    [0.6, 0, 0.6, 0, 1, true, false, false, 0, 0, 90, 9, 0, 51, 150, 9],
    [false, true, 320, 80, 0, 0, 320, 80, 320, 80, 2, 12, 9, 0, 0, 100, 80],
    [1, 0, 1, 0, 2, false, true, false, 0, 0, 12, 80, 0.3125, 0, 0.3125, 0, 1, true, false, false, 0, 0, 31.25, 9],
    [false, true, -1, -1, 0, 0, -1, -1, -1, -1, 0],
  ],
  [
    [0.5, 0.5, 0.5, 0.5, 2, false, true, false, 2, 52, 10, 50, false, true, 0, 0, 0, 0],
    [0.6, 0.4, 0.6, 0.4, 1, true, false, false, 42, 2, 60, 10, 0.5],
    [0, 0, 5, 1],
    [0.2, 0, 0.2, 0, 2, false, true, false, 0, 0, 10, 20, 190, 0, 10, 100, true],
    [0.5, 0, 0.5, 0, 1, true, false, false, 0, 0, 100, 8, 0, 92, 200, 8, true],
    [0.2, 0, 0.2, 0, 2, false, true, false, 0, 0, 4, 20, 196, 0, 4, 100, true],
    [0.5, 0, 0.5, 0, 1, true, false, false, 0, 0, 100, 4, 0, 96, 200, 4, true],
    [false, true, 300, 380, 0, 0, 300, 380, 300, 380, 1, 12, 9, 5, 5, 190, 90, true, true],
    [0.2368, 0, 0.2368, 0, 2, false, true, false, 0, 0, 12, 21.3158, 188, 5, 12, 90, true],
    [0.6333, 0, 0.6333, 0, 1, true, false, false, 0, 0, 120.3333, 9, 5, 91, 190, 9, true],
    [true, false, 250, 350, 0, 0, 250, 350, 250, 350, 1, 12, 9, 0, 0, 150, 60, true, true],
    [0.1714, 0, 0.1714, 0, 2, false, true, false, 0, 0, 12, 10.2857, 138, 0, 12, 60],
    [0.6, 0, 0.6, 0, 1, true, false, false, 0, 0, 90, 9, 0, 51, 150, 9],
    [false, true, 320, 80, 0, 0, 320, 80, 320, 80, 2, 12, 9, 0, 0, 100, 80],
    [1, 0, 1, 0, 2, false, true, false, 0, 0, 12, 80, 0.3125, 0, 0.3125, 0, 1, true, false, false, 0, 0, 31.25, 9],
    [false, true, -1, -1, 0, 0, -1, -1, -1, -1, 0],
  ],
  [
    [0.5, 0.25, 0.5, 0.25, 1, true, false, false, 4.5, 2, 5, 100, false, true, 0.25, 0, 0, 0],
    [0.6, 0.4, 0.6, 0.4, 1, true, false, false, 42, 2, 60, 10, 0.5],
    [0, 0, 5, 1],
    [0.2, 0, 0.2, 0, 2, false, true, false, 0, 0, 10, 20, 190, 0, 10, 100, true],
    [0.5, 0, 0.5, 0, 1, true, false, false, 0, 0, 100, 8, 0, 92, 200, 8, true],
    [0.2, 0, 0.2, 0, 2, false, true, false, 0, 0, 4, 20, 196, 0, 4, 100, true],
    [0.5, 0, 0.5, 0, 1, true, false, false, 0, 0, 100, 4, 0, 96, 200, 4, true],
    [false, true, 300, 380, 0, 0, 300, 380, 300, 380, 1, 12, 9, 5, 5, 190, 90, true, true],
    [0.2368, 0, 0.2368, 0, 2, false, true, false, 0, 0, 12, 21.3158, 188, 5, 12, 90, true],
    [0.6333, 0, 0.6333, 0, 1, true, false, false, 0, 0, 120.3333, 9, 5, 91, 190, 9, true],
    [true, false, 250, 350, 0, 0, 250, 350, 250, 350, 1, 12, 9, 0, 0, 150, 60, true, true],
    [0.1714, 0, 0.1714, 0, 2, false, true, false, 0, 0, 12, 10.2857, 138, 0, 12, 60],
    [0.6, 0, 0.6, 0, 1, true, false, false, 0, 0, 90, 9, 0, 51, 150, 9],
    [false, true, 320, 80, 0, 0, 320, 80, 320, 80, 2, 12, 9, 0, 0, 100, 80],
    [1, 0, 1, 0, 2, false, true, false, 0, 0, 12, 80, 0.3125, 0, 0.3125, 0, 1, true, false, false, 0, 0, 31.25, 9],
    [false, true, -1, -1, 0, 0, -1, -1, -1, -1, 0],
  ],
  [
    [1, 0, 1, 0, 1, true, false, false, 2, 2, 10, 100, false, true, 0.25, 0, 0, 0],
    [2, -0.2, 1.2, 0, 1, true, false, false, 2, 2, 120, 10, 0.5],
    [0, 0, 5, 1],
    [0.2, 0, 0.2, 0, 2, false, true, false, 0, 0, 10, 20, 190, 0, 10, 100, true],
    [0.5, 0, 0.5, 0, 1, true, false, false, 0, 0, 100, 8, 0, 92, 200, 8, true],
    [0.2, 0, 0.2, 0, 2, false, true, false, 0, 0, 4, 20, 196, 0, 4, 100, true],
    [0.5, 0, 0.5, 0, 1, true, false, false, 0, 0, 100, 4, 0, 96, 200, 4, true],
    [false, true, 300, 380, 0, 0, 300, 380, 300, 380, 1, 12, 9, 5, 5, 190, 90, true, true],
    [0.2368, 0, 0.2368, 0, 2, false, true, false, 0, 0, 12, 21.3158, 188, 5, 12, 90, true],
    [0.6333, 0, 0.6333, 0, 1, true, false, false, 0, 0, 120.3333, 9, 5, 91, 190, 9, true],
    [true, false, 250, 350, 0, 0, 250, 350, 250, 350, 1, 12, 9, 0, 0, 150, 60, true, true],
    [0.1714, 0, 0.1714, 0, 2, false, true, false, 0, 0, 12, 10.2857, 138, 0, 12, 60],
    [0.6, 0, 0.6, 0, 1, true, false, false, 0, 0, 90, 9, 0, 51, 150, 9],
    [false, true, 320, 80, 0, 0, 320, 80, 320, 80, 2, 12, 9, 0, 0, 100, 80],
    [1, 0, 1, 0, 2, false, true, false, 0, 0, 12, 80, 0.3125, 0, 0.3125, 0, 1, true, false, false, 0, 0, 31.25, 9],
    [false, true, -1, -1, 0, 0, -1, -1, -1, -1, 0],
  ],
  [
    [0, 0.4, 0, 0.4, 1, true, false, true, 6, 2, 0, 100, false, true, 0.25, 0, 0, 0],
    [2, -0.2, 1.2, 0, 1, true, false, false, 2, 2, 120, 10, 0.5],
    [0, 0, 5, 1],
    [0.2, 0, 0.2, 0, 2, false, true, false, 0, 0, 10, 20, 190, 0, 10, 100, true],
    [0.5, 0, 0.5, 0, 1, true, false, false, 0, 0, 100, 8, 0, 92, 200, 8, true],
    [0.2, 0, 0.2, 0, 2, false, true, false, 0, 0, 4, 20, 196, 0, 4, 100, true],
    [0.5, 0, 0.5, 0, 1, true, false, false, 0, 0, 100, 4, 0, 96, 200, 4, true],
    [false, true, 300, 380, 0, 0, 300, 380, 300, 380, 1, 12, 9, 5, 5, 190, 90, true, true],
    [0.2368, 0, 0.2368, 0, 2, false, true, false, 0, 0, 12, 21.3158, 188, 5, 12, 90, true],
    [0.6333, 0, 0.6333, 0, 1, true, false, false, 0, 0, 120.3333, 9, 5, 91, 190, 9, true],
    [true, false, 250, 350, 0, 0, 250, 350, 250, 350, 1, 12, 9, 0, 0, 150, 60, true, true],
    [0.1714, 0, 0.1714, 0, 2, false, true, false, 0, 0, 12, 10.2857, 138, 0, 12, 60],
    [0.6, 0, 0.6, 0, 1, true, false, false, 0, 0, 90, 9, 0, 51, 150, 9],
    [false, true, 320, 80, 0, 0, 320, 80, 320, 80, 2, 12, 9, 0, 0, 100, 80],
    [1, 0, 1, 0, 2, false, true, false, 0, 0, 12, 80, 0.3125, 0, 0.3125, 0, 1, true, false, false, 0, 0, 31.25, 9],
    [false, true, -1, -1, 0, 0, -1, -1, -1, -1, 0],
  ],
  [
    [0, 0.4, 0, 0.4, 1, true, false, true, 6, 2, 0, 100, false, true, 0.25, 0, 0, 0],
    [2, -0.2, 1.2, 0, 1, true, false, false, 2, 2, 120, 10, 0.5],
    [50, 100, 5, 1],
    [0.2, 0.2, 0.2, 0.2, 2, false, true, false, 0, 20, 10, 20, 190, 0, 10, 100, true],
    [0.5, 0.125, 0.5, 0.125, 1, true, false, false, 25, 0, 100, 8, 0, 92, 200, 8, true],
    [0.2, 0.2, 0.2, 0.2, 2, false, true, false, 0, 20, 4, 20, 196, 0, 4, 100, true],
    [0.5, 0.125, 0.5, 0.125, 1, true, false, false, 25, 0, 100, 4, 0, 96, 200, 4, true],
    [false, true, 300, 380, 0, 0, 300, 380, 300, 380, 1, 12, 9, 5, 5, 190, 90, true, true],
    [0.2368, 0, 0.2368, 0, 2, false, true, false, 0, 0, 12, 21.3158, 188, 5, 12, 90, true],
    [0.6333, 0, 0.6333, 0, 1, true, false, false, 0, 0, 120.3333, 9, 5, 91, 190, 9, true],
    [true, false, 250, 350, 0, 0, 250, 350, 250, 350, 1, 12, 9, 0, 0, 150, 60, true, true],
    [0.1714, 0, 0.1714, 0, 2, false, true, false, 0, 0, 12, 10.2857, 138, 0, 12, 60],
    [0.6, 0, 0.6, 0, 1, true, false, false, 0, 0, 90, 9, 0, 51, 150, 9],
    [false, true, 320, 80, 0, 0, 320, 80, 320, 80, 2, 12, 9, 0, 0, 100, 80],
    [1, 0, 1, 0, 2, false, true, false, 0, 0, 12, 80, 0.3125, 0, 0.3125, 0, 1, true, false, false, 0, 0, 31.25, 9],
    [false, true, -1, -1, 0, 0, -1, -1, -1, -1, 0],
  ],
  [
    [0, 0.4, 0, 0.4, 1, true, false, true, 6, 2, 0, 100, false, true, 0.25, 0, 0, 0],
    [2, -0.2, 1.2, 0, 1, true, false, false, 2, 2, 120, 10, 0.5],
    [90, 250, 5, 1],
    [0.2, 0.5, 0.2, 0.5, 2, false, true, false, 0, 50, 10, 20, 190, 0, 10, 100, true],
    [0.5, 0.225, 0.5, 0.225, 1, true, false, false, 45, 0, 100, 8, 0, 92, 200, 8, true],
    [0.2, 0.5, 0.2, 0.5, 2, false, true, false, 0, 50, 4, 20, 196, 0, 4, 100, true],
    [0.5, 0.225, 0.5, 0.225, 1, true, false, false, 45, 0, 100, 4, 0, 96, 200, 4, true],
    [false, true, 300, 380, 0, 0, 300, 380, 300, 380, 1, 12, 9, 5, 5, 190, 90, true, true],
    [0.2368, 0, 0.2368, 0, 2, false, true, false, 0, 0, 12, 21.3158, 188, 5, 12, 90, true],
    [0.6333, 0, 0.6333, 0, 1, true, false, false, 0, 0, 120.3333, 9, 5, 91, 190, 9, true],
    [true, false, 250, 350, 0, 0, 250, 350, 250, 350, 1, 12, 9, 0, 0, 150, 60, true, true],
    [0.1714, 0, 0.1714, 0, 2, false, true, false, 0, 0, 12, 10.2857, 138, 0, 12, 60],
    [0.6, 0, 0.6, 0, 1, true, false, false, 0, 0, 90, 9, 0, 51, 150, 9],
    [false, true, 320, 80, 0, 0, 320, 80, 320, 80, 2, 12, 9, 0, 0, 100, 80],
    [1, 0, 1, 0, 2, false, true, false, 0, 0, 12, 80, 0.3125, 0, 0.3125, 0, 1, true, false, false, 0, 0, 31.25, 9],
    [false, true, -1, -1, 0, 0, -1, -1, -1, -1, 0],
  ],
  [
    [0, 0.4, 0, 0.4, 1, true, false, true, 6, 2, 0, 100, false, true, 0.25, 0, 0, 0],
    [2, -0.2, 1.2, 0, 1, true, false, false, 2, 2, 120, 10, 0.5],
    [90, 250, 5, 1],
    [0.3, 0.5, 0.3, 0.5, 2, false, true, false, 0, 75, 10, 45, 290, 0, 10, 150, true],
    [0.75, 0.225, 0.75, 0.225, 1, true, false, false, 67.5, 0, 225, 8, 0, 142, 300, 8, true],
    [0.3, 0.5, 0.3, 0.5, 2, false, true, false, 0, 75, 4, 45, 296, 0, 4, 150, true],
    [0.75, 0.225, 0.75, 0.225, 1, true, false, false, 67.5, 0, 225, 4, 0, 146, 300, 4, true],
    [false, true, 300, 380, 0, 0, 300, 380, 300, 380, 1, 12, 9, 5, 5, 190, 90, true, true],
    [0.2368, 0, 0.2368, 0, 2, false, true, false, 0, 0, 12, 21.3158, 188, 5, 12, 90, true],
    [0.6333, 0, 0.6333, 0, 1, true, false, false, 0, 0, 120.3333, 9, 5, 91, 190, 9, true],
    [true, false, 250, 350, 0, 0, 250, 350, 250, 350, 1, 12, 9, 0, 0, 150, 60, true, true],
    [0.1714, 0, 0.1714, 0, 2, false, true, false, 0, 0, 12, 10.2857, 138, 0, 12, 60],
    [0.6, 0, 0.6, 0, 1, true, false, false, 0, 0, 90, 9, 0, 51, 150, 9],
    [false, true, 320, 80, 0, 0, 320, 80, 320, 80, 2, 12, 9, 0, 0, 100, 80],
    [1, 0, 1, 0, 2, false, true, false, 0, 0, 12, 80, 0.3125, 0, 0.3125, 0, 1, true, false, false, 0, 0, 31.25, 9],
    [false, true, -1, -1, 0, 0, -1, -1, -1, -1, 0],
  ],
  [
    [0, 0.4, 0, 0.4, 1, true, false, true, 6, 2, 0, 100, false, true, 0.25, 0, 0, 0],
    [2, -0.2, 1.2, 0, 1, true, false, false, 2, 2, 120, 10, 0.5],
    [90, 150, 5, 1],
    [0.5, 0.5, 0.5, 0.5, 2, false, true, false, 0, 75, 10, 75, 40, 0, 10, 150, true],
    [0.625, 0.225, 0.625, 0.225, 1, true, false, false, 56.25, 0, 156.25, 12, 0, 138, 250, 12, true],
    [0.5, 0.5, 0.5, 0.5, 2, false, true, false, 0, 75, 4, 75, 246, 0, 4, 150, true],
    [0.625, 0.225, 0.625, 0.225, 1, true, false, false, 56.25, 0, 156.25, 4, 0, 146, 250, 4, true],
    [false, true, 300, 380, 0, 0, 300, 380, 300, 380, 1, 12, 9, 5, 5, 190, 90, true, true],
    [0.2368, 0, 0.2368, 0, 2, false, true, false, 0, 0, 12, 21.3158, 188, 5, 12, 90, true],
    [0.6333, 0, 0.6333, 0, 1, true, false, false, 0, 0, 120.3333, 9, 5, 91, 190, 9, true],
    [true, false, 250, 350, 0, 0, 250, 350, 250, 350, 1, 12, 9, 0, 0, 150, 60, true, true],
    [0.1714, 0, 0.1714, 0, 2, false, true, false, 0, 0, 12, 10.2857, 138, 0, 12, 60],
    [0.6, 0, 0.6, 0, 1, true, false, false, 0, 0, 90, 9, 0, 51, 150, 9],
    [false, true, 320, 80, 0, 0, 320, 80, 320, 80, 2, 12, 9, 0, 0, 100, 80],
    [1, 0, 1, 0, 2, false, true, false, 0, 0, 12, 80, 0.3125, 0, 0.3125, 0, 1, true, false, false, 0, 0, 31.25, 9],
    [false, true, -1, -1, 0, 0, -1, -1, -1, -1, 0],
  ],
  [
    [0, 0.4, 0, 0.4, 1, true, false, true, 6, 2, 0, 100, false, true, 0.25, 0, 0, 0],
    [2, -0.2, 1.2, 0, 1, true, false, false, 2, 2, 120, 10, 0.5],
    [90, 50, 5, 1],
    [0.75, 0.25, 0.75, 0.25, 2, false, true, false, 0, 37.5, 10, 112.5, 40, 0, 10, 150, true],
    [0.625, 0.225, 0.625, 0.225, 1, true, false, false, 56.25, 0, 156.25, 12, 0, 138, 250, 12, true],
    [0.75, 0.25, 0.75, 0.25, 2, false, true, false, 0, 37.5, 4, 112.5, 246, 0, 4, 150, true],
    [0.625, 0.225, 0.625, 0.225, 1, true, false, false, 56.25, 0, 156.25, 4, 0, 146, 250, 4, true],
    [false, true, 300, 380, 0, 0, 300, 380, 300, 380, 1, 12, 9, 5, 5, 190, 90, true, true],
    [0.2368, 0, 0.2368, 0, 2, false, true, false, 0, 0, 12, 21.3158, 188, 5, 12, 90, true],
    [0.6333, 0, 0.6333, 0, 1, true, false, false, 0, 0, 120.3333, 9, 5, 91, 190, 9, true],
    [true, false, 250, 350, 0, 0, 250, 350, 250, 350, 1, 12, 9, 0, 0, 150, 60, true, true],
    [0.1714, 0, 0.1714, 0, 2, false, true, false, 0, 0, 12, 10.2857, 138, 0, 12, 60],
    [0.6, 0, 0.6, 0, 1, true, false, false, 0, 0, 90, 9, 0, 51, 150, 9],
    [false, true, 320, 80, 0, 0, 320, 80, 320, 80, 2, 12, 9, 0, 0, 100, 80],
    [1, 0, 1, 0, 2, false, true, false, 0, 0, 12, 80, 0.3125, 0, 0.3125, 0, 1, true, false, false, 0, 0, 31.25, 9],
    [false, true, -1, -1, 0, 0, -1, -1, -1, -1, 0],
  ],
  [
    [0, 0.4, 0, 0.4, 1, true, false, true, 6, 2, 0, 100, false, true, 0.25, 0, 0, 0],
    [2, -0.2, 1.2, 0, 1, true, false, false, 2, 2, 120, 10, 0.5],
    [90, 50, 5, 1],
    [0.75, 0.25, 0.75, 0.25, 2, false, true, false, 0, 37.5, 10, 112.5, 40, 0, 10, 150, true],
    [0.625, 0.225, 0.625, 0.225, 1, true, false, false, 56.25, 0, 156.25, 12, 0, 138, 250, 12, true],
    [0.75, 0.25, 0.75, 0.25, 2, false, true, false, 0, 37.5, 4, 112.5, 246, 0, 4, 150, true],
    [0.625, 0.225, 0.625, 0.225, 1, true, false, false, 56.25, 0, 156.25, 4, 0, 146, 250, 4, true],
    [false, true, 300, 380, 30, 95, 300, 380, 300, 380, 1, 12, 9, 5, 5, 190, 90, true, true],
    [0.2368, 0.25, 0.2368, 0.25, 2, false, true, false, 0, 22.5, 12, 21.3158, 188, 5, 12, 90, true],
    [0.6333, 0.1, 0.6333, 0.1, 1, true, false, false, 19, 0, 120.3333, 9, 5, 91, 190, 9, true],
    [true, false, 250, 350, 0, 175, 250, 350, 250, 350, 1, 12, 9, 0, 0, 150, 60, true, true],
    [0.1714, 0.5, 0.1714, 0.5, 2, false, true, false, 0, 30, 12, 10.2857, 138, 0, 12, 60],
    [0.6, 0, 0.6, 0, 1, true, false, false, 0, 0, 90, 9, 0, 51, 150, 9],
    [false, true, 320, 80, 0, 0, 320, 80, 320, 80, 2, 12, 9, 0, 0, 100, 80],
    [1, 0, 1, 0, 2, false, true, false, 0, 0, 12, 80, 0.3125, 0, 0.3125, 0, 1, true, false, false, 0, 0, 31.25, 9],
    [false, true, -1, -1, 0, 0, -1, -1, -1, -1, 0],
  ],
  [
    [0, 0.4, 0, 0.4, 1, true, false, true, 6, 2, 0, 100, false, true, 0.25, 0, 0, 0],
    [2, -0.2, 1.2, 0, 1, true, false, false, 2, 2, 120, 10, 0.5],
    [90, 50, 5, 1],
    [0.75, 0.25, 0.75, 0.25, 2, false, true, false, 0, 37.5, 10, 112.5, 40, 0, 10, 150, true],
    [0.625, 0.225, 0.625, 0.225, 1, true, false, false, 56.25, 0, 156.25, 12, 0, 138, 250, 12, true],
    [0.75, 0.25, 0.75, 0.25, 2, false, true, false, 0, 37.5, 4, 112.5, 246, 0, 4, 150, true],
    [0.625, 0.225, 0.625, 0.225, 1, true, false, false, 56.25, 0, 156.25, 4, 0, 146, 250, 4, true],
    [false, true, 300, 760, 30, 95, 300, 760, 300, 760, 1, 0, 0, 5, 5, 190, 90, true, true],
    [0.1184, 0.125, 0.1184, 0.125, 2, false, true, false, 0, 11.25, 12, 10.6579, 188, 5, 12, 90, true],
    [0.6333, 0.1, 0.6333, 0.1, 1, true, false, false, 19, 0, 120.3333, 9, 5, 91, 190, 9, true],
    [true, false, 250, 350, 0, 175, 250, 350, 250, 350, 1, 12, 9, 0, 0, 150, 60, true, true],
    [0.1714, 0.5, 0.1714, 0.5, 2, false, true, false, 0, 30, 12, 10.2857, 138, 0, 12, 60],
    [0.6, 0, 0.6, 0, 1, true, false, false, 0, 0, 90, 9, 0, 51, 150, 9],
    [false, true, 320, 80, 0, 0, 320, 80, 320, 80, 2, 12, 9, 0, 0, 100, 80],
    [1, 0, 1, 0, 2, false, true, false, 0, 0, 12, 80, 0.3125, 0, 0.3125, 0, 1, true, false, false, 0, 0, 31.25, 9],
    [false, true, -1, -1, 0, 0, -1, -1, -1, -1, 0],
  ],
  [
    [0, 0.4, 0, 0.4, 1, true, false, true, 6, 2, 0, 100, false, true, 0.25, 0, 0, 0],
    [2, -0.2, 1.2, 0, 1, true, false, false, 2, 2, 120, 10, 0.5],
    [90, 50, 5, 1],
    [0.75, 0.25, 0.75, 0.25, 2, false, true, false, 0, 37.5, 10, 112.5, 40, 0, 10, 150, true],
    [0.625, 0.225, 0.625, 0.225, 1, true, false, false, 56.25, 0, 156.25, 12, 0, 138, 250, 12, true],
    [0.75, 0.25, 0.75, 0.25, 2, false, true, false, 0, 37.5, 4, 112.5, 246, 0, 4, 150, true],
    [0.625, 0.225, 0.625, 0.225, 1, true, false, false, 56.25, 0, 156.25, 4, 0, 146, 250, 4, true],
    [false, true, 600, 760, 30, 95, 600, 760, 600, 760, 1, 12, 0, 5, 5, 190, 90, true, true],
    [0.1184, 0.125, 0.1184, 0.125, 2, false, true, false, 0, 11.25, 12, 10.6579, 188, 5, 12, 90, true],
    [0.3167, 0.05, 0.3167, 0.05, 1, true, false, false, 9.5, 0, 60.1667, 9, 5, 91, 190, 9, true],
    [true, false, 400, 350, 0, 29, 400, 350, 400, 350, 1, 12, 9, 0, 0, 150, 60, true, true],
    [0.1714, 0.0829, 0.1714, 0.0829, 2, false, true, false, 0, 4.9714, 12, 10.2857, 138, 0, 12, 60],
    [0.375, 0, 0.375, 0, 1, true, false, false, 0, 0, 56.25, 9, 0, 51, 150, 9],
    [false, true, 320, 80, 0, 0, 320, 80, 320, 80, 2, 12, 9, 0, 0, 100, 80],
    [1, 0, 1, 0, 2, false, true, false, 0, 0, 12, 80, 0.3125, 0, 0.3125, 0, 1, true, false, false, 0, 0, 31.25, 9],
    [false, true, -1, -1, 0, 0, -1, -1, -1, -1, 0],
  ],
  [
    [0, 0.4, 0, 0.4, 1, true, false, true, 6, 2, 0, 100, false, true, 0.25, 0, 0, 0],
    [2, -0.2, 1.2, 0, 1, true, false, false, 2, 2, 120, 10, 0.5],
    [90, 50, 5, 1],
    [0.75, 0.25, 0.75, 0.25, 2, false, true, false, 0, 37.5, 10, 112.5, 40, 0, 10, 150, true],
    [0.625, 0.225, 0.625, 0.225, 1, true, false, false, 56.25, 0, 156.25, 12, 0, 138, 250, 12, true],
    [0.75, 0.25, 0.75, 0.25, 2, false, true, false, 0, 37.5, 4, 112.5, 246, 0, 4, 150, true],
    [0.625, 0.225, 0.625, 0.225, 1, true, false, false, 56.25, 0, 156.25, 4, 0, 146, 250, 4, true],
    [false, true, 600, 760, 30, 95, 600, 760, 600, 760, 1, 16, 0, 5, 5, 190, 90, true, true],
    [0.1184, 0.125, 0.1184, 0.125, 2, false, true, false, 0, 11.25, 16, 10.6579, 184, 5, 16, 90, true],
    [0.3167, 0.05, 0.3167, 0.05, 1, true, false, false, 9.5, 0, 60.1667, 13, 5, 87, 190, 13, true],
    [true, false, 400, 350, 0, 29, 400, 350, 400, 350, 1, 12, 7, 0, 0, 150, 60, true, true],
    [0.1714, 0.0829, 0.1714, 0.0829, 2, false, true, false, 0, 4.9714, 12, 10.2857, 138, 0, 12, 60],
    [0.375, 0, 0.375, 0, 1, true, false, false, 0, 0, 56.25, 7, 0, 53, 150, 7],
    [false, true, 90, 120, 0, 0, 90, 120, 90, 120, 2, 12, 9, 0, 0, 100, 120],
    [1, 0, 1, 0, 2, false, true, false, 0, 0, 12, 120, 1, 0, 1, 0, 1, true, false, false, 0, 0, 100, 9],
    [false, true, -1, -1, 0, 0, -1, -1, -1, -1, 0],
  ],
];

const SPLITVIEW = [
  [
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 300, 100],
    [[0, 0, 50, 100, true, true], [56, 0, 80, 100, true, true], [142, 0, 158, 100, true, true]],
    [[50, 0, 6, 100, true, false, false], [136, 0, 6, 100, true, false, false]],
    ["row", 30, -1, "inf", 0, -1, "inf", false, false],
    ["row", 0, 80, 120, 0, -1, "inf", false, false],
    [2, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 172],
    [[0, 0, 120, 40, true, true], [0, 46, 120, 98, true, true], [0, 150, 120, 30, true, true]],
    [[0, 40, 120, 6, true, false, false], [0, 144, 120, 6, true, false, false]],
    ["col", 0, -1, "inf", 20, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [0, 0, 50, 100],
    [56, 0, 80, 100],
    [142, 0, 158, 100],
    [320, 200, 25, 15],
    [],
  ],
  [
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 360, 100],
    [[0, 0, 50, 100, true, true], [56, 0, 80, 100, true, true], [142, 0, 218, 100, true, true]],
    [[50, 0, 6, 100, true, false, false], [136, 0, 6, 100, true, false, false]],
    ["row", 30, -1, "inf", 0, -1, "inf", false, false],
    ["row", 0, 80, 120, 0, -1, "inf", false, false],
    [2, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 172],
    [[0, 0, 120, 40, true, true], [0, 46, 120, 98, true, true], [0, 150, 120, 30, true, true]],
    [[0, 40, 120, 6, true, false, false], [0, 144, 120, 6, true, false, false]],
    ["col", 0, -1, "inf", 20, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [0, 0, 50, 100],
    [56, 0, 80, 100],
    [142, 0, 218, 100],
    [320, 200, 25, 15],
    [],
  ],
  [
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 360, 100],
    [[0, 0, 50, 100, true, true], [56, 0, 120, 100, true, true], [182, 0, 178, 100, true, true]],
    [[50, 0, 6, 100, true, false, false], [176, 0, 6, 100, true, false, false]],
    ["row", 30, -1, "inf", 0, -1, "inf", false, false],
    ["row", 0, 200, 120, 0, -1, "inf", false, false],
    [2, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 172],
    [[0, 0, 120, 40, true, true], [0, 46, 120, 98, true, true], [0, 150, 120, 30, true, true]],
    [[0, 40, 120, 6, true, false, false], [0, 144, 120, 6, true, false, false]],
    ["col", 0, -1, "inf", 20, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [0, 0, 50, 100],
    [56, 0, 120, 100],
    [182, 0, 178, 100],
    [320, 200, 25, 15],
    [],
  ],
  [
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 360, 100],
    [[0, 0, 70, 100, true, true], [76, 0, 120, 100, true, true], [202, 0, 158, 100, true, true]],
    [[70, 0, 6, 100, true, false, false], [196, 0, 6, 100, true, false, false]],
    ["row", 70, -1, "inf", 0, -1, "inf", false, false],
    ["row", 0, 200, 120, 0, -1, "inf", false, false],
    [2, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 172],
    [[0, 0, 120, 40, true, true], [0, 46, 120, 98, true, true], [0, 150, 120, 30, true, true]],
    [[0, 40, 120, 6, true, false, false], [0, 144, 120, 6, true, false, false]],
    ["col", 0, -1, "inf", 20, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [0, 0, 70, 100],
    [76, 0, 120, 100],
    [202, 0, 158, 100],
    [320, 200, 25, 15],
    [],
  ],
  [
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 360, 100],
    [[0, 0, 90, 100, true, true], [96, 0, 120, 100, true, true], [222, 0, 138, 100, true, true]],
    [[90, 0, 6, 100, true, false, false], [216, 0, 6, 100, true, false, false]],
    ["row", 70, -1, "inf", 0, -1, "inf", false, false],
    ["row", 0, 200, 120, 0, -1, "inf", false, false],
    [2, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 172],
    [[0, 0, 120, 40, true, true], [0, 46, 120, 98, true, true], [0, 150, 120, 30, true, true]],
    [[0, 40, 120, 6, true, false, false], [0, 144, 120, 6, true, false, false]],
    ["col", 0, -1, "inf", 20, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [0, 0, 90, 100],
    [96, 0, 120, 100],
    [222, 0, 138, 100],
    [320, 200, 25, 15],
    [],
  ],
  [
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 360, 100],
    [[0, 0, 90, 100, true, true], [96, 0, 120, 100, true, true], [222, 0, 138, 100, false, true]],
    [[90, 0, 6, 100, true, false, false], [216, 0, 6, 100, false, false, false]],
    ["row", 70, -1, "inf", 0, -1, "inf", false, false],
    ["row", 0, 200, 120, 0, -1, "inf", false, false],
    [2, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 172],
    [[0, 0, 120, 40, true, true], [0, 46, 120, 98, true, true], [0, 150, 120, 30, true, true]],
    [[0, 40, 120, 6, true, false, false], [0, 144, 120, 6, true, false, false]],
    ["col", 0, -1, "inf", 20, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [0, 0, 90, 100],
    [96, 0, 120, 100],
    [222, 0, 138, 100],
    [320, 200, 25, 15],
    [],
  ],
  [
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 360, 100],
    [[0, 0, 188, 100, true, true], [194, 0, 120, 100, true, true], [320, 0, 40, 100, true, true]],
    [[188, 0, 6, 100, true, false, false], [314, 0, 6, 100, true, false, false]],
    ["row", 70, -1, "inf", 0, -1, "inf", true, false],
    ["row", 0, 200, 120, 0, -1, "inf", false, false],
    [2, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 172],
    [[0, 0, 120, 40, true, true], [0, 46, 120, 98, true, true], [0, 150, 120, 30, true, true]],
    [[0, 40, 120, 6, true, false, false], [0, 144, 120, 6, true, false, false]],
    ["col", 0, -1, "inf", 20, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [0, 0, 188, 100],
    [194, 0, 120, 100],
    [320, 0, 40, 100],
    [320, 200, 25, 15],
    [],
  ],
  [
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 150, 100],
    [[0, 0, 70, 100, true, true], [76, 0, 68, 100, true, true], [150, 0, 0, 100, true, true]],
    [[70, 0, 6, 100, true, false, false], [144, 0, 6, 100, true, false, false]],
    ["row", 70, -1, "inf", 0, -1, "inf", true, false],
    ["row", 0, 200, 120, 0, -1, "inf", false, false],
    [2, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 172],
    [[0, 0, 120, 40, true, true], [0, 46, 120, 98, true, true], [0, 150, 120, 30, true, true]],
    [[0, 40, 120, 6, true, false, false], [0, 144, 120, 6, true, false, false]],
    ["col", 0, -1, "inf", 20, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [0, 0, 70, 100],
    [76, 0, 68, 100],
    [150, 0, 0, 100],
    [320, 200, 25, 15],
    [],
  ],
  [
    [2, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 150, 100],
    [[0, 0, 150, 0, true, true], [0, 6, 150, 63, true, true], [0, 75, 150, 25, true, true]],
    [[0, 0, 150, 6, true, false, false], [0, 69, 150, 6, true, false, false]],
    ["row", 70, -1, "inf", 0, -1, "inf", true, false],
    ["row", 0, 200, 120, 0, -1, "inf", false, true],
    [2, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 172],
    [[0, 0, 120, 40, true, true], [0, 46, 120, 98, true, true], [0, 150, 120, 30, true, true]],
    [[0, 40, 120, 6, true, false, false], [0, 144, 120, 6, true, false, false]],
    ["col", 0, -1, "inf", 20, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [0, 0, 150, 0],
    [0, 6, 150, 63],
    [0, 75, 150, 25],
    [320, 200, 25, 15],
    [],
  ],
  [
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 300, 100],
    [[0, 0, 90, 100, true, true], [96, 0, 120, 100, true, true], [222, 0, 78, 100, true, true]],
    [[90, 0, 6, 100, true, false, false], [216, 0, 6, 100, true, false, false]],
    ["row", 70, -1, "inf", 0, -1, "inf", false, false],
    ["row", 0, 200, 120, 0, -1, "inf", false, true],
    [2, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 172],
    [[0, 0, 120, 40, true, true], [0, 46, 120, 98, true, true], [0, 150, 120, 30, true, true]],
    [[0, 40, 120, 6, true, false, false], [0, 144, 120, 6, true, false, false]],
    ["col", 0, -1, "inf", 20, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [0, 0, 90, 100],
    [96, 0, 120, 100],
    [222, 0, 78, 100],
    [320, 200, 25, 15],
    [],
  ],
  [
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 300, 100],
    [[0, 0, 90, 100, true, true], [96, 0, 0, 100, true, true], [102, 0, 198, 100, true, true]],
    [[90, 0, 6, 100, true, false, false], [96, 0, 6, 100, true, false, false]],
    ["row", -1, -1, "inf", 0, -1, "inf", false, false],
    ["row", 0, -1, -1, 0, -1, "inf", false, true],
    [2, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 172],
    [[0, 0, 120, 40, true, true], [0, 46, 120, 98, true, true], [0, 150, 120, 30, true, true]],
    [[0, 40, 120, 6, true, false, false], [0, 144, 120, 6, true, false, false]],
    ["col", 0, -1, "inf", 20, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [0, 0, 90, 100],
    [96, 0, 0, 100],
    [102, 0, 198, 100],
    [320, 200, 25, 15],
    [],
  ],
  [
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 300, 100],
    [[0, 0, 44, 100, true, true], [50, 0, 33, 100, true, true], [89, 0, 211, 100, true, true]],
    [[44, 0, 6, 100, true, false, false], [83, 0, 6, 100, true, false, false]],
    ["row", -1, 44, "inf", 0, -1, "inf", false, false],
    ["row", 0, 33, -1, 0, -1, "inf", false, true],
    [2, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 172],
    [[0, 0, 120, 40, true, true], [0, 46, 120, 98, true, true], [0, 150, 120, 30, true, true]],
    [[0, 40, 120, 6, true, false, false], [0, 144, 120, 6, true, false, false]],
    ["col", 0, -1, "inf", 20, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [0, 0, 44, 100],
    [50, 0, 33, 100],
    [89, 0, 211, 100],
    [320, 200, 25, 15],
    [],
  ],
  [
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 300, 100],
    [[0, 0, 44, 100, true, true], [50, 0, 33, 100, true, true], [89, 0, 211, 100, true, true]],
    [[44, 0, 6, 100, true, false, false], [83, 0, 6, 100, true, false, false]],
    ["row", -1, 44, "inf", 0, -1, "inf", false, false],
    ["row", 0, 33, -1, 0, -1, "inf", false, true],
    [2, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 172],
    [[0, 0, 120, 40, true, true], [0, 46, 120, 98, true, true], [0, 150, 120, 30, true, true]],
    [[0, 40, 120, 6, true, false, false], [0, 144, 120, 6, true, false, false]],
    ["col", 0, -1, "inf", 20, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [0, 0, 44, 100],
    [50, 0, 33, 100],
    [89, 0, 211, 100],
    [320, 200, 25, 15],
    [true, false, true],
  ],
  [
    [1, false, 4, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 300, 100],
    [[0, 0, 44, 100, true, true], [50, 0, 33, 100, true, true], [89, 0, 40, 100, true, true], [135, 0, 165, 100, true, true]],
    [[44, 0, 6, 100, true, false, false], [83, 0, 6, 100, true, false, false], [129, 0, 6, 100, true, false, false]],
    ["row", -1, 44, "inf", 0, -1, "inf", false, false],
    ["row", 0, 33, -1, 0, -1, "inf", false, true],
    [2, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 172],
    [[0, 0, 120, 40, true, true], [0, 46, 120, 98, true, true], [0, 150, 120, 30, true, true]],
    [[0, 40, 120, 6, true, false, false], [0, 144, 120, 6, true, false, false]],
    ["col", 0, -1, "inf", 20, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [0, 0, 44, 100],
    [50, 0, 33, 100],
    [89, 0, 40, 100],
    [135, 0, 165, 100],
    [true, false, true],
  ],
  [
    [1, false, 4, 2, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 300, 100],
    [[0, 0, 33, 100, true, true], [39, 0, 40, 100, true, true], [85, 0, 44, 100, true, true], [135, 0, 165, 100, true, true]],
    [[33, 0, 6, 100, true, false, false], [79, 0, 6, 100, true, false, false], [129, 0, 6, 100, true, false, false]],
    ["row", -1, 44, "inf", 0, -1, "inf", false, false],
    ["row", 0, 33, -1, 0, -1, "inf", false, true],
    [2, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 172],
    [[0, 0, 120, 40, true, true], [0, 46, 120, 98, true, true], [0, 150, 120, 30, true, true]],
    [[0, 40, 120, 6, true, false, false], [0, 144, 120, 6, true, false, false]],
    ["col", 0, -1, "inf", 20, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [85, 0, 44, 100],
    [0, 0, 33, 100],
    [39, 0, 40, 100],
    [135, 0, 165, 100],
    [true, false, true],
  ],
  [
    [1, false, 3, 1, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 300, 100],
    [[0, 0, 33, 100, true, true], [39, 0, 44, 100, true, true], [89, 0, 211, 100, true, true]],
    [[33, 0, 6, 100, true, false, false], [83, 0, 6, 100, true, false, false]],
    ["row", -1, 44, "inf", 0, -1, "inf", false, false],
    ["row", 0, 33, -1, 0, -1, "inf", false, true],
    [2, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 172],
    [[0, 0, 120, 40, true, true], [0, 46, 120, 98, true, true], [0, 150, 120, 30, true, true]],
    [[0, 40, 120, 6, true, false, false], [0, 144, 120, 6, true, false, false]],
    ["col", 0, -1, "inf", 20, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [39, 0, 44, 100],
    [0, 0, 33, 100],
    [39, 0, 40, 100],
    [89, 0, 211, 100],
    [true, false, true],
  ],
  [
    [1, false, 3, 1, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 300, 100],
    [[0, 0, 33, 100, true, true], [39, 0, 44, 100, true, true], [89, 0, 211, 100, true, true]],
    [[33, 0, 6, 100, true, false, false], [83, 0, 6, 100, true, false, false]],
    ["row", -1, 44, "inf", 0, -1, "inf", false, false],
    ["row", 0, 33, -1, 0, -1, "inf", false, true],
    [2, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 172],
    [[0, 0, 120, 18, true, true], [0, 24, 120, 150, true, true], [0, 180, 120, 0, true, true]],
    [[0, 18, 120, 6, true, false, false], [0, 174, 120, 6, true, false, false]],
    ["col", 0, -1, "inf", 150, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [39, 0, 44, 100],
    [0, 0, 33, 100],
    [39, 0, 40, 100],
    [89, 0, 211, 100],
    [true, false, true],
  ],
  [
    [1, false, 3, 1, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 300, 100],
    [[0, 0, 33, 100, true, true], [39, 0, 44, 100, true, true], [89, 0, 211, 100, true, true]],
    [[33, 0, 6, 100, true, false, false], [83, 0, 6, 100, true, false, false]],
    ["row", -1, 44, "inf", 0, -1, "inf", false, false],
    ["row", 0, 33, -1, 0, -1, "inf", false, true],
    [2, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 92],
    [[0, 0, 120, 0, true, true], [0, 6, 120, 150, true, true], [0, 162, 120, 0, true, true]],
    [[0, 0, 120, 6, true, false, false], [0, 156, 120, 6, true, false, false]],
    ["col", 0, -1, "inf", 150, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [39, 0, 44, 100],
    [0, 0, 33, 100],
    [39, 0, 40, 100],
    [89, 0, 211, 100],
    [true, false, true],
  ],
  [
    [1, false, 3, 1, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 300, 100],
    [[0, 0, 33, 100, true, true], [39, 0, 44, 100, true, true], [89, 0, 211, 100, true, true]],
    [[33, 0, 6, 100, true, false, false], [83, 0, 6, 100, true, false, false]],
    ["row", -1, 44, "inf", 0, -1, "inf", false, false],
    ["row", 0, 33, -1, 0, -1, "inf", false, true],
    [2, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 92],
    [[0, 0, 120, 0, false, true], [0, 0, 120, 150, true, true], [0, 156, 120, 0, true, true]],
    [[0, 0, 120, 6, false, false, false], [0, 150, 120, 6, true, false, false]],
    ["col", 0, -1, "inf", 150, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [39, 0, 44, 100],
    [0, 0, 33, 100],
    [39, 0, 40, 100],
    [89, 0, 211, 100],
    [true, false, true],
  ],
  [
    [1, false, 3, 1, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 300, 100],
    [[0, 0, 33, 100, true, true], [39, 0, 44, 100, true, true], [89, 0, 211, 100, true, true]],
    [[33, 0, 6, 100, true, false, false], [83, 0, 6, 100, true, false, false]],
    ["row", -1, 44, "inf", 0, -1, "inf", false, false],
    ["row", 0, 33, -1, 0, -1, "inf", false, true],
    [1, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 92],
    [[0, 0, 0, 100, true, true], [6, 0, 0, 100, true, true], [12, 0, 108, 100, true, true]],
    [[0, 0, 6, 100, true, false, false], [6, 0, 6, 100, true, false, false]],
    ["col", 0, -1, "inf", 150, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 60, 50, true, true], [70, 0, 50, 50, true, true], [130, 0, 50, 50, true, true]],
    [[60, 0, 10, 50, true, false, false], [120, 0, 10, 50, true, false, false]],
    ["wide", 40, 60, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [39, 0, 44, 100],
    [0, 0, 33, 100],
    [39, 0, 40, 100],
    [89, 0, 211, 100],
    [true, false, true],
  ],
  [
    [1, false, 3, 1, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 300, 100],
    [[0, 0, 33, 100, true, true], [39, 0, 44, 100, true, true], [89, 0, 211, 100, true, true]],
    [[33, 0, 6, 100, true, false, false], [83, 0, 6, 100, true, false, false]],
    ["row", -1, 44, "inf", 0, -1, "inf", false, false],
    ["row", 0, 33, -1, 0, -1, "inf", false, true],
    [1, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 92],
    [[0, 0, 0, 100, true, true], [6, 0, 0, 100, true, true], [12, 0, 108, 100, true, true]],
    [[0, 0, 6, 100, true, false, false], [6, 0, 6, 100, true, false, false]],
    ["col", 0, -1, "inf", 150, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 145, 50, true, true], [155, 0, 15, 50, true, true], [180, 0, 0, 50, true, true]],
    [[145, 0, 10, 50, true, false, false], [170, 0, 10, 50, true, false, false]],
    ["wide", 40, 500, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [39, 0, 44, 100],
    [0, 0, 33, 100],
    [39, 0, 40, 100],
    [89, 0, 211, 100],
    [true, false, true],
  ],
  [
    [1, false, 3, 1, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 300, 100],
    [[0, 0, 33, 100, true, true], [39, 0, 44, 100, true, true], [89, 0, 211, 100, true, true]],
    [[33, 0, 6, 100, true, false, false], [83, 0, 6, 100, true, false, false]],
    ["row", -1, 44, "inf", 0, -1, "inf", false, false],
    ["row", 0, 33, -1, 0, -1, "inf", false, true],
    [1, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 92],
    [[0, 0, 0, 100, true, true], [6, 0, 0, 100, true, true], [12, 0, 108, 100, true, true]],
    [[0, 0, 6, 100, true, false, false], [6, 0, 6, 100, true, false, false]],
    ["col", 0, -1, "inf", 150, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 180, 50],
    [[0, 0, 161, 50, true, true], [163, 0, 15, 50, true, true], [180, 0, 0, 50, true, true]],
    [[161, 0, 2, 50, true, false, false], [178, 0, 2, 50, true, false, false]],
    ["wide", 40, 500, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [39, 0, 44, 100],
    [0, 0, 33, 100],
    [39, 0, 40, 100],
    [89, 0, 211, 100],
    [true, false, true],
  ],
  [
    [1, false, 3, 1, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 300, 100],
    [[0, 0, 33, 100, true, true], [39, 0, 44, 100, true, true], [89, 0, 211, 100, true, true]],
    [[33, 0, 6, 100, true, false, false], [83, 0, 6, 100, true, false, false]],
    ["row", -1, 44, "inf", 0, -1, "inf", false, false],
    ["row", 0, 33, -1, 0, -1, "inf", false, true],
    [1, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 92],
    [[0, 0, 0, 100, true, true], [6, 0, 0, 100, true, true], [12, 0, 108, 100, true, true]],
    [[0, 0, 6, 100, true, false, false], [6, 0, 6, 100, true, false, false]],
    ["col", 0, -1, "inf", 150, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true]],
    [],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 1, 0, 0, 180, 50],
    [[0, 0, 165, 50, true, true], [165, 0, 15, 50, true, true], [180, 0, 0, 50, true, true]],
    [],
    ["wide", 40, 500, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [39, 0, 44, 100],
    [0, 0, 33, 100],
    [39, 0, 40, 100],
    [89, 0, 211, 100],
    [true, false, true],
  ],
  [
    [1, false, 3, 1, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 300, 100],
    [[0, 0, 33, 100, true, true], [39, 0, 44, 100, true, true], [89, 0, 211, 100, true, true]],
    [[33, 0, 6, 100, true, false, false], [83, 0, 6, 100, true, false, false]],
    ["row", -1, 44, "inf", 0, -1, "inf", false, false],
    ["row", 0, 33, -1, 0, -1, "inf", false, true],
    [1, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 92],
    [[0, 0, 0, 100, true, true], [6, 0, 0, 100, true, true], [12, 0, 108, 100, true, true]],
    [[0, 0, 6, 100, true, false, false], [6, 0, 6, 100, true, false, false]],
    ["col", 0, -1, "inf", 150, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 2, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 80, 60],
    [[0, 0, 20, 60, true, true], [22, 0, 58, 60, true, true]],
    [[20, 0, 2, 60, true, false, false]],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 1, 0, 0, 180, 50],
    [[0, 0, 165, 50, true, true], [165, 0, 15, 50, true, true], [180, 0, 0, 50, true, true]],
    [],
    ["wide", 40, 500, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [39, 0, 44, 100],
    [0, 0, 33, 100],
    [39, 0, 40, 100],
    [89, 0, 211, 100],
    [true, false, true],
  ],
  [
    [1, false, 3, 1, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 300, 100],
    [[0, 0, 33, 100, true, true], [39, 0, 44, 100, true, true], [89, 0, 211, 100, true, true]],
    [[33, 0, 6, 100, true, false, false], [83, 0, 6, 100, true, false, false]],
    ["row", -1, 44, "inf", 0, -1, "inf", false, false],
    ["row", 0, 33, -1, 0, -1, "inf", false, true],
    [1, false, 3, 0, 0, 0, 0, 0, 8, 8, 3, 3, 4, 4, 112, 92],
    [[0, 0, 0, 100, true, true], [6, 0, 0, 100, true, true], [12, 0, 108, 100, true, true]],
    [[0, 0, 6, 100, true, false, false], [6, 0, 6, 100, true, false, false]],
    ["col", 0, -1, "inf", 150, -1, "inf", false, true],
    ["col", 0, -1, "inf", 0, -1, 50, false, false],
    [1, false, 2, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 80, 60],
    [[0, 0, 80, 60, true, true], [22, 0, 58, 60, false, true]],
    [[80, 0, 2, 60, false, false, false]],
    [1, false, 3, 0, 0, 0, 0, 0, 0, 0, 3, 1, 0, 0, 180, 50],
    [[0, 0, 165, 50, true, true], [165, 0, 15, 50, true, true], [180, 0, 0, 50, true, true]],
    [],
    ["wide", 40, 500, "inf", 0, -1, "inf", false, false],
    ["wide", 15, -1, "inf", 0, -1, "inf", true, false],
    [39, 0, 44, 100],
    [0, 0, 33, 100],
    [39, 0, 40, 100],
    [89, 0, 211, 100],
    [true, false, true],
  ],
];
