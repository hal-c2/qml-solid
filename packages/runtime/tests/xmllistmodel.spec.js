import { test as plain } from "@playwright/test";
import { expect, open, test } from "./open.js";

const READY = 1;
const ready = (page, name = "feed") =>
  page.waitForFunction(([name, READY]) => window.objects[name].status === READY, [name, READY]);
const rows = (page) =>
  page.evaluate(() => {
    const { rows } = window.objects;
    return Array.from({ length: rows.count }, (_, index) => rows.itemAt(index).all);
  });

const FEED = [
  ["First", "a1", "http://example.org/1", "one.png", "", "d1"],
  // Of several elements of a name, the last is the one read.
  ["Second again", "a2", "", "two.png", "", "d3"],
  ["Third bold one", "", "", "", "", ""],
  // Qt reads the document as a stream: an item after the channel is one too.
  ["Stray", "a4", "", "", "", ""],
];

test("an XmlListModel's rows are the elements its query names", async ({ page }) => {
  await open(page, "xmllistmodel");
  await ready(page);
  await ready(page, "single");
  expect(await rows(page)).toEqual(FEED);
  const read = await page.evaluate(() => {
    const { feed, single, none, titles, log, XmlListModel } = window.objects;
    return {
      feed: [feed.count, feed.status, feed.progress, feed.errorString(), feed.rowCount()],
      log,
      // A model with one role gives it as `modelData`.
      titles: Array.from({ length: titles.count }, (_, index) => titles.itemAt(index).value),
      single: single.count,
      none: [none.count, none.status, none.source, none.query],
      enums: [XmlListModel.Null, XmlListModel.Ready, XmlListModel.Loading, XmlListModel.Error],
    };
  });
  expect(read).toEqual({
    feed: [4, 1, 1, "", 4],
    // It was loading before anything could ask to be told.
    log: ["count 4", "status 1 4 1"],
    titles: ["First", "Second again", "Third bold one", "Stray"],
    single: 4,
    none: [0, 0, "", ""],
    enums: [0, 1, 2, 3],
  });
});

test("a query is a path of element names from the document's", async ({ page }) => {
  await open(page, "xmllistmodel");
  await ready(page);
  const counts = {};
  for (const query of ["/rss/channel/item/", "/rss/item", "/rss/channel", "/rss/channel/item/nested", "/channel/item", "//item", "/item", "/rss"]) {
    await page.evaluate((query) => {
      window.objects.root.query = query;
    }, query);
    await ready(page);
    counts[query] = await page.evaluate(() => [window.objects.feed.count, window.objects.rows.count]);
  }
  expect(counts).toEqual({
    "/rss/channel/item/": [4, 4],
    "/rss/item": [1, 1],
    "/rss/channel": [1, 1],
    // Once in the first item's `nested`, Qt looks for no other item.
    "/rss/channel/item/nested": [1, 1],
    "/channel/item": [0, 0],
    "//item": [0, 0],
    "/item": [0, 0],
    "/rss": [1, 1],
  });
});

test("what an XmlListModel shows stays until what replaces it has been read", async ({ page }) => {
  let held;
  const waiting = new Promise((resolve) => {
    held = resolve;
  });
  await page.route("**/fixtures/other.xml", async (route) => {
    await waiting;
    await route.continue();
  });
  await open(page, "xmllistmodel");
  await ready(page);
  const during = await page.evaluate(() => {
    const { root, feed, rows, log } = window.objects;
    log.length = 0;
    root.source = root.fixture("other.xml");
    return [feed.status, feed.progress, feed.count, rows.count, rows.itemAt(0).all[0]];
  });
  expect(during).toEqual([2, 0, 4, 4, "First"]);
  held();
  await ready(page);
  expect(await rows(page)).toEqual([
    ["Other", "b1", "", "", "", ""],
    ["Another", "b2", "", "", "", ""],
  ]);
  const after = await page.evaluate(() => {
    const { root, feed, rows, log, made } = window.objects;
    const seen = { log: log.slice(), made };
    root.source = "";
    seen.cleared = [feed.status, feed.count, rows.count];
    return seen;
  });
  expect(after).toEqual({
    log: [
      "status 2 4 0",
      "destroyed First",
      "destroyed Second again",
      "destroyed Third bold one",
      "destroyed Stray",
      "count 2",
      "status 1 2 1",
    ],
    made: 6,
    // No source, no rows.
    cleared: [0, 0, 0],
  });
});

