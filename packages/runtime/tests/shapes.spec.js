// Paths and the shapes that draw them. The numbers are Qt 6's own for the
// same QML: what `pointAtPercent` and `boundingRect` say there, and the
// colours of a picture its software renderer made.
import { expect, open, test } from "./open.js";
import { pixels } from "./pixels.js";

const split = (text) => text.split(" ").map((point) => point.split(",").map(Number));

// Qt reads a path's points off a table of them and so cuts a corner by a
// tenth of a pixel; here they are where the path is.
function close(read, wanted, slack = 0.15) {
  expect(read.length).toBe(wanted.length);
  read.forEach((point, index) => {
    const off = Math.hypot(point[0] - wanted[index][0], point[1] - wanted[index][1]);
    expect(off, `point ${index}: ${point} for ${wanted[index]}`).toBeLessThan(slack);
  });
}

const along = (page, name, steps) =>
  page.evaluate(
    ([name, steps]) => {
      const path = window.objects[name];
      const points = [];
      for (let step = 0; step <= steps; step++) {
        const point = path.pointAtPercent(step / steps);
        points.push([point.x, point.y]);
      }
      return points;
    },
    [name, steps],
  );

const QT = {
  lines: "10,20 57.5,20 100,25 100,72.5 100,120",
  // What an element does not say is 0, unless it says how far to go.
  unsaid: "10,20 58.155,9.299 93.543,0.323 44.275,2.786 0,0",
  arc: "0,0 3.929,-19.462 14.645,-35.355 30.538,-46.071 50,-50 69.462,-46.071 85.355,-35.355 96.071,-19.462 100,0",
  lineArc: "0,0 32.146,0 64.291,0 96.437,0 127.231,8.059 146.734,32.189 147.882,64.444 130.089,89.936 100,100",
  angleArc:
    "74.994,143.307 55.637,123.085 50.293,94.556 61.212,68.446 84.193,52.550 113.289,51.785 137.117,66.498 149.345,91.888 145.550,120.650 127.421,141.817 100,150",
  // `moveToStart: false`: a line to where the arc starts.
  joined:
    "5,5 38.939,5 66.587,20.757 91.193,44.133 115.799,67.509 140.405,90.884 145.652,120.424 123.296,144.253 110,150",
  apart: "5,5 21.698,5 38.396,5 149.722,105.299 145.202,121.401 135.905,134.797 122.821,144.500 106.936,149.523 110,150",
  quad: "0,0 12.5,21.875 25,37.5 37.5,46.875 50,50 62.5,46.875 75,37.5 87.5,21.875 100,0",
  cubic: "0,0 4.297,32.812 15.625,56.250 31.641,70.312 50,75 68.359,70.312 84.375,56.250 95.703,32.812 100,0",
  curve:
    "0,0 9.024,11.385 21.961,28.244 36.459,43.481 50.163,49.998 62.591,42.096 75,25 87.409,7.904 99.837,0.002 113.541,6.519 128.039,21.756 140.976,38.615 150,50",
  // A move has no length.
  moved: "5,5 11.875,5 18.75,5 25.625,5 32.5,5 39.375,5 46.25,5 63.125,60 70,60",
  // The data starts at 0,0 whatever the path did before it, and what
  // follows starts where the data closed.
  svg: "5,5 8.018,1.982 10,1.464 10,5.732 9.965,9.915 6.982,6.982 6.464,5 10.732,5 15,5",
  polyline: "10,10 15,10 20,10 20,15 20,20 20,25 20,30 25,30 30,30",
  multiline: "10,10 13.75,10 17.5,10 31.25,30 35,30 38.75,30 42.5,30 46.25,30 50,30",
  rectangle:
    "10,10 19.167,10 28.333,10 37.5,10 40,16.667 40,25.833 35,30 25.833,30 16.667,30 10,27.5 10,18.333 10.833,10 20,10",
  rounded:
    "15,10 20.717,10 26.434,10 32.151,10 37.728,10.810 40,15.717 40,21.434 39.532,27.112 35,30 29.283,30 23.566,30 17.849,30 12.272,29.190 10,24.283 10,18.566 10.468,12.888 15,10",
};

