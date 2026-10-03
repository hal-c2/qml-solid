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
    "addProjectInvite", "features",
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

// What one QML file asks of another, decided when both are compiled.
const logged = (page, action) =>
  page.evaluate((action) => demo.Shell.log.filter(([name]) => name === action).map(([, payload]) => payload), action);

test("an instance sets the component's properties and its root object's", async ({ page }) => {
  // `objectName` is the root's, `title` the component's, `note` an alias of a child's text.
  const [counter, plain] = [named(page, "counterCard"), named(page, "plainCard")];
  await expect(named(page, "card")).toHaveCount(0);
  await expect(counter.locator('[data-object-name="cardTitle"]')).toHaveText("Picked 0");
  await expect(counter.locator('[data-object-name="cardNote"]')).toHaveText("keep going");
  await expect(plain.locator('[data-object-name="cardTitle"]')).toHaveText("Untitled");
  await expect(plain.locator('[data-object-name="cardNote"]')).toHaveText("no note");
  const border = (card) => card.evaluate((el) => getComputedStyle(el).borderTopColor);
  expect(await border(counter)).not.toBe(await border(plain));
});

test("an instance's children go where the default alias points", async ({ page }) => {
  const names = (card) =>
    named(page, card).locator('[data-object-name="cardBody"] > *').evaluateAll((all) => all.map((el) => el.dataset.objectName));
  expect(await names("counterCard")).toEqual(["pill", "cardChild"]);
  expect(await names("plainCard")).toEqual([]);
});

test("an inline component takes its own properties and its root's", async ({ page }) => {
  await expect(named(page, "pill")).toHaveText("[inline]");
  // The instance's colour (the theme's `success`), not the component's own.
  await expect(named(page, "pill")).toHaveCSS("color", "rgb(158, 206, 106)");
});

test("a signal reaches the instance's handler with its arguments", async ({ page }) => {
  const title = named(page, "counterCard").locator('[data-object-name="cardTitle"]');
  const node = await title.elementHandle();
  for (const count of [1, 2, 3]) {
    await title.click();
    await expect(title).toHaveText(`Picked ${count}`);
  }
  await expect(named(page, "counterCard").locator('[data-object-name="cardNote"]')).toHaveText("enough");
  expect(await node.evaluate((el) => el.isConnected)).toBe(true);
  // A card nothing listens to still emits.
  await named(page, "plainCard").locator('[data-object-name="cardTitle"]').click();
  expect(page.problems).toEqual([]);
});

test("lifecycle and change handlers run when QML runs them", async ({ page }) => {
  expect(await logged(page, "card.completed")).toEqual([{ title: "Picked 0" }, { title: "Untitled" }]);
  // Not for the first value, only for a change.
  expect(await logged(page, "card.retitled")).toEqual([]);
  await named(page, "counterCard").locator('[data-object-name="cardTitle"]').click();
  await expect.poll(() => logged(page, "card.retitled")).toEqual([{ title: "Picked 1" }]);
});
