import { expect, open, rect, test } from "./open.js";

test("a ListModel holds its elements, their roles and the lists in them", async ({ page }) => {
  await open(page, "models");
  const read = await page.evaluate(() => {
    const { fruit, single, loose } = window.objects;
    loose.append({ name: "x" });
    loose.append({ size: 2 });
    return {
      count: fruit.count,
      first: [fruit.get(0).name, fruit.get(0).cost],
      // A role an element was not given reads as nothing of its type.
      missing: [fruit.get(2).cost, loose.get(1).name, fruit.get(0).attributes],
      beyond: fruit.get(7),
      nested: [fruit.get(1).attributes.count, fruit.get(1).attributes.get(0).description],
      single: single.count,
    };
  });
  expect(read).toEqual({
    count: 3,
    first: ["apple", 2],
    missing: [0, undefined, undefined],
    beyond: undefined,
    nested: [1, "green"],
    single: 1,
  });
});

test("a ListModel is changed by its methods and through its elements", async ({ page }) => {
  await open(page, "models");
  const read = await page.evaluate(() => {
    const { fruit } = window.objects;
    const names = () => Array.from({ length: fruit.count }, (_, index) => fruit.get(index).name).join(" ");
    const seen = [];
    fruit.append({ name: "fig", cost: 1 });
    fruit.append([{ name: "kiwi" }, { name: "lime" }]);
    seen.push(names());
    fruit.insert(0, [{ name: "date" }, { name: "sloe" }]);
    seen.push(names());
    fruit.move(0, 2, 2);
    seen.push(names());
    fruit.remove(1, 2);
    seen.push(names());
    fruit.set(0, { name: "APPLE", cost: 9 });
    fruit.setProperty(1, "name", "SLOE");
    fruit.set(fruit.count, { name: "last" });
    fruit.get(2).name = "PEAR";
    seen.push(names(), fruit.get(0).cost);
    fruit.clear();
    seen.push(fruit.count);
    return seen;
  });
  expect(read).toEqual([
    "apple pear plum fig kiwi lime",
    "date sloe apple pear plum fig kiwi lime",
    "apple pear date sloe plum fig kiwi lime",
    "apple sloe plum fig kiwi lime",
    "APPLE SLOE PEAR fig kiwi lime last",
    9,
    0,
  ]);
});

// As Qt has them: `a r0 r1 r2 repeater b`.
test("a Repeater's items are its parent's children, before it and in the order of the rows", async ({ page }) => {
  await open(page, "models");
  const read = await page.evaluate(() => {
    const { root, before, after, byList } = window.objects;
    const children = root.children;
    const at = children.indexOf(byList);
    const nodes = [...root.$node.children];
    return {
      count: byList.count,
      order: [children.indexOf(before) === at - 4, children[at - 3] === byList.itemAt(0), children[at + 1] === after],
      parent: byList.itemAt(1).parent === root,
      dom: [0, 1, 2].map((index) => nodes.indexOf(byList.itemAt(index).$node) - nodes.indexOf(byList.$node)),
      none: byList.itemAt(3),
      log: window.objects.log.filter((line) => line.startsWith("added")),
    };
  });
  expect(read).toEqual({
    count: 3,
    order: [true, true, true],
    parent: true,
    dom: [-3, -2, -1],
    none: null,
    log: ["added 0 apple", "added 1 pear", "added 2 plum"],
  });
  const item = (index) => page.evaluate((index) => {
    const { x, y, width, height } = window.objects.byList.itemAt(index).$node.getBoundingClientRect();
    return { x, y, width, height };
  }, index);
  expect(await item(0)).toEqual({ x: 0, y: 0, width: 20, height: 30 });
  expect(await item(1)).toEqual({ x: 30, y: 0, width: 20, height: 40 });
  expect(await item(2)).toEqual({ x: 60, y: 0, width: 20, height: 10 });
});

test("a delegate is given its index, its roles, the row as `model` and nothing else", async ({ page }) => {
  await open(page, "models");
  const read = await page.evaluate(() => {
    const { byList, bySingle, byNumber, byArray, byObjects, fruit } = window.objects;
    const item = byList.itemAt(1);
    item.model.cost = 7;
    return {
      roles: [item.index, item.name, item.cost, item.model.name, item.model.index],
      // A model of several roles has no one value to be `modelData`.
      whole: [item.whole, bySingle.itemAt(0).value, byNumber.itemAt(2).value, byArray.itemAt(1).value],
      written: [fruit.get(1).cost, item.height],
      object: [byObjects.itemAt(1).name, byObjects.itemAt(1).whole.age, byObjects.itemAt(1).width],
      has: ["index", "model", "modelData", "name", "cost", "attributes", "width", "toString"].map((name) => item.has(name)),
    };
  });
  expect(read).toEqual({
    roles: [1, "pear", 7, "pear", 1],
    whole: [undefined, "only", 2, "b"],
    written: [7, 80],
    object: ["bob", 40, 40],
    has: [true, true, true, true, true, true, false, false],
  });
});

