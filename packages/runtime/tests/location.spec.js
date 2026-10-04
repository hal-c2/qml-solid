// What is expected here is what Qt 6.11 answers for the same QML: the scene
// is run by `qml6` too and asked the same, and `fixtures/location.json` is
// what it said. What a browser draws of it (the tiles, the notice) is held
// against what the map itself says of where places are.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, open, test } from "./open.js";

const expected = JSON.parse(readFileSync(join(import.meta.dirname, "fixtures/location.json"), "utf8"));

// One pixel, which every tile is: nothing is asked of the network.
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

// Opens the scene. What it asks of anyone but the tests' own server is
// answered here, and told: the addresses, in the order they were asked.
async function scene(page, baseURL) {
  const asked = [];
  const host = new URL(baseURL).host;
  await page.route(
    (url) => url.host !== host,
    (route) => {
      asked.push(route.request().url());
      return route.fulfill({ contentType: "image/png", body: PIXEL });
    },
  );
  await open(page, "location");
  return asked;
}

const read = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.scene.read())));
const step = (page, index) =>
  page.evaluate((index) => {
    window.scene.step(index);
    window.flush();
  }, index);

// Qt's numbers are of its own arithmetic, and some of single precision.
function same(answers, row, name) {
  expect(answers.length, name).toBe(row.length);
  for (const [index, value] of row.entries()) {
    const answer = answers[index];
    const where = `${name}, value ${index}`;
    if (typeof value !== "number") expect(answer, where).toBe(value);
    else expect(Math.abs(answer - value), `${where}: ${answer} for ${value}`).toBeLessThan(1e-4 + Math.abs(value) * 1e-7);
  }
}

// The tiles in view: which each is, and where its middle and its size are
// on the map, beside where the map says the middle of that tile is.
const tiles = (page) =>
  page.evaluate(() => {
    const map = window.objects.map;
    const frame = map.$node.getBoundingClientRect();
    return [...map.$node.querySelectorAll(".qq-tiles > img[src]")].map((image) => {
      const [z, x, y] = new URL(image.src).pathname.match(/\d+/g).slice(-3).map(Number);
      const box = image.getBoundingClientRect();
      const count = 2 ** z;
      // The Earth is there again to the east and to the west: the map
      // says where the nearest is, and a tile may be of the next.
      const middle = window.scene.corner(x + 0.5, y + 0.5, count);
      const side = 256 * 2 ** (map.zoomLevel - z);
      const turns = Math.round((box.x + box.width / 2 - frame.x - middle[0]) / (side * count));
      return {
        name: `${z}/${x}/${y}`,
        x: box.x + box.width / 2 - frame.x - turns * side * count,
        y: box.y + box.height / 2 - frame.y,
        width: box.width,
        side,
        middle,
      };
    });
  });

// Every tile asked for is there: a picture is shown once it is.
const loaded = (page) =>
  page.waitForFunction(() =>
    [...document.querySelectorAll("#scene .qq-tiles > img[src]")].every(
      (image) => getComputedStyle(image).visibility === "visible",
    ),
  );

async function placed(page, name) {
  const shown = await tiles(page);
  expect(shown.length, name).toBeGreaterThan(0);
  for (const tile of shown) {
    expect(tile.x, `${name}: ${tile.name} across`).toBeCloseTo(tile.middle[0], 3);
    expect(tile.y, `${name}: ${tile.name} down`).toBeCloseTo(tile.middle[1], 3);
  }
  return shown;
}

test("A map and its items are where Qt has them, however it is moved", async ({ page, baseURL }) => {
  await scene(page, baseURL);
  same(await read(page), expected.read[0], "at first");
  for (let index = 0; index < expected.read.length - 1; index++) {
    await step(page, index);
    const row = [...expected.read[index + 1]];
    // Qt counts an item of a row that is gone until it is deleted.
    if (index === 9) row[8] = 3;
    same(await read(page), row, `after step ${index}`);
  }
  expect(await page.evaluate(() => window.scene.seen)).toEqual(expected.seen.slice(1));
});

