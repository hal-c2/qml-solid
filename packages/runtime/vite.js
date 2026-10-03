// Vite plugin: a `.qml` import is compiled by `qmlc` as it is loaded.
import { spawnSync } from "node:child_process";

export default function qml({ qmlc = "qmlc", args = [] } = {}) {
  return {
    name: "qml-solid",
    load(id) {
      const [file] = id.split("?");
      if (!file.endsWith(".qml")) return null;
      this.addWatchFile(file);
      const result = spawnSync(qmlc, [...args, file], { encoding: "utf8" });
      if (result.error) this.error(`could not run ${qmlc}: ${result.error.message}`);
      if (result.status !== 0) this.error(result.stderr.trim());
      return { code: result.stdout, map: null };
    },
  };
}
