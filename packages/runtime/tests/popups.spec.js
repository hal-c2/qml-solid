// Popups of QtQuick.Templates. What is expected here is what Qt 6.11 answers
// for the same QML: each scene is run by `qml6` too, and asked the same before
// and after every step, or by a QtTest `TestCase` that makes the same moves
// with its mouse and keys (`moves.js`).
import { play } from "./moves.js";
import { expect, open, test } from "./open.js";

const answers = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.scene.answers())));

// `expected` is what the scene answers at first, and then after each of its
// steps.
async function stages(page, expected) {
  for (let at = 0; at < expected.length; at++) {
    expect(await answers(page), at ? `after step ${at - 1}` : "at first").toEqual(expected[at]);
    if (at < expected.length - 1) await page.evaluate((index) => window.scene.step(index), at);
  }
}

// The same with time in the test's hands: Qt was asked 400 ms after each step,
// by when a transition of 100 ms is over.
async function timed(page, expected) {
  await page.evaluate(() => window.clock.stop());
  for (let at = 0; at < expected.length; at++) {
    expect(await answers(page), at ? `after step ${at - 1}` : "at first").toEqual(expected[at]);
    if (at === expected.length - 1) break;
    await page.evaluate((index) => {
      window.scene.step(index);
      window.clock.advance(400);
    }, at);
  }
}

test("a Popup is shown over the window where its parent is, and tells of opening and closing", async ({ page }) => {
  await open(page, "popups");
  await stages(page, POPUPS);
});

test("a popup shown over what is in another waits for that one, goes with it and comes back with it", async ({ page }) => {
  await open(page, "popupnested");
  await stages(page, NESTED);
});

test("a popup's transitions bring it and take it away, and it is open once it has come", async ({ page }) => {
  await open(page, "popupfade");
  await timed(page, FADE);
});

// Qt answers once a transition is over. What is here is the way there: the
// popup is where its transition has it, and what dims the window follows its
// own Behavior.
test("a popup's transitions and its dimmer run on the clock", async ({ page }) => {
  await open(page, "popupfade");
  const state = () => page.evaluate(() => JSON.parse(JSON.stringify(window.scene.answers())));
  const run = (index, ms) =>
    page.evaluate(
      ([index, ms]) => {
        if (index !== null) window.scene.step(index);
        window.clock.advance(ms);
      },
      [index, ms],
    );
  await page.evaluate(() => window.clock.stop());
  await run(0, 50);
  expect(await state()).toEqual([[true, false, 0.5, 0.75], [false, false, 0.8], ["aboutToShow", "visible true", "now true false 0 0.5"], [["Popup", true, 0.5, 0.75]]]);
  await run(null, 50);
  expect(await state()).toEqual([[true, true, 1, 1], [false, false, 0.8], ["openedChanged true", "opened"], [["Popup", true, 1, 1]]]);
  await run(1, 50);
  expect(await state()).toEqual([[true, false, 0.5, 0.75], [false, false, 0.8], ["aboutToHide", "openedChanged false", "now true false 1 1"], [["Popup", true, 0.5, 0.75]]]);
  await run(null, 50);
  expect(await state()).toEqual([[false, false, 1, 1], [false, false, 0.8], ["visible false", "closed"], []]);
  await run(6, 50);
  expect((await state())[3]).toEqual([["dimmer", true, 0.3, 1], ["Popup", true, 0.8, 1]]);
  await run(7, 50);
  expect((await state()).slice(1)).toEqual([[true, false, 0.4], [], [["dimmer", true, 0.15, 1], ["Popup", true, 0.4, 1]]]);
  await run(null, 60);
  expect((await state()).slice(1)).toEqual([[false, false, 0.8], [], []]);
});

test("a press outside a popup closes it as its policy says, a modal one lets nothing through, and focus is the top one's", async ({ page }) => {
  await play(page, "popuppress", PRESSES);
});

