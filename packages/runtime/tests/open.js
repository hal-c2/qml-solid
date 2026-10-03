// `test` for scenes: anything the page logs as an error or a warning fails
// the test. Solid's diagnostics are warnings: a read it could not track, a
// write it would not allow.
import { expect, test as base } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, use) => {
    const problems = [];
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") problems.push(message.text());
    });
    await use(page);
    expect(problems).toEqual([]);
  },
});

export { expect };

// Opens `scenes/<scene>.js` and waits for it.
export async function open(page, scene) {
  await page.goto(`/?scene=${scene}`);
  await page.waitForFunction(() => window.ready);
}

// An item's rectangle on the page, by the name the scene exported it under.
export const rect = (page, name) =>
  page.evaluate((name) => {
    const { x, y, width, height } = window.objects[name].$node.getBoundingClientRect();
    return { x, y, width, height };
  }, name);
