import { test as plain } from "@playwright/test";
import { expect, open, rect, test } from "./open.js";

// The steps are the ones Qt was taken through with the same models, and the
// rows what it had after each.
test("a SortFilterProxyModel shows the rows its filters accept in its sorters' order", async ({ page }) => {
  await open(page, "proxymodel");
  const read = await page.evaluate(() => {
    const { scene } = window;
    const { src, plain, fn, ff, rs, ss, vf, vfil, vf2, rows, plainRows, vfRows, log } = scene;
    const shown = (view) => Array.from({ length: view.count }, (_, index) => view.itemAt(index));
    const now = () => ({
      rows: shown(rows)
        .map((item) => `${item.name}@${item.index}`)
        .join(" "),
      costs: shown(rows).map((item) => item.cost),
      log: log.splice(0).sort().join(" "),
    });
    const names = (view) => shown(view).map((item) => item.name);
    const seen = {};
    seen.defaults = [
      [ff.enabled, ff.inverted, vfil.roleName, vfil.value, vf2.value],
      [rs.enabled, rs.sortOrder, rs.priority, ss.caseSensitivity, ss.ignorePunctuation, ss.numericMode],
      [plain.model === src, plain.sourceModel === src, vf.model === src, vf.sourceModel === src],
      [plain.rowCount(), fn.rowCount(), vf.rowCount(), fn.columnCount()],
    ];
    seen.initial = [now(), names(plainRows)];
    const kept = shown(rows);
    // What a filter's function reads that is no role of a row is its own
    // affair.
    scene.wanted = "veg";
    seen.unasked = now();
    fn.invalidate();
    seen.invalidated = now();
    const [leek, apple] = shown(rows);
    src.setProperty(2, "cost", 5);
    seen.moved = [now(), shown(rows)[0] === apple, shown(rows)[1] === leek];
    src.setProperty(0, "kind", "veg");
    seen.accepted = now();
    src.append({ name: "kale", kind: "veg", cost: 4 });
    seen.appended = [now(), plain.rowCount(), names(plainRows)];
    src.remove(4);
    seen.removed = now();
    const three = shown(rows);
    rs.sortOrder = 1;
    seen.descending = [now(), shown(rows)[0] === three[2], shown(rows)[2] === three[0]];
    rs.enabled = false;
    seen.byName = now();
    ff.inverted = true;
    seen.inverted = now();
    ff.enabled = false;
    seen.unfiltered = now();
    rs.enabled = true;
    rs.sortOrder = 0;
    ss.priority = 0;
    rs.priority = 1;
    seen.priority = now();
    fn.setPrimarySorter(rs);
    seen.primary = now();
    seen.value = [names(vfRows)];
    vfil.value = "fruit";
    seen.value.push(names(vfRows));
    vf2.value = 2;
    seen.value.push(names(vfRows));
    vfil.roleName = "nope";
    seen.value.push(names(vfRows));
    const first = fn.index(0, 0);
    seen.mapped = [
      fn.mapToSource(first).row,
      fn.mapToSource(first).model === src,
      fn.mapFromSource(src.index(0, 0)).row,
      fn.mapFromSource(src.index(0, 0)).model === fn,
      first.row,
      first.valid,
      fn.index(9, 0).valid,
      fn.mapToSource(src.index(0, 0)).valid,
    ];
    // A delegate writes to the source through its row.
    shown(rows)[0].model.name = "RENAMED";
    seen.written = [src.get(1).name, now(), names(plainRows)];
    src.clear();
    seen.cleared = [now().rows, plain.rowCount(), kept.length];
    return seen;
  });
  expect(read).toEqual({
    defaults: [
      [true, false, "kind", "veg", undefined],
      [true, 0, 2147483647, 1, false, false],
      [true, true, true, true],
      [5, 3, 0, 1],
    ],
    initial: [
      { rows: "Apple@0 pear@1 fig@2", costs: [2, 3, 10], log: "+Apple +fig +pear" },
      ["pear", "Apple", "leek", "fig", "apple"],
    ],
    unasked: { rows: "Apple@0 pear@1 fig@2", costs: [2, 3, 10], log: "" },
    invalidated: { rows: "leek@0 apple@1", costs: [1, 2], log: "+apple +leek -Apple -fig -pear" },
    // A row that moves keeps its delegate.
    moved: [{ rows: "apple@0 leek@1", costs: [2, 5], log: "" }, true, true],
    accepted: { rows: "apple@0 pear@1 leek@2", costs: [2, 3, 5], log: "+pear" },
    appended: [
      { rows: "apple@0 pear@1 kale@2 leek@3", costs: [2, 3, 4, 5], log: "+kale" },
      6,
      ["pear", "Apple", "leek", "fig", "apple", "kale"],
    ],
    removed: { rows: "pear@0 kale@1 leek@2", costs: [3, 4, 5], log: "-apple" },
    descending: [{ rows: "leek@0 kale@1 pear@2", costs: [5, 4, 3], log: "" }, true, true],
    byName: { rows: "kale@0 leek@1 pear@2", costs: [4, 5, 3], log: "" },
    inverted: { rows: "Apple@0 fig@1", costs: [2, 10], log: "+Apple +fig -kale -leek -pear" },
    unfiltered: { rows: "Apple@0 fig@1 kale@2 leek@3 pear@4", costs: [2, 10, 4, 5, 3], log: "+kale +leek +pear" },
    priority: { rows: "Apple@0 fig@1 kale@2 leek@3 pear@4", costs: [2, 10, 4, 5, 3], log: "" },
    primary: { rows: "Apple@0 pear@1 kale@2 leek@3 fig@4", costs: [2, 3, 4, 5, 10], log: "" },
    value: [[], [], ["Apple"], []],
    mapped: [1, true, 1, true, 0, true, false, false],
    written: [
      "RENAMED",
      { rows: "RENAMED@0 pear@1 kale@2 leek@3 fig@4", costs: [2, 3, 4, 5, 10], log: "" },
      ["pear", "RENAMED", "leek", "fig", "kale"],
    ],
    cleared: ["", 0, 3],
  });
});

