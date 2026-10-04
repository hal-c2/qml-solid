// SpinBox and DoubleSpinBox. What is expected is what Qt 6.11 answers for
// the same scene (`qml6`), and what it notes when a QtTest `TestCase` makes
// the same moves with its mouse, wheel and keys.
import { advance, call, read, said, set, still as base, take } from "./notes.js";
import { expect, open, test } from "./open.js";
import { lettered, stages } from "./stages.js";

// prettier-ignore
const SPINBOX = [
  [[0,99,0,1,"0",false,false,false,65536,false],[140,36,140,36,30,30,30,0,80,36,"0"],[110,0,30,36,0,true,true,30,36,false,false,true],[0,0,30,36,0,false,true,30,32,false,false],[0,false,true,false,false,7,false,true,true],[0,99,0,1,"0",true,true,true,true],[0,0,0,false,false,0,"function","function"],["-1.234",1234,"1,235"],[10,-10,10,4,"10",true,false],[200,500,"200",4],[1,"some","some","all",1],[0,99.99,2.35,0.25,2,"2.35","2.35",true,true,true],[0,99.99,0,1,2,"0.00",true,65536,"1.234,568",1234.5],[]],
  [[0,99,99,1,"99",false,false,false,65536,false],[140,36,140,36,30,30,30,0,80,36,"99"],[110,0,30,36,0,false,true,30,36,false,false,true],[0,0,30,36,0,true,true,30,32,false,false],[0,false,true,false,false,7,false,true,true],[0,99,0,1,"0",true,true,true,true],[0,0,0,false,false,0,"function","function"],["-1.234",1234,"1,235"],[10,-10,-10,4,"-10",false,true],[200,500,"200",4],[1,"some","some","all",1],[0,99.99,99.99,0.25,2,"99.99","99.99",false,true,true],[0,99.99,0,1,2,"0.00",true,65536,"1.234,568",1234.5],["real.text 99.99","real.value 99.99","text 99","value 99"]],
  [[0,50,50,1,"50",false,false,false,65536,false],[140,36,140,36,30,30,30,0,80,36,"50"],[110,0,30,36,0,false,true,30,36,false,false,true],[0,0,30,36,0,true,true,30,32,false,false],[0,false,true,false,false,7,false,true,true],[0,99,0,1,"0",true,true,true,true],[0,0,0,false,false,0,"function","function"],["-1.234",1234,"1,235"],[10,-10,-10,4,"-10",false,true],[200,500,"200",4],[1,"some","some","all",1],[0,20,20,0.25,2,"20.00","20.00",false,true,true],[0,99.99,0,1,2,"0.00",true,65536,"1.234,568",1234.5],["real.text 20.00","real.value 20","text 50","value 50"]],
  [[60,50,60,1,"60",false,false,false,65536,false],[140,36,140,36,30,30,30,0,80,36,"60"],[110,0,30,36,0,true,true,30,36,false,false,true],[0,0,30,36,0,false,true,30,32,false,false],[0,false,true,false,false,7,false,true,true],[0,99,0,1,"0",true,true,true,true],[0,0,0,false,false,0,"function","function"],["-1.234",1234,"1,235"],[10,-10,-10,4,"-10",false,true],[200,500,"200",4],[1,"some","some","all",1],[0,20,20,0.25,2,"20.00","20.00",false,true,true],[0,99.99,0,1,2,"0.00",true,65536,"1.234,568",1234.5],["text 60","value 60"]],
  [[60,50,58,1,"58",false,false,false,65536,false],[140,36,140,36,30,30,30,0,80,36,"58"],[110,0,30,36,0,true,true,30,36,false,false,true],[0,0,30,36,0,true,true,30,32,false,false],[0,false,true,false,false,7,false,true,true],[0,99,0,1,"0",true,true,true,true],[0,0,0,false,false,0,"function","function"],["-1.234",1234,"1,235"],[10,-10,-6,4,"-6",true,true],[200,500,"200",4],[1,"some","some","all",1],[0,20,19.75,0.25,2,"19.75","19.75",true,true,true],[0,99.99,0,1,2,"0.00",true,65536,"1.234,568",1234.5],["real.text 19.75","real.value 19.75","text 58","text 59","value 58","value 59"]],
  [[0,50,49,1,"49",false,false,true,65536,false],[140,36,140,36,30,30,30,0,80,36,"49"],[110,0,30,36,0,true,true,30,36,false,false,true],[0,0,30,36,0,true,true,30,32,false,false],[0,false,true,false,false,7,false,true,true],[0,99,0,1,"0",true,true,true,true],[0,0,0,false,false,0,"function","function"],["-1.234",1234,"1,235"],[10,-10,-6,4,"-6",true,true],[200,500,"200",4],[1,"some","some","all",1],[0,20,0,0.25,2,"0.00","0.00",true,true,true],[0,99.99,0,1,2,"0.00",true,65536,"1.234,568",1234.5],["real.text 0.00","real.text 20.00","real.value 0","real.value 20","text 49","text 50","value 49","value 50"]],
  [[0,50,50,7,"50",false,false,false,65536,false],[140,36,140,36,30,30,30,0,80,36,"50"],[110,0,30,36,0,false,true,30,36,false,false,true],[0,0,30,36,0,true,true,30,32,false,false],[0,false,true,false,false,7,false,true,true],[0,99,0,1,"0",true,true,true,true],[0,0,0,false,false,0,"function","function"],["-1.234",1234,"1,235"],[10,-10,-6,4,"-6",true,true],[200,500,"200",4],[1,"some","some","all",1],[0,20,0.004,0.004,2,"0.00","0.00",true,true,true],[0,99.99,0,1,2,"0.00",true,65536,"1.234,568",1234.5],["real.value 0.004","text 50","value 50"]],
  [[0,50,50,7,"50",false,false,false,65536,false],[140,36,140,36,30,30,30,0,80,36,"50"],[110,0,30,36,0,false,true,30,36,false,false,true],[0,0,30,36,0,true,true,30,32,false,false],[0,false,true,false,false,7,false,true,true],[0,99,0,1,"0",true,true,true,true],[0,0,0,false,false,0,"function","function"],["-1.234",1234,"1,235"],[10,-10,-6,4,"-6",true,true],[200,500,"200",4],[1,"some","some","all",1],[0,20,0,0.004,1,"0.0","0.0",true,true,true],[0,99.99,0,1,2,"0.00",true,65536,"1.234,568",1234.5],["real.text 0.0","real.value 0"]],
  [[0,100000,12345,7,"12.345",false,false,false,65536,false],[140,36,140,36,30,30,30,0,80,36,"12.345"],[110,0,30,36,0,true,true,30,36,false,false,true],[0,0,30,36,0,true,true,30,32,false,false],[0,false,true,false,false,7,false,true,true],[0,99,0,1,"0",true,true,true,true],[0,0,0,false,false,0,"function","function"],["-1.234",1234,"1,235"],[10,-10,-6,4,"-6",true,true],[200,500,"200",4],[1,"some","some","all",1],[0,5000,1234.6,0.004,1,"1.234,6","1.234,6",true,true,true],[0,99.99,0,1,2,"0.00",true,65536,"1.234,568",1234.5],["real.text 1,234.6","real.text 1.234,6","real.value 1234.6","text 12,345","text 12.345","value 12345"]],
  [[0,100000,3,7,"<3>",false,false,false,65536,false],[140,36,140,36,30,30,30,0,80,36,"<3>"],[110,0,30,36,0,true,true,30,36,false,false,true],[0,0,30,36,0,true,true,30,32,false,false],[0,false,true,false,false,7,false,true,true],[0,99,0,1,"0",true,true,true,true],[0,0,0,false,false,0,"function","function"],["-1.234",1234,"1,235"],[10,-10,-6,4,"-6",true,true],[300,500,"300",6],[1,"some","some","all",1],[0,5000,1234.6,0.004,1,"1.234,6","1.234,6",true,true,true],[0,99.99,0,1,2,"0.00",true,65536,"1.234,568",1234.5],["text <3>","value 3"]],
  [[0,100000,3,7,"<3>",false,false,false,65536,false],[140,36,140,36,30,30,30,0,80,36,"<3>"],[110,0,30,36,0,true,true,30,36,false,false,true],[0,0,30,36,0,true,true,30,32,false,false],[0,false,true,false,false,7,false,true,true],[0,99,0,1,"0",true,true,true,true],[0,0,0,false,false,0,"function","function"],["-1.234",1234,"1,235"],[10,-10,-6,4,"-6",true,true],[50,250,"50",1],[1,"some","some","all",1],[0,5000,1234.6,0.004,1,"1.234,6","1.234,6",true,true,true],[0,99.99,0,1,2,"0.00",true,65536,"1.234,568",1234.5],[]],
  [[0,100000,3,7,"<3>",true,false,false,65536,false],[140,36,140,36,30,30,30,0,80,36,"<3>"],[0,0,30,36,0,true,true,30,36,false,false,true],[110,0,30,36,0,true,true,30,32,false,false],[0,false,true,false,false,7,false,false,true],[0,99,0,1,"0",true,true,true,true],[0,0,0,false,false,0,"function","function"],["-1.234",1234,"1,235"],[10,-10,-6,4,"-6",true,true],[50,250,"50",1],[1,"some","some","all",1],[0,5000,1234.6,0.004,1,"1.234,6","1.234,6",true,true,false],[0,99.99,0,1,2,"0.00",true,65536,"1.234,568",1234.5],[]],
  [[0,100000,3,7,"<3>",true,false,false,65536,false],[140,36,140,36,30,30,30,0,80,36,"<3>"],[0,0,30,36,0,true,true,30,36,false,false,true],[110,0,30,36,0,true,true,30,32,false,false],[0,false,true,false,false,7,false,false,true],[0,99,0,1,"0",true,true,true,true],[0,0,0,false,false,0,"function","function"],["-1.234",1234,"1,235"],[10,-10,-6,4,"-6",true,true],[50,250,"50",1],[2,"all","all","all",1],[0,5000,1234.6,0.004,1,"1.234,6","1.234,6",true,true,false],[0,99.99,0,1,2,"0.00",true,65536,"1.234,568",1234.5],[]],
  [[0,100000,3,7,"<3>",true,false,false,65536,false],[140,36,140,36,30,30,30,0,80,36,"<3>"],[0,0,30,36,0,true,true,30,36,false,false,true],[110,0,30,36,0,true,true,30,32,false,false],[0,false,true,true,true,1,false,false,true],[0,99,0,1,"0",true,true,true,true],[0,0,0,false,false,0,"function","function"],["-1.234",1234,"1,235"],[10,-10,-6,4,"-6",true,true],[50,250,"50",1],[2,"all","all","all",1],[0,5000,1234.6,0.004,1,"1.234,6","1.234,6",true,true,false],[0,99.99,0,1,2,"0.00",true,65536,"1.234,568",1234.5],["reason 1"]],
  [[0,100000,0,7,"<0>",true,false,false,65536,false],[140,32,140,32,0,30,0,0,110,32,"<0>"],[0,0,30,32,0,true,false,0,0,false,false,false],[110,0,30,32,0,false,true,30,32,false,false],[0,false,true,false,false,7,false,false,false],[0,99,0,1,"0",true,true,true,true],[0,0,0,false,true,0,"function","function"],["-1.234",1234,"1,235"],[10,-10,-6,4,"-6",true,true],[50,250,"50",1],[2,"all","all","all",1],[0,5000,1234.6,0.004,1,"1.234,6","1.234,6",true,true,false],[0,99.99,0,1,2,"0.00",true,65536,"1.234,568",1234.5],["modified 0","reason 7","text <0>","value 0"]],
];

