import { expect, open, test } from "./open.js";

const attributes = (page) =>
  page.evaluate(() => {
    const said = (item) =>
      Object.fromEntries([...item.$node.attributes].filter(({ name }) => name === "role" || name.startsWith("aria-")).map(({ name, value }) => [name, value]));
    const [button, box, caption] = window.scene.items();
    return { button: said(button), box: said(box), caption: said(caption), id: caption.$node.id };
  });

test("what an item is to a reader is said in ARIA on its element", async ({ page }) => {
  await open(page, "accessible");
  expect(await page.evaluate(() => window.scene.read())).toEqual([true, "backspace", false, 43, 41]);
  let said = await attributes(page);
  expect(said.button).toEqual({ role: "button", "aria-label": "backspace" });
  expect(said.box).toEqual({ role: "checkbox", "aria-checked": "false", "aria-labelledby": said.id });
  expect(said.caption).toEqual({});
  await expect(page.getByRole("button", { name: "backspace" })).toHaveCount(1);

  await page.evaluate(() => window.scene.step());
  said = await attributes(page);
  expect(said.button).toEqual({ role: "button", "aria-label": "backspace", "aria-description": "takes one away" });
  expect(said.box["aria-checked"]).toBe("true");
  expect(said.caption).toEqual({ "aria-hidden": "true" });
});
