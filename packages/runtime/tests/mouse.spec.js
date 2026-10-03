// MouseArea, driven by the browser's own mouse. What is expected is what Qt
// 6.11 does with the same scene and the same moves, but for one thing: here
// a property has changed, and said so, before the signal that goes with it
// (`pressedChanged` before `pressed`), where Qt says so after.
import { expect, open, test } from "./open.js";

const advance = (page, ms) => page.evaluate((ms) => window.objects.clock.advance(ms), ms);
const log = (page) => page.evaluate(() => window.objects.log.splice(0));
const read = (page, name, property) =>
  page.evaluate(([name, property]) => window.objects[name][property], [name, property]);

test("a click presses, releases and clicks", async ({ page }) => {
  await open(page, "mouse");
  await page.mouse.move(10, 10);
  expect(await log(page)).toEqual([]);
  await page.mouse.down();
  expect(await log(page)).toEqual([
    "basic containsMouseChanged true",
    "basic entered",
    "basic pressedChanged true",
    "basic containsPressChanged true",
    "basic pressed 10,10 b=1 bs=1 p=true cm=true cp=true pb=1",
  ]);
  await page.mouse.up();
  expect(await log(page)).toEqual([
    "basic pressedChanged false",
    "basic containsPressChanged false",
    "basic released b=1 bs=0 p=false cm=true held=false",
    "basic clicked 10,10",
    "basic containsMouseChanged false",
    "basic exited",
  ]);
  // A button it does not accept is not its business.
  await page.mouse.click(10, 10, { button: "right" });
  await page.mouse.click(10, 10, { button: "middle" });
  expect(await log(page)).toEqual([]);
});

test("a press that leaves the area is no click when released outside", async ({ page }) => {
  await open(page, "mouse");
  await page.mouse.move(20, 10);
  await page.mouse.down();
  await log(page);
  await page.mouse.move(30, 20);
  expect(await log(page)).toEqual(["basic position 30,20 bs=1 30,20"]);
  await page.mouse.move(100, 100);
  expect(await log(page)).toEqual([
    "basic containsMouseChanged false",
    "basic containsPressChanged false",
    "basic exited",
    "basic position 100,100 bs=1 100,100",
  ]);
  expect(await read(page, "basic", "pressed")).toBe(true);
  await page.mouse.move(30, 20);
  expect(await log(page)).toEqual([
    "basic containsMouseChanged true",
    "basic containsPressChanged true",
    "basic entered",
    "basic position 30,20 bs=1 30,20",
  ]);
  await page.mouse.move(100, 100);
  await log(page);
  await page.mouse.up();
  expect(await log(page)).toEqual(["basic pressedChanged false", "basic released b=1 bs=0 p=false cm=false held=false"]);
});

test("a press that is held long enough is a long press, and no click", async ({ page }) => {
  await open(page, "mouse");
  await page.mouse.move(10, 10);
  await page.mouse.down();
  await log(page);
  await advance(page, 799);
  expect(await log(page)).toEqual([]);
  await advance(page, 1);
  expect(await log(page)).toEqual(["basic pressAndHold held=true"]);
  await page.mouse.up();
  expect(await log(page)).toEqual([
    "basic pressedChanged false",
    "basic containsPressChanged false",
    "basic released b=1 bs=0 p=false cm=true held=true",
    "basic containsMouseChanged false",
    "basic exited",
  ]);
  // One that nothing handles leaves the click a click.
  await page.mouse.move(170, 10);
  await page.mouse.down();
  await advance(page, 1000);
  await page.mouse.up();
  expect(await log(page)).toEqual([
    "plain pressedChanged true",
    "plain pressed",
    "plain pressedChanged false",
    "plain released",
    "plain clicked",
  ]);
});

