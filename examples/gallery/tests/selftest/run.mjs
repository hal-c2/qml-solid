#!/usr/bin/env node
// The harness measured against examples whose answers are known: the report
// is run on the small examples in `qml/`, with the stand-in compiler, and
// what it says of each is checked, as is the ratchet. Nothing here depends on
// what the real compiler takes.
//
//   node tests/selftest/run.mjs      # or: pnpm selftest
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const here = dirname(fileURLToPath(import.meta.url));
const gallery = join(here, "../..");
const output = join(here, "output");
const corpus = join(output, "corpus");
const report = join(output, "report");
const expectedFile = join(output, "expected.json");

const window = { width: 200, height: 120 };
const taken = 1700000000000;
const example = (id, more = {}) => ({ id, dir: id, entry: "Main.qml", root: "Item", window, qt: { runnable: true, settle: 500 }, ...more });
const examples = [
  example("works"),
  example("differs"),
  example("unsized"),
  example("unpictured", { qt: { runnable: false, reason: "the self-test has no picture of it", settle: 500 } }),
  example("broken"),
  example("partial"),
  example("throws"),
  example("late"),
  example("empty"),
  example("clock", { volatile: "time" }),
];

// A reference picture: white, with a blue block.
function picture({ width, height }, left, top) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const inside = x >= left && x < left + 100 && y >= top && y < top + 60;
      png.data.set(inside ? [0, 0, 255, 255] : [255, 255, 255, 255], (y * width + x) * 4);
    }
  }
  return PNG.sync.write(png);
}

rmSync(output, { recursive: true, force: true });
mkdirSync(join(corpus, "reference"), { recursive: true });
writeFileSync(join(corpus, "examples.json"), JSON.stringify({ root: relative(corpus, join(here, "qml")), examples }, null, 2));
const references = {
  works: picture(window, 20, 20),
  differs: picture(window, 100, 60),
  unsized: picture({ width: 150, height: 150 }, 20, 20),
  broken: picture(window, 20, 20),
  partial: picture(window, 20, 20),
  throws: picture(window, 20, 20),
  late: picture(window, 20, 20),
  empty: picture(window, 20, 20),
  clock: picture(window, 20, 20),
};
for (const [id, png] of Object.entries(references)) writeFileSync(join(corpus, "reference", `${id}.png`), png);
writeFileSync(join(corpus, "reference/reference.json"), JSON.stringify({ clock: { capturedAt: taken, ...window } }));

// The report on those examples, with this ratchet; what it said and how it
// ended.
function run(expected, environment = {}) {
  writeFileSync(expectedFile, JSON.stringify({ examples: expected }));
  const result = spawnSync("pnpm", ["exec", "playwright", "test"], {
    cwd: gallery,
    encoding: "utf8",
    env: {
      ...process.env,
      GALLERY_MANIFEST: join(corpus, "examples.json"),
      GALLERY_REPORT: report,
      GALLERY_EXPECTED: expectedFile,
      GALLERY_PORT: process.env.GALLERY_SELFTEST_PORT ?? "4175",
      QMLC: join(here, "qmlc.mjs"),
      ...environment,
    },
  });
  const text = result.stdout + result.stderr;
  let rows = null;
  try {
    rows = Object.fromEntries(JSON.parse(readFileSync(join(report, "report.json"), "utf8")).map((row) => [row.id, row]));
  } catch {
    assert.fail(`the report was not written:\n${text}`);
  }
  return { status: result.status, text, rows, expected: JSON.parse(readFileSync(expectedFile, "utf8")).examples };
}