test("a proxy's rows are laid out as rows of any model are", async ({ page }) => {
  await open(page, "proxymodel");
  const boxes = () =>
    page.evaluate(() => {
      const { rows } = window.scene;
      return Array.from({ length: rows.count }, (_, index) => {
        const { x, y, width, height } = rows.itemAt(index).$node.getBoundingClientRect();
        return [rows.itemAt(index).name, x, y, width, height];
      });
    });
  expect(await rect(page, "rows")).toBeDefined();
  expect(await boxes()).toEqual([
    ["Apple", 0, 0, 22, 10],
    ["pear", 0, 12, 23, 10],
    ["fig", 0, 24, 30, 10],
  ]);
  await page.evaluate(() => window.scene.src.setProperty(3, "cost", 1));
  expect(await boxes()).toEqual([
    ["fig", 0, 0, 21, 10],
    ["Apple", 0, 12, 22, 10],
    ["pear", 0, 24, 23, 10],
  ]);
});

test("filters and sorters order rows as Qt's do", async ({ page }) => {
  await open(page, "proxysorting");
  const read = await page.evaluate(() => {
    const { views, af, cf, dr, es, fs, src } = window.scene;
    const rows = (name, role = "name") =>
      Array.from({ length: views[name].count }, (_, index) => views[name].itemAt(index)[role]);
    const seen = {};
    seen.a = [rows("a")];
    af.value = "veg";
    seen.a.push(rows("a"));
    af.inverted = true;
    seen.a.push(rows("a"));
    seen.b = rows("b");
    seen.c = [rows("c")];
    cf.value = 2;
    seen.c.push(rows("c"));
    seen.h = rows("h");
    seen.d = [rows("d")];
    dr.roleName = "cost";
    seen.d.push(rows("d"));
    dr.roleName = "nope";
    seen.d.push(rows("d"));
    dr.roleName = "";
    seen.d.push(rows("d"));
    seen.e = [rows("e", "tag")];
    es.caseSensitivity = 0;
    seen.e.push(rows("e", "tag"));
    es.numericMode = true;
    seen.e.push(rows("e", "tag"));
    es.ignorePunctuation = true;
    seen.e.push(rows("e", "tag"));
    es.sortOrder = 1;
    seen.e.push(rows("e", "tag"));
    seen.g = rows("g");
    seen.f = [rows("f")];
    fs.sortOrder = 1;
    seen.f.push(rows("f"));
    // What its function read of a row is what it is asked again for.
    src.setProperty(3, "name", "figtree");
    seen.f.push(rows("f"));
    return seen;
  });
  expect(read).toEqual({
    // A ValueFilter with no value, or no role, accepts nothing.
    a: [[], ["leek", "apple"], ["pear", "Apple", "fig"]],
    b: [],
    c: [
      ["Apple", "apple"],
      ["Apple", "apple"],
    ],
    h: ["Apple", "fig", "pear"],
    d: [
      ["Apple", "apple", "fig", "leek", "pear"],
      ["leek", "Apple", "apple", "pear", "fig"],
      ["pear", "Apple", "leek", "fig", "apple"],
      ["pear", "Apple", "leek", "fig", "apple"],
    ],
    e: [
      ["a1", "a10", "a2", "b-2", "B1"],
      ["a1", "a10", "a2", "b-2", "B1"],
      ["a1", "a2", "a10", "b-2", "B1"],
      ["a1", "a2", "a10", "B1", "b-2"],
      ["b-2", "B1", "a10", "a2", "a1"],
    ],
    // Rows a sorter has in one place stay as the source has them, the other
    // way round when it is descending.
    f: [
      ["fig", "pear", "leek", "Apple", "apple"],
      ["apple", "Apple", "leek", "pear", "fig"],
      ["figtree", "apple", "Apple", "leek", "pear"],
    ],
    g: ["leek", "apple", "Apple", "pear", "fig"],
  });
});

