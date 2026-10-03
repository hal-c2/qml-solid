// The compiled bricks, in a real browser: what they render and how they update.
import { expect, test } from "@playwright/test";

const named = (page, name) => page.locator(`[data-object-name="${name}"]`);

test.beforeEach(async ({ page }) => {
  const problems = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => message.type() === "error" && problems.push(message.text()));
  page.problems = problems;
  await page.goto("/");
  await expect(named(page, "demo")).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(page.problems).toEqual([]);
});

test("renders every brick", async ({ page }) => {
  const bricks = await named(page, "demo").locator("> *").evaluateAll((all) => all.map((el) => el.dataset.objectName));
  expect(bricks).toEqual([
    "workingIndicator", "notifications", "approvals", "pendingUserInput", "revertPicker", "threadOverlay",
    "addProjectInvite",
  ]);
  await expect(named(page, "workingIndicator")).toHaveText("● Working… 12s");
  await expect(named(page, "notifications").locator("> *")).toHaveCount(2);
});

test("literal properties are in the template, not set at run time", async ({ page }) => {
  await expect(named(page, "notifications")).toHaveAttribute("style", "flex-direction:column;flex-shrink:0");
  await expect(named(page, "demo")).toHaveCSS("flex-direction", "column");
  expect(await named(page, "demo").evaluate((el) => el.style.width)).toBe("64ch");
});

test("visible follows its binding", async ({ page }) => {
  await expect(named(page, "revertPicker")).toBeHidden();
  await page.evaluate(() => demo.Shell.setState((state) => { state.revert.open = true; }));
  await expect(named(page, "revertPicker")).toBeVisible();
});

test("a handler in a delegate removes its row and keeps the others", async ({ page }) => {
  const kept = await named(page, "notification-n2").elementHandle();
  await named(page, "notificationDismiss-n1").click();
  expect(await page.evaluate(() => demo.Shell.log.at(-1))).toEqual(["notification.dismiss", { id: "n1" }]);
  await expect(named(page, "notifications").locator("> *")).toHaveCount(1);
  expect(await kept.evaluate((el) => el.isConnected && el.dataset.objectName)).toBe("notification-n2");
});

test("a handler inside a component instance", async ({ page }) => {
  await named(page, "addProjectInviteAction").click();
  expect(await page.evaluate(() => demo.Shell.log.at(-1)[0])).toBe("project.add");
  await expect(named(page, "notifications").locator("> *")).toHaveCount(3);
});

test("text and delegate bindings update", async ({ page }) => {
  await page.evaluate(() => demo.Shell.setState((state) => {
    state.timeline.working.text = "● Working… 13s";
    state.approvals.items[1].active = true;
  }));
  await expect(named(page, "workingIndicator")).toHaveText("● Working… 13s");
  await expect(named(page, "approval-a2").locator("> *").first()).toHaveText("▸ ");
});

test("a new theme restyles the nodes in place", async ({ page }) => {
  const title = await named(page, "addProjectInviteTitle").elementHandle();
  const before = await title.evaluate((el) => getComputedStyle(el).color);
  await page.evaluate(() => demo.setTheme("light"));
  await expect(named(page, "addProjectInviteTitle")).not.toHaveCSS("color", before);
  expect(await title.evaluate((el) => el.isConnected)).toBe(true);
});
