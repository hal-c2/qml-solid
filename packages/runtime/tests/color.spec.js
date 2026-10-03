// What is expected here is what Qt 6.11 answers for the same QML (`qml6`).
import { expect, open, test } from "./open.js";

const channels = (page, name) =>
  page.evaluate((name) => {
    const c = window.objects[name].color;
    return [String(c), c.r, c.g, c.b, c.a, c.hsvHue, c.hsvSaturation, c.hsvValue, c.hslHue, c.hslSaturation, c.hslLightness, c.valid];
  }, name);

const painted = (page, name) =>
  page.evaluate((name) => getComputedStyle(window.objects[name].$node).backgroundColor, name);

test("a colour reads back as a value with Qt's channels", async ({ page }) => {
  await open(page, "color");
  expect(await channels(page, "named")).toEqual([
    "#4682b4", 0.27450981736183167, 0.5098039507865906, 0.7058823704719543, 1,
    0.5757499933242798, 0.6111085414886475, 0.7058823704719543,
    0.5757499933242798, 0.43999388813972473, 0.4901960790157318, true,
  ]);
  expect(await channels(page, "made")).toEqual(["#80ff0000", 1, 0, 0, 0.5000076293945312, 0, 1, 1, 0, 1, 0.5000076293945312, true]);
  expect(await channels(page, "lit")).toEqual([
    "#72bfff", 0.4477149546146393, 0.7489891052246094, 1, 1,
    0.5757499933242798, 0.5522850155830383, 1,
    0.5757499933242798, 1, 0.7238574624061584, true,
  ]);
  // Twelve hexadecimal digits: sixteen bits a channel.
  expect(await channels(page, "long")).toEqual([
    "#112233", 0.06666667014360428, 0.13333334028720856, 0.20000000298023224, 1,
    0.5833333134651184, 0.6666666865348816, 0.20000000298023224,
    0.5833333134651184, 0.5000076293945312, 0.13333334028720856, true,
  ]);
  expect(await channels(page, "clear")).toEqual(["#00000000", 0, 0, 0, 0, -1, 0, 0, -1, 0, 0, true]);
  expect(await channels(page, "hsl")).toEqual([
    "#335c99", 0.20000000298023224, 0.36000609397888184, 0.6000000238418579, 1,
    0.6000000238418579, 0.6666666865348816, 0.6000000238418579,
    0.6000000238418579, 0.5000076293945312, 0.4000000059604645, true,
  ]);
});

test("lighter, darker, alpha and tint give Qt's colours", async ({ page }) => {
  await open(page, "color");
  const made = await page.evaluate(() => {
    const { Qt, named } = window.objects;
    return [
      Qt.darker(named.color),
      Qt.darker("steelblue", 1.2),
      Qt.lighter("#102030", 3),
      Qt.alpha("steelblue", 0.25),
      Qt.tint("steelblue", "#80ff0000"),
      Qt.hsva(0.25, 1, 0.5, 0.5),
      named.color.lighter(1.1),
      Qt.hsla(0.6, 0.5, 0.4, 1),
      Qt.color("Light Blue"),
      Qt.color("#abc"),
      Qt.lighter(Qt.hsla(0.6, 0.5, 0.4, 1)),
    ].map(String);
  });
  expect(made).toEqual([
    "#23415a", "#3a6c96", "#306090", "#404682b4", "#a3415a", "#80408000",
    "#4d8fc6", "#335c99", "#add8e6", "#aabbcc", "#4d8ae5",
  ]);
});

test("a colour equals its hexadecimal name, and colorEqual knows the others", async ({ page }) => {
  await open(page, "color");
  const equal = await page.evaluate(() => {
    const { Qt, named, made } = window.objects;
    return [
      named.color == "#4682b4",
      named.color == "steelblue",
      made.color == "#80ff0000",
      Qt.colorEqual(named.color, "steelblue"),
      Qt.colorEqual("#ff0000", "red"),
      Qt.colorEqual(Qt.hsla(0, 1, 0.5, 1), "red"),
      Qt.colorEqual("transparent", "#00000000"),
    ];
  });
  expect(equal).toEqual([true, false, true, true, true, false, true]);
});

test("what is no colour is refused as Qt refuses it", async ({ page }) => {
  await open(page, "color");
  const answers = await page.evaluate(() => {
    const { Qt } = window.objects;
    const message = (work) => {
      try {
        return work();
      } catch (error) {
        return error.message;
      }
    };
    return [
      message(() => Qt.color("nonsense")),
      Qt.lighter("nonsense"),
      Qt.alpha("nonsense", 0.5),
      Qt.tint("nonsense", "red"),
      message(() => Qt.colorEqual("nonsense", "red")),
    ];
  });
  expect(answers).toEqual(['"nonsense" is not a valid color name', null, null, null, "Qt.colorEqual(): Invalid color name"]);
});

test("a rectangle is painted with the colour, and what is bound to it follows", async ({ page }) => {
  await open(page, "color");
  expect(await painted(page, "named")).toBe("rgb(70, 130, 180)");
  expect(await painted(page, "made")).toBe("rgba(255, 0, 0, 0.5)");
  expect(await painted(page, "lit")).toBe("rgb(114, 191, 255)");
  expect(await painted(page, "long")).toBe("rgb(17, 34, 51)");
  expect(await painted(page, "clear")).toBe("rgba(0, 0, 0, 0)");
  expect(await painted(page, "hsl")).toBe("rgb(51, 92, 153)");
  expect(await page.evaluate(() => String(window.objects.clear.border.color))).toBe("#80ff0000");

  const read = await page.evaluate(() => {
    const { Qt, named, lit } = window.objects;
    named.color = "red";
    const first = [String(lit.color), String(named.color), named.color.r, lit.color.g];
    named.color = Qt.rgba(0, 0.5, 0, 1);
    return [...first, String(lit.color), String(named.color), named.color == "#008000", named.color.g];
  });
  expect(read).toEqual(["#ff7f7f", "#ff0000", 1, 0.49999237060546875, "#00bf00", "#008000", true, 0.5000076293945312]);
  expect(await painted(page, "named")).toBe("rgb(0, 128, 0)");
  expect(await painted(page, "lit")).toBe("rgb(0, 191, 0)");
});

test("an animation's colours are Qt's, channel by channel", async ({ page }) => {
  await open(page, "color");
  const steps = await page.evaluate(() =>
    [0.1, 0.25, 0.37, 0.5, 0.75, 0.99].map((t) => String(window.objects.mix("#102030", "#80f0e0d1", t))),
  );
  expect(steps).toEqual(["#f2263340", "#df485058", "#d062676b", "#bf808080", "#9fb8b0a8", "#81eddecf"]);
});