for (const [name, points] of Object.entries(QT)) {
  test(`the points along a path are where Qt has them: ${name}`, async ({ page }) => {
    await open(page, "pathpoints");
    const wanted = split(points);
    close(await along(page, name, wanted.length - 1), wanted);
  });
}

test("a path is an outline", async ({ page }) => {
  await open(page, "pathpoints");
  const read = await page.evaluate(() => {
    const o = window.objects;
    const d = (name) => o[name].$outline().toString();
    return {
      d: [d("lines"), d("arc"), d("apart"), d("quad"), d("moved"), d("svg"), d("multiline"), d("rectangle"), d("round")],
      rounded: d("rounded"),
      closed: [o.lines.closed, o.round.closed, o.rounded.closed, o.svg.closed],
      length: [o.lines.$outline().length, o.moved.$outline().length],
      // Which way a thing on the path faces: clockwise from pointing right.
      angle: [0.25, 0.75].map((at) => o.lines.$outline().angleAt(at)),
      turning: [0, 0.5, 1].map((at) => Math.round(o.arc.$outline().angleAt(at)) % 360),
      last: [o.last.x, o.last.y, o.last.relativeX],
    };
  });
  expect(read.d).toEqual([
    "M10 20L100 20L100 120",
    // An arc is the cubics Qt makes of it.
    "M0 0C0 -27.614 22.386 -50 50 -50C77.614 -50 100 -27.614 100 0",
    "M5 5L50 5M150 100C150 127.614 127.614 150 100 150L110 150",
    "M0 0C33.333 66.667 66.667 66.667 100 0",
    "M5 5L50 5M60 60L70 60",
    "M5 5L10 0L10 10L5 5ZM5 5L15 5",
    "M10 10L20 10M30 30L40 30L50 30",
    "M10 10L40 10L40 30L10 30L10 10ZM10 10L20 10",
    // What ends where it started is closed, and its line joined there.
    "M10 10L50 10L10 50L10 10Z",
  ]);
  expect(read.rounded).toBe(
    "M15 10L35 10C37.761 10 40 12.239 40 15L40 25C40 27.761 37.761 30 35 30L15 30C12.239 30 10 27.761 10 25L10 15C10 12.239 12.239 10 15 10Z",
  );
  // A rounded rectangle starts after its corner, not where the path does.
  expect(read.closed).toEqual([false, true, false, false]);
  expect(read.length).toEqual([190, 55]);
  expect(read.angle).toEqual([0, 90]);
  expect(read.turning).toEqual([270, 0, 90]);
  expect(read.last).toEqual([0, 0, undefined]);
});

test("a path follows its elements and its scale", async ({ page }) => {
  await open(page, "pathpoints");
  const read = await page.evaluate(() => {
    const { scaled, far, log, Qt } = window.objects;
    const end = () => {
      const point = scaled.pointAtPercent(1);
      return [point.x, point.y];
    };
    const out = [end(), [...log]];
    far.x = 60;
    out.push(end(), [...log]);
    scaled.scale = Qt.size(1, 1);
    out.push(end(), scaled.$outline().toString(), [...log]);
    return out;
  });
  // Qt: `scale: Qt.size(2, 0.5)` of 10,20 to 110,70 ends at 220,35.
  expect(read).toEqual([[220, 35], [], [120, 35], ["changed"], [60, 70], "M10 20L60 70", ["changed", "changed"]]);
});

test("the elements of a path are a list a program changes", async ({ page }) => {
  await open(page, "pathpoints");
  const read = await page.evaluate(() => {
    const { lines, far, last, PathLine } = window.objects;
    const d = () => lines.$outline().toString();
    const out = [lines.pathElements.length, lines.pathElements[0].x];
    lines.pathElements.push(far);
    out.push(lines.pathElements.length, d());
    lines.pathElements = [far, last];
    out.push(lines.pathElements.length, d(), lines.closed);
    lines.pathElements.push(PathLine({ x: 10, y: 20 }));
    out.push(d(), lines.closed);
    return out;
  });
  expect(read).toEqual([
    2,
    100,
    3,
    "M10 20L100 20L100 120L110 70",
    2,
    "M10 20L110 70L0 0",
    false,
    "M10 20L110 70L0 0L10 20Z",
    true,
  ]);
});