test("a spin box keeps its value between its ends, steps it and writes it as its locale does", async ({ page }) => {
  await open(page, "spinbox");
  await stages(page, SPINBOX);
});

const still = async (page) => {
  await base(page, "spinbox");
  await lettered(page);
  // Where QtTest leaves its mouse before each of its tests.
  await page.mouse.move(300, 250);
  await take(page);
};

// Where the boxes are in the scene.
const at = { box: [10, 10], named: [10, 70], real: [10, 120] };
const move = (page, name, x, y) => page.mouse.move(at[name][0] + x, at[name][1] + y);

async function press(page, name, x, y) {
  await move(page, name, x, y);
  await page.mouse.down();
}

// Time enough after a release for the next press not to be the second of a
// double click: what QtTest does as well.
async function release(page) {
  await page.mouse.up();
  await advance(page, 500);
}

async function click(page, name, x, y) {
  await press(page, name, x, y);
  await release(page);
}

// The wheel as Qt counts it: 120 to a notch, up and to the left positive.
async function wheel(page, name, x, y, across, up) {
  await move(page, name, x, y);
  await page.mouse.wheel(-across / 1.2, -up / 1.2);
  await page.waitForFunction(() => new Promise((done) => requestAnimationFrame(() => done(true))));
}

// What a box noted, and what it is then. `valueModified` is a signal, and is
// noted in its place.
async function tell(page, notes, names = [], state = []) {
  await said(page, notes, /modified /);
  expect(await read(page, ...names)).toEqual(state);
}

