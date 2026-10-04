// The yardstick: for each example, how much of it the compiler takes, whether
// the page renders it, and how close that is to what Qt renders. An example
// that does not compile or render is a line in the report, not a failure:
// what fails is one that `corpus/expected.json` says must keep working.
import { spawnSync } from "node:child_process";
import { copyFileSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { expect, test } from "@playwright/test";
import { readManifest, readScreen } from "../manifest.js";
import { compare } from "./compare.js";
import { qmlc, readExpected, reportDirectory, runtimePackage } from "./settings.js";

const expected = readExpected().examples ?? {};
const screen = readScreen();

// The modules of Qt the runtime has: what its package exports.
const runtime = new Set(Object.keys(JSON.parse(readFileSync(runtimePackage, "utf8")).exports).map((path) => path.slice(2)));

// Each file as the Vite plugin compiles it: `qmlc FILE`, with the files next
// to it and what stands in for the example's C++. The documentation's snippets are not part of the example.
function compileAll(example) {
  const files = readdirSync(example.directory, { recursive: true })
    .filter((file) => file.endsWith(".qml") && !file.split("/").includes("doc"))
    .sort();
  const errors = {};
  // The modules what was compiled imports that the runtime does not have.
  // The page stops at the first of them; the work to do is all of them.
  const lacks = new Set();
  for (const file of files) {
    const run = spawnSync(qmlc, [...(example.standins ? ["--with", example.standins] : []), join(example.directory, file)], { encoding: "utf8" });
    if (run.error) throw new Error(`could not run ${qmlc}: ${run.error.message}`);
    if (run.status !== 0) errors[file] = run.stderr.trim().replaceAll(example.directory + "/", "");
    for (const [, module] of run.stdout.matchAll(/ from "qml-solid\/([^"]+)";/g)) {
      if (!runtime.has(module)) lacks.add(module.replaceAll("/", "."));
    }
  }
  return { files: files.length, compiled: files.length - Object.keys(errors).length, errors, lacks: [...lacks].sort() };
}

for (const example of readManifest()) {
  test(example.id, async ({ page }, testInfo) => {
    const { width, height } = example.window;
    const compiled = compileAll(example);
    const entryCompiles = !(example.entry in compiled.errors);

    // As the reference was taken: no network, and for an example that shows
    // the time, the moment of the reference.
    const elsewhere = (url) => !["127.0.0.1", "localhost"].includes(url.hostname);
    await page.route(elsewhere, (route) => route.abort());
    // A socket is no request, and is closed as one that reached nobody.
    await page.routeWebSocket(elsewhere, (socket) => socket.close());
    if (example.volatile === "time" && example.capturedAt) await page.clock.setFixedTime(example.capturedAt);
    // What moves is where it was in the reference only at the same moment:
    // its time stands still until it is there, and then runs as long as Qt's
    // did.
    const moving = example.volatile === "animation";
    if (moving) {
      await page.clock.install({ time: 0 });
      await page.clock.pauseAt(1000);
    }
    const viewport = { width: Math.max(width, 800), height: height + 200 };
    await page.setViewportSize(viewport);
    // The screen is the reference's too: a browser under test says its
    // screen is as large as its page, and an example may lay itself out by
    // which way the screen is up.
    if (screen) {
      const session = await page.context().newCDPSession(page);
      await session.send("Emulation.setDeviceMetricsOverride", {
        ...viewport,
        deviceScaleFactor: 1,
        mobile: false,
        screenWidth: screen.width,
        screenHeight: screen.height,
      });
    }
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    // The page only learns that a module did not load. Why is what the dev
    // server answered: most often a module of Qt the runtime does not have.
    const refused = [];
    const answers = [];
    const answered = async (response) => {
      if (response.status() < 500) return;
      // The browser keeps nothing of a script it could not load: ask again.
      const again = await page.request.get(response.url()).catch(() => null);
      const body = (await again?.text().catch(() => "")) ?? "";
      const said = body.match(/const error = (\{.*\})\s*$/m)?.[1];
      const message = said ? JSON.parse(said).message : `${response.status()} for ${response.url()}`;
      const missing = message.match(/^"\.\/(\S+)" is not exported .* from package \S+qml-solid /)?.[1];
      refused.push(missing ? `the runtime has no ${missing.replaceAll("/", ".")}` : message);
    };
    page.on("response", (response) => answers.push(answered(response)));

    await page.goto(`?example=${encodeURIComponent(example.id)}`);
    await page
      .waitForFunction(() => window.gallery && window.gallery.status !== "loading", null, { timeout: 20000 })
      .catch(() => pageErrors.push("the page did not finish loading the example"));
    // Its pictures and fonts are asked for when it is made: a busy server
    // may take longer over them than the wait that follows.
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    if (moving) await page.clock.runFor(example.qt?.settle ?? 1500);
    else await page.waitForTimeout(example.qt?.settle ?? 1500);
    // A window nothing shows is there and not to be seen: its QML does not
    // say `visible`, and main.cpp is what shows it.
    const state = await page.evaluate(() => {
      const stage = document.getElementById("stage");
      const style = stage.firstElementChild && getComputedStyle(stage.firstElementChild);
      return { ...window.gallery, children: stage.childElementCount, hidden: style?.visibility === "hidden" || style?.display === "none" };
    });
    await Promise.all(answers);
    const found =
      (compiled.lacks.length > 0 && refused.length > 0 ? `the runtime has no ${compiled.lacks.join(", ")}` : null) ??
      refused[0] ?? state.error ?? pageErrors[0] ?? (state.status !== "rendered" ? null : state.children === 0 ? "the example rendered nothing" : state.hidden ? "the example's window is not shown" : null);
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
      // Where the page's own error came from, when it is the one told of.
      stack: found != null && found === state.error ? (state.stack ?? null) : null,
      reference: example.reference !== null,
      qt: example.qt?.runnable ? null : (example.qt?.reason ?? null),
      pixels: similarity?.pixels ?? null,
      content: similarity?.content ?? null,
      mismatch: similarity?.mismatch ?? null,
      lacks: compiled.lacks,
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