let failed = 0;
function check(name, body) {
  try {
    body();
    console.log(`ok    ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`FAIL  ${name}\n${String(error.message).replace(/^/gm, "      ")}`);
  }
}
const has = (row, wanted) => assert.deepEqual(Object.fromEntries(Object.keys(wanted).map((key) => [key, row[key]])), wanted);

// With nothing expected, and asked to note what renders.
const first = run({}, { GALLERY_RATCHET: "1" });
const { rows } = first;
check("a report where examples fail is not a failure", () => assert.equal(first.status, 0, first.text));
check("every example is in the report", () => assert.deepEqual(Object.keys(rows).sort(), examples.map(({ id }) => id).sort()));
check("the table is printed", () => {
  assert.match(first.text, /works\s+2\/2\s+yes\s+yes\s+100\.0%\s+100\.0%/);
  assert.match(first.text, /total\s+10\/12\s+9\/10\s+5\/10/);
});
check("an example like its reference scores all of it", () =>
  has(rows.works, { files: 2, compiled: 2, entryCompiles: true, renders: true, error: null, pixels: 1, content: 1 }));
check("one unlike its reference renders and scores low", () => {
  has(rows.differs, { entryCompiles: true, renders: true, error: null });
  // The two blocks, of 6000 pixels each, share 400: 11200 of the window's
  // 24000 pixels differ, and of the 11600 that are not background.
  assert.equal(rows.differs.pixels.toFixed(6), (1 - 11200 / 24000).toFixed(6));
  assert.equal(rows.differs.content.toFixed(6), (1 - 11200 / 11600).toFixed(6));
});
check("a reference of another size is not compared", () => {
  has(rows.unsized, { renders: true, pixels: null, content: null });
  assert.match(rows.unsized.mismatch, /200x120.*150x150/);
});
check("an example Qt has no picture of is still measured", () =>
  has(rows.unpictured, { renders: true, reference: false, pixels: null, qt: "the self-test has no picture of it" }));
check("an entry that does not compile is reported with the compiler's message", () => {
  has(rows.broken, { files: 1, compiled: 0, entryCompiles: false, renders: false, pixels: null });
  assert.match(rows.broken.error, /^Main\.qml:1:1: the stand-in compiler has no output/);
});
check("a component that does not compile stops only the example that uses it", () => {
  has(rows.partial, { files: 2, compiled: 1, entryCompiles: true, renders: false });
  assert.match(rows.partial.error, /Missing\.qml:1:1: the stand-in compiler has no output/);
});
check("an example that throws as it renders has not rendered", () =>
  has(rows.throws, { entryCompiles: true, renders: false, error: "thrown while rendering" }));
check("nor has one that throws afterwards", () => {
  assert.equal(rows.late.renders, false);
  assert.match(rows.late.error, /thrown after rendering/);
});
check("nor one that renders nothing", () => has(rows.empty, { entryCompiles: true, renders: false, error: "the example rendered nothing" }));
check("an example that shows the time is compared at the moment of its reference", () => has(rows.clock, { renders: true, pixels: 1 }));
check("the pictures are saved next to each other", () => {
  for (const kind of ["web", "qt", "diff"]) readFileSync(join(report, `works.${kind}.png`));
  readFileSync(join(report, "index.html"));
});
check("GALLERY_RATCHET notes what renders", () =>
  assert.deepEqual(Object.keys(first.expected), ["clock", "differs", "unpictured", "unsized", "works"]));

// With what renders expected, and as like the reference as it is.
const second = run({ ...first.expected, works: { pixels: 1, content: 1 }, differs: { pixels: 0.53 } });
check("the ratchet holds while what is expected renders", () => assert.equal(second.status, 0, second.text));

// With more expected than there is.
const third = run({ works: {}, broken: {}, differs: { pixels: 0.9 } });
check("the ratchet fails for an example that no longer renders", () => {
  assert.notEqual(third.status, 0);
  assert.match(third.text, /^  broken must keep rendering: Main\.qml:1:1/m);
});
check("and for one less like its reference than expected", () => assert.match(third.text, /^  differs must stay as like its reference picture: pixels/m));
check("and for no other", () => {
  assert.equal(third.text.match(/^  \S+ must /gm).length, 2);
});
check("a failed ratchet still reports every example", () => assert.equal(Object.keys(third.rows).length, examples.length));

console.log(failed ? `\n${failed} failed` : "\nthe harness measures what it says");
process.exit(failed ? 1 : 0);
