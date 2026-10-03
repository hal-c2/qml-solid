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