test("a press of an indicator steps a spin box when it is released, and again and again while it is held", async ({
  page,
}) => {
  await still(page);
  const value = ["box.value"];
  await press(page, "box", 120, 10);
  await tell(
    page,
    ["up.hovered true", "up.pressed true"],
    ["box.value", "box.activeFocus", "input.activeFocus", "box.focusReason", "box.hovered"],
    [0, false, false, 7, true],
  );
  await release(page);
  await tell(page, ["text 1", "value 1", "up.pressed false", "modified 1"], value, [1]);

  // Held: nothing for 300 ms, and then a step every 100.
  await press(page, "box", 120, 10);
  await tell(page, ["up.pressed true"], value, [1]);
  await advance(page, 250);
  await tell(page, [], value, [1]);
  await advance(page, 100);
  await tell(page, [], value, [1]);
  await advance(page, 100);
  await tell(page, ["text 2", "value 2", "modified 2"], value, [2]);
  await advance(page, 100);
  await tell(page, ["text 3", "value 3", "modified 3"], value, [3]);
  // The release of one that repeated steps no more.
  await release(page);
  await tell(page, ["up.pressed false"], value, [3]);

  // The press is of whichever indicator the mouse is over.
  await press(page, "box", 10, 10);
  await tell(page, ["up.hovered false", "down.hovered true", "down.pressed true"], value, [3]);
  await move(page, "box", 60, 10);
  await tell(page, ["down.hovered false", "down.pressed false"], value, [3]);
  await move(page, "box", 12, 10);
  await tell(page, ["down.hovered true", "down.pressed true"], value, [3]);
  await move(page, "box", 125, 10);
  await tell(page, ["up.hovered true", "up.pressed true", "down.hovered false", "down.pressed false"], value, [3]);
  await release(page);
  await tell(page, ["text 4", "value 4", "up.pressed false", "modified 4"], value, [4]);

  await press(page, "box", 10, 10);
  await tell(page, ["up.hovered false", "down.hovered true", "down.pressed true"], value, [4]);
  await move(page, "box", 60, 50);
  await tell(page, ["down.hovered false", "down.pressed false"], ["box.value", "box.hovered"], [4, false]);
  await release(page);
  await tell(page, [], value, [4]);

  // One that the mouse left stops repeating, and does not start again.
  await press(page, "box", 120, 10);
  await tell(page, ["up.hovered true", "up.pressed true"]);
  await advance(page, 450);
  await tell(page, ["text 5", "value 5", "modified 5"], value, [5]);
  await move(page, "box", 60, 10);
  await tell(page, ["up.hovered false", "up.pressed false"], value, [5]);
  await advance(page, 450);
  await tell(page, [], value, [5]);
  await move(page, "box", 120, 10);
  await tell(page, ["up.hovered true", "up.pressed true"], value, [5]);
  await advance(page, 450);
  await tell(page, [], value, [5]);
  await release(page);
  await tell(page, ["text 6", "value 6", "up.pressed false", "modified 6"], value, [6]);

  // At an end, the indicator that would step past it is disabled.
  await set(page, "box.value", 98);
  await tell(page, ["text 98", "value 98"]);
  await click(page, "box", 120, 10);
  await tell(
    page,
    ["up.pressed true", "text 99", "value 99", "up.pressed false", "modified 99", "up.hovered false"],
    ["box.value", "box.up.indicator.enabled", "box.up.hovered"],
    [99, false, false],
  );
  await press(page, "box", 120, 10);
  await tell(page, [], ["box.value", "box.up.pressed"], [99, false]);
  await release(page);
  await tell(page, [], value, [99]);

  // The other buttons are not its.
  await move(page, "box", 10, 10);
  await page.mouse.down({ button: "right" });
  await tell(page, ["down.hovered true"], ["box.down.pressed"], [false]);
  await page.mouse.up({ button: "right" });
  await tell(page, [], value, [99]);
});

