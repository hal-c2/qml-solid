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

test("a model with a skin is bent by its joints as Qt bends it", async ({ page }) => {
  await open(page, "skin3d");
  const R = [255, 0, 0];
  const G = [0, 255, 0];
  const none = [32, 32, 32];
  const points = [
    // The one bent over: up its lower half, round the corner, along its
    // upper half, and where it would be if the model's own place counted.
    [[80, 230], R],
    [[80, 180], R],
    [[100, 150], R],
    [[150, 150], R],
    [[175, 135], R],
    [[175, 165], R],
    [[60, 120], none],
    // The one whose joints undo no pose: its foot, its slanting middle, its
    // upper half moved over, and beside its foot.
    [[200, 230], G],
    [[215, 150], G],
    [[260, 70], G],
    [[240, 230], none],
    // The lit one: its lower half full in the light, darker the more of the
    // turned joint a corner goes with, and its squashed top, and round it.
    [[300, 230], [239, 239, 239]],
    [[320, 230], [239, 239, 239]],
    [[320, 200], [239, 239, 239]],
    [[320, 180], [224, 224, 224]],
    [[320, 160], [202, 202, 202]],
    [[320, 140], [153, 153, 153]],
    [[320, 125], [25, 25, 25]],
    [[320, 110], [0, 0, 0]],
    [[320, 95], none],
    [[305, 110], none],
    [[335, 110], none],
    [[345, 230], none],
  ];
  const at = points.map(([point]) => point);
  await expect.poll(async () => (await pixels(page, [at[0]]))[0]).toBe("255 0 0");
  const painted = (await pixels(page, at)).map((colour) => colour.split(" ").map(Number));
  near(painted, points.map(([, colour]) => colour), "", 3);
  // What it says its bounds are is the mesh's, bent or not.
  near(await page.evaluate(() => window.scene.read()), { bounds: [[-20, 0, 0], [20, 200, 0]] });
});

// What Qt paints through, over the grey the scene is on: Qt's own colour
// and how much of it is there.
const over = ([r, g, b], alpha) => [r, g, b].map((c) => Math.round((c * alpha + 32 * (255 - alpha)) / 255));
const grey = (v) => [v, v, v];

// What is painted at each of the points, once the pictures it is painted
// with are here.
async function painted(page, points, within = 3) {
  const at = points.map(([point]) => point);
  const read = async () => (await pixels(page, at)).map((colour) => colour.split(" ").map(Number));
  const there = (colours) => colours.every((colour, index) => colour.every((channel, part) => Math.abs(channel - points[index][1][part]) < within));
  await expect.poll(async () => there(await read())).toBe(true).catch(() => {});
  return read();
}

test("a material reads its pictures as Qt reads them", async ({ page }) => {
  await open(page, "maps3d");
  const points = [
    // Plain, turned by a picture of the way it faces, turned less, and as
    // rough as one channel of a picture says and as another.
    [[40, 50], grey(188)],
    [[120, 50], grey(168)],
    [[200, 50], grey(184)],
    [[280, 50], grey(189)],
    [[360, 50], grey(188)],
    // All metal, as much metal as a picture's blue says and as its green,
    // and reached by as little light as a picture says, and half of that.
    [[40, 150], [162, 79, 37]],
    [[120, 150], [180, 90, 46]],
    [[200, 150], [183, 93, 51]],
    [[280, 150], grey(90)],
    [[360, 150], grey(124)],
    // Giving off a picture, there as much as a picture's red says, as much
    // as it does not, as much as a picture is there, and rough by one that
    // is half there.
    [[25, 240], [255, 4, 4]],
    [[55, 240], [4, 4, 255]],
    [[25, 260], [255, 4, 4]],
    [[55, 260], [4, 4, 255]],
    [[120, 250], over(grey(185), 51)],
    [[200, 250], over(grey(188), 204)],
    [[280, 250], over(grey(187), 128)],
    [[360, 250], grey(189)],
    [[5, 5], grey(32)],
  ];
  near(await painted(page, points), points.map(([, colour]) => colour), "", 3);
});