const POPUPS = [
  [[0,0,0,0,0,0,60,30,0,0,60,80,false,false,1,1,0,[0,0],[5,5,0,0,false],[0,0,0,0,-1],false,false,false,false,false,false,17,-1,-1,true],[0,0,120,90,120,90,0,0,120,90,0,0,false,false,1,1,0,[0,0],[0,0,120,90,false],null,false,false,false,false,false,false,17,-1,-1,true],["shown opened"],[0,0,400,300,1000001,true,1],[0,0,31,21,0,0,false],[0,0,101,51,0,0,false],[5,250,40,30,5,250,true]],
  [[10,20,0,0,0,0,60,30,0,0,60,80,true,true,1,1,0,[60,60],[5,5,0,0,true],[0,0,0,0,-1],true,true,false,false,false,false,17,-1,-1,true],[0,0,120,90,120,90,0,0,120,90,0,0,false,false,1,1,0,[0,0],[0,0,120,90,false],null,false,false,false,false,false,false,17,-1,-1,true],["aboutToShow true true","x 10","visible true","openedChanged true","opened true true"],[0,0,400,300,1000001,true,2],[0,0,31,21,0,0,false],[0,0,101,51,0,0,false],[5,250,40,30,5,250,true]],
  [[30,20,0,0,0,0,60,30,0,0,60,80,true,true,1,1,0,[80,60],[5,5,0,0,true],[0,0,0,0,-1],true,true,false,false,false,false,17,-1,-1,true],[0,0,120,90,120,90,0,0,120,90,0,0,false,false,1,1,0,[0,0],[0,0,120,90,false],null,false,false,false,false,false,false,17,-1,-1,true],["x 30"],[0,0,400,300,1000001,true,2],[0,0,31,21,0,0,false],[0,0,101,51,0,0,false],[5,250,40,30,5,250,true]],
  [[30,20,0,0,0,0,60,30,0,0,60,80,false,false,1,1,0,[80,60],[5,5,0,0,false],[0,0,0,0,-1],false,false,false,false,false,false,17,-1,-1,true],[0,0,120,90,120,90,0,0,120,90,0,0,false,false,1,1,0,[0,0],[0,0,120,90,false],null,false,false,false,false,false,false,17,-1,-1,true],["aboutToHide true false","openedChanged false","visible false","closed false false"],[0,0,400,300,1000001,true,1],[0,0,31,21,0,0,false],[0,0,101,51,0,0,false],[5,250,40,30,5,250,true]],
  [[30,20,0,0,0,0,60,30,0,0,60,80,true,true,1,1,0,[80,60],[8,8,0,0,true],[0,0,0,0,-1],true,true,false,false,false,false,17,-1,-1,true],[0,0,120,90,120,90,0,0,120,90,0,0,false,false,1,1,0,[0,0],[0,0,120,90,false],null,false,false,false,false,false,false,17,-1,-1,true],["aboutToShow true true","visible true","openedChanged true","opened true true"],[0,0,400,300,1000001,true,2],[0,0,31,21,0,0,false],[0,0,101,51,0,0,false],[5,250,40,30,5,250,true]],
  [[30,20,0,0,0,0,60,30,0,0,60,80,false,false,1,1,0,[80,60],[8,8,0,0,false],[0,0,0,0,-1],false,false,false,false,false,false,17,-1,-1,true],[300,200,120,90,120,90,0,0,120,90,0,0,true,true,1,1,0,[350,240],[0,0,120,90,true],null,true,true,false,false,false,false,17,-1,-1,true],["aboutToHide true false","openedChanged false","visible false","closed false false"],[0,0,400,300,1000001,true,2],[0,0,31,21,0,0,false],[0,0,101,51,0,0,false],[5,250,40,30,5,250,true]],
  [[30,20,0,0,0,0,60,30,0,0,60,80,false,false,1,1,0,[80,60],[8,8,0,0,false],[0,0,0,0,-1],false,false,false,false,false,false,17,-1,-1,true],[220,160,120,90,120,90,0,0,120,90,0,0,true,true,1,1,0,[270,200],[0,0,120,90,true],null,true,true,false,false,false,false,17,10,10,true],[],[0,0,400,300,1000001,true,2],[0,0,31,21,0,0,false],[0,0,101,51,0,0,false],[5,250,40,30,5,250,true]],
  [[30,20,0,0,0,0,60,30,0,0,60,80,false,false,1,1,0,[80,60],[8,8,0,0,false],[0,0,0,0,-1],false,false,false,false,false,false,17,-1,-1,true],[-40,-30,120,90,120,90,0,0,120,90,0,0,true,true,1,1,0,[10,10],[0,0,120,90,true],null,true,true,false,false,false,false,17,10,10,true],[],[0,0,400,300,1000001,true,2],[0,0,31,21,0,0,false],[0,0,101,51,0,0,false],[5,250,40,30,5,250,true]],
  [[30,20,0,0,0,0,60,30,0,0,60,80,false,false,1,1,0,[80,60],[8,8,0,0,false],[0,0,0,0,-1],false,false,false,false,false,false,17,-1,-1,true],[-46,-100,120,90,120,90,0,0,120,90,0,0,true,true,1,1,0,[4,-60],[0,0,120,90,true],null,true,true,false,false,false,false,17,-1,-1,true],[],[0,0,400,300,1000001,true,2],[0,0,31,21,0,0,false],[0,0,101,51,0,0,false],[5,250,40,30,5,250,true]],
  [[30,20,0,0,0,0,60,30,0,0,60,80,false,false,1,1,0,[80,60],[8,8,0,0,false],[0,0,0,0,-1],false,false,false,false,false,false,17,-1,-1,true],[-46,-100,500,90,120,90,0,0,500,90,0,0,true,true,1,1,0,[4,-60],[0,0,500,90,true],null,true,true,false,false,false,false,17,-1,-1,true],[],[0,0,400,300,1000001,true,2],[0,0,31,21,0,0,false],[0,0,101,51,0,0,false],[5,250,40,30,5,250,true]],
  [[30,20,0,0,0,0,60,30,0,0,60,80,false,false,1,1,0,[80,60],[8,8,0,0,false],[0,0,0,0,-1],false,false,false,false,false,false,17,-1,-1,true],[-46,-100,500,90,120,90,0,0,500,90,0,0,false,false,1,1,0,[4,-60],[0,0,500,90,false],null,false,false,false,false,false,false,17,-1,-1,true],[],[0,0,400,300,1000001,true,3],[34.5,19.5,31,21,84.5,59.5,true],[149.5,124.5,101,51,149.5,124.5,true],[5,250,40,30,5,250,true]],
  [[30,20,0,0,0,0,60,30,0,0,60,80,false,false,1,1,0,[80,60],[8,8,0,0,false],[0,0,0,0,-1],false,false,false,false,false,false,17,-1,-1,true],[-46,-100,500,90,120,90,0,0,500,90,0,0,false,false,1,1,0,[4,-60],[0,0,500,90,false],null,false,false,false,false,false,false,17,-1,-1,true],[],[0,0,400,300,1000001,true,3],[59.5,19.5,31,21,259.5,59.5,true],[149.5,124.5,101,51,149.5,124.5,true],[5,250,40,30,5,250,true]],
  [[30,20,0,0,0,0,60,30,0,0,60,80,false,false,1,1,0,[80,60],[8,8,0,0,false],[0,0,0,0,-1],false,false,false,false,false,false,17,-1,-1,true],[-46,-100,500,90,120,90,0,0,500,90,0,0,false,false,1,1,0,[4,-60],[0,0,500,90,false],null,false,false,false,false,false,false,17,-1,-1,true],[],[0,0,400,300,1000001,true,3],[59.5,19.5,31,21,259.5,59.5,true],[139,89,101,51,139,89,true],[5,250,40,30,5,250,true]],
];

