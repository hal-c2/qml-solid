// Vite plugin: a `.qml` import is compiled by `qmlc` as it is loaded, and so
// is a script it imports.
//
// Much of Qt is QML itself: a style of Qt Quick Controls is a directory of
// QML files over the types of QtQuick.Templates. Those are not rewritten
// here. A module of Qt's is put together from what the runtime has of it
// (the types Qt has in C++) and the QML files of the Qt that is installed,
// compiled as any other.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { searchForWorkspaceRoot } from "vite";

// What marks a `.js` file as the script a QML file imports
// (`import "logic.js" as Logic`), which `qmlc` makes a module of.
const SCRIPT = "qml";

const isScript = (id) => {
  const [file, query] = id.split("?");
  return file.endsWith(".js") && new URLSearchParams(query).has(SCRIPT);
};

// The modules the runtime has, by what they are imported as.
const runtime = import.meta.dirname;
const natives = () => JSON.parse(readFileSync(join(runtime, "package.json"), "utf8")).exports;

// `qml-solid/QtQuick/Controls`: a module of Qt's, not `qml-solid/object`.
const MODULE = /^qml-solid\/(Qt[\w/]*)$/;
const VIRTUAL = "\0qml-solid:";
const path = (uri) => uri.replaceAll(".", "/");

// Where the Qt installed here keeps its QML modules.
function installed() {
  if (process.env.QT_INSTALL_QML) return process.env.QT_INSTALL_QML;
  for (const tool of ["qtpaths6", "qtpaths", "qmake6"]) {
    const asked = spawnSync(tool, [tool.startsWith("qmake") ? "-query" : "--query", "QT_INSTALL_QML"], { encoding: "utf8" });
    if (asked.status === 0 && asked.stdout.trim()) return asked.stdout.trim();
  }
  return null;
}

// What a `qmldir` says its module is made of: the QML files that are its
// types, and the modules that come with it.
function described(directory) {
  const file = join(directory, "qmldir");
  if (!existsSync(file)) return null;
  const types = new Map();
  const imports = [];
  let style = null;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const words = line.split("#")[0].trim().split(/\s+/);
    if (words[0] === "singleton" || words[0] === "internal") words.shift();
    if (words[0] === "import" && words[1]) imports.push(words[1]);
    // The style a program has when it chooses none.
    else if (words[0] === "default" && words[1] === "import" && words[2]) style = words[2];
    else if (/^[A-Z]/.test(words[0] ?? "") && words.at(-1).endsWith(".qml") && words.length <= 3) types.set(words[0], words.at(-1));
  }
  return { file, types, imports, style };
}

// - `qmlc`, `args`: the compiler and what it is run with.
// - `qt`: where the QML modules of Qt are, when not where `qtpaths` says.
// - `style`: what `import QtQuick.Controls` is, "Material" or "Fusion": a
//   name, or a function of the file that imports it when the files of one
//   build are not all of one style. Qt's default when there is none.
export default function qml({ qmlc = "qmlc", args = [], qt = installed(), style } = {}) {
  const styled = (importer) => (typeof style === "function" ? style(importer) : style);
  // A module that is put together here: one with QML files or a style, or
  // one the runtime has nothing of that only brings others. What the runtime
  // has whole (QtQuick) is left to it.
  const composed = (module, seen = []) => {
    const about = qt && !seen.includes(module) ? described(join(qt, module)) : null;
    if (!about) return null;
    if (about.types.size > 0 || about.style) return about;
    const brings = about.imports.some((uri) => has(path(uri), [...seen, module]));
    return !natives()[`./${module}`] && brings ? about : null;
  };
  const has = (module, seen = []) => Boolean(natives()[`./${module}`] || composed(module, seen));
  return {
    name: "qml-solid",
    // Before Vite's own: a script is told from any other `.js` file by who
    // imports it, and only here is that known.
    enforce: "pre",
    // Qt's own QML is outside the project.
    config(config) {
      if (!qt) return null;
      const allowed = config.server?.fs?.allow ? [] : [searchForWorkspaceRoot(config.root ?? process.cwd())];
      return { server: { fs: { allow: [...allowed, qt] } } };
    },
    async resolveId(source, importer, options) {
      const module = source.match(MODULE)?.[1];
      const about = module && composed(module);
      if (about) return `${VIRTUAL}${module}${about.style ? `?style=${styled(importer) ?? about.style.split(".").at(-1)}` : ""}`;
      if (!importer || (!importer.split("?")[0].endsWith(".qml") && !isScript(importer))) return null;
      // What compiled QML imports is the runtime's to find, wherever the QML
      // is: Qt's own is in no project.
      if (/^[\w@]/.test(source)) {
        const found = await this.resolve(source, importer, { ...options, skipSelf: true }).catch(() => null);
        if (found) return found;
        const own = natives()[source.replace(/^qml-solid(?=\/)/, ".")];
        return own ? join(runtime, own) : this.resolve(source, join(runtime, "index.js"), { ...options, skipSelf: true });
      }
      if (!source.endsWith(".js") || !/^\.\.?\//.test(source)) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (!resolved || resolved.external || resolved.id.includes("?")) return resolved;
      return { ...resolved, id: `${resolved.id}?${SCRIPT}` };
    },
    load(id) {
      if (id.startsWith(VIRTUAL)) {
        const [module, query] = id.slice(VIRTUAL.length).split("?");
        const directory = join(qt, module);
        const about = described(directory);
        this.addWatchFile(about.file);
        const lines = [];
        // What the runtime has of the module: the types Qt has in C++.
        const native = natives()[`./${module}`];
        if (native) lines.push(`export * from ${JSON.stringify(join(runtime, native))};`);
        // Its QML files, which come before a type of the same name in what
        // it imports: a named export hides one that `export *` brings.
        for (const [name, file] of about.types) {
          lines.push(`export { default as ${name} } from ${JSON.stringify(join(directory, file))};`);
        }
        const chosen = new URLSearchParams(query).get("style");
        const brought = chosen ? [`${about.style.split(".").slice(0, -1).join(".")}.${chosen}`] : about.imports;
        for (const uri of brought.map(path).filter((uri) => has(uri))) lines.push(`export * from "qml-solid/${uri}";`);
        return { code: lines.join("\n") + "\n", map: null };
      }
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
