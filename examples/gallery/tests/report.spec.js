// The yardstick: for each example, how much of it the compiler takes, whether
// the page renders it, and how close that is to what Qt renders. An example
// that does not compile or render is a line in the report, not a failure:
// what fails is one that `corpus/expected.json` says must keep working.
import { spawnSync } from "node:child_process";
import { copyFileSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { expect, test } from "@playwright/test";
import { readManifest } from "../manifest.js";
import { compare } from "./compare.js";
import { qmlc, readExpected, reportDirectory } from "./settings.js";

const expected = readExpected().examples ?? {};

// Each file as the Vite plugin compiles it: `qmlc FILE`, with the files next
// to it. The documentation's snippets are not part of the example.
function compileAll(example) {
  const files = readdirSync(example.directory, { recursive: true })
    .filter((file) => file.endsWith(".qml") && !file.split("/").includes("doc"))
    .sort();
  const errors = {};
  for (const file of files) {
    const run = spawnSync(qmlc, [join(example.directory, file)], { encoding: "utf8" });
    if (run.error) throw new Error(`could not run ${qmlc}: ${run.error.message}`);
    if (run.status !== 0) errors[file] = run.stderr.trim().replaceAll(example.directory + "/", "");
  }
  return { files: files.length, compiled: files.length - Object.keys(errors).length, errors };
}

for (const example of readManifest()) {
  test(example.id, async ({ page }, testInfo) => {
    const { width, height } = example.window;
    const compiled = compileAll(example);
    const entryCompiles = !(example.entry in compiled.errors);

    // As the reference was taken: no network, and for an example that shows
    // the time, the moment of the reference.
    await page.route(
      (url) => !["127.0.0.1", "localhost"].includes(url.hostname),
      (route) => route.abort(),
    );
    if (example.volatile === "time" && example.capturedAt) await page.clock.setFixedTime(example.capturedAt);
    await page.setViewportSize({ width: Math.max(width, 800), height: height + 200 });
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    // The page only learns that a module did not load. Why is what the dev
    // server answered: most often a module of Qt the runtime does not have.
    const refused = [];
    page.on("response", async (response) => {
      if (response.status() < 500) return;
      // The browser keeps nothing of a script it could not load: ask again.
      const again = await page.request.get(response.url()).catch(() => null);
      const body = (await again?.text().catch(() => "")) ?? "";
      const said = body.match(/const error = (\{.*\})\s*$/m)?.[1];
      const message = said ? JSON.parse(said).message : `${response.status()} for ${response.url()}`;
      const missing = message.match(/^"\.\/(\S+)" is not exported .* from package \S+qml-solid /)?.[1];
      refused.push(missing ? `the runtime has no ${missing.replaceAll("/", ".")}` : message);
    });

    await page.goto(`?example=${encodeURIComponent(example.id)}`);
    await page
      .waitForFunction(() => window.gallery && window.gallery.status !== "loading", null, { timeout: 20000 })
      .catch(() => pageErrors.push("the page did not finish loading the example"));
    await page.waitForTimeout(example.qt?.settle ?? 1500);
    const state = await page.evaluate(() => ({ ...window.gallery, children: document.getElementById("stage").childElementCount }));
    const found =
      refused[0] ?? state.error ?? pageErrors[0] ?? (state.children === 0 && state.status === "rendered" ? "the example rendered nothing" : null);
    const error =
      found
        ?.replaceAll(example.directory + "/", "")
        .replace(/^The requested module '\S*\/packages\/runtime\/(\S+?)(?:\/index)?\.js\S*' does not provide an export named '(\w+)'/, (_, module, name) =>
          `the runtime's ${module.replaceAll("/", ".")} has no ${name}`,
        ) ?? null;
    const renders = state.status === "rendered" && error === null;

    const picture = await page.locator("#stage").screenshot({ caret: "hide" });
    writeFileSync(join(reportDirectory, `${example.id}.web.png`), picture);
    let similarity = null;
    if (example.reference) {
      copyFileSync(example.reference, join(reportDirectory, `${example.id}.qt.png`));
      if (renders) {
        const { diff, ...scores } = compare(picture, readFileSync(example.reference));
        if (diff) writeFileSync(join(reportDirectory, `${example.id}.diff.png`), diff);
        similarity = scores;
      }
    }

    const result = {
      id: example.id,
      entry: relative(example.directory, example.entryFile),
      window: { width, height },
      files: compiled.files,
      compiled: compiled.compiled,
      entryCompiles,
      renders,
      error: error ?? (entryCompiles ? null : compiled.errors[example.entry]),
      reference: example.reference !== null,
      qt: example.qt?.runnable ? null : (example.qt?.reason ?? null),
      pixels: similarity?.pixels ?? null,
      content: similarity?.content ?? null,
      mismatch: similarity?.mismatch ?? null,
      compileErrors: compiled.errors,
    };
    await testInfo.attach("example", { body: JSON.stringify(result), contentType: "application/json" });

    // The ratchet.
    const floor = expected[example.id];
    if (floor) {
      expect(renders, `${example.id} must keep rendering: ${result.error}`).toBe(true);
      for (const score of ["pixels", "content"]) {
        if (typeof floor[score] !== "number") continue;
        expect(result[score], `${example.id} must stay as like its reference picture: ${score}`).toBeGreaterThanOrEqual(floor[score]);
      }
    }
  });
}
