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

test("a Repeater3D makes a node for every row, inside itself", async ({ page }) => {
  await open(page, "repeater3d");
  // What it makes is its own, and not its parent's as an item a Repeater
  // makes is: where it is moves them, and its parent has it alone.
  near(await page.evaluate(() => window.scene.read()), {
    count: [3, 2, 2],
    objectAt: [-40, null, null],
    parent: [false, true, false, true],
    holder: "before,rep,after",
    scenePosition: [[-40, -160, 0], [20, 80, 0]],
    log: ["added 0 -100", "added 1 -40", "added 2 20"],
  });
  const none = [32, 32, 32];
  const points = [
    // One before them, one for each of three, none for a fourth, and one
    // after them.
    [[30, 70], [255, 255, 255]],
    [[100, 70], [255, 0, 0]],
    [[160, 70], [0, 255, 0]],
    [[220, 70], [0, 0, 255]],
    [[280, 70], none],
    [[370, 70], [128, 128, 128]],
    // Those of a list are moved off the picture with the repeater, and
    // those of an array are where they say.
    [[100, 230], none],
    [[160, 230], none],
    [[260, 230], [255, 128, 0]],
    [[320, 230], [128, 0, 255]],
    [[200, 150], none],
  ];
  near(await painted(page, points), points.map(([, colour]) => colour), "", 3);
  // Another number of them is all of them anew: the last goes first.
  expect(await page.evaluate(() => window.scene.grow(4))).toEqual({
    count: 4,
    log: ["removed 2 20", "removed 1 -40", "removed 0 -100", "added 0 -100", "added 1 -40", "added 2 20", "added 3 80"],
    holder: "before,rep,after",
  });
  expect(await page.evaluate(() => window.scene.grow(2))).toEqual({
    count: 2,
    log: ["removed 3 80", "removed 2 20", "removed 1 -40", "removed 0 -100", "added 0 -100", "added 1 -40"],
    holder: "before,rep,after",
  });
  // A list that says what changed in it is followed row by row.
  expect(await page.evaluate(() => window.scene.swap())).toEqual({ count: 2, x: -100 });
});

test("a picture of everything round a scene is seen behind it", async ({ page }) => {
  await open(page, "sky3d");
  // Looking each of four ways: the corners of the view, and between them
  // and its middle, above the horizon, on it and below. The picture shows
  // less bright than it is: white is 208.
  const ways = {
    0: [
      [[50, 40], [208, 0, 0]],
      [[350, 40], [0, 208, 0]],
      [[100, 75], [208, 0, 0]],
      [[300, 75], [0, 208, 0]],
      [[50, 150], [169, 65, 65]],
      [[350, 150], [125, 208, 125]],
      [[100, 225], [122, 122, 122]],
      [[300, 225], [208, 208, 208]],
      [[50, 260], [122, 122, 122]],
      [[350, 260], [208, 208, 208]],
    ],
    90: [
      [[50, 40], [208, 208, 0]],
      [[350, 40], [208, 0, 0]],
      [[100, 75], [208, 208, 0]],
      [[300, 75], [208, 0, 0]],
      [[50, 150], [208, 118, 125]],
      [[350, 150], [169, 65, 65]],
      [[100, 225], [208, 0, 208]],
      [[300, 225], [122, 122, 122]],
      [[50, 260], [208, 0, 208]],
      [[350, 260], [122, 122, 122]],
    ],
    180: [
      [[50, 40], [0, 0, 208]],
      [[350, 40], [208, 208, 0]],
      [[100, 75], [0, 0, 208]],
      [[300, 75], [208, 208, 0]],
      [[50, 150], [0, 125, 208]],
      [[350, 150], [208, 118, 125]],
      [[100, 225], [0, 208, 208]],
      [[300, 225], [208, 0, 208]],
      [[50, 260], [0, 208, 208]],
      [[350, 260], [208, 0, 208]],
    ],
    270: [
      [[50, 40], [0, 208, 0]],
      [[350, 40], [0, 0, 208]],
      [[100, 75], [0, 208, 0]],
      [[300, 75], [0, 0, 208]],
      [[50, 150], [125, 208, 125]],
      [[350, 150], [0, 125, 208]],
      [[100, 225], [208, 208, 208]],
      [[300, 225], [0, 208, 208]],
      [[50, 260], [208, 208, 208]],
      [[350, 260], [0, 208, 208]],
    ],
  };
  for (const [turn, points] of Object.entries(ways)) {
    await page.evaluate((turn) => void (window.scene.turn = turn), Number(turn));
    near(await painted(page, points), points.map(([, colour]) => colour), `turned ${turn}`, 3);
  }
  // Blurred by half and wholly, looking the first way: each is the picture
  // as a surface that rough would give it back.
  await page.evaluate(() => void (window.scene.turn = 0));
  const blurs = {
    0.5: [
      [[50, 40], [195, 102, 64]],
      [[350, 40], [123, 201, 107]],
      [[100, 75], [189, 120, 80]],
      [[300, 75], [139, 197, 116]],
      [[200, 75], [167, 169, 97]],
      [[50, 150], [178, 114, 102]],
      [[350, 150], [165, 202, 162]],
      [[200, 150], [171, 173, 137]],
      [[100, 225], [161, 139, 132]],
      [[300, 225], [187, 199, 184]],
      [[200, 225], [175, 176, 164]],
      [[50, 260], [155, 131, 129]],
      [[350, 260], [192, 202, 192]],
    ],
    1: [
      [[50, 40], [180, 153, 104]],
      [[350, 40], [159, 185, 146]],
      [[100, 75], [177, 157, 113]],
      [[300, 75], [164, 183, 142]],
      [[200, 75], [171, 172, 125]],
      [[50, 150], [179, 149, 126]],
      [[350, 150], [165, 190, 159]],
      [[200, 150], [173, 173, 140]],
      [[100, 225], [177, 157, 145]],
      [[300, 225], [170, 188, 164]],
      [[200, 225], [174, 175, 154]],
      [[50, 260], [178, 151, 148]],
      [[350, 260], [169, 191, 172]],
    ],
  };
  for (const [blur, points] of Object.entries(blurs)) {
    await page.evaluate((blur) => void (window.scene.blur = blur), Number(blur));
    near(await painted(page, points), points.map(([, colour]) => colour), `blurred ${blur}`, 3);
  }
});

