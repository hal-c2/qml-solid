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
