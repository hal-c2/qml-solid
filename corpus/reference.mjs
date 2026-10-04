#!/usr/bin/env node
// What real Qt renders for each example: `corpus/reference/<id>.png`, the
// picture the web rendering is compared with.
//
//   corpus/reference.mjs [ID...]      # default: every example Qt can run
//
// The examples are run with the plain `qml` tool (no C++ of their own: the QML
// in `corpus/standins/<id>` stands in for it where there is some), on the
// offscreen platform, each in a small harness that loads the entry file, lets
// it settle and saves what it painted. Which examples that works for, and the
// window each gets, is in `corpus/examples.json`.
//
// `corpus/reference/reference.json` records when each picture was taken: an
// example that shows the time of day is compared at that same moment.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const corpus = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(corpus, "examples.json"), "utf8"));
const examples = join(corpus, manifest.root);
const output = join(corpus, "reference");
const indexFile = join(output, "reference.json");

const qml = process.env.QML ?? ["qml6", "qml"].find((tool) => spawnSync(tool, ["--help"], { env: { ...process.env, QT_QPA_PLATFORM: "offscreen" } }).status === 0);
if (!qml) {
  console.error("no `qml6` or `qml` tool: install Qt 6 (qt6-declarative), or set QML");
  process.exit(1);
}

// The screen the examples see: several lay themselves out by `Screen`, and the
// offscreen platform's own is 800x800.
const screen = { width: 1920, height: 1080 };

// The harness for an entry whose root is an Item: what `QQuickView` with
// `SizeRootObjectToView` shows, on the view's white.
const itemHarness = ({ entry, width, height, settle, png }) => `
import QtQuick
Window {
    width: ${width}; height: ${height}; visible: true
    Rectangle {
        id: stage
        anchors.fill: parent
        color: "white"
        Loader {
            id: loader
            anchors.fill: parent
            source: ${JSON.stringify(entry)}
            onStatusChanged: if (status === Loader.Error) Qt.exit(2)
        }
    }
    Timer {
        interval: ${settle}; running: loader.status === Loader.Ready
        onTriggered: stage.grabToImage(function (result) {
            console.log("reference:" + JSON.stringify({ at: Date.now(), width: stage.width, height: stage.height }))
            Qt.exit(result.saveToFile(${JSON.stringify(png)}) ? 0 : 3)
        })
    }
}
`;

// The harness for an entry whose root is a Window: the window is created as
// `QQmlApplicationEngine` would, and its whole scene (for an ApplicationWindow
// that includes the header, the footer and the popups) is grabbed. A grab
// leaves out the window's own colour, so it is laid over that colour in this
// harness's window and grabbed again.
const windowHarness = ({ entry, width, height, impose, properties, settle, png }) => `
import QtQuick
Window {
    id: harness
    visible: true
    property var target: null
    property var grab: null
    Rectangle {
        id: stage
        anchors.fill: parent
        color: harness.target ? harness.target.color : "white"
        Image {
            id: scene
            anchors.fill: parent
            cache: false
            onStatusChanged: if (status === Image.Ready) composed.start()
        }
    }
    Component.onCompleted: {
        const component = Qt.createComponent(${JSON.stringify(entry)})
        if (component.status !== Component.Ready) {
            console.error(component.errorString())
            Qt.exit(2)
            return
        }
        const target = component.createObject(null, ${JSON.stringify({ ...(impose ? { width, height } : {}), ...properties })})
        if (!target) {
            console.error(component.errorString())
            Qt.exit(2)
            return
        }
        harness.target = target
        settled.start()
    }
    Timer {
        id: settled
        interval: ${settle}
        onTriggered: {
            const target = harness.target
            harness.width = target.width
            harness.height = target.height
            let root = target.contentItem
            while (root.parent)
                root = root.parent
            root.grabToImage(function (result) {
                harness.grab = result
                console.log("reference:" + JSON.stringify({ at: Date.now(), width: root.width, height: root.height }))
                scene.source = result.url
            })
        }
    }
    Timer {
        id: composed
        interval: 100
        onTriggered: stage.grabToImage(function (result) {
            Qt.exit(result.saveToFile(${JSON.stringify(png)}) ? 0 : 3)
        })
    }
}
`;

