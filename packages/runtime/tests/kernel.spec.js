import { test as plain } from "@playwright/test";
import { expect, open, test } from "./open.js";

// The steps are the ones Qt was taken through with the same scene, and the
// answers the ones it gave.
test("an object's properties and signals tell what Qt's do, when they do", async ({ page }) => {
  await open(page, "kernel");
  const read = await page.evaluate(() => {
    const { scene } = window;
    const seen = [scene.read()];
    for (let step = 0; step <= 12; step++) {
      scene.step(step);
      seen.push(scene.read());
    }
    // What two properties were given where the object was made, Qt tells of
    // last first: an order nothing is to lean on.
    const [made] = seen[0];
    seen[0][0] = [...made.slice(0, 2).sort(), ...made.slice(2)];
    return seen;
  });
  const rest = (a, b, c, word) => [a, b, c, word, "held", a, 3, "two"];
  expect(read).toEqual([
    // A literal next to its handler is where the property starts; one given
    // where the object is made, and what a binding first gives, are changes.
    [["given n 2", "given s two", "bound n 5", "bound s x"], ...rest(5, 6, 0, "x")],
    // A handler that assigns finds what depends on it up to date.
    [["bound n 7", "b 8"], ...rest(7, 8, 1, "x")],
    [["word y", "bound s y"], ...rest(7, 8, 1, "y")],
    // A change signal is one to emit and to connect to.
    [["word y"], ...rest(7, 8, 1, "y")],
    [["done 3", "wired 3"], ...rest(7, 8, 1, "y")],
    [["done 4", "wired 4", "heard 4"], ...rest(7, 8, 1, "y")],
    [["done 5", "wired 5"], ...rest(7, 8, 1, "y")],
    [["lone 4", "heard lone 4", "word z", "bound s z"], ...rest(7, 8, 1, "z")],
    [["lone 5", "word w", "bound s w"], ...rest(7, 8, 1, "w")],
    [["given n 3", "given s three"], ...rest(7, 8, 1, "w")],
    // A directory keeps the slash it ends with.
    [["/data/"], ...rest(7, 8, 1, "w")],
    // An element of a ListModel has its roles to list.
    [["n,name a1"], ...rest(7, 8, 1, "w")],
    [["1,b"], ...rest(7, 8, 1, "w")],
    [["given n 9", "given heard 9"], ...rest(7, 8, 1, "w")],
  ]);
});

test("a binding that comes back to its own property ends there", async ({ page }) => {
  await open(page, "bindingloop");
  // Qt's answers; where a loop of two ends is not for a program to lean on.
  expect(await page.evaluate(() => window.scene.read())).toEqual([20, 20, true, true, 5]);
});

test("a property bound again to what depends on it goes round once", async ({ page }) => {
  await open(page, "lateloop");
  const read = await page.evaluate(() => {
    const { scene } = window;
    const seen = [scene.read()];
    for (let step = 0; step < 3; step++) {
      scene.step(step);
      seen.push(scene.read());
    }
    return seen;
  });
  // Qt's answers: what changed first is left as it was when it changed.
  expect(read).toEqual([
    [[0, false, 484, 484], [1, true, 364, 364], [1, true, 364, 364], [4, 8]],
    [[0, false, 484, 484], [1, true, 364, 364], [1, true, 364, 600], [8, 16]],
    [[0, false, 484, 500], [1, true, 364, 500], [0, false, 484, 380], [61, 122]],
    [[0, false, 484, 484], [1, true, 364, 364], [1, true, 364, 484], [123, 246]],
  ]);
});

test("a picture as wide as its own height says is loaded once more, and no more", async ({ page }) => {
  await open(page, "imageloop");
  await page.waitForFunction(() => window.scene.ready);
  // Qt's answers.
  expect(await page.evaluate(() => window.scene.read())).toEqual([
    [90, 60, 90, 60, 90, 60],
    [30, 20, 30, 20, 30, 20],
    [60, 40, 60, 0, 60, 40],
    [60, 20, 60, 20, 60, 20],
  ]);
});

test("what is said of the object a property holds is that object's", async ({ page }) => {
  await open(page, "through");
  const read = await page.evaluate(() => {
    const scene = window.scene;
    const out = [scene.read()];
    for (let index = 0; index < 5; index++) {
      scene.step(index);
      out.push(scene.read());
    }
    return out;
  });
  // Qt's answers.
  expect(read).toEqual([
    ["wide", "#ff0000", 2, 10, 30, ""],
    ["wide", "#ff0000", 2, 10, 30, "back 2"],
    ["narrow", "#0000ff", 1, 10, 30, "back 2"],
    ["narrow", "#0000ff", 5, 4, 60, "back 2,width 4"],
    ["wide", "#ff0000", 5, 4, 80, "back 2,width 4"],
    ["wide", "#ff0000", 2, 10, 30, "back 2,width 4,width 10"],
  ]);
});

plain("a binding that cannot be evaluated is told of, unless what it met is not made yet", async ({ page }) => {
  const warnings = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  await open(page, "early");
  const read = await page.evaluate(() => {
    const { scene } = window;
    const seen = [scene.read()];
    for (let step = 0; step < 2; step++) {
      scene.step(step);
      seen.push(scene.read());
    }
    return seen;
  });
  // Qt's answers. An item may be beside one that is below it; what an alias
  // was given stays what it was when it cannot be evaluated again.
  expect(read).toEqual([
    [300, "", 32, 10, 7, 43],
    [300, "first", 32, 10, 7, 43],
    [300, "first", 32, 10, 7, 43],
  ]);
  // And Qt's complaints: none of `wide`, which asked an object made after it.
  expect(new Set(warnings)).toEqual(new Set(["title: TypeError: Cannot read properties of null (reading 'title')"]));
  expect(warnings.length).toBeGreaterThanOrEqual(2);
});

plain("a binding that cannot be evaluated while objects are made is told of when they are, if it still cannot", async ({ page }) => {
  const warnings = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  const told = (name) => `${name}: TypeError: Cannot read properties of null (reading 'title')`;
  await open(page, "mended");
  const read = () => page.evaluate(() => JSON.parse(JSON.stringify(window.scene.read())));
  // Qt's answers and complaints: nothing of what `Component.onCompleted` or
  // the stack's first item made whole, though they came after the binding
  // was first asked.
  expect(await read()).toEqual(["first", "", "first", "page"]);
  expect(warnings).toEqual([told("broken")]);
  // From then on, of each as it happens.
  await page.evaluate(() => window.scene.step(0));
  expect(await read()).toEqual(["first", "", "first", "page"]);
  expect(warnings.toSorted()).toEqual([told("broken"), told("mended"), told("title")]);
  await page.evaluate(() => window.scene.step(1));
  expect(await read()).toEqual(["second", "", "second", "page"]);
  expect(warnings).toHaveLength(3);
});

test("what an object is made with is not a change, unless it was a binding", async ({ page }) => {
  await open(page, "told");
  // Qt's answers: a number, a text and the key of an enum are what the object
  // is made with. (Qt tells of the bindings last made first; that order is
  // not kept here.)
  expect((await page.evaluate(() => window.scene.seen)).sort()).toEqual(["availability 1", "bound 2", "height 200"]);
});

test("what a type of a namespace attaches is asked of the object in a script", async ({ page }) => {
  await open(page, "attachedname");
  // Qt 6.11: the bar the Flickable was given, from itself and from an object
  // inside it, a quarter of the content in view, and no bar across.
  expect(await page.evaluate(() => window.scene.read())).toEqual([true, "bar", true, true, 0.25, null]);
});