test("rows inserted, moved, changed and removed keep the delegates of the others", async ({ page }) => {
  await open(page, "models");
  const read = await page.evaluate(() => {
    const { fruit, byList, made, log, root } = window.objects;
    const [apple, pear, plum] = [0, 1, 2].map((index) => byList.itemAt(index));
    log.length = 0;
    fruit.insert(1, { name: "fig", cost: 1 });
    const inserted = [byList.itemAt(0) === apple, byList.itemAt(2) === pear, pear.index, pear.x, byList.itemAt(1).label];
    fruit.move(0, 2, 2);
    const moved = [byList.itemAt(2) === apple, byList.itemAt(0) === pear, byList.itemAt(1) === plum, apple.x, plum.index];
    fruit.setProperty(2, "cost", 5);
    const changed = [apple.cost, apple.height];
    fruit.remove(0, 2);
    const removed = [byList.count, byList.itemAt(0) === apple, apple.index, root.children.indexOf(byList) - root.children.indexOf(apple)];
    fruit.clear();
    return { inserted, moved, changed, removed, made: made.byList, count: byList.count, log };
  });
  expect(read).toEqual({
    inserted: [true, true, 2, 60, "fig"],
    moved: [true, true, true, 60, 1],
    changed: [5, 60],
    removed: [2, true, 0, 2],
    // Three to begin with and the one inserted.
    made: 4,
    count: 0,
    log: [
      "added 1 fig",
      "removed 0 pear",
      "removed 1 plum",
      "destroyed pear",
      "destroyed plum",
      "removed 0 apple",
      "removed 1 fig",
      "destroyed apple",
      "destroyed fig",
    ],
  });
  expect(await page.evaluate(() => window.objects.root.$node.children.length)).toBe(
    await page.evaluate(() => window.objects.root.children.length),
  );
});

test("a count that changes adds and removes rows at the end", async ({ page }) => {
  await open(page, "models");
  const read = await page.evaluate(() => {
    const { root, byNumber, made, things, log } = window.objects;
    const first = byNumber.itemAt(0);
    const before = [byNumber.count, things.count, things.object.objectName, things.objectAt(2).objectName];
    log.length = 0;
    root.rows = 5;
    const grown = [byNumber.count, byNumber.itemAt(0) === first, byNumber.itemAt(4).value, made.byNumber, things.count];
    root.rows = 1;
    const shrunk = [byNumber.count, byNumber.itemAt(0) === first, byNumber.itemAt(1), made.byNumber, things.objectAt(1)];
    return { before, grown, shrunk, log: log.filter((line) => line.includes("object")) };
  });
  expect(read).toEqual({
    before: [3, 3, "thing 0", "thing 2"],
    grown: [5, true, 4, 5, 5],
    shrunk: [1, true, null, 5, null],
    log: ["object 3", "object 4", "no object 1", "no object 2", "no object 3", "no object 4"],
  });
  expect(await rect(page, "byNumber")).toEqual({ x: 0, y: 0, width: 0, height: 0 });
});

test("an array given in place of another keeps the rows of the values in both", async ({ page }) => {
  await open(page, "models");
  const read = await page.evaluate(() => {
    const { root, byArray, byObjects, made } = window.objects;
    const [a, b, c] = [0, 1, 2].map((index) => byArray.itemAt(index));
    root.names = ["c", "x", "a", "y", "b"];
    const values = Array.from({ length: byArray.count }, (_, index) => byArray.itemAt(index).value).join("");
    const kept = [byArray.itemAt(0) === c, byArray.itemAt(2) === a, byArray.itemAt(4) === b, a.x, made.byArray];
    root.names = ["y"];
    const one = [byArray.count, byArray.itemAt(0).value, byArray.itemAt(0).x, made.byArray];
    const [ann, bob] = root.people;
    const bobItem = byObjects.itemAt(1);
    root.people = [{ name: "cat", age: 20 }, bob];
    const people = [byObjects.itemAt(1) === bobItem, bobItem.x, byObjects.itemAt(0).name, made.byObjects, ann.name];
    return { values, kept, one, people };
  });
  expect(read).toEqual({
    values: "cxayb",
    kept: [true, true, true, 60, 5],
    one: [1, "y", 0, 5],
    people: [true, 30, "cat", 3, "ann"],
  });
});

// What Qt 6.11 answers for the same scene, and it warns of nothing.
test("a delegate that goes with the row it read is not asked for what it read", async ({ page }) => {
  await open(page, "shrink");
  const scene = await page.evaluate(() => [
    window.scene.read(),
    window.scene.shrink(),
    window.scene.read(),
    window.scene.grow(),
    window.scene.read(),
  ]);
  expect(JSON.parse(JSON.stringify(scene))).toEqual([["a", "b", "c"], null, ["x"], null, ["p", "q"]]);
});

test("a value of an array that is no number is one row, as any other is", async ({ page }) => {
  await open(page, "arraynan");
  const mixed = ["0:NaN", "1:NaN", "2:undefined", "3:null", "4:0", "5:", "6:a", "7:a"];
  // What Qt 6.11 answers, as the scene is made and after each step.
  const qt = [
    [3, ["0:1", "1:NaN", "2:3"], 8, mixed],
    [3, ["0:NaN", "1:2", "2:NaN"], 8, mixed],
    [1, ["0:NaN"], 8, mixed],
  ];
  for (let index = 0; index < qt.length; index++) {
    expect(await page.evaluate(() => window.scene.answers())).toEqual(qt[index]);
    if (index + 1 < qt.length) await page.evaluate((index) => window.scene.step(index), index);
  }
});