test("the second of two quick clicks is a double click where one is handled", async ({ page }) => {
  await open(page, "mouse");
  await page.mouse.click(100, 10);
  await page.mouse.click(100, 10);
  expect(await log(page)).toEqual([
    "dbl pressed",
    "dbl released",
    "dbl clicked",
    "dbl pressed",
    "dbl doubleClicked true",
    "dbl released",
  ]);
  // The third starts over.
  await page.mouse.click(100, 10);
  expect(await log(page)).toEqual(["dbl pressed", "dbl released", "dbl clicked"]);
  await advance(page, 500);
  // Too late for a double click.
  await page.mouse.click(100, 10);
  expect(await log(page)).toEqual(["dbl pressed", "dbl released", "dbl clicked"]);
  await advance(page, 500);
  await page.mouse.click(170, 10);
  await page.mouse.click(170, 10);
  const click = ["plain pressedChanged true", "plain pressed", "plain pressedChanged false", "plain released", "plain clicked"];
  expect(await log(page)).toEqual([...click, ...click]);
});

test("an area that hovers follows the mouse with no button down", async ({ page }) => {
  await open(page, "mouse");
  await page.mouse.move(235, 5);
  await page.mouse.move(235, 8);
  expect(await log(page)).toEqual(["h1 entered", "h1 position 5,5 bs=0", "h1 position 5,8 bs=0"]);
  expect(await read(page, "h1", "containsMouse")).toBe(true);
  expect(await read(page, "h1", "mouseY")).toBe(8);
  // Into an area inside it: both have the mouse.
  await page.mouse.move(250, 20);
  expect(await log(page)).toEqual(["hc entered", "h1 position 20,20 bs=0"]);
  expect(await page.evaluate(() => getComputedStyle(window.objects.hc.$node).cursor)).toBe("pointer");
  await page.mouse.move(235, 8);
  expect(await log(page)).toEqual(["h1 position 5,8 bs=0", "hc exited"]);
  await page.mouse.down();
  await page.mouse.move(235, 100);
  expect(await log(page)).toEqual(["h1 pressed cm=true", "h1 exited", "h1 position 5,100 bs=1"]);
  await page.mouse.up();
  expect(await log(page)).toEqual(["h1 released cm=false"]);
  await page.mouse.move(100, 250);
  expect(await log(page)).toEqual([]);
});

test("of two areas that hover, the one on top has the mouse", async ({ page }) => {
  await open(page, "mouse");
  await page.mouse.move(300, 50);
  expect(await log(page)).toEqual(["h1 entered", "h1 position 70,50 bs=0"]);
  await page.mouse.move(320, 50);
  expect(await log(page)).toEqual(["h2 entered", "h1 exited"]);
  await page.mouse.move(380, 20);
  expect(await log(page)).toEqual(["h2 exited"]);
  // An area that does not hover hides nothing from the mouse.
  await page.mouse.move(260, 110);
  expect(await read(page, "w1", "containsMouse")).toBe(true);
  expect(await read(page, "cover", "containsMouse")).toBe(false);
  // A click leaves an area that hovers with the mouse it had.
  await page.mouse.move(300, 50);
  await log(page);
  await page.mouse.down();
  await page.mouse.up();
  await page.mouse.move(302, 50);
  expect(await log(page)).toEqual(["h1 pressed cm=true", "h1 released cm=true", "h1 clicked", "h1 position 72,50 bs=0"]);
});

test("a press the topmost area does not accept goes to the one under it", async ({ page }) => {
  await open(page, "mouse");
  await page.mouse.click(10, 80);
  expect(await log(page)).toEqual([
    "above pressedChanged true",
    "above pressed",
    "above pressedChanged false",
    "above released",
    "above clicked",
  ]);
  await advance(page, 500);
  await page.evaluate(() => (window.objects.root.reject = true));
  await page.mouse.click(10, 80);
  expect(await log(page)).toEqual([
    "above pressedChanged true",
    "above pressed",
    "above pressedChanged false",
    "below pressed",
    "below released",
    "below clicked",
  ]);
  // What is drawn over an area takes nothing from it.
  await page.mouse.click(310, 210);
  expect(await log(page)).toEqual(["covered clicked"]);
});