// As Qt's toycustomizer has one.
test("a proxy of a ListModel type of the program's own follows it row by row", async ({ page }) => {
  await open(page, "proxyderived");
  const read = await page.evaluate(() => {
    const { scene } = window;
    const { proxy, view, rows, log } = scene;
    const shown = () => Array.from({ length: view.count }, (_, index) => view.itemAtIndex(index));
    const now = () => shown().map((item) => `${item.name}@${item.index}${item.selected ? "!" : ""}`);
    const seen = {};
    seen.initial = [now(), scene.model.groups(), proxy.model === scene.model, proxy.sourceModel === scene.model];
    const [cap, crown] = shown();
    const kept = [rows.itemAt(0), rows.itemAt(1)];
    proxy.setSelected(1);
    seen.selected = [now(), shown()[0] === cap, shown()[1] === crown, getComputedStyle(crown.$node).backgroundColor];
    proxy.setSelected(0);
    seen.other = now();
    scene.model.append({ name: "beret", group: "hat", selected: false });
    seen.appended = [now(), shown()[0] === cap, shown()[1] === crown, rows.itemAt(0) === kept[0], rows.count];
    scene.tab = 1;
    seen.tab = [now(), log.slice()];
    scene.tab = 5;
    seen.none = [now(), log.slice(), proxy.rowCount()];
    return seen;
  });
  expect(read).toEqual({
    initial: [["cap@0", "crown@1"], ["hat", "eye"], true, true],
    selected: [["cap@0", "crown@1!"], true, true, "rgb(255, 0, 0)"],
    other: ["cap@0!", "crown@1"],
    appended: [["cap@0!", "crown@1", "beret@2"], true, true, true, 3],
    // The handler is told of what the binding first gave too: it is not what
    // the property had.
    tab: [["lens@0", "patch@1"], ["filter hat", "filter eye"]],
    none: [[], ["filter hat", "filter eye", "filter "], 0],
  });
});

plain("a SortFilterProxyModel has no rows for a model without roles", async ({ page }) => {
  const warnings = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  await open(page, "proxysorting");
  const read = await page.evaluate(() => {
    const { bad, views, d } = window.scene;
    const seen = [];
    bad.model = ["b", "a"];
    seen.push(bad.rowCount(), views.bad.count);
    bad.model = 3;
    seen.push(bad.rowCount(), views.bad.count);
    // Given one with roles, it shows it.
    bad.model = d;
    seen.push(bad.rowCount(), views.bad.count, views.bad.itemAt(0).name);
    bad.model = null;
    seen.push(bad.rowCount(), views.bad.count);
    return seen;
  });
  expect(read).toEqual([0, 0, 0, 0, 5, 5, "Apple", 0, 0]);
  expect(warnings).toEqual(
    new Array(2).fill("SortFilterProxyModel: a model whose rows have roles is the only kind it can be given"),
  );
});