test("a scene is lit by a picture of everything round it", async ({ page }) => {
  await open(page, "probe3d");
  // Of each ball: its middle and four places off it. The cube the picture
  // is folded into is blurred by the same sums as Qt's, and read by another
  // GPU, so these are within three of Qt's and not two.
  const points = [
    // Rough.
    [[40, 80], [136, 172, 199]],
    [[28, 68], [151, 165, 191]],
    [[52, 68], [112, 172, 192]],
    [[28, 92], [162, 169, 199]],
    [[52, 92], [142, 184, 202]],
    // A DefaultMaterial.
    [[40, 220], [131, 168, 194]],
    [[28, 208], [158, 166, 177]],
    [[52, 208], [115, 171, 185]],
    [[28, 232], [153, 168, 196]],
    [[52, 232], [127, 180, 201]],
    // Half as rough.
    [[120, 80], [150, 170, 200]],
    [[108, 68], [171, 167, 187]],
    [[132, 68], [122, 170, 196]],
    [[108, 92], [174, 163, 198]],
    [[132, 92], [147, 183, 205]],
    // A DefaultMaterial with a shine.
    [[120, 220], [151, 174, 250]],
    [[108, 208], [238, 233, 172]],
    [[132, 208], [125, 185, 239]],
    [[108, 232], [235, 168, 251]],
    [[132, 232], [136, 239, 255]],
    // A mirror.
    [[200, 80], [38, 186, 208]],
    [[188, 68], [208, 208, 0]],
    [[212, 68], [0, 0, 208]],
    [[188, 92], [208, 0, 208]],
    [[212, 92], [0, 208, 208]],
    // Red under a clear coat.
    [[200, 220], [164, 38, 51]],
    [[188, 208], [132, 58, 5]],
    [[212, 208], [86, 16, 58]],
    [[188, 232], [129, 9, 60]],
    [[212, 232], [87, 60, 61]],
    // A metal, a little rough.
    [[280, 80], [177, 129, 183]],
    [[268, 68], [192, 179, 74]],
    [[292, 68], [83, 109, 186]],
    [[268, 92], [172, 89, 172]],
    [[292, 92], [107, 188, 193]],
    // Giving nothing back.
    [[280, 220], [181, 166, 178]],
    [[268, 208], [192, 165, 152]],
    [[292, 208], [159, 165, 177]],
    [[268, 232], [190, 159, 178]],
    [[292, 232], [163, 166, 193]],
    // Rough and red.
    [[360, 80], [186, 19, 26]],
    [[348, 68], [195, 19, 11]],
    [[372, 68], [176, 21, 25]],
    [[348, 92], [186, 15, 24]],
    [[372, 92], [170, 25, 32]],
    // Half metal, tinted.
    [[360, 220], [186, 140, 0]],
    [[348, 208], [188, 131, 0]],
    [[372, 208], [94, 82, 28]],
    [[348, 232], [185, 75, 28]],
    [[372, 232], [109, 138, 28]],
  ];
  near(await painted(page, points, 4), points.map(([, colour]) => colour), "", 4);

  // The middles of the balls and the four places on the mirror, with the
  // picture twice as bright, reaching half as far below the horizon, turned
  // a quarter about the way up, and tilted.
  const at = [
    [40, 80],
    [120, 80],
    [200, 80],
    [188, 68],
    [212, 68],
    [188, 92],
    [212, 92],
    [280, 80],
    [360, 80],
    [40, 220],
    [120, 220],
    [200, 220],
    [280, 220],
    [360, 220],
  ];
  const set = async (change, colours) => {
    await page.evaluate(change);
    const expected = at.map((point, index) => [point, colours[index]]).filter(([, colour]) => colour);
    near(await painted(page, expected, 4), expected.map(([, colour]) => colour), String(change), 4);
  };
  await set(() => void (window.scene.exposure = 2), [
    [176, 211, 234],
    [190, 211, 236],
    [55, 224, 239],
    [239, 239, 0],
    [0, 0, 239],
    [239, 0, 239],
    [0, 239, 239],
    [216, 168, 221],
    [223, 31, 39],
    [170, 208, 229],
    [193, 217, 255],
    [205, 56, 72],
    [219, 205, 216],
    [229, 179, 4],
  ]);
  await set(() => void ((window.scene.exposure = 1), (window.scene.horizon = 0.5)), [
    [102, 133, 159],
    [113, 131, 159],
    [25, 146, 168],
    [207, 207, 0],
    [0, 0, 207],
    [168, 0, 168],
    [0, 168, 168],
    [137, 96, 143],
    [146, 11, 15],
    [108, 142, 166],
    [129, 149, 220],
    [143, 30, 41],
    [158, 143, 155],
    [156, 115, 0],
  ]);
  await set(() => void ((window.scene.horizon = 0), window.scene.turn(0, 90, 0)), [
    [156, 196, 181],
    [152, 198, 190],
    [186, 208, 208],
    [0, 0, 208],
    [0, 208, 0],
    [0, 208, 208],
    [208, 208, 208],
    [99, 183, 190],
    [125, 26, 31],
    [146, 192, 170],
    [138, 232, 182],
    [116, 51, 42],
    [109, 180, 190],
    [57, 91, 26],
  ]);
  await set(() => window.scene.turn(40, 0, 0), [
    [153, 182, 202],
    [160, 179, 204],
    [0, 208, 208],
    [208, 0, 208],
    // An edge in the picture runs through here.
    null,
    [122, 122, 122],
    [208, 208, 208],
    [176, 117, 190],
    [181, 18, 27],
    [142, 176, 202],
    [157, 236, 255],
    [165, 48, 64],
    [179, 162, 192],
    [185, 78, 26],
  ]);
});