test("composed events an area does not accept are offered to the areas under it", async ({ page }) => {
  await open(page, "mouse");
  await page.mouse.click(110, 90);
  expect(await log(page)).toEqual(["cabove pressed", "cabove released", "cabove clicked", "cbelow clicked 20,20"]);
  await page.mouse.click(110, 90);
  expect(await log(page)).toEqual(["cabove pressed", "cbelow doubleClicked", "cabove released"]);
  await advance(page, 500);
  await page.mouse.down();
  await advance(page, 800);
  await page.mouse.up();
  expect(await log(page)).toEqual(["cabove pressed", "cbelow pressAndHold", "cabove released"]);
});

test("an area that accepts two buttons is pressed while either is down", async ({ page }) => {
  await open(page, "mouse");
  await page.mouse.move(190, 80);
  await page.mouse.down({ button: "left" });
  await page.mouse.down({ button: "right" });
  expect(await log(page)).toEqual(["chord pressedChanged true", "chord pressed b=1 pb=1", "chord pressed b=2 pb=3"]);
  await page.mouse.up({ button: "left" });
  expect(await log(page)).toEqual(["chord released b=1 pb=2", "chord clicked b=1"]);
  expect(await read(page, "chord", "pressed")).toBe(true);
  await page.mouse.up({ button: "right" });
  expect(await log(page)).toEqual(["chord pressedChanged false", "chord released b=2 pb=0", "chord clicked b=2"]);
});

test("the wheel goes to the topmost area that handles and accepts it", async ({ page }) => {
  await open(page, "mouse");
  await page.mouse.move(310, 130);
  await page.mouse.wheel(0, -100);
  await expect.poll(() => read(page, "log", "length")).toBe(2);
  expect(await log(page)).toEqual(["w2 wheel", "w1 wheel 120 0 100 x=60 acc=true b=0 m=0"]);
  // Through an area that has no handler for it.
  await page.mouse.move(260, 110);
  await page.mouse.wheel(0, 200);
  await expect.poll(() => read(page, "log", "length")).toBe(1);
  expect(await log(page)).toEqual(["w1 wheel -240 0 -200 x=10 acc=true b=0 m=0"]);
});

test("an area drags its target once the mouse has gone past the threshold", async ({ page }) => {
  await open(page, "mouse");
  await page.mouse.move(10, 150);
  await page.mouse.down();
  await page.mouse.move(15, 150);
  await page.mouse.move(25, 150);
  expect(await log(page)).toEqual(["drag position 15 x=0", "drag position 25 x=0"]);
  // It starts from where the mouse is by now, and does not jump.
  await page.mouse.move(30, 150);
  expect(await log(page)).toEqual(["drag.active true x=0", "drag position 25 x=5"]);
  await page.mouse.move(45, 170);
  expect(await log(page)).toEqual(["drag position 25 x=20"]);
  expect(await read(page, "drag", "pressed")).toBe(true);
  await page.mouse.move(320, 150);
  expect(await log(page)).toEqual(["drag position 220 x=100"]);
  expect(await page.evaluate(() => window.objects.drag.drag.active)).toBe(true);
  await page.mouse.up();
  expect(await log(page)).toEqual(["drag released x=100", "drag.active false x=100"]);
  expect(await page.evaluate(() => [window.objects.box.x, window.objects.box.y])).toEqual([100, 140]);
  expect((await page.evaluate(() => window.objects.box.$node.getBoundingClientRect().x))).toBe(100);
  // A press that did not drag is a click.
  await advance(page, 500);
  await page.mouse.click(110, 150);
  expect(await log(page)).toEqual(["drag released x=100", "drag clicked"]);
});