test("reload reads the document again, and only the last one asked for counts", async ({ page }) => {
  let served = 0;
  const item = (title) => `<rss><channel><item id="n"><title>${title}</title></item></channel></rss>`;
  await page.route("**/fixtures/changing.xml", (route) =>
    route.fulfill({ contentType: "text/xml", body: item(`version ${++served}`) }),
  );
  await open(page, "xmllistmodel");
  await ready(page);
  await page.evaluate(() => {
    window.objects.root.source = window.objects.root.fixture("changing.xml");
  });
  await ready(page);
  expect((await rows(page)).map((row) => row[0])).toEqual(["version 1"]);
  const status = await page.evaluate(() => {
    const { feed } = window.objects;
    feed.reload();
    // Asked for twice before either came: the first is dropped.
    feed.reload();
    return feed.status;
  });
  expect(status).toBe(2);
  await ready(page);
  expect(served).toBeGreaterThan(1);
  expect((await rows(page)).map((row) => row[0])).toEqual([`version ${served}`]);
  expect(await page.evaluate(() => window.objects.made)).toBe(4 + 1 + 1);
});

test("a role that changes is read again", async ({ page }) => {
  await open(page, "xmllistmodel");
  await ready(page);
  await page.evaluate(() => {
    const { image } = window.objects;
    image.elementName = "link";
    image.attributeName = "";
  });
  await ready(page);
  expect((await rows(page)).map((row) => row[3])).toEqual(["http://example.org/1", "", "", ""]);
});

plain("an XmlListModel says what Qt says of a query, a role or a document it cannot use", async ({ page }) => {
  const warnings = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  await open(page, "xmllistmodel");
  await ready(page);
  // A query that is not a path from the root leaves the one before it.
  await page.evaluate(() => {
    window.objects.root.query = "rss/channel/item";
  });
  await ready(page);
  expect(await page.evaluate(() => window.objects.feed.count)).toBe(4);
  // An element without the attribute a role names.
  await page.evaluate(() => {
    window.objects.image.attributeName = "type";
  });
  await ready(page);
  expect((await rows(page)).map((row) => row[3])).toEqual(["image/png", "", "", ""]);
  // A browser gives nothing of a document that is not well formed.
  await page.evaluate(() => {
    window.objects.root.source = window.objects.root.fixture("broken.xml");
  });
  await ready(page);
  expect(await page.evaluate(() => [window.objects.feed.count, window.objects.feed.status])).toEqual([0, 1]);
  expect(warnings.filter((text) => text.includes("An XmlListModel query must start with '/'"))).toHaveLength(1);
  expect(warnings.filter((text) => text.includes('Query error: "Attribute type not found"'))).toHaveLength(2);
  expect(warnings.filter((text) => text.includes("XmlListModel: Query error:"))).toHaveLength(1);
});

plain("a document that cannot be fetched is an error with a reason", async ({ page }) => {
  await page.route("**/fixtures/missing.xml", (route) => route.fulfill({ status: 404, body: "no" }));
  await open(page, "xmllistmodel");
  await ready(page);
  await page.evaluate(() => {
    window.objects.root.source = window.objects.root.fixture("missing.xml");
  });
  await page.waitForFunction(() => window.objects.feed.status === 3);
  const read = await page.evaluate(() => {
    const { feed, rows } = window.objects;
    return [feed.count, rows.count, feed.progress, feed.errorString()];
  });
  expect(read.slice(0, 3)).toEqual([0, 0, 1]);
  expect(read[3]).toContain("missing.xml");
  // The next document clears the error.
  await page.evaluate(() => {
    window.objects.root.source = window.objects.root.fixture("other.xml");
  });
  await ready(page);
  expect(await page.evaluate(() => [window.objects.feed.count, window.objects.feed.errorString()])).toEqual([2, ""]);
});