test("the sky QtQuick3D.Helpers makes is the one Qt makes", async ({ page }) => {
  await open(page, "procedural3d");
  // Looking away, to the left, behind, at the sun, down and up: the view
  // all over, and down its middle, where the sky meets the ground.
  const ways = [
    [
      [0, 0],
      [
        [[50, 40], [154, 186, 201]],
        [[200, 40], [153, 186, 201]],
        [[350, 40], [154, 186, 201]],
        [[50, 150], [131, 136, 140]],
        [[200, 150], [127, 131, 134]],
        [[350, 150], [132, 136, 140]],
        [[50, 260], [40, 47, 53]],
        [[200, 260], [40, 47, 53]],
        [[350, 260], [40, 47, 53]],
        [[200, 100], [162, 189, 202]],
        [[200, 120], [169, 191, 203]],
        [[200, 135], [176, 193, 204]],
        [[200, 145], [182, 196, 205]],
        [[200, 155], [81, 78, 77]],
        [[200, 165], [56, 58, 61]],
        [[200, 200], [40, 47, 54]],
      ],
    ],
    [
      [0, 90],
      [
        [[50, 40], [154, 186, 201]],
        [[200, 40], [161, 189, 202]],
        [[350, 40], [154, 186, 201]],
        [[50, 150], [131, 136, 140]],
        [[200, 150], [127, 131, 134]],
        [[350, 150], [132, 136, 140]],
        [[50, 260], [40, 47, 53]],
        [[200, 260], [40, 47, 53]],
        [[350, 260], [40, 47, 53]],
        [[200, 100], [162, 189, 202]],
        [[200, 120], [169, 191, 203]],
        [[200, 135], [176, 193, 204]],
        [[200, 145], [182, 196, 205]],
        [[200, 155], [81, 78, 77]],
        [[200, 165], [56, 58, 61]],
        [[200, 200], [40, 47, 54]],
      ],
    ],
    [
      [0, 180],
      [
        [[50, 40], [154, 186, 201]],
        [[200, 40], [153, 186, 201]],
        [[350, 40], [154, 186, 201]],
        [[50, 150], [131, 136, 140]],
        [[200, 150], [127, 131, 134]],
        [[350, 150], [132, 136, 140]],
        [[50, 260], [40, 47, 53]],
        [[200, 260], [40, 47, 53]],
        [[350, 260], [40, 47, 53]],
        [[200, 100], [162, 189, 202]],
        [[200, 120], [169, 191, 203]],
        [[200, 135], [176, 193, 204]],
        [[200, 145], [182, 196, 205]],
        [[200, 155], [81, 78, 77]],
        [[200, 165], [56, 58, 61]],
        [[200, 200], [40, 47, 54]],
      ],
    ],
    [
      [35, 90],
      [
        [[50, 40], [152, 186, 201]],
        [[200, 40], [152, 186, 201]],
        [[350, 40], [152, 186, 201]],
        [[50, 150], [152, 186, 201]],
        [[200, 150], [208, 208, 208]],
        [[350, 150], [152, 186, 201]],
        [[50, 260], [162, 189, 202]],
        [[200, 260], [161, 188, 202]],
        [[350, 260], [162, 189, 202]],
        [[200, 100], [162, 189, 202]],
        [[200, 120], [176, 194, 203]],
        [[200, 135], [193, 201, 205]],
        [[200, 145], [207, 208, 208]],
        [[200, 155], [207, 207, 208]],
        [[200, 165], [193, 201, 205]],
        [[200, 200], [163, 189, 202]],
      ],
    ],
    [
      [-60, 0],
      [
        [[50, 40], [40, 47, 53]],
        [[200, 40], [40, 47, 53]],
        [[350, 40], [40, 47, 53]],
        [[50, 150], [40, 47, 53]],
        [[200, 150], [40, 47, 53]],
        [[350, 150], [40, 47, 53]],
        [[50, 260], [40, 47, 53]],
        [[200, 260], [40, 47, 53]],
        [[350, 260], [40, 47, 53]],
        [[200, 100], [40, 47, 53]],
        [[200, 120], [40, 47, 53]],
        [[200, 135], [40, 47, 53]],
        [[200, 145], [40, 47, 53]],
        [[200, 155], [40, 47, 53]],
        [[200, 165], [40, 47, 53]],
        [[200, 200], [40, 47, 53]],
      ],
    ],
    [
      [60, 0],
      [
        [[50, 40], [152, 186, 201]],
        [[200, 40], [152, 186, 201]],
        [[350, 40], [152, 186, 201]],
        [[50, 150], [152, 186, 201]],
        [[200, 150], [152, 186, 201]],
        [[350, 150], [152, 186, 201]],
        [[50, 260], [152, 186, 201]],
        [[200, 260], [152, 186, 201]],
        [[350, 260], [152, 186, 201]],
        [[200, 100], [152, 186, 201]],
        [[200, 120], [152, 186, 201]],
        [[200, 135], [152, 186, 201]],
        [[200, 145], [152, 186, 201]],
        [[200, 155], [152, 186, 201]],
        [[200, 165], [152, 186, 201]],
        [[200, 200], [152, 186, 201]],
      ],
    ],
  ];
  for (const [[x, y], points] of ways) {
    await page.evaluate(([x, y]) => window.scene.turn(x, y, 0), [x, y]);
    near(await painted(page, points), points.map(([, colour]) => colour), `turned ${x}, ${y}`, 3);
  }
});