function capture(example) {
  const directory = join(examples, example.dir);
  const scratch = mkdtempSync(join(tmpdir(), `qml-reference-${example.id}-`));
  try {
    const home = join(scratch, "home");
    mkdirSync(home);
    writeFileSync(
      join(scratch, "screen.json"),
      JSON.stringify({ screens: [{ name: "reference", x: 0, y: 0, ...screen, logicalDpi: 96, logicalBaseDpi: 96, dpr: 1 }] }),
    );
    // The example is run from a copy of its directory made of links, where
    // the `qmldir` can be put right: one written for a CMake build sends the
    // engine to resources (`prefer :/qt/qml/...`) that the plain tool has not
    // got. When the example imports itself by name (`import examples.Maroon`
    // in `maroon/`) the copy has that name.
    const copy = join(scratch, "modules", ...(example.qt.module ?? "example").split("."));
    mkdirSync(copy, { recursive: true });
    for (const name of readdirSync(directory)) {
      if (name !== "qmldir") symlinkSync(join(directory, name), join(copy, name));
    }
    if (existsSync(join(directory, "qmldir"))) {
      const lines = readFileSync(join(directory, "qmldir"), "utf8").split("\n");
      writeFileSync(join(copy, "qmldir"), lines.filter((line) => !/^(prefer|typeinfo)\b/.test(line)).join("\n"));
    }
    const entry = join(copy, example.entry);
    const importPaths = (example.importPaths ?? []).map((path) => resolve(copy, path));
    if (example.qt.module) importPaths.push(join(scratch, "modules"));
    // What stands in for the example's C++ is QML that Qt takes too: the
    // picture is of the example with the same types the web gives it.
    const standins = join(corpus, "standins", example.id);
    if (existsSync(standins)) importPaths.push(standins);

    const png = join(scratch, "reference.png");
    const harness = example.root === "Window" ? windowHarness : itemHarness;
    writeFileSync(
      join(scratch, "harness.qml"),
      harness({
        entry: pathToFileURL(entry).href,
        width: example.window.width,
        height: example.window.height,
        impose: example.window.imposed ?? false,
        properties: example.qt.properties ?? {},
        settle: example.qt.settle ?? 1500,
        png,
      }),
    );

    const environment = {
      PATH: process.env.PATH,
      HOME: home,
      XDG_CONFIG_HOME: join(home, ".config"),
      XDG_DATA_HOME: join(home, ".local/share"),
      XDG_CACHE_HOME: join(home, ".cache"),
      XDG_RUNTIME_DIR: process.env.XDG_RUNTIME_DIR ?? scratch,
      LANG: "en_US.UTF-8",
      TZ: "UTC",
      QT_QPA_PLATFORM: `offscreen:configfile=${join(scratch, "screen.json")}`,
      QT_FORCE_STDERR_LOGGING: "1",
      QT_SCALE_FACTOR: "1",
      QML_DISABLE_DISK_CACHE: "1",
      ...(example.qt.style ? { QT_QUICK_CONTROLS_STYLE: example.qt.style } : {}),
      ...(example.qt.controlsConf ? { QT_QUICK_CONTROLS_CONF: resolve(directory, example.qt.controlsConf) } : {}),
      ...(example.qt.env ?? {}),
    };
    const args = [...importPaths.flatMap((path) => ["-I", path]), join(scratch, "harness.qml")];
    // Without a network: in a network namespace of its own, which has none.
    const command = example.qt.offline ? ["unshare", "--map-root-user", "--net", qml, ...args] : [qml, ...args];
    const run = spawnSync(command[0], command.slice(1), { env: environment, encoding: "utf8", timeout: 30000, cwd: scratch });
    const log = (run.stderr ?? "") + (run.stdout ?? "");
    const captured = /reference:(\{.*\})/.exec(log);
    const warnings = log
      .split("\n")
      .filter((line) => line.trim() && !line.includes("reference:{"))
      .map((line) => line.replaceAll(pathToFileURL(copy).href + "/", "").replaceAll(scratch, "<scratch>"));
    if (run.status !== 0 || !captured || !existsSync(png) || statSync(png).size === 0) {
      const why = run.error?.code === "ETIMEDOUT" ? "timed out" : `exit ${run.status ?? run.signal}`;
      return { ok: false, why, warnings };
    }
    mkdirSync(output, { recursive: true });
    writeFileSync(join(output, `${example.id}.png`), readFileSync(png));
    return { ok: true, ...JSON.parse(captured[1]), warnings };
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

const wanted = process.argv.slice(2);
const unknown = wanted.filter((id) => !manifest.examples.some((example) => example.id === id));
if (unknown.length) {
  console.error(`no such example: ${unknown.join(", ")}`);
  process.exit(1);
}
const index = existsSync(indexFile) ? JSON.parse(readFileSync(indexFile, "utf8")) : {};
let failed = 0;
for (const example of manifest.examples) {
  if (wanted.length ? !wanted.includes(example.id) : !example.qt.runnable) continue;
  if (!example.qt.runnable) {
    console.log(`${example.id}: not run, ${example.qt.reason}`);
    continue;
  }
  const result = capture(example);
  for (const warning of result.warnings) console.log(`  ${warning}`);
  if (!result.ok) {
    failed += 1;
    console.log(`${example.id}: FAILED (${result.why})`);
    continue;
  }
  const { width, height } = example.window;
  const size = result.width === width && result.height === height ? "" : ` (the manifest says ${width}x${height})`;
  if (size) failed += 1;
  index[example.id] = { capturedAt: result.at, width: result.width, height: result.height };
  console.log(`${example.id}: ${result.width}x${result.height}${size}`);
}
if (existsSync(output)) {
  const sorted = Object.fromEntries(Object.entries(index).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(indexFile, JSON.stringify(sorted, null, 2) + "\n");
}
process.exit(failed ? 1 : 0);
