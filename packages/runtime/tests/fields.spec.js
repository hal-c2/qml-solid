// TextField and TextArea. What is expected is what Qt 6.11 answers for the
// same scenes (`qml6`), and what it notes when a QtTest `TestCase` makes the
// same moves with its mouse and keys.
import { advance, still, take } from "./notes.js";
import { expect, open, test } from "./open.js";
import { stages } from "./stages.js";

// prettier-ignore
const TEXTFIELD = [
  [[200,40,200,40,24,16],[200,40,0,0,0,0],[0,0,200,40,-1,true],["hint","#80ff0000",3],[false,false,7,true,false],[0,0,0,0,true,0],["","#000000",false,true,7,false],[20,true,true,700,false],[3,4,112,20,-1,30,12],[0,0],[0,5,20,0,2],[12,400,false,"#000000"],[]],
  [[200,40,120,40,0,16],[200,40,0,0,0,0],[0,0,120,40,-1,true],["hint","#80ff0000",0],[false,false,7,true,false],[0,0,0,0,true,0],["","#000000",false,true,7,false],[20,true,true,700,false],[3,4,112,20,-1,30,12],[0,0],[0,5,20,0,2],[12,400,false,"#000000"],[]],
  [[203,42,120,42,0,16],[200,40,2,3,0,0],[3,2,117,40,-1,true],["hint","#80ff0000",0],[false,false,7,true,false],[0,0,0,0,true,0],["","#000000",false,true,7,false],[20,true,true,700,false],[3,4,112,20,-1,30,12],[0,0],[1,5,149,0,2],[12,400,false,"#000000"],[]],
  [[203,42,120,42,0,16],[200,40,2,3,0,0],[3,2,117,40,-1,true],["hint","#80ff0000",0],[false,false,7,true,false],[0,0,0,0,true,0],["","#000000",false,true,7,false],[11,true,true,700,false],[3,4,112,20,-1,30,12],[0,0],[1,5,149,0,2],[12,400,false,"#000000"],[]],
  [[203,42,120,42,0,16],[200,40,2,3,0,0],[3,2,117,40,-1,true],["other","#0000ff",0],[false,false,7,true,false],[0,0,0,0,true,0],["","#000000",false,true,7,false],[11,true,true,700,false],[3,4,112,20,-1,30,12],[0,0],[1,5,149,0,2],[12,400,false,"#000000"],[]],
  [[203,42,120,42,0,16],[200,40,2,3,0,0],[3,2,117,40,-1,true],["other","#0000ff",0],[false,false,1,true,false],[0,0,0,0,true,0],["","#000000",false,true,7,false],[11,true,true,700,false],[3,4,112,20,-1,30,12],[0,0],[1,5,149,0,2],[12,400,false,"#000000"],["reason 1"]],
  [[203,42,120,42,0,16],[200,40,2,3,0,0],[3,2,117,40,-1,true],["other","#0000ff",0],[false,false,7,true,true],[0,0,0,0,true,0],["","#000000",false,true,7,false],[11,true,true,700,false],[3,4,112,20,-1,30,12],[0,0],[1,5,149,0,2],[12,400,false,"#000000"],["reason 7"]],
  [[203,42,120,42,0,16],[200,40,2,3,0,0],[3,2,117,40,-1,true],["other","#0000ff",0],[false,false,0,true,false],[0,0,0,0,true,0],["","#000000",false,true,0,true],[11,true,true,700,false],[3,4,112,20,-1,30,12],[0,0],[1,5,149,0,2],[12,400,false,"#000000"],["reason 0"]],
];

test("a TextField is as big as its style says, behind it a background, and says why it has focus", async ({ page }) => {
  await open(page, "textfield");
  await stages(page, TEXTFIELD);
});

// Where the fields are in the scene.
const at = { field: [10, 10] };
const move = (page, name, x, y) => page.mouse.move(at[name][0] + x, at[name][1] + y);

async function press(page, name, x, y, button = "left") {
  await move(page, name, x, y);
  await page.mouse.down({ button });
}