test("a picture given as its numbers is drawn as Qt draws it", async ({ page }) => {
  await open(page, "data3d");
  // The four pixels of each sheet.
  const points = [
    // Four colours a byte each: the first row is the bottom one.
    [[30, 80], [0, 0, 255]],
    [[70, 80], [255, 255, 0]],
    [[30, 120], [255, 0, 0]],
    [[70, 120], [0, 255, 0]],
    // The same as fractions, which a DefaultMaterial reads as a screen shows them.
    [[130, 80], [255, 128, 7]],
    [[170, 80], [50, 50, 50]],
    [[130, 120], [128, 64, 255]],
    [[170, 120], [22, 0, 204]],
    // Seen through, and saying so.
    [[230, 80], [0, 0, 255]],
    [[270, 80], over([255, 255, 0], 64)],
    [[230, 120], over([255, 0, 0], 128)],
    [[270, 120], over([0, 255, 0], 128)],
    // Seen through all the same where it does not.
    [[330, 80], [0, 0, 255]],
    [[370, 80], over([255, 255, 0], 64)],
    [[330, 120], over([255, 0, 0], 128)],
    [[370, 120], over([0, 255, 0], 128)],
    // One channel, which is red.
    [[30, 180], [64, 0, 0]],
    [[70, 180], [0, 0, 0]],
    [[30, 220], [255, 0, 0]],
    [[70, 220], [128, 0, 0]],
    // The numbers, and not the file named beside them.
    [[130, 180], [0, 128, 255]],
    [[170, 180], [0, 128, 255]],
    [[130, 220], [0, 128, 255]],
    [[170, 220], [0, 128, 255]],
    // Fractions as a PrincipledMaterial's colour, which are in linear light.
    [[230, 180], [255, 187, 63]],
    [[270, 180], [123, 123, 123]],
    [[230, 220], [187, 137, 255]],
    [[270, 220], [89, 39, 231]],
    // And as halves.
    [[330, 180], [255, 128, 7]],
    [[370, 180], [50, 50, 50]],
    [[330, 220], [128, 64, 255]],
    [[370, 220], [22, 0, 204]],
  ];
  near(await painted(page, points), points.map(([, colour]) => colour), "", 3);
});