const geometry = (page, names) =>
  page.evaluate(
    (names) =>
      names.map((name) => {
        const shape = window.objects[name];
        const box = shape.boundingRect;
        return [box.x, box.y, box.width, box.height, shape.implicitWidth, shape.implicitHeight, shape.width, shape.height];
      }),
    names,
  );

function roughly(read, wanted, digits = 3) {
  expect(read.length).toBe(wanted.length);
  read.forEach((row, index) => {
    expect(row.length).toBe(wanted[index].length);
    row.forEach((value, at) => expect(value, `${index}.${at}`).toBeCloseTo(wanted[index][at], digits));
  });
}

test("a shape is as big as what it draws", async ({ page }) => {
  await open(page, "shapes");
  const read = await geometry(page, ["line", "triangle", "dial", "dashed", "holes", "fitted", "shaded", "empty"]);
  // Qt's `boundingRect`, implicit size and size. The line widens it: by
  // half its width, or by 0.707 of it under a square cap.
  roughly(read, [
    [9.29289, 19.2929, 101.414, 51.4142, 110.7071, 70.7071, 110.7071, 70.7071],
    [5, 15, 110, 60, 115, 75, 115, 75],
    [4.34315, 4.34315, 90.4438, 86.6374, 94.7869, 90.9806, 94.7869, 90.9806],
    [-2, 8, 104, 4, 102, 12, 102, 12],
    [10, 10, 80, 80, 90, 90, 90, 90],
    [10, 10, 50, 50, 60, 60, 200, 100],
    [0, 0, 170, 50, 170, 50, 170, 50],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ]);
});

const attributes = (page, name, names) =>
  page.evaluate(
    ([name, names]) => {
      const path = window.objects[name].$shape.querySelector(":scope > path");
      return names.map((attribute) => path.getAttribute(attribute));
    },
    [name, names],
  );

test("a shape path is an SVG path with Qt's defaults", async ({ page }) => {
  await open(page, "shapes");
  const read = await page.evaluate(() => {
    const { line, linePath, trianglePath, shaded, linear, Shape, ShapePath } = window.objects;
    return {
      html: line.$node.innerHTML,
      path: [
        String(linePath.strokeColor),
        linePath.strokeWidth,
        String(linePath.fillColor),
        linePath.fillRule,
        linePath.joinStyle,
        linePath.miterLimit,
        linePath.capStyle,
        linePath.strokeStyle,
        linePath.dashOffset,
        [...linePath.dashPattern],
        linePath.fillGradient,
        [linePath.scale.width, linePath.scale.height],
        linePath.closed,
        trianglePath.closed,
      ],
      shape: [
        line.rendererType,
        line.status,
        line.containsMode,
        line.fillMode,
        line.horizontalAlignment,
        line.verticalAlignment,
        line.preferredRendererType,
      ],
      enums: [Shape.CurveRenderer, Shape.PreserveAspectFit, Shape.AlignVCenter, ShapePath.RoundJoin, ShapePath.DashLine],
      // Everything declared in a shape is its data; its children are items.
      data: [shaded.data.length, shaded.children.length, shaded.data[0] === linear],
    };
  });
  expect(read.html).toBe(
    '<svg class="qq-shape"><g><g><path d="M10 20L110 70" fill-rule="evenodd" stroke="white" stroke-width="1" ' +
      'stroke-linecap="square" stroke-linejoin="bevel" stroke-miterlimit="4.123105625617661" fill="white"></path></g></g></svg>',
  );
  expect(read.path).toEqual(["#ffffff", 1, "#ffffff", 0, 64, 2, 16, 1, 0, [4, 2], null, [1, 1], false, true]);
  // Qt says which of its renderers it took; here it is the browser's.
  expect(read.shape).toEqual([1, 1, 0, 0, 1, 32, 0]);
  expect(read.enums).toEqual([4, 1, 128, 128, 2]);
  expect(read.data).toEqual([4, 1, true]);
  expect(await attributes(page, "trianglePath", ["d", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "fill"])).toEqual(
    ["M10 20L110 20L60 70L10 20Z", "blue", "10", "round", "miter", "#ff000080"],
  );
  // The picture's place is the item's corner, and it takes no room there.
  const svg = await page.evaluate(() => {
    const box = window.objects.triangle.$node.querySelector("svg").getBoundingClientRect();
    return [box.x, box.y];
  });
  expect(svg).toEqual([150, 0]);
});