// Time enough after a release for the next press not to be the second of a
// double click: what QtTest does as well.
async function release(page, button = "left") {
  await page.mouse.up({ button });
  await advance(page, 500);
}

const state = (page, ...names) =>
  page.evaluate((names) => names.map((name) => name.split(".").reduce((from, part) => from[part], window.scene)), names);

// Qt holds a press back from the text until it knows it is not a long one,
// so its field has focus when it is let go; the page's has it when pressed.
test("a TextField says when it is pressed, held and let go, and where", async ({ page }) => {
  await still(page, "textfield");
  await press(page, "field", 20, 15);
  expect(await take(page)).toEqual(["pressed 20,15 1 1 false", "reason 0"]);
  await release(page);
  expect(await take(page)).toEqual(["released 20,15 1 0 false"]);
  expect(await state(page, "field.activeFocus", "field.focusReason")).toEqual([true, 0]);

  await press(page, "field", 30, 12);
  expect(await take(page)).toEqual(["pressed 30,12 1 1 false"]);
  await advance(page, 1000);
  expect(await take(page)).toEqual(["held 30,12 1 1 true"]);
  await release(page);
  expect(await take(page)).toEqual(["released 30,12 1 0 false"]);

  // A press that goes along the text is not a long one.
  await press(page, "field", 30, 12);
  await move(page, "field", 60, 12);
  await advance(page, 1000);
  expect(await take(page)).toEqual(["pressed 30,12 1 1 false"]);
  await release(page);
  expect(await take(page)).toEqual(["released 30,12 1 0 false"]);

  // Nor is one of another button.
  await press(page, "field", 30, 12, "right");
  await advance(page, 1000);
  expect(await take(page)).toEqual(["pressed 30,12 2 2 false"]);
  await release(page, "right");
  expect(await take(page)).toEqual(["released 30,12 2 0 false"]);

  // Beside the text, on the padding, it is the field's all the same.
  await page.evaluate(() => window.scene.bare.forceActiveFocus());
  expect(await take(page)).toEqual(["reason 7"]);
  await press(page, "field", 4, 4);
  expect(await take(page)).toEqual(["pressed 4,4 1 1 false", "reason 0"]);
  await release(page);
  expect(await take(page)).toEqual(["released 4,4 1 0 false"]);
  expect(await state(page, "field.activeFocus", "field.focusReason")).toEqual([true, 0]);
  expect(await page.evaluate(() => document.activeElement === window.scene.field.$input)).toBe(true);
});

test("a TextField hovers where it is asked to, and Tab says why focus came and went", async ({ page }) => {
  await still(page, "textfield");
  await page.evaluate(() => window.scene.field.forceActiveFocus(0));
  await page.mouse.move(300, 250);
  await page.evaluate(() => {
    window.scene.field.hoverEnabled = true;
    window.scene.take();
  });
  await move(page, "field", 20, 20);
  expect(await take(page)).toEqual(["hovered true"]);
  await move(page, "field", 4, 4);
  expect(await take(page)).toEqual([]);
  await page.mouse.move(300, 250);
  expect(await take(page)).toEqual(["hovered false"]);
  await move(page, "field", 20, 20);
  expect(await take(page)).toEqual(["hovered true"]);
  // It is over the field until it moves.
  await page.evaluate(() => (window.scene.field.hoverEnabled = false));
  expect(await state(page, "field.hoverEnabled", "field.hovered")).toEqual([false, true]);
  await move(page, "field", 23, 20);
  expect(await take(page)).toEqual(["hovered false"]);

  await page.keyboard.press("Tab");
  expect(await take(page)).toEqual(["reason 1"]);
  expect(await state(page, "field.activeFocus", "bare.activeFocus", "bare.focusReason", "field.focusReason")).toEqual([false, true, 1, 1]);
  await page.keyboard.press("Shift+Tab");
  expect(await take(page)).toEqual(["reason 2"]);
  expect(await state(page, "field.activeFocus", "field.focusReason", "bare.focusReason")).toEqual([true, 2, 2]);
});