test("a DefaultMaterial gives back a light as Qt has it", async ({ page }) => {
  await open(page, "shine3d");
  // Of each ball: its middle and three places off it. What it gives back is
  // in its own colour.
  const points = [
    // A little rough: a wide spot, dimmed by as much as it is rough.
    [[80, 150], [152, 77, 37]],
    [[90, 140], [117, 58, 26]],
    [[100, 150], [92, 44, 19]],
    [[70, 165], [133, 67, 31]],
    // Smooth: a spot too small to see.
    [[160, 150], [145, 73, 35]],
    [[170, 140], [119, 59, 27]],
    [[180, 150], [106, 52, 23]],
    [[150, 165], [120, 59, 27]],
    // Tinted green, which a light's shine is not.
    [[240, 150], [146, 74, 35]],
    [[250, 140], [135, 67, 32]],
    [[260, 150], [124, 62, 29]],
    [[230, 165], [117, 58, 26]],
    // None.
    [[320, 150], [123, 61, 28]],
    [[330, 140], [125, 62, 29]],
    [[340, 150], [127, 63, 30]],
    [[310, 165], [104, 51, 22]],
    // Behind them, the colour the scene is cleared with, which Qt takes to linear
    // light and back: 30 for 32.
    [[200, 150], [30, 30, 30]],
    [[20, 20], [30, 30, 30]],
  ];
  near(await painted(page, points), points.map(([, colour]) => colour), "", 3);
});

test("a Radiance picture lights a scene and is drawn as Qt has it", async ({ page }) => {
  await open(page, "hdr3d");
  const points = [
    // Behind: red and green above, each four times as bright as white and
    // showing little brighter, and grey and white below.
    [[50, 40], [253, 129, 129]],
    [[350, 40], [129, 253, 129]],
    [[100, 75], [253, 129, 129]],
    [[300, 75], [129, 253, 129]],
    [[50, 260], [129, 129, 129]],
    [[350, 260], [208, 208, 208]],
    [[100, 225], [129, 129, 129]],
    [[300, 225], [208, 208, 208]],
    // A rough ball, lit from all round.
    [[80, 150], [189, 216, 243]],
    [[70, 140], [207, 214, 240]],
    [[90, 160], [177, 219, 241]],
    // A mirror, and the four colours that are behind the eye.
    [[200, 150], [205, 214, 241]],
    [[188, 138], [239, 239, 96]],
    [[212, 138], [129, 129, 253]],
    [[188, 162], [239, 96, 239]],
    [[212, 162], [96, 239, 239]],
    // The picture as a colour: what is brighter than white is white.
    [[290, 140], [255, 137, 137]],
    [[310, 140], [137, 255, 137]],
    [[330, 140], [137, 137, 255]],
    [[350, 140], [255, 255, 99]],
    [[290, 160], [137, 137, 137]],
    [[310, 160], [255, 255, 255]],
    [[330, 160], [99, 255, 255]],
    [[350, 160], [255, 99, 255]],
  ];
  near(await painted(page, points), points.map(([, colour]) => colour), "", 3);
});