const colours = async (page, points) => (await pixels(page, points)).map((colour) => colour.split(" ").map(Number));

function shade(read, wanted, slack = 8) {
  read.forEach((colour, index) => {
    colour.forEach((value, channel) =>
      expect(Math.abs(value - wanted[index][channel]), `colour ${index}: ${colour} for ${wanted[index]}`).toBeLessThanOrEqual(
        slack,
      ),
    );
  });
}

const WHITE = [255, 255, 255];
const GREEN = [0, 128, 0];
const ORANGE = [255, 165, 0];

test("a shape is painted as Qt paints it", async ({ page }) => {
  await open(page, "shapes");
  const read = await colours(page, [
    // The triangle: its fill, its line, a mitred corner, its tip, outside.
    [210, 40],
    [210, 20],
    [153, 17],
    [210, 73],
    [150, 30],
    // The dial: on the arc, where the arc has not got to, under its cap.
    [10, 150],
    [50, 110],
    [90, 150],
    [50, 150],
    [92, 143],
    // The dashes: 4 long, 12 apart, starting 8 into the pattern.
    [130, 110],
    [138, 110],
    [146, 110],
    [122, 110],
    [130, 106],
  ]);
  const mint = [44, 222, 133];
  shade(read, [
    [255, 127, 127],
    [0, 0, 255],
    [0, 0, 255],
    [0, 0, 255],
    WHITE,
    mint,
    mint,
    WHITE,
    WHITE,
    mint,
    [0, 0, 0],
    WHITE,
    [0, 0, 0],
    WHITE,
    WHITE,
  ]);
});

test("a bound element redraws the path", async ({ page }) => {
  await open(page, "shapes");
  expect(await attributes(page, "dialPath", ["d", "stroke", "fill"])).toEqual([
    "M31.215 85.324C18.591 78.595 10 65.301 10 50C10 27.909 27.909 10 50 10C69.237 10 85.302 23.579 89.13 41.664",
    "#2CDE85",
    "transparent",
  ]);
  const read = await page.evaluate(() => {
    const { dial, dialPath, setSweep } = window.objects;
    setSweep(0);
    window.flush();
    const box = dial.boundingRect;
    const end = dialPath.pointAtPercent(1);
    return [[box.x, box.y, box.width, box.height, end.x, end.y, dial.width, dial.height]];
  });
  // Qt, for a sweep of 140 degrees.
  roughly(read, [[4.34315, 5.21309, 42.9773, 85.7675, 41.6636, 10.8699, 47.3205, 90.9806]]);
  expect(await attributes(page, "dialPath", ["d"])).toEqual([
    "M31.215 85.324C18.591 78.595 10 65.301 10 50C10 30.763 23.579 14.698 41.664 10.87",
  ]);
});

test("a line has a width, ends, corners and dashes", async ({ page }) => {
  await open(page, "shapes");
  const names = ["stroke", "stroke-width", "stroke-linecap", "stroke-dasharray", "stroke-dashoffset"];
  // A dash is as many widths long as the pattern says.
  expect(await attributes(page, "dashedPath", names)).toEqual(["black", "4", "butt", "4 12", "8"]);
  const read = [];
  const change = async (values) => {
    await page.evaluate((values) => {
      Object.assign(window.objects.dashedPath, values);
      window.flush();
    }, values);
    read.push(await attributes(page, "dashedPath", names));
  };
  await change({ strokeWidth: 2, dashOffset: 0 });
  await change({ strokeStyle: 1, capStyle: 32 });
  // No line of no width, and none that cannot be seen.
  await change({ strokeWidth: 0 });
  await change({ strokeWidth: 3, strokeColor: "transparent" });
  await change({ strokeColor: "#80ff0000" });
  expect(read.map((row) => row.slice(0, 4))).toEqual([
    ["black", "2", "butt", "2 6"],
    ["black", "2", "round", null],
    ["none", null, null, null],
    ["none", null, null, null],
    ["#ff000080", "3", "round", null],
  ]);
  expect(read[0][4]).toBe(null);
  // Qt lets a mitre stick out `miterLimit` widths, SVG measures all of it.
  const limit = await page.evaluate(() => {
    window.objects.trianglePath.miterLimit = 1;
    window.flush();
    return Number(window.objects.trianglePath.$shape.querySelector("path").getAttribute("stroke-miterlimit"));
  });
  expect(limit).toBeCloseTo(Math.sqrt(5), 6);
});