test("a drag that is not smoothed starts from where the press was", async ({ page }) => {
  await open(page, "mouse");
  await page.mouse.move(230, 210);
  await page.mouse.down();
  await page.mouse.move(233, 210);
  await page.mouse.move(236, 212);
  expect(await log(page)).toEqual(["grip position 13,10 at=220,200", "grip position 16,12 at=220,200"]);
  await page.mouse.move(240, 220);
  expect(await log(page)).toEqual(["grip drag.active true at=220,200", "grip position 10,10 at=230,210"]);
  await page.mouse.up();
  expect(await log(page)).toEqual(["grip released", "grip drag.active false at=230,210"]);
});

test("an area that filters its children drags what a child was pressed on", async ({ page }) => {
  await open(page, "mouse");
  await page.mouse.click(10, 210);
  expect(await log(page)).toEqual([
    "outer pressed",
    "inner pressed",
    "outer released",
    "outer clicked",
    "inner released",
    "inner clicked",
  ]);
  await advance(page, 500);
  await page.mouse.down();
  await page.mouse.move(15, 210);
  await page.mouse.move(30, 210);
  expect(await log(page)).toEqual(["outer pressed", "inner pressed"]);
  // The press is taken from the child when the drag starts.
  await page.mouse.move(40, 210);
  expect(await log(page)).toEqual(["outer drag.active true", "inner canceled"]);
  expect(await read(page, "handle", "x")).toBe(10);
  await page.mouse.move(60, 210);
  expect(await read(page, "handle", "x")).toBe(30);
  await page.mouse.up();
  expect(await log(page)).toEqual(["outer released", "outer drag.active false"]);
  expect(await read(page, "inner", "pressed")).toBe(false);
  await advance(page, 500);
  await page.mouse.click(150, 260);
  expect(await log(page)).toEqual(["outer pressed", "outer released", "outer clicked"]);
});

test("an area that is hidden or loses the pointer while pressed is canceled", async ({ page }) => {
  await open(page, "mouse");
  await page.mouse.move(170, 10);
  await page.mouse.down();
  expect(await log(page)).toEqual(["plain pressedChanged true", "plain pressed"]);
  await page.evaluate(() => (window.objects.plain.visible = false));
  expect(await log(page)).toEqual(["plain canceled", "plain pressedChanged false"]);
  await page.mouse.up();
  expect(await log(page)).toEqual([]);
  await page.evaluate(() => (window.objects.plain.visible = true));
  await advance(page, 500);
  await page.mouse.down();
  await log(page);
  // The page takes a pointer back when it has another use for it.
  await page.evaluate(() => document.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 1, bubbles: true })));
  expect(await log(page)).toEqual(["plain pressedChanged false", "plain canceled"]);
  await page.mouse.up();
  expect(await log(page)).toEqual([]);
});

test("an area that is disabled while pressed still gets the release", async ({ page }) => {
  await open(page, "mouse");
  await page.mouse.move(170, 10);
  await page.mouse.down();
  await page.evaluate(() => (window.objects.plain.enabled = false));
  await page.mouse.up();
  expect(await log(page)).toEqual([
    "plain pressedChanged true",
    "plain pressed",
    "plain pressedChanged false",
    "plain released",
    "plain clicked",
  ]);
  await advance(page, 500);
  await page.mouse.click(170, 10);
  expect(await log(page)).toEqual([]);
});

test("a finger presses and clicks as the mouse does", async ({ page }) => {
  await open(page, "mouse");
  const device = await page.context().newCDPSession(page);
  await device.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 10, y: 10 }] });
  await device.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  expect(await log(page)).toEqual([
    "basic containsMouseChanged true",
    "basic entered",
    "basic pressedChanged true",
    "basic containsPressChanged true",
    "basic pressed 10,10 b=1 bs=1 p=true cm=true cp=true pb=1",
    "basic pressedChanged false",
    "basic containsPressChanged false",
    "basic released b=1 bs=0 p=false cm=true held=false",
    "basic clicked 10,10",
    "basic containsMouseChanged false",
    "basic exited",
  ]);
});