test("the indicator of a spin box that the mouse is over is hovered, if it is enabled", async ({ page }) => {
  await still(page);
  await set(page, "box.value", 99);
  await take(page);
  const up = ["box.hovered", "box.up.hovered"];
  const down = ["box.hovered", "box.down.hovered"];
  await move(page, "box", 120, 10);
  await tell(page, [], up, [true, false]);
  await move(page, "box", 60, 10);
  await tell(page, [], up, [true, false]);
  await move(page, "box", 10, 10);
  await tell(page, ["down.hovered true"], down, [true, true]);
  await page.mouse.move(300, 250);
  await tell(page, ["down.hovered false"], down, [false, false]);

  await set(page, "box.value", 50);
  await take(page);
  await move(page, "box", 120, 10);
  await tell(page, ["up.hovered true"], up, [true, true]);
  await move(page, "box", 10, 10);
  await tell(page, ["up.hovered false", "down.hovered true"], down, [true, true]);

  // A box that does not hover says nothing until the mouse moves, and then
  // only what is pressed is hovered.
  await set(page, "box.hoverEnabled", false);
  await tell(page, [], down, [true, true]);
  await move(page, "box", 120, 10);
  await tell(page, ["down.hovered false"], ["box.hovered", "box.up.hovered", "box.down.hovered"], [false, false, false]);
  await page.mouse.down();
  const both = ["box.up.hovered", "box.down.hovered"];
  await tell(page, ["up.pressed true"], both, [false, false]);
  await move(page, "box", 122, 10);
  await tell(page, ["up.hovered true"], both, [true, false]);
  await release(page);
  await tell(page, ["text 51", "value 51", "up.pressed false", "modified 51"], both, [true, false]);
  await set(page, "box.hoverEnabled", true);
  await tell(page, [], ["box.hovered", "box.up.hovered", "box.down.hovered"], [false, true, false]);
});