test("a material is turned and seen through as Qt has it", async ({ page }) => {
  await open(page, "turned3d");
  const points = [
    // A metal as rough as a picture says, here and further along, which
    // the eye sees from another side; a picture that is half there says
    // the same.
    [[40, 50], [129, 62, 27]],
    [[120, 50], [139, 67, 30]],
    [[100, 30], [134, 65, 29]],
    [[140, 70], [143, 69, 31]],
    // A DefaultMaterial is turned by a picture as far as `bumpAmount`
    // says, which is not at all until it is set; a picture of heights that
    // rise evenly tilts it a little.
    [[200, 50], grey(187)],
    [[280, 50], grey(186)],
    // Nothing is seen through an opaque one's colour, and it is half there
    // all the same.
    [[360, 50], over(grey(187), 128)],
    // A DefaultMaterial giving off a picture, and there as much as a
    // picture is.
    [[25, 140], [255, 0, 0]],
    [[55, 140], [0, 0, 255]],
    [[120, 150], over(grey(187), 128)],
    // A ball under a clear coat has less of its colour all round than it
    // would have. (The spot of light at its middle is a few pixels wide.)
    [[190, 140], [130, 0, 0]],
    [[210, 160], [119, 0, 0]],
    // A ball turned by a picture, and a tile seen from its back.
    [[280, 150], grey(168)],
    [[270, 140], grey(180)],
    [[295, 160], grey(160)],
    [[360, 150], grey(170)],
    // Giving off a picture besides being lit, masked and half there, a
    // picture laid the other way round, a tile turned on its face, and the
    // ball with no coat.
    [[25, 240], [255, 188, 188]],
    [[55, 240], [188, 188, 255]],
    [[120, 250], over(grey(187), 128)],
    [[200, 250], grey(169)],
    [[280, 250], grey(168)],
    [[360, 250], [188, 15, 15]],
    [[350, 240], [178, 3, 3]],
    [[370, 260], [176, 0, 0]],
  ];
  near(await painted(page, points), points.map(([, colour]) => colour), "", 3);
});

test("a clear coat and a light's shine are as Qt has them", async ({ page }) => {
  await open(page, "coated3d");
  // Of each ball: its middle, and three places off it. A ball here is of
  // other triangles than Qt's, which shows most where it is darkest, so
  // these are within four of Qt's and not three.
  const points = [
    // A whole coat.
    [[40, 50], [161, 28, 28]],
    [[30, 40], [63, 0, 0]],
    [[52, 58], [166, 6, 6]],
    [[22, 62], [28, 0, 0]],
    // Half of one.
    [[120, 50], [183, 37, 37]],
    [[110, 40], [141, 1, 1]],
    [[132, 58], [164, 4, 4]],
    [[102, 62], [121, 0, 0]],
    // As much of one as a picture's red says.
    [[200, 50], [186, 17, 17]],
    [[190, 40], [166, 4, 4]],
    [[212, 58], [168, 4, 4]],
    [[182, 62], [147, 3, 3]],
    // One as rough as a picture's green says.
    [[280, 50], [174, 41, 41]],
    [[270, 40], [116, 0, 0]],
    [[292, 58], [104, 0, 0]],
    [[262, 62], [99, 0, 0]],
    // And both by its blue.
    [[360, 50], [164, 25, 25]],
    [[350, 40], [136, 4, 4]],
    [[372, 58], [106, 0, 0]],
    [[342, 62], [128, 1, 1]],
    // A coat that gives back more sooner as it turns.
    [[40, 150], [179, 35, 35]],
    [[30, 140], [131, 1, 1]],
    [[52, 158], [163, 4, 4]],
    [[22, 162], [73, 0, 0]],
    // One over what bends light more.
    [[120, 150], [210, 130, 130]],
    [[110, 140], [105, 6, 6]],
    [[132, 158], [133, 10, 10]],
    [[102, 162], [33, 0, 0]],
    // One over a ball a picture turns.
    [[200, 150], [195, 115, 115]],
    [[190, 140], [131, 1, 1]],
    [[212, 158], [92, 0, 0]],
    [[182, 162], [66, 0, 0]],
    // One a picture turns.
    [[280, 150], [69, 0, 0]],
    [[270, 140], [119, 0, 0]],
    [[292, 158], [0, 0, 0]],
    [[262, 162], [132, 5, 5]],
    // And one whose giving back is scaled and shifted.
    [[360, 150], [157, 24, 24]],
    [[350, 140], [147, 4, 4]],
    [[372, 158], [110, 0, 0]],
    [[342, 162], [113, 0, 0]],
    // No coat: what a ball gives back of a light, scaled and shifted, which the lights do not heed.
    [[40, 250], [189, 21, 21]],
    [[30, 240], [178, 0, 0]],
    [[52, 258], [175, 0, 0]],
    [[22, 262], [159, 0, 0]],
    // A fifth as much, which they do not heed either.
    [[120, 250], [190, 37, 37]],
    [[110, 240], [178, 0, 0]],
    [[132, 258], [175, 0, 0]],
    [[102, 262], [159, 0, 0]],
    // In its own colour.
    [[200, 250], [191, 0, 0]],
    [[190, 240], [178, 0, 0]],
    [[212, 258], [175, 0, 0]],
    [[182, 262], [158, 0, 0]],
    // Growing otherwise as it turns.
    [[280, 250], [189, 30, 30]],
    [[270, 240], [178, 0, 0]],
    [[292, 258], [175, 0, 0]],
    [[262, 262], [158, 0, 0]],
    // And none at all.
    [[360, 250], [187, 0, 0]],
    [[350, 240], [178, 0, 0]],
    [[372, 258], [175, 0, 0]],
    [[342, 262], [158, 0, 0]],
  ];
  near(await painted(page, points, 4), points.map(([, colour]) => colour), "", 4);
});
