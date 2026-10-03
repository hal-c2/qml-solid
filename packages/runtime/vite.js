// Vite plugin: a `.qml` import is compiled by `qmlc` as it is loaded.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";

export default function qml({ qmlc = "qmlc", args = [] } = {}) {
  return {
    name: "qml-solid",
    load(id) {
      const [file] = id.split("?");
      if (!file.endsWith(".qml")) return null;
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