test("the indicator under the mouse stops being hovered when the value reaches its end", async ({ page }) => {
  await still(page);
  await set(page, "box.value", 98);
  await move(page, "box", 120, 10);
  await take(page);
  // Qt says so when it next draws.
  await call(page, "box.increase");
  await tell(page, ["text 99", "value 99", "up.hovered false"], ["box.up.hovered", "box.hovered"], [false, true]);
  await call(page, "box.decrease");
  await tell(page, ["text 98", "value 98", "up.hovered true"], ["box.up.hovered"], [true]);
});

test("the keys up and down step a spin box that has focus", async ({ page }) => {
  await still(page);
  await set(page, "box.value", 98);
  await take(page);
  await call(page, "box.forceActiveFocus");
  await tell(page, [], ["box.activeFocus", "input.activeFocus"], [true, false]);
  await page.keyboard.down("ArrowDown");
  await tell(
    page,
    ["down.pressed true", "text 97", "value 97", "modified 97"],
    ["box.value", "box.down.pressed"],
    [97, true],
  );
  await page.keyboard.up("ArrowDown");
  await tell(page, ["down.pressed false"], ["box.value", "box.down.pressed"], [97, false]);
  const value = ["box.value"];
  await page.keyboard.press("ArrowUp");
  await tell(page, ["up.pressed true", "text 98", "value 98", "modified 98", "up.pressed false"], value, [98]);
  await page.keyboard.press("ArrowUp");
  await tell(page, ["up.pressed true", "text 99", "value 99", "modified 99", "up.pressed false"], value, [99]);
  // The end: its indicator is disabled, and the key does nothing.
  await page.keyboard.press("ArrowUp");
  await tell(page, [], value, [99]);
  await page.keyboard.press("ArrowLeft");
  await tell(page, [], value, [99]);
  await page.keyboard.press("PageDown");
  await tell(page, [], value, [99]);
});