test("Providers and the maps of them answer as Qt's", async ({ page, baseURL }) => {
  await scene(page, baseURL);
  const answers = await page.evaluate(() => JSON.parse(JSON.stringify(window.scene.others())));
  same(answers, expected.others, "others");
});

test("The tiles in view are asked for, and each is where the map says it is", async ({ page, baseURL }) => {
  const asked = await scene(page, baseURL);
  await loaded(page);
  // Zoom level 5, around Amsterdam: three across and three down.
  const first = [];
  for (let y = 9; y <= 11; y++) for (let x = 15; x <= 17; x++) first.push(`5/${x}/${y}`);
  const street = asked.filter((url) => url.startsWith("https://tile.openstreetmap.org/5/"));
  expect(street.map((url) => url.slice(31, -4)).sort()).toEqual(first.sort());
  let shown = await placed(page, "at first");
  expect(shown.map((tile) => tile.name).sort()).toEqual(first);
  for (const tile of shown) expect(tile.width).toBeCloseTo(256, 3);

  // Moved by less than a tile, nothing is asked for.
  const before = asked.length;
  await step(page, 0);
  await placed(page, "panned");
  expect(asked.length).toBe(before);

  // Closer by a level and a half: the tiles of the next level, enlarged.
  await step(page, 1);
  shown = await placed(page, "closer");
  for (const tile of shown) {
    expect(tile.name.startsWith("6/")).toBe(true);
    expect(tile.width).toBeCloseTo(256 * Math.SQRT2, 3);
  }

  // Turned, the layer is turned as a whole.
  await step(page, 2);
  await placed(page, "turned");
  await step(page, 3);
  await placed(page, "turned and moved");

  // The whole Earth, as wide as the map and no smaller: it is there again
  // beside itself, the one tile twice.
  await page.evaluate(() => {
    const map = window.objects.map;
    map.bearing = 0;
    map.zoomLevel = 0.1;
    window.flush();
  });
  shown = await placed(page, "far");
  expect(shown.map((tile) => tile.name)).toEqual(["0/0/0", "0/0/0"]);
  for (const tile of shown) expect(tile.width).toBeCloseTo(400, 3);

  // Across the line where east is west.
  await step(page, 5);
  await step(page, 7);
  await page.evaluate(() => {
    window.objects.map.pan(-150, 0);
    window.flush();
  });
  shown = await placed(page, "at the date line");
  const columns = new Set(shown.map((tile) => tile.name.split("/")[1]));
  expect(columns.has("0") && columns.has("31")).toBe(true);
  for (const url of asked) expect(url).toMatch(/\/\d+\/\d+\/\d+\.png$/);
});