test("a path is filled by its rule", async ({ page }) => {
  await open(page, "shapes");
  const points = [
    [300, 140],
    [265, 105],
    [255, 95],
  ];
  expect(await attributes(page, "holesPath", ["fill-rule", "fill", "stroke"])).toEqual(["nonzero", "orange", "none"]);
  // Two squares drawn the same way round: the inner one is filled too.
  shade(await colours(page, points), [ORANGE, ORANGE, WHITE]);
  await page.evaluate(() => {
    const { holes, holesPath } = window.objects;
    holesPath.fillRule = 0;
    // As a program does that knows the paths of a shape as its data.
    holes.data[0].fillColor = "green";
    window.flush();
  });
  expect(await attributes(page, "holesPath", ["fill-rule", "fill"])).toEqual(["evenodd", "green"]);
  shade(await colours(page, points), [WHITE, GREEN, WHITE]);
});

const layer = (page, name) =>
  page.evaluate((name) => window.objects[name].$node.querySelector("svg > g").getAttribute("transform"), name);

test("a shape is fitted to its size and placed in it", async ({ page }) => {
  await open(page, "shapes");
  // 60 by 60 in 200 by 100: 100 by 100, in the middle.
  expect(await layer(page, "fitted")).toBe("translate(50 0) scale(1.6666666666666667 1.6666666666666667)");
  // Qt draws the triangle from 67,217 to 150,300.
  shade(
    await colours(page, [
      [140, 230],
      [148, 219],
      [70, 218],
      [148, 296],
      [80, 290],
      [64, 218],
      [152, 230],
    ]),
    [GREEN, GREEN, GREEN, GREEN, WHITE, WHITE, WHITE],
  );
  const read = [];
  const change = async (values) => {
    await page.evaluate((values) => {
      Object.assign(window.objects.fitted, values);
      window.flush();
    }, values);
    read.push(await layer(page, "fitted"));
  };
  await change({ fillMode: 3 });
  await change({ fillMode: 2 });
  await change({ fillMode: 2, verticalAlignment: 64, horizontalAlignment: 2 });
  await change({ fillMode: 0 });
  await change({ horizontalAlignment: 1, verticalAlignment: 32 });
  expect(read).toEqual([
    "translate(0 0) scale(3.3333333333333335 1.6666666666666667)",
    "translate(0 -50) scale(3.3333333333333335 3.3333333333333335)",
    "translate(0 -100) scale(3.3333333333333335 3.3333333333333335)",
    // Not resized, it is still put where its alignment says.
    "translate(140 40) scale(1 1)",
    null,
  ]);
  // Fitting it does not change how big it says it is.
  roughly(await geometry(page, ["fitted"]), [[10, 10, 50, 50, 60, 60, 200, 100]]);
});