const PRESSES = [
  ["",[],[false,false,false,false,false,false,false,false,false,false,false,true,[]]],
  ["step 0",["field active true"],[false,false,false,false,false,false,true,false,false,false,false,true,[]]],
  ["step 1",["a aboutToShow","a opened"],[true,false,false,false,false,false,true,false,false,false,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["press 300 250",["under hover true","overlay pressed","a aboutToHide","a closed","under pressed"],[false,false,false,false,false,false,true,false,false,true,false,true,[]]],
  ["release 300 250",["under released","under clicked"],[false,false,false,false,false,false,true,false,false,true,false,true,[]]],
  ["step 1",["a aboutToShow","a opened"],[true,false,false,false,false,false,true,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["press 70 70",["under hover false","overlay pressed","inner pressed"],[true,false,false,false,false,false,true,false,false,false,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["release 70 70",["overlay released","inner clicked"],[true,false,false,false,false,false,true,false,false,false,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["press 120 120",["overlay pressed"],[true,false,false,false,false,false,true,false,false,false,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["release 120 120",["overlay released"],[true,false,false,false,false,false,true,false,false,false,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["press 55 45",["under hover true","overlay pressed","a aboutToHide","a closed","under pressed"],[false,false,false,false,false,false,true,false,false,true,false,true,[]]],
  ["release 55 45",["under released","under clicked"],[false,false,false,false,false,false,true,false,false,true,false,true,[]]],
  ["step 2",["a aboutToShow","a opened"],[true,false,false,false,false,false,true,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["press 55 45",["overlay pressed","under pressed"],[true,false,false,false,false,false,true,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["release 55 45",["overlay released","a aboutToHide","a closed","under released","under clicked"],[false,false,false,false,false,false,true,false,false,true,false,true,[]]],
  ["step 2",["a aboutToShow","a opened"],[true,false,false,false,false,false,true,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["press 300 250",["overlay pressed","under pressed"],[true,false,false,false,false,false,true,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["move 80 80",[],[true,false,false,false,false,false,true,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["release 80 80",["overlay released","under released","under clicked","under hover false"],[true,false,false,false,false,false,true,false,false,false,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["press 80 110",["overlay pressed"],[true,false,false,false,false,false,true,false,false,false,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["move 300 250",[],[true,false,false,false,false,false,true,false,false,false,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["release 300 250",["overlay released","under hover true"],[true,false,false,false,false,false,true,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["step 3",[],[true,false,false,false,false,false,true,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["press 55 45",["overlay pressed","under pressed"],[true,false,false,false,false,false,true,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["release 55 45",["overlay released","under released","under clicked"],[true,false,false,false,false,false,true,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["press 300 250",["overlay pressed","a aboutToHide","a closed","under pressed"],[false,false,false,false,false,false,true,false,false,true,false,true,[]]],
  ["release 300 250",["under released","under clicked"],[false,false,false,false,false,false,true,false,false,true,false,true,[]]],
  ["step 15",["a aboutToShow","a opened"],[true,false,false,false,false,false,true,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["press 300 250",["overlay pressed","under pressed"],[true,false,false,false,false,false,true,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["release 55 45",["overlay released","under released","under clicked"],[true,false,false,false,false,false,true,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["press 300 250",["overlay pressed","under pressed"],[true,false,false,false,false,false,true,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["release 300 250",["overlay released","a aboutToHide","a closed","under released","under clicked"],[false,false,false,false,false,false,true,false,false,true,false,true,[]]],
  ["step 4",["a aboutToShow","a opened"],[true,false,false,false,false,false,true,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["press 300 250",["overlay pressed","under pressed"],[true,false,false,false,false,false,true,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["release 300 250",["overlay released","under released","under clicked"],[true,false,false,false,false,false,true,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["step 5",["a aboutToHide","a closed"],[false,false,false,false,false,false,true,false,false,true,false,true,[]]],
  ["step 1",["a aboutToShow","a opened"],[true,false,false,false,false,false,true,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["rpress 300 250",["a aboutToHide","a closed"],[false,false,false,false,false,false,true,false,false,true,false,true,[]]],
  ["rrelease 300 250",[],[false,false,false,false,false,false,true,false,false,true,false,true,[]]],
  ["step 6",["a aboutToShow","field active false","a active true","a opened"],[true,false,false,true,false,false,false,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["key A",[],[true,false,false,true,false,false,false,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["key Escape",["a active false","a aboutToHide","field active true","a closed"],[false,false,false,false,false,false,true,false,false,true,false,true,[]]],
  ["step 6",["a aboutToShow","field active false","a active true","a opened"],[true,false,false,true,false,false,false,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["step 7",["b aboutToShow","a active false","b active true","first active true","b opened"],[true,true,false,false,true,false,false,true,false,true,false,true,[["Popup",60,60,100,80,0,1],["Popup",110,100,100,80,0,1]]]],
  ["key A",["first key 65"],[true,true,false,false,true,false,false,true,false,true,false,true,[["Popup",60,60,100,80,0,1],["Popup",110,100,100,80,0,1]]]],
  ["key Tab",["first key 16777217","first active false","second active true"],[true,true,false,false,true,false,false,false,true,true,false,true,[["Popup",60,60,100,80,0,1],["Popup",110,100,100,80,0,1]]]],
  ["key Tab",["second active false","first active true"],[true,true,false,false,true,false,false,true,false,true,false,true,[["Popup",60,60,100,80,0,1],["Popup",110,100,100,80,0,1]]]],
  ["key Backtab",["first key 16777248","first key 16777218","first active false","second active true"],[true,true,false,false,true,false,false,false,true,true,false,true,[["Popup",60,60,100,80,0,1],["Popup",110,100,100,80,0,1]]]],
  ["press 70 70",["under hover false","overlay pressed","second active false","b active false","b aboutToHide","a active true","b closed","inner pressed"],[true,false,false,true,false,false,false,false,false,false,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["release 70 70",["overlay released","inner clicked"],[true,false,false,true,false,false,false,false,false,false,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["step 7",["b aboutToShow","a active false","b active true","second active true","b opened"],[true,true,false,false,true,false,false,false,true,false,false,true,[["Popup",60,60,100,80,0,1],["Popup",110,100,100,80,0,1]]]],
  ["press 300 250",["under hover true","overlay pressed","second active false","b active false","b aboutToHide","a active true","b closed","a active false","a aboutToHide","field active true","a closed","under pressed"],[false,false,false,false,false,false,true,false,false,true,false,true,[]]],
  ["release 300 250",["under released","under clicked"],[false,false,false,false,false,false,true,false,false,true,false,true,[]]],
  ["step 6",["a aboutToShow","field active false","a active true","a opened"],[true,false,false,true,false,false,false,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["step 7",["b aboutToShow","a active false","b active true","second active true","b opened"],[true,true,false,false,true,false,false,false,true,true,false,true,[["Popup",60,60,100,80,0,1],["Popup",110,100,100,80,0,1]]]],
  ["key Escape",["second active false","b active false","b aboutToHide","a active true","b closed"],[true,false,false,true,false,false,false,false,false,true,false,true,[["Popup",60,60,100,80,0,1]]]],
  ["key Escape",["a active false","a aboutToHide","field active true","a closed"],[false,false,false,false,false,false,true,false,false,true,false,true,[]]],
  ["step 8",[],[false,false,false,false,false,false,true,false,false,true,false,true,[]]],
  ["step 9",["m aboutToShow","m opened"],[false,false,true,false,false,false,true,false,false,true,false,true,[["modalDimmer",0,0,400,300,0,1],["Popup",200,150,100,100,0,1]]]],
  ["move 20 280",["under hover false"],[false,false,true,false,false,false,true,false,false,false,false,true,[["modalDimmer",0,0,400,300,0,1],["Popup",200,150,100,100,0,1]]]],
  ["press 20 280",["overlay pressed","m aboutToHide","m closed"],[false,false,false,false,false,false,true,false,false,false,false,true,[]]],
  ["release 20 280",["under hover true"],[false,false,false,false,false,false,true,false,false,true,false,true,[]]],
  ["step 9",["m aboutToShow","m opened"],[false,false,true,false,false,false,true,false,false,true,false,true,[["modalDimmer",0,0,400,300,0,1],["Popup",200,150,100,100,0,1]]]],
  ["step 1",["a aboutToShow","a opened"],[true,false,true,false,false,false,true,false,false,true,false,true,[["modalDimmer",0,0,400,300,0,1],["Popup",200,150,100,100,0,1],["Popup",60,60,100,80,0,1]]]],
  ["press 20 280",["under hover false","overlay pressed","a aboutToHide","a closed","m aboutToHide","m closed"],[false,false,false,false,false,false,true,false,false,false,false,true,[]]],
  ["release 20 280",["under hover true"],[false,false,false,false,false,false,true,false,false,true,false,true,[]]],
  ["step 10",["m aboutToShow","m opened"],[false,false,true,false,false,false,true,false,false,true,false,true,[["modalDimmer",0,0,400,300,0,1],["Popup",200,150,100,100,0,1]]]],
  ["press 20 280",["under hover false","overlay pressed"],[false,false,true,false,false,false,true,false,false,false,false,true,[["modalDimmer",0,0,400,300,0,1],["Popup",200,150,100,100,0,1]]]],
  ["release 20 280",["overlay released"],[false,false,true,false,false,false,true,false,false,false,false,true,[["modalDimmer",0,0,400,300,0,1],["Popup",200,150,100,100,0,1]]]],
  ["press 250 200",["overlay pressed"],[false,false,true,false,false,false,true,false,false,false,false,true,[["modalDimmer",0,0,400,300,0,1],["Popup",200,150,100,100,0,1]]]],
  ["release 250 200",["overlay released"],[false,false,true,false,false,false,true,false,false,false,false,true,[["modalDimmer",0,0,400,300,0,1],["Popup",200,150,100,100,0,1]]]],
  ["step 1",["a aboutToShow","a opened"],[true,false,true,false,false,false,true,false,false,false,false,true,[["modalDimmer",0,0,400,300,0,1],["Popup",200,150,100,100,0,1],["Popup",60,60,100,80,0,1]]]],
  ["press 70 70",["overlay pressed","inner pressed"],[true,false,true,false,false,false,true,false,false,false,false,true,[["modalDimmer",0,0,400,300,0,1],["Popup",200,150,100,100,0,1],["Popup",60,60,100,80,0,1]]]],
  ["release 70 70",["overlay released","inner clicked"],[true,false,true,false,false,false,true,false,false,false,false,true,[["modalDimmer",0,0,400,300,0,1],["Popup",200,150,100,100,0,1],["Popup",60,60,100,80,0,1]]]],
  ["press 20 280",["overlay pressed","a aboutToHide","a closed"],[false,false,true,false,false,false,true,false,false,false,false,true,[["modalDimmer",0,0,400,300,0,1],["Popup",200,150,100,100,0,1]]]],
  ["release 20 280",["overlay released"],[false,false,true,false,false,false,true,false,false,false,false,true,[["modalDimmer",0,0,400,300,0,1],["Popup",200,150,100,100,0,1]]]],
  ["step 11",["m aboutToHide","m closed","m aboutToShow","m opened"],[false,false,true,false,false,false,true,false,false,false,false,false,[["Popup",200,150,100,100,0,1]]]],
  ["press 20 280",["under hover true","overlay pressed"],[false,false,true,false,false,false,true,false,false,true,false,false,[["Popup",200,150,100,100,0,1]]]],
  ["release 20 280",["overlay released"],[false,false,true,false,false,false,true,false,false,true,false,false,[["Popup",200,150,100,100,0,1]]]],
  ["step 12",["m aboutToHide","m closed","a aboutToShow","a opened"],[true,false,false,false,false,false,true,false,false,true,true,false,[["modelessDimmer",0,0,400,300,0,1],["Popup",60,60,100,80,0,1]]]],
  ["press 300 20",["overlay pressed","under pressed"],[true,false,false,false,false,false,true,false,false,true,true,false,[["modelessDimmer",0,0,400,300,0,1],["Popup",60,60,100,80,0,1]]]],
  ["release 300 20",["overlay released","under released","under clicked"],[true,false,false,false,false,false,true,false,false,true,true,false,[["modelessDimmer",0,0,400,300,0,1],["Popup",60,60,100,80,0,1]]]],
  ["step 13",[],[true,false,false,false,false,false,true,false,false,true,true,false,[["modalDimmer",0,0,400,300,0,1],["Popup",60,60,100,80,0,1]]]],
  ["step 14",[],[true,false,false,false,false,false,true,false,false,true,false,false,[["Popup",60,60,100,80,0,1]]]],
  ["move 300 20",[],[true,false,false,false,false,false,true,false,false,true,false,false,[["Popup",60,60,100,80,0,1]]]],
  ["move 120 120",["under hover false"],[true,false,false,false,false,false,true,false,false,false,false,false,[["Popup",60,60,100,80,0,1]]]],
];

const FADE = [
  [[false,false,1,1],[false,false,0.8],[],[]],
  [[true,true,1,1],[false,false,0.8],["aboutToShow","visible true","now true false 0 0.5","openedChanged true","opened"],[["Popup",true,1,1]]],
  [[false,false,1,1],[false,false,0.8],["aboutToHide","openedChanged false","now true false 1 1","visible false","closed"],[]],
  [[false,false,0,0.5],[false,false,0.8],["aboutToShow","visible true","aboutToHide","openedChanged false","now true false 1 1","visible false","closed"],[]],
  [[true,true,1,1],[false,false,0.8],["aboutToShow","visible true","openedChanged true","opened"],[["Popup",true,1,1]]],
  [[true,true,1,1],[false,false,0.8],["aboutToHide","openedChanged false","aboutToShow","visible true","now true false 0 0.5","openedChanged true","opened"],[["Popup",true,1,1]]],
  [[false,false,1,1],[false,false,0.8],["aboutToHide","openedChanged false","visible false","closed"],[]],
  [[false,false,1,1],[true,true,0.8],[],[["dimmer",true,0.6,1],["Popup",true,0.8,1]]],
  [[false,false,1,1],[false,false,0.8],[],[]],
  [[false,false,1,1],[true,true,0.8],[],[["dimmer",true,0.6,1],["Popup",true,0.8,1]]],
];

const NESTED = [
  [[],[false,false],[false,false],[false,false],[false,false]],
  [[],[false,false],[false,false],[false,false],[false,false]],
  [["early aboutToShow","early opened","deep aboutToShow","deep opened","nested aboutToShow","nested opened","outer aboutToShow","outer visible true","outer opened"],[true,true],[true,true],[true,true],[true,true]],
  [["outer aboutToHide","outer visible false","outer closed"],[false,false],[false,false],[false,false],[false,false]],
  [["early aboutToShow","early opened","deep aboutToShow","deep opened","nested aboutToShow","nested opened","outer aboutToShow","outer visible true","outer opened"],[true,true],[true,true],[true,true],[true,true]],
  [["nested aboutToHide","nested closed"],[true,true],[false,false],[false,false],[true,true]],
  [["outer aboutToHide","outer visible false","outer closed"],[false,false],[false,false],[false,false],[false,false]],
  [["nested aboutToHide","nested closed"],[false,false],[false,false],[false,false],[false,false]],
  [["early aboutToShow","early opened","outer aboutToShow","outer visible true","outer opened"],[true,true],[false,false],[false,false],[true,true]],
  [["early aboutToHide","early closed","outer aboutToHide","outer visible false","outer closed"],[false,false],[false,false],[false,false],[false,false]],
  [[],[false,false],[false,false],[false,false],[false,false]],
  [["early aboutToShow","early opened","deep aboutToShow","deep opened","nested aboutToShow","nested opened","outer aboutToShow","outer visible true","outer opened"],[true,true],[true,true],[true,true],[true,true]],
  [["deep aboutToHide","deep closed","nested aboutToHide","nested closed","nested aboutToShow","nested opened"],[true,true],[true,true],[false,false],[true,true]],
];

// A style's Popup says what dims the window (`T.Overlay.modal`), and so may
// the one who uses it: both are heard, and the user's is the one shown.
test("a style's popup dims the window with its own dimmer, or with the one it is given", async ({ page }) => {
  await open(page, "popupstyled");
  await stages(page, [
    [false, false, []],
    [true, false, [["", "#12000000", 400, 300]]],
    [false, true, [["own", "#80ff0000", 400, 300]]],
  ]);
});
