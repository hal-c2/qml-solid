import { existsSync, readFileSync } from "node:fs";
import { join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import qml from "qml-solid/vite";
import { manifestFile, readManifest } from "./manifest.js";

const path = (relative) => fileURLToPath(new URL(relative, import.meta.url));

// `virtual:examples`: the manifest as a module, each example with a `load`
// that imports its entry file where it lies in the corpus. A dynamic import
// an example, so that one is compiled only when it is asked for and one that
// fails takes no other with it.
function examples() {
  const name = "virtual:examples";
  return {
    name: "gallery-examples",
    resolveId: (source) => (source === name ? "\0" + name : null),
    load(id) {
      if (id !== "\0" + name) return null;
      this.addWatchFile(manifestFile);
      const pictures = [];
      const entries = readManifest().map((example, index) => {
        const { id, dir, entry, window, root, rootType, imports, cpp, qt, notes } = example;
        const data = JSON.stringify({ id, dir, entry, window, root, rootType, imports, cpp, qt, notes });
        if (example.reference) pictures.push(`import reference${index} from ${JSON.stringify(example.reference + "?url")};`);
        const reference = example.reference ? `reference${index}` : "null";
        const main = example.main ? `() => import(${JSON.stringify(example.main)})` : "null";
        return `{ ...${data}, reference: ${reference}, main: ${main}, load: () => import(${JSON.stringify(example.entryFile)}) }`;
      });
      return `${pictures.join("\n")}\nexport default [\n${entries.join(",\n")}\n];\n`;
    },
  };
}

// The style of Qt Quick Controls an example has: the one its main.cpp or
// its qtquickcontrols2.conf chooses, as the reference picture was taken with,
// and otherwise the one Qt chooses on the machine the pictures are from.
function style(importer) {
  const example = readManifest().find(({ directory }) => importer?.startsWith(directory + sep));
  if (!example) return undefined;
  if (example.qt.style) return example.qt.style;
  const conf = example.qt.controlsConf && join(example.directory, example.qt.controlsConf);
  const chosen = conf && existsSync(conf) ? readFileSync(conf, "utf8").match(/^\s*Style\s*=\s*(\w+)/m)?.[1] : null;
  if (chosen) return chosen === "Default" ? "Basic" : chosen;
  return "Fusion";
}

// The QML that stands in for the C++ of the example a file is of, or is
// itself one of the files that do.
function standins(file) {
  const example = readManifest().find(
    ({ directory, standins }) => standins && (file.startsWith(directory + sep) || file.startsWith(standins + sep)),
  );
  return example ? [example.standins] : [];
}

// The plugin stops the build at a file `qmlc` does not take. Here that is the
// usual case and must not stop anything: the file becomes a module that
// throws the compiler's message when it is imported, so the example that
// needs it fails, with the reason, in the page.
function tolerant(plugin) {
  return {
    ...plugin,
    load(id) {
      try {
        return plugin.load.call(this, id);
      } catch (error) {
        const message = String(error?.message ?? error);
        return { code: `throw new Error(${JSON.stringify(message)});\nexport default undefined;\n`, map: null };
      }
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [examples(), tolerant(qml({ qmlc: process.env.QMLC ?? path("../../target/debug/qmlc"), style, standins }))],
  resolve: {
    // Qt's examples have no app behind them: nothing to find here.
    alias: { "qml-solid/host": path("./host.js") },
    // The QML is in the corpus, outside this package: what its compiled
    // output imports still resolves from here.
    dedupe: ["solid-js", "@solidjs/web", "qml-solid"],
  },
  // Known before the first example is loaded, so the server does not reload
  // the page to bundle them when it meets them.
  optimizeDeps: { include: ["solid-js", "@solidjs/web"] },
  // The server tells every page of an error in any: its overlay would cover an
  // example that renders with what another one lacks.
  server: { fs: { allow: [path("../..")] }, hmr: { overlay: false } },
});