test("the wheel steps a spin box that says it may, by as much as it turned", async ({ page }) => {
  await still(page);
  await set(page, "box.value", 99);
  await take(page);
  const value = ["box.value"];
  await wheel(page, "box", 60, 10, 0, -120);
  await tell(page, [], value, [99]);
  await set(page, "box.wheelEnabled", true);
  await wheel(page, "box", 60, 10, 0, -120);
  await tell(page, ["text 98", "value 98", "modified 98"], value, [98]);
  await wheel(page, "box", 60, 10, 0, -240);
  await tell(page, ["text 96", "value 96", "modified 96"], value, [96]);
  // Half a notch is no step of a whole number.
  await wheel(page, "box", 60, 10, 0, 60);
  await tell(page, [], value, [96]);
  await wheel(page, "box", 60, 10, 0, 600);
  await tell(page, ["text 99", "value 99", "modified 99"], value, [99]);
  await wheel(page, "box", 60, 10, -120, 0);
  await tell(page, ["text 98", "value 98", "modified 98"], value, [98]);
  await wheel(page, "box", 60, 10, -120, 240);
  await tell(page, ["text 99", "value 99", "modified 99"], value, [99]);
});

test("what is typed into an editable spin box is its value when it is entered or loses focus", async ({ page }) => {
  await still(page);
  await set(page, "box.value", 97);
  await call(page, "box.forceActiveFocus");
  await take(page);
  await set(page, "box.editable", true);
  await tell(page, [], ["box.activeFocus", "input.activeFocus", "input.readOnly"], [true, false, false]);
  await click(page, "box", 60, 18);
  await tell(page, ["reason 0"], ["box.activeFocus", "input.activeFocus", "box.focusReason"], [true, true, 0]);

  const shown = ["box.value", "box.displayText", "input.text"];
  await call(page, "input.selectAll");
  await page.keyboard.press("4");
  await tell(page, ["text 4"], shown, [97, "4", "4"]);
  await page.keyboard.press("2");
  await tell(page, ["text 42"], shown, [97, "42", "42"]);
  // What the validator does not take.
  await page.keyboard.press("7");
  await tell(page, [], shown, [97, "42", "42"]);
  await page.keyboard.press("a");
  await tell(page, [], shown, [97, "42", "42"]);
  await page.keyboard.down("Enter");
  await tell(page, [], shown, [97, "42", "42"]);
  await page.keyboard.up("Enter");
  await tell(page, ["value 42", "modified 42"], shown, [42, "42", "42"]);
  await page.keyboard.press("ArrowUp");
  await tell(
    page,
    ["up.pressed true", "text 43", "value 43", "modified 43", "up.pressed false"],
    [...shown, "input.cursorPosition"],
    [43, "43", "43", 2],
  );

  await page.keyboard.press("Backspace");
  await tell(page, ["text 4"], shown, [43, "4", "4"]);
  await page.keyboard.press("Backspace");
  await tell(page, ["text "], shown, [43, "", ""]);
  await page.keyboard.press("Enter");
  await tell(page, ["text 0", "value 0", "modified 0"], shown, [0, "0", "0"]);
  await page.keyboard.press("5");
  await tell(page, ["text 05"], shown, [0, "05", "05"]);
  await call(page, "bare.forceActiveFocus");
  await tell(page, ["reason 7", "text 5", "value 5", "modified 5"], [...shown, "box.activeFocus"], [5, "5", "5", false]);

  // Typed, and then a key that steps it: from what was typed.
  await call(page, "box.forceActiveFocus");
  await tell(page, [], ["box.activeFocus", "input.activeFocus"], [true, true]);
  await call(page, "input.selectAll");
  await page.keyboard.press("3");
  await page.keyboard.press("0");
  await tell(page, ["text 3", "text 30"], shown, [5, "30", "30"]);
  await page.keyboard.press("ArrowDown");
  await tell(
    page,
    ["down.pressed true", "text 4", "value 4", "modified 4", "down.pressed false"],
    shown,
    [4, "4", "4"],
  );
  await page.keyboard.press("8");
  await tell(page, ["text 48"], shown, [4, "48", "48"]);
  await click(page, "box", 10, 10);
  await tell(
    page,
    ["down.hovered true", "down.pressed true", "text 3", "value 3", "down.pressed false", "modified 3"],
    [...shown, "input.activeFocus"],
    [3, "3", "3", true],
  );

  // Tab stops at what is typed into.
  await page.keyboard.press("Tab");
  await tell(
    page,
    ["reason 1"],
    ["box.value", "input.activeFocus", "word.activeFocus", "box.focusReason"],
    [3, false, true, 1],
  );
  await page.keyboard.press("Shift+Tab");
  await tell(page, ["reason 2"], ["box.activeFocus", "input.activeFocus", "box.focusReason"], [true, true, 2]);
});