test("A tile that leaves gives its element to the next", async ({ page, baseURL }) => {
  await scene(page, baseURL);
  const count = () => page.evaluate(() => window.objects.map.$node.querySelectorAll(".qq-tiles > img").length);
  const elements = await count();
  expect(elements).toBe(9);
  // A screen to the east and back, a step at a time.
  const names = await page.evaluate(() => {
    const map = window.objects.map;
    const names = new Set();
    for (const by of [150, 150, 150, -150, -150, -150]) {
      map.pan(by, 0);
      window.flush();
      for (const image of map.$node.querySelectorAll(".qq-tiles > img[src]")) names.add(image.src);
    }
    return names.size;
  });
  expect(names).toBeGreaterThan(9);
  expect(await count()).toBeLessThanOrEqual(12);
  same(await read(page), expected.read[0], "back");
  // Another kind of map: the same elements, of other pictures.
  await page.evaluate(() => {
    const map = window.objects.map;
    map.activeMapType = map.supportedMapTypes[4];
    window.flush();
  });
  expect(await count()).toBeLessThanOrEqual(12);
  const shown = await placed(page, "terrain");
  expect(shown.length).toBe(9);
  const sources = await page.evaluate(() =>
    [...window.objects.map.$node.querySelectorAll(".qq-tiles > img[src]")].map((image) => image.src),
  );
  for (const source of sources) expect(source).toMatch(/^https:\/\/a\.tile\.thunderforest\.com\/landscape\/5\//);
});

test("A provider's own server is asked for the tiles of its kind of map", async ({ page, baseURL }) => {
  const asked = await scene(page, baseURL);
  await loaded(page);
  expect(asked.filter((url) => url.includes("tiles.test"))).toEqual([]);
  // `others` makes that kind of map the one shown. Zoom level 25 is past
  // the tiles there are: those of the last level, around London.
  await page.evaluate(() => {
    window.scene.others();
    window.flush();
  });
  await loaded(page);
  const own = asked.filter((url) => url.includes("tiles.test"));
  expect(own.length).toBeGreaterThan(0);
  for (const url of own) expect(url).toMatch(/^http:\/\/tiles\.test\/own\/19\/2619\d\d\/1743\d\d\.png$/);
});

test("Whose the map is is said in its corner, over its items", async ({ page, baseURL }) => {
  await scene(page, baseURL);
  const notice = page.locator("#scene .qq-copyright").last();
  await expect(notice).toHaveText("Map © OpenStreetMap.org | Data © OpenStreetMap contributors");
  const box = await page.evaluate(() => {
    const map = window.objects.map;
    const frame = map.$node.getBoundingClientRect();
    const notice = map.$node.querySelector(".qq-copyright");
    const box = notice.getBoundingClientRect();
    return { left: box.x - frame.x, bottom: frame.bottom - box.bottom, height: box.height, z: getComputedStyle(notice).zIndex };
  });
  expect(box).toEqual({ left: 0, bottom: 0, height: 14, z: "1" });
  await notice.locator("a").first().click();
  expect(await page.evaluate(() => window.scene.seen)).toEqual(["link http://www.openstreetmap.org/copyright"]);
  // Over an item that is over the others, and no lower again.
  const z = await page.evaluate(() => {
    const { map, marker } = window.objects;
    const notice = map.$node.querySelector(".qq-copyright");
    const seen = [];
    marker.z = 5;
    window.flush();
    seen.push(getComputedStyle(notice).zIndex);
    marker.z = 0;
    window.flush();
    seen.push(getComputedStyle(notice).zIndex);
    map.copyrightsVisible = false;
    window.flush();
    seen.push(getComputedStyle(notice).display);
    return seen;
  });
  expect(z).toEqual(["6", "6", "none"]);
});

test("A map's item is drawn where the map says its place is", async ({ page, baseURL }) => {
  await scene(page, baseURL);
  const drawn = () =>
    page.evaluate(() => {
      const { map, marker } = window.objects;
      const frame = map.$node.getBoundingClientRect();
      const flag = marker.sourceItem.$node.getBoundingClientRect();
      const at = map.fromCoordinate(marker.coordinate, false);
      return {
        left: flag.x - frame.x,
        top: flag.y - frame.y,
        width: flag.width,
        height: flag.height,
        x: at.x,
        y: at.y,
        opacity: getComputedStyle(marker.sourceItem.$node.parentElement).opacity,
      };
    });
  let flag = await drawn();
  expect(flag.left).toBeCloseTo(flag.x - 12, 3);
  expect(flag.top).toBeCloseTo(flag.y - 6, 3);
  expect([flag.width, flag.height, flag.opacity]).toEqual([24, 12, "1"]);
  // Of a zoom level, it is twice its size a level closer, from its anchor.
  await page.evaluate(() => {
    window.objects.marker.zoomLevel = 4;
    window.flush();
  });
  flag = await drawn();
  expect(flag.left).toBeCloseTo(flag.x - 24, 3);
  expect(flag.top).toBeCloseTo(flag.y - 12, 3);
  expect(flag.width).toBeCloseTo(48, 3);
  expect(flag.height).toBeCloseTo(24, 3);
  // Far out it fades, and is gone where the whole Earth is in view.
  const faded = await page.evaluate(() => {
    const { map, marker } = window.objects;
    const holder = marker.sourceItem.$node.parentElement;
    const seen = [];
    for (const zoom of [2.25, 1.5, 3]) {
      map.zoomLevel = zoom;
      window.flush();
      seen.push(getComputedStyle(holder).opacity);
    }
    marker.autoFadeIn = false;
    map.zoomLevel = 1;
    window.flush();
    seen.push(getComputedStyle(holder).opacity);
    return seen;
  });
  expect(faded).toEqual(["0.75", "0", "1", "1"]);
});
