import { expect, open, test } from "./open.js";
import { pixels } from "./pixels.js";

// Qt's numbers are single precision, rounded to three places.
function near(actual, expected, path = "", within = 0.006) {
  if (typeof expected === "number") expect(Math.abs(actual - expected), `${path}: ${actual} for ${expected}`).toBeLessThan(within);
  else if (Array.isArray(expected)) {
    expect(actual, path).toHaveLength(expected.length);
    expected.forEach((value, index) => near(actual[index], value, `${path}[${index}]`, within));
  } else if (expected && typeof expected === "object") {
    for (const [key, value] of Object.entries(expected)) near(actual[key], value, `${path}.${key}`, within);
  } else expect(actual, path).toBe(expected);
}

test("a node in space is where Qt has it, and a camera sees it there", async ({ page }) => {
  await open(page, "node3d");
  near(await page.evaluate(() => window.scene.read()), {
    outer: [85.858, 20, -15.858],
    inner: [118.371, 22.321, 2.513],
    cube: [-51.334, 22.32, 172.219],
    scale: [2, 6, 2],
    rotation: [0.701, 0.43, 0.092, 0.561],
    cubeRotation: [0.674, 0.327, 0.213, 0.627],
    own: [0.892, 0.239, 0.37, -0.099],
    forward: [-0.612, 0.5, -0.612],
    up: [-0.707, 0, 0.707],
    right: [0.354, 0.866, 0.354],
    point: [114.267, 21.053, 15.38],
    back: [-29.461, 13.89, -30.708],
    between: [-121, 11.966, 17.477],
    way: [0.86, -0.317, 1.331],
    wayBack: [6.293, 8.485, 2.899],
    seen: [156.607, 166.068, 444.447],
    there: [-37.181, 127.504, 332.093],
    viewport: [0.392, 0.554, 444.447],
    from: [44.668, 21.1, 508.099],
    bounds: [
      [-50, -50, -50],
      [50, 50, 50],
    ],
    parent: [true, true, 1],
  });
});

test("a node turns about its own line, its parent's and the scene's", async ({ page }) => {
  await open(page, "node3d");
  const step = (index) => page.evaluate((index) => window.scene.step(index), index);
  // Its angles are read back from the turn it was given.
  near(await step(0), [
    [0.845, 0.038, 0.462, 0.269],
    [-10.573, 54.492, 29.819],
    [4.296, 4.888, -7.592],
  ]);
  near(await step(1), [
    [0.781, 0.325, 0.342, 0.41],
    [13.088, 55.24, 62.313],
    [4.296, 8.625, -2.674],
  ]);
  near(await step(2), [
    [0.976, -0.058, 0.17, 0.12],
    [0.673, 0.243, 0.404, 0.569],
    [-0.821, -0.133, -0.555],
  ]);
  // One angle assigned leaves the other two as the turn had them.
  near(await step(3), [
    [0.73, 0.375, 0.439, 0.365],
    [3.473, 8.625, -3.68],
    [-40.728, 13.66, 154.541],
  ]);
  near(await step(4), [
    [-4.448, 17.532, 0],
    [-0.3, -0.078, -0.951],
  ]);
});

test("a View3D paints its models as Qt does", async ({ page }) => {
  await open(page, "shaded3d");
  const points = [
    [50, 60],
    [150, 60],
    [250, 60],
    [350, 60],
    [50, 170],
    [150, 170],
    [230, 160],
    [270, 160],
    [230, 180],
    [270, 180],
    [350, 170],
    [335, 160],
    [50, 260],
    [30, 245],
    [150, 260],
    [250, 260],
    [100, 110],
  ];
  // The picture one of them is drawn with arrives when it does.
  await expect.poll(async () => (await pixels(page, [points[6]]))[0]).toBe("255 0 0");
  const painted = (await pixels(page, points)).map((colour) => colour.split(" ").map(Number));
  // What Qt paints there: its own colour, a light full on, a rough and a
  // metal one, one turned from the light, one seen through, the corners of
  // a picture, a ball at its middle and off it, the nearer of two and the
  // further beside it, a back, a back that is drawn, and nothing.
  near(painted, [
    [50, 102, 153],
    [207, 104, 51],
    [77, 214, 117],
    [144, 119, 71],
    [216, 214, 213],
    [144, 16, 16],
    [255, 0, 0],
    [0, 0, 255],
    [255, 0, 0],
    [0, 0, 255],
    [136, 134, 255],
    [123, 121, 239],
    [255, 255, 0],
    [0, 255, 255],
    [32, 32, 32],
    [255, 0, 255],
    [32, 32, 32],
  ], "", 3);
});