test("a live spin box has the value that is typed as it is typed", async ({ page }) => {
  await still(page);
  await set(page, "box.editable", true);
  await set(page, "box.value", 3);
  await call(page, "box.forceActiveFocus");
  await take(page);
  const shown = ["box.value", "box.displayText", "input.text"];
  await set(page, "box.live", true);
  await tell(page, []);
  await call(page, "input.selectAll");
  await page.keyboard.press("6");
  await tell(page, ["text 6", "value 6"], shown, [6, "6", "6"]);
  await page.keyboard.press("1");
  await tell(page, ["text 61", "value 61"], shown, [61, "61", "61"]);
  await page.keyboard.press("Backspace");
  await tell(page, ["text 6", "value 6"], shown, [6, "6", "6"]);
  await page.keyboard.press("Backspace");
  await tell(page, ["text 0", "value 0"], shown, [0, "0", "0"]);
  await page.keyboard.press("8");
  await tell(page, ["text 8", "value 8"], shown, [8, "8", "8"]);
  // One that becomes live has what was typed before.
  await set(page, "box.live", false);
  await page.keyboard.press("8");
  await tell(page, ["text 88"], shown, [8, "88", "88"]);
  await set(page, "box.live", true);
  await tell(page, ["value 88"], shown, [88, "88", "88"]);
});

test("a spin box reads what is typed as its `valueFromText` does", async ({ page }) => {
  await still(page);
  await call(page, "named.forceActiveFocus");
  await tell(page, [], ["named.activeFocus", "word.activeFocus"], [true, true]);
  await call(page, "word.selectAll");
  for (const key of "all") await page.keyboard.press(key);
  await tell(page, [], ["named.value", "named.displayText"], [1, "all"]);
  await page.keyboard.press("Enter");
  await tell(page, ["named.modified 2"], ["named.value", "named.displayText"], [2, "all"]);
  // A word that is none of its: no value, which is the least it has.
  await page.keyboard.press("x");
  await page.keyboard.press("Enter");
  await tell(page, ["named.modified 0"], ["named.value", "named.displayText", "word.text"], [0, "none", "none"]);
});

test("a spin box of real numbers steps, turns and reads as one of whole numbers does", async ({ page }) => {
  await still(page);
  const value = ["real.value", "real.displayText"];
  await click(page, "real", 130, 10);
  await tell(page, ["real.text 2.60", "real.value 2.6", "real.modified 2.6"], value, [2.6, "2.60"]);
  await click(page, "real", 10, 10);
  await tell(page, ["real.text 2.35", "real.value 2.35", "real.modified 2.35"], value, [2.35, "2.35"]);
  // Half a notch is half a step, and more digits than it shows.
  await set(page, "real.wheelEnabled", true);
  await wheel(page, "real", 60, 10, 0, 60);
  await tell(page, ["real.text 2.48", "real.value 2.475", "real.modified 2.475"], value, [2.475, "2.48"]);

  await set(page, "real.editable", true);
  await click(page, "real", 60, 10);
  await tell(page, [], ["real.activeFocus", "realInput.activeFocus"], [true, true]);
  const shown = [...value, "realInput.text"];
  await call(page, "realInput.selectAll");
  for (const key of "7.129") await page.keyboard.press(key);
  await tell(page, ["real.text 7", "real.text 7.", "real.text 7.1", "real.text 7.12"], shown, [2.475, "7.12", "7.12"]);
  await page.keyboard.press("Enter");
  await tell(page, ["real.value 7.12", "real.modified 7.12"], shown, [7.12, "7.12", "7.12"]);
  await page.keyboard.press("ArrowUp");
  await tell(page, ["real.text 7.37", "real.value 7.37", "real.modified 7.37"], shown, [7.37, "7.37", "7.37"]);
  await set(page, "real.value", 99.9);
  await take(page);
  await page.keyboard.press("ArrowUp");
  await tell(
    page,
    ["real.text 99.99", "real.value 99.99", "real.modified 99.99"],
    [...value, "real.up.indicator.enabled"],
    [99.99, "99.99", false],
  );
  await page.keyboard.press("ArrowUp");
  await tell(page, [], value, [99.99, "99.99"]);
});