test("a path is filled with a gradient", async ({ page }) => {
  await open(page, "shapes");
  const read = await page.evaluate(() => {
    const { linear, radial, conical } = window.objects;
    const html = (path) => path.$shape.querySelector("defs").innerHTML;
    return [
      html(linear),
      linear.$shape.querySelector(":scope > path").getAttribute("fill"),
      html(radial),
      conical.$shape.querySelector("foreignObject > div").style.background,
      conical.$shape.querySelector("foreignObject").outerHTML.replace(/<div.*<\/div>/, ""),
      conical.$shape.querySelector("clipPath > path").getAttribute("d") ===
        conical.$shape.querySelector(":scope > path").getAttribute("d"),
      conical.$shape.querySelector(":scope > path").getAttribute("fill"),
    ];
  });
  const id = /id="(qq-gradient-\d+)"/.exec(read[0])[1];
  expect(read[0]).toBe(
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" spreadMethod="pad" x1="0" y1="0" x2="50" y2="0">` +
      '<stop offset="0" stop-color="red"></stop><stop offset="1" stop-color="blue"></stop></linearGradient>',
  );
  expect(read[1]).toBe(`url(#${id})`);
  expect(read[2]).toMatch(
    /^<radialGradient id="qq-gradient-\d+" gradientUnits="userSpaceOnUse" spreadMethod="repeat" cx="85" cy="25" r="25" fx="85" fy="25" fr="0">/,
  );
  // SVG has no conical gradient: a box with CSS's, seen through the path.
  // Qt's turns the other way, from three o'clock.
  expect(read[3]).toBe("conic-gradient(from 90deg at 25px 25px, black 0%, blue 50%, lime 75%, red 100%)");
  expect(read[4]).toMatch(/^<foreignObject clip-path="url\(#qq-clip-\d+\)" x="120" y="0" width="50" height="50">/);
  expect(read.slice(5)).toEqual([true, "none"]);

  // The colours Qt paints at the same points.
  shade(
    await colours(page, [
      [222, 225],
      [245, 225],
      [268, 225],
      [305, 225],
      [317, 225],
      [328, 225],
      [283, 203],
      [385, 222],
      [385, 228],
      [365, 205],
      [345, 225],
      [379, 211],
      [365, 245],
      // The rounded corner of the path the conical gradient is seen through.
      [341, 201],
      // An item in a shape is drawn too.
      [394, 205],
    ]),
    [
      [242, 0, 13],
      [125, 0, 130],
      [8, 0, 247],
      [248, 248, 248],
      [127, 127, 127],
      [15, 15, 15],
      [200, 200, 200],
      [235, 20, 0],
      [0, 0, 14],
      [4, 251, 0],
      [0, 0, 253],
      [133, 122, 0],
      [0, 0, 126],
      WHITE,
      [0, 0, 0],
    ],
    10,
  );
});

test("a gradient follows its stops and what it is told", async ({ page }) => {
  await open(page, "shapes");
  const read = await page.evaluate(() => {
    const { linear, linearFill, far, radialFill, conical, conicalFill, radial, LinearGradient } = window.objects;
    far.color = "#80ffff00";
    far.position = 0.5;
    linearFill.x2 = 25;
    linearFill.spread = LinearGradient.ReflectSpread;
    radialFill.centerRadius = 10;
    radialFill.focalRadius = 2;
    conicalFill.angle = 30;
    conicalFill.centerX = 130;
    window.flush();
    const out = [
      linear.$shape.querySelector("linearGradient").outerHTML.replace(/ id="[^"]*"/, ""),
      radial.$shape.querySelector("radialGradient").getAttribute("r"),
      radial.$shape.querySelector("radialGradient").getAttribute("fr"),
      conical.$shape.querySelector("foreignObject > div").style.background,
    ];
    // One colour again, and a gradient again.
    conical.fillGradient = null;
    linear.fillGradient = null;
    linear.fillColor = "red";
    window.flush();
    out.push(
      conical.$shape.querySelector("foreignObject"),
      conical.$shape.querySelector(":scope > path").getAttribute("fill"),
      linear.$shape.querySelector("linearGradient"),
      linear.$shape.querySelector(":scope > path").getAttribute("fill"),
    );
    linear.fillGradient = linearFill;
    window.flush();
    out.push(linear.$shape.querySelector(":scope > path").getAttribute("fill") === `url(#${linearFill.$element.id})`);
    return out;
  });
  expect(read).toEqual([
    '<linearGradient gradientUnits="userSpaceOnUse" spreadMethod="reflect" x1="0" y1="0" x2="25" y2="0">' +
      '<stop offset="0" stop-color="red"></stop><stop offset="0.5" stop-color="#ffff0080"></stop></linearGradient>',
    "10",
    "2",
    "conic-gradient(from 60deg at 10px 25px, black 0%, blue 50%, lime 75%, red 100%)",
    null,
    "white",
    null,
    "red",
    true,
  ]);
});
