// A QML file named by its path is the component it was compiled to, and a
// script a QML file imports is a module of what it declares.
import { test as base } from "@playwright/test";
import { expect, open, test } from "./open.js";

test("a script is what it declares", async ({ page }) => {
  await open(page, "paths");
  const read = await page.evaluate(() => {
    const { scene } = window;
    return [scene.total, scene.made()];
  });
  expect(read).toEqual([5, 0]);
});

test("a path of a QML file is a component that is ready", async ({ page }) => {
  await open(page, "paths");
  const read = await page.evaluate(() => {
    const { block } = window.scene;
    return [block.status, block.progress, block.errorString(), block === window.scene.own()];
  });
  // The script names the same file from its own directory.
  expect(read).toEqual([1, 1, "", true]);
});

test("a component of a file makes its objects where it is told", async ({ page }) => {
  await open(page, "paths");
  const read = await page.evaluate(() => {
    const { scene } = window;
    const block = scene.block.createObject(scene, { x: 30 });
    const ball = scene.make("Ball", 70);
    return [
      [block.kind, block.x, block.width, block.parent === scene],
      [ball.kind, ball.x, ball.width, ball.parent === scene],
      scene.made(),
      scene.children.length,
    ];
  });
  expect(read).toEqual([["block", 30, 20, true], ["ball", 70, 10, true], 1, 2]);
  const boxes = await page.evaluate(() =>
    window.scene.children.map((child) => {
      const { x, width } = child.$node.getBoundingClientRect();
      return [x, width];
    }),
  );
  expect(boxes).toEqual([[30, 20], [70, 10]]);
});

test("a path put together is looked up among the files it could be", async ({ page }) => {
  await open(page, "paths");
  const read = await page.evaluate(() => {
    const { scene } = window;
    scene.show();
    const ball = scene.shown;
    scene.page = "Nothing";
    scene.show();
    return [ball === scene.component("Ball"), ball.createObject(null).kind, scene.shown];
  });
  // What names no file stays the path it was.
  expect(read).toEqual([true, "ball", "paths/Nothing.qml"]);
});

// This warns, which the scenes' `test` takes for a failure.
base("a component of a file that is not there says so", async ({ page }) => {
  const warnings = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  await open(page, "paths");
  const read = await page.evaluate(() => {
    const { scene } = window;
    const missing = scene.component("Nothing");
    return [missing.status, missing.errorString(), missing.createObject(scene), scene.make("Nothing", 0), scene.made()];
  });
  expect(read[0]).toBe(3);
  expect(read[1]).toMatch(/\/scenes\/paths\/Nothing\.qml: No such file or directory$/);
  expect(read.slice(2)).toEqual([null, null, 0]);
  expect(warnings).toHaveLength(1);
  expect(warnings[0]).toMatch(/^QQmlComponent: Component is not ready: .*Nothing\.qml: No such file or directory$/);
});
