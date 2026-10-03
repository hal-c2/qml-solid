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
