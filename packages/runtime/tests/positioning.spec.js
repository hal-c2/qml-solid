import { expect, open, test } from "./open.js";

const call = (page, name) => page.evaluate((name) => window.scene[name](), name);
const seen = (page) => page.evaluate(() => window.scene.seen);
const position = (page, text) =>
  page.waitForFunction((text) => String(window.scene.source.position.coordinate) === text, text);

// What a property hears of the place it is first given, as in Qt.
const KEPT = "kept 1° 0' 0.0\" N, 2° 0' 0.0\" E";

// What Qt 6.11 answers to `places()` of the scene.
const PLACES = [
  "52° 22' 12.0\" N, 4° 54' 0.0\" E",
  "52° 22' 12.0\" S, 4° 54' 0.0\" W, 12.5m",
  '{"latitude":52.37,"longitude":4.9,"altitude":null,"isValid":true}',
  "latitude,longitude,altitude,isValid",
  true,
  false,
  "",
  false,
  "NaN",
  "NaN",
  "NaN",
  false,
  false,
  true,
  "1° 0' 0.0\" N, 2° 0' 0.0\" E",
  430718.0896677367,
  205.68216508233758,
  23.710350973607206,
  0,
  0,
  53.001258198419876,
  5.956710342833897,
  "NaN",
  21.446846729571288,
  -39.11246130724255,
  3,
  66.49408649401268,
  -90.09007527272547,
  false,
  "-52.37120°, 4.90560°, 3m",
  "52.37120° S, 4.90560° E, 3m",
  "-52° 22.272', 4° 54.336', 3m",
  "52° 22.272' S, 4° 54.336' E, 3m",
  "-52° 22' 16.3\", 4° 54' 20.2\", 3m",
  "52° 22' 16.3\" S, 4° 54' 20.2\" E, 3m",
  "0° 0' 0.0\", 0° 0' 0.0\"",
  "0° 30' 0.0\" S, 0° 30' 0.0\" W",
  "60° 0' 0.0\" N, 180° 0' 0.0\" E",
  "59° 59.999' N, 180° 0.000' E",
  "1° 0' 0.0\" N, 2° 0' 0.0\" E, -3.25m",
  "1° 0' 0.0\" N, 2° 0' 0.0\" E, 1.23457e+06m",
  0.5136111111111111,
  0.32863875664366315,
  "NaN",
  -4,
  5,
  "66° 30' 47.7\" N, 90° 0' 0.0\" W, 0m",
  -89.7860070747368,
  90,
  90,
  90,
  -90,
];

test("a coordinate says what Qt's says", async ({ page }) => {
  await open(page, "positioning");
  const places = await call(page, "places");
  expect(places.length).toBe(PLACES.length);
  places.forEach((value, index) => {
    if (typeof value === "number") expect(value, `places()[${index}]`).toBeCloseTo(PLACES[index], 9);
    else expect(value, `places()[${index}]`).toBe(PLACES[index]);
  });
  // A property given the place it has has not changed.
  expect(await call(page, "keep")).toEqual(["kept 1° 0' 0.0\" N, 2° 0' 0.0\" E, 3m"]);
});

test("a PositionSource knows of no place until it is active", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 52.37, longitude: 4.9, accuracy: 25 });
  await open(page, "positioning");
  expect(await call(page, "names")).toEqual([0, 255, -256, -1, 0, 1, 2, 3, 4]);
  // Qt's answers, but for the error of a Qt whose source is refused.
  const idle = [false, true, 3000, -1, 3, "", false, false, false, false, false, false, false, false, false, false, true];
  expect(await call(page, "read")).toEqual(idle);
  expect(await call(page, "numbers")).toEqual(["NaN", "NaN", "NaN", "NaN", "NaN", "NaN", "NaN"]);

  await page.evaluate(() => (window.scene.source.active = true));
  await position(page, "52° 22' 12.0\" N, 4° 54' 0.0\" E");
  // The place is in the position by the time its change is told of, and in
  // what is bound to it.
  expect(await seen(page)).toEqual([KEPT, "active true", "position 52° 22' 12.0\" N, 4° 54' 0.0\" E 52.37"]);
  expect(await call(page, "read")).toEqual([
    ...[true, true, 3000, -1, 3, "52° 22' 12.0\" N, 4° 54' 0.0\" E", true, true, false],
    ...[true, false, false, false, false, false, false, false],
  ]);
  expect((await call(page, "numbers"))[0]).toBe("25");

  // It watches: where the device goes, the position follows.
  await context.setGeolocation({ latitude: 48.85, longitude: 2.35 });
  await position(page, "48° 51' 0.0\" N, 2° 21' 0.0\" E");
  await page.evaluate(() => window.scene.source.stop());
  expect((await call(page, "read"))[0]).toBe(false);
  expect((await seen(page)).at(-1)).toBe("active false");
  const told = (await seen(page)).length;
  await context.setGeolocation({ latitude: 1, longitude: 2 });

  // One answer: active until it is there. Nothing was watching: the place
  // is told of once.
  const during = () => {
    window.scene.source.update();
    return window.scene.source.active;
  };
  expect(await page.evaluate(during)).toBe(true);
  await position(page, "1° 0' 0.0\" N, 2° 0' 0.0\" E");
  await page.waitForFunction(() => window.scene.source.active === false);
  expect((await seen(page)).slice(told)).toEqual(["active true", "position 1° 0' 0.0\" N, 2° 0' 0.0\" E 1", "active false"]);

  // `start()` is `active`, and so is `stop()`.
  await page.evaluate(() => window.scene.source.start());
  expect(await page.evaluate(() => window.scene.source.active)).toBe(true);
  await page.evaluate(() => window.scene.source.stop());
  expect(await page.evaluate(() => window.scene.source.active)).toBe(false);
});

test("a PositionSource says that the browser refused", async ({ page }) => {
  await open(page, "positioning");
  // Nobody is there to answer a browser under test: it says no.
  await page.evaluate(() => window.scene.source.start());
  await page.waitForFunction(() => window.scene.source.sourceError === 0);
  // Refused is not stopped, as in Qt.
  expect(await seen(page)).toEqual([KEPT, "active true", "error 0"]);
  const after = () => {
    window.scene.source.update(500);
    return window.scene.source.active;
  };
  expect(await page.evaluate(after)).toBe(true);
});
