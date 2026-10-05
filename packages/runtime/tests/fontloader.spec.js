// A FontLoader whose file cannot be read says so, as Qt's does: what is set
// in its family is set in another font, which nothing else tells of.
import { test as plain } from "@playwright/test";
import { expect, open } from "./open.js";

plain("a font that cannot be loaded is told of", async ({ page }) => {
  const problems = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") problems.push(message.text());
  });
  await open(page, "fontloader");
  await page.waitForFunction(() => window.objects.missing.status === 3);
  expect(await page.evaluate(() => window.objects.missing.name)).toBe("");
  expect(problems.length).toBe(1);
  expect(problems[0]).toMatch(/^FontLoader: Cannot load font: "http.*\/scenes\/fonts\/nowhere,at%20all\.ttf"$/);
});
