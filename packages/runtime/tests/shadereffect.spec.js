// What `scenes/shadereffect.qml` is to look like is what Qt's documentation
// says of ShaderEffect: Qt's own offscreen platform, which answers for the
// other scenes, draws no shaders.
import { expect, test as plain } from "@playwright/test";
import { open } from "./open.js";
import { pixels } from "./pixels.js";

const RED = "255 0 0";
const GREEN = "0 255 0";
const BLUE = "0 0 255";
const WHITE = "255 255 255";

const Compiled = 0;
const Failed = 2;

// Two shaders of the scene are there to fail, and say so.
plain("an item is painted by its shaders, with its properties as their uniforms", async ({ page }) => {
  const warnings = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    // The graphics driver says of itself that the browser, drawing without a
    // screen, read a picture back.
    if (message.type() === "warning" && !message.text().includes("GL Driver Message")) warnings.push(message.text());
    // The browser says of itself that a file was not there.
    if (message.type() === "error" && !message.text().includes("404")) errors.push(message.text());
  });
  await open(page, "shadereffect");
  await expect.poll(() => page.evaluate(() => window.scene.statuses())).toEqual([Compiled, Compiled, Compiled, Compiled, Failed, Failed]);
  const logs = await page.evaluate(() => window.scene.logs());
  expect(logs[0]).toBe("");
  expect(logs[1]).toMatch(/nothing/);
  expect(logs[2]).toMatch(/none\.frag is not a shader/);

  const points = [
    // The tint as far as level and shift say, then blue.
    [10, 25],
    [70, 25],
    [80, 25],
    [150, 25],
    // A picture as a texture, its red and blue changed over.
    [20, 85],
    [80, 85],
    // Another effect as a texture, through a ShaderEffectSource.
    [10, 145],
    [90, 145],
    // Shaped by a vertex shader: half as wide, less at the middle rows.
    [45, 182],
    [20, 205],
    [35, 205],
    [70, 205],
    // Nothing is drawn by a shader that failed.
    [10, 250],
  ];
  expect(await pixels(page, points)).toEqual([RED, RED, BLUE, WHITE, BLUE, RED, RED, BLUE, GREEN, GREEN, WHITE, WHITE, WHITE]);

  await page.evaluate(() => window.scene.step(0));
  expect((await pixels(page, points)).slice(0, 8)).toEqual([GREEN, BLUE, BLUE, WHITE, BLUE, RED, GREEN, BLUE]);

  // Of another size it is drawn again, as is one whose uniforms changed; an
  // item's opacity is the page's to apply.
  await page.evaluate(() => window.scene.step(1));
  const HALF = "127 255 127";
  const after = await pixels(page, points);
  expect(after.slice(0, 4)).toEqual([GREEN, BLUE, BLUE, BLUE]);
  expect(after.slice(8, 12)).toEqual([HALF, HALF, HALF, WHITE]);

  expect(errors).toEqual([]);
  expect(warnings.length).toBe(2);
  for (const warning of warnings) expect(warning).toMatch(/^ShaderEffect: /);
});
