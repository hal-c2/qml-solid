// Vite plugin: a `.qml` import is compiled by `qmlc` as it is loaded, and so
// is a script it imports.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";

// What marks a `.js` file as the script a QML file imports
// (`import "logic.js" as Logic`), which `qmlc` makes a module of.
const SCRIPT = "qml";

const isScript = (id) => {
  const [file, query] = id.split("?");
  return file.endsWith(".js") && new URLSearchParams(query).has(SCRIPT);
};

export default function qml({ qmlc = "qmlc", args = [] } = {}) {
  return {
    name: "qml-solid",
    // Before Vite's own: a script is told from any other `.js` file by who
    // imports it, and only here is that known.
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (!importer || !source.endsWith(".js") || !/^\.\.?\//.test(source)) return null;
      if (!importer.split("?")[0].endsWith(".qml") && !isScript(importer)) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (!resolved || resolved.external || resolved.id.includes("?")) return resolved;
      return { ...resolved, id: `${resolved.id}?${SCRIPT}` };
    },
    load(id) {
      const [file] = id.split("?");
      if (!file.endsWith(".qml") && !isScript(id)) return null;
      // A component is compiled with the files next to it: what they set on
      // its instances decides what it takes. A build that watches rebuilds
      // it when any of them changes.
      const directory = dirname(file);
      for (const sibling of readdirSync(directory)) {
        if (sibling.endsWith(".qml")) this.addWatchFile(join(directory, sibling));
      }
      const result = spawnSync(qmlc, [...args, file], { encoding: "utf8" });
      if (result.error) this.error(`could not run ${qmlc}: ${result.error.message}`);
      if (result.status !== 0) this.error(result.stderr.trim());
      return { code: result.stdout, map: null };
    },
    // The same for the dev server: a changed file takes the compiled output
    // of its whole directory with it.
    hotUpdate({ file, modules }) {
      if (!file.endsWith(".qml")) return;
      const directory = dirname(file);
      const affected = new Set(modules);
      for (const module of this.environment.moduleGraph.idToModuleMap.values()) {
        if (module.file?.endsWith(".qml") && dirname(module.file) === directory) affected.add(module);
      }
      return [...affected];
    },
  };
}
