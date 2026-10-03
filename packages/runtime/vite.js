// Vite plugin: a `.qml` import is compiled by `qmlc` as it is loaded, and so
// is a script it imports.
//
// Much of Qt is QML itself: a style of Qt Quick Controls is a directory of
// QML files over the types of QtQuick.Templates. Those are not rewritten
// here. A module of Qt's is put together from what the runtime has of it
// (the types Qt has in C++) and the QML files of the Qt that is installed,
// compiled as any other. A type Qt has in C++ and the runtime does not have
// yet is there all the same, to say so when it is used: a style names every
// control, and a program that uses three of them needs those three.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
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

// What the Qt installed here says of itself: where it keeps its QML modules
// and its tools, and which Qt it is.
function installed() {
  for (const tool of ["qtpaths6", "qtpaths", "qmake6"]) {
    const ask = (what) => {
      const asked = spawnSync(tool, [tool.startsWith("qmake") ? "-query" : "--query", what], { encoding: "utf8" });
      return asked.status === 0 ? asked.stdout.trim() : "";
    };
    const qml = ask("QT_INSTALL_QML");
    if (qml) return { qml, bins: ask("QT_INSTALL_BINS"), version: ask("QT_VERSION") };
  }
  return {};
}

// `qrc:/qt-project.org/imports/QtQuick/Controls/Basic/images/check.png`:
// where a module of Qt's keeps the pictures its QML names, inside the plugin
// that is the module. They are read out of it by Qt's own `qml` tool, into
// `directory`, once.
const KEPT = "qrc:/qt-project.org/imports";

const EXTRACT = (uri, folder) => `import QtQml
import Qt.labs.folderlistmodel
import ${uri} as Module

QtObject {
    id: root
    property FolderListModel folder: FolderListModel {
        showDirs: false
        folder: "${folder}"
        onStatusChanged: if (status === FolderListModel.Ready) root.read()
    }
    property Timer late: Timer { interval: 5000; running: true; onTriggered: Qt.quit() }
    function read() {
        for (let i = 0; i < folder.count; i++) {
            const name = folder.get(i, "fileName")
            const get = new XMLHttpRequest()
            get.open("GET", folder.folder + "/" + name, false)
            get.responseType = "arraybuffer"
            get.send()
            console.log("kept", name, Qt.btoa(get.response))
        }
        Qt.quit()
    }
}
`;

function extract(tool, uri, folder, directory) {
  mkdirSync(directory, { recursive: true });
  const script = join(directory, ".extract.qml");
  writeFileSync(script, EXTRACT(uri, folder));
  const ran = spawnSync(tool, [script], {
    encoding: "utf8",
    timeout: 20000,
    maxBuffer: 1 << 26,
    // Without a terminal Qt logs to the journal; without a display it has
    // nowhere to be.
    env: { ...process.env, QT_FORCE_STDERR_LOGGING: "1", QML_XHR_ALLOW_FILE_READ: "1", QT_QPA_PLATFORM: "offscreen" },
  });
  if (ran.error) return ran.error.message;
  for (const [, name, data] of ran.stderr.matchAll(/kept (\S+) (\S+)/g)) {
    writeFileSync(join(directory, name), Buffer.from(data, "base64"));
  }
  return null;
}

// What a `qmldir` says its module is made of: the QML files that are its
// types, and the modules that come with it. Of `optional import`s one comes,
// the `default import` when the program chooses no other: a style.
function described(directory) {
  const file = join(directory, "qmldir");
  if (!existsSync(file)) return null;
  const types = new Map();
  const imports = [];
  const defaults = [];
  let optional = false;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const words = line.split("#")[0].trim().split(/\s+/);
    if (words[0] === "singleton" || words[0] === "internal") words.shift();
    if (words[0] === "import" && words[1]) imports.push(words[1]);
    else if (words[0] === "optional" && words[1] === "import") optional = true;
    else if (words[0] === "default" && words[1] === "import" && words[2]) defaults.push(words[2]);
    else if (/^[A-Z]/.test(words[0] ?? "") && words.at(-1).endsWith(".qml") && words.length <= 3) types.set(words[0], words.at(-1));
  }
  // With nothing to choose from, a default is an import as any other.
  if (!optional) imports.push(...defaults);
  return { file, types, imports, style: optional ? (defaults[0] ?? null) : null };
}

// The names a module of the runtime's exports, its `export *` followed.
function exported(context, file, names = new Set(), seen = new Set()) {
  if (seen.has(file) || !existsSync(file)) return names;
  seen.add(file);
  context.addWatchFile(file);
  for (const node of context.parse(readFileSync(file, "utf8")).body) {
    if (node.type === "ExportAllDeclaration") {
      if (node.exported) names.add(node.exported.name ?? node.exported.value);
      else if (/^\.\.?\//.test(node.source.value)) exported(context, join(dirname(file), node.source.value), names, seen);
    } else if (node.type === "ExportNamedDeclaration") {
      for (const specifier of node.specifiers) names.add(specifier.exported.name ?? specifier.exported.value);
      if (node.declaration?.id) names.add(node.declaration.id.name);
      for (const declarator of node.declaration?.declarations ?? []) names.add(declarator.id.name);
    }
  }
  return names;
}

// - `qmlc`, `args`: the compiler and what it is run with.
// - `qt`: where the QML modules of Qt are, when not where `qtpaths` says.
// - `style`: what `import QtQuick.Controls` is, "Material" or "Fusion": a
//   name, or a function of the file that imports it when the files of one
//   build are not all of one style. Qt's default when there is none.
export default function qml({ qmlc = "qmlc", args = [], qt, style } = {}) {
  let asked;
  const found = () => (asked ??= installed());
  qt ??= process.env.QT_INSTALL_QML ?? found().qml ?? null;
  const styled = (importer) => (typeof style === "function" ? style(importer) : style);
  let cache = join(runtime, "node_modules/.vite/qml-solid");
  // The pictures of a module, by what its QML names them: next to the QML
  // when the installation has them there, otherwise read out of the plugin
  // when the QML names any. An `@2x` one is for a screen that is not asked
  // about yet.
  const kept = (module, about) => {
    const folder = `${KEPT}/${module}/images`;
    let directory = join(qt, module, "images");
    if (!existsSync(directory)) {
      const named = [...about.types.values()].some((file) => readFileSync(join(qt, module, file), "utf8").includes(folder));
      if (!named) return [];
      const { bins, version } = found();
      directory = join(cache, version || "qt", module, "images");
      if (!existsSync(directory)) {
        const failed = extract(join(bins || "", "qml"), module.replaceAll("/", "."), folder, directory);
        if (failed) console.warn(`qml-solid: the pictures of ${module} could not be read out of Qt: ${failed}`);
      }
    }
    return readdirSync(directory)
      .filter((name) => !name.startsWith(".") && !name.includes("@"))
      .map((name) => [`${folder}/${name}`, join(directory, name)]);
  };
  // The types Qt has of a module in C++, as the compiler's table has them:
  // what the runtime is to have of it. None for a module the table lacks.
  const tables = new Map();
  const needed = (module) => {
    if (!tables.has(module)) {
      const asked = spawnSync(qmlc, ["--types", module.replaceAll("/", ".")], { encoding: "utf8" });
      const names = asked.status === 0 ? asked.stdout.trim().split(" ").slice(1) : [];
      tables.set(module, names.length > 0 ? names : null);
    }
    return tables.get(module);
  };
  // What Qt's installation says of a module, when it is worth reading: one
  // with QML files or a style, or one that only brings others.
  const composed = (module, seen = []) => {
    const about = qt && !seen.includes(module) ? described(join(qt, module)) : null;
    if (!about) return null;
    if (about.types.size > 0 || about.style) return about;
    return about.imports.some((uri) => has(path(uri), [...seen, module])) ? about : null;
  };
  // `QML`, which QtQml's `qmldir` imports, is no module to import: what is
  // in it the runtime has in QtQml.
  const has = (module, seen = []) =>
    /^Qt/.test(module) && Boolean(natives()[`./${module}`] || needed(module) || composed(module, seen));
  // What a module is made of, in the order that decides whose a name is:
  // what the runtime has of it and its QML files, then what it brings, each
  // name from the first module to have it, and last what Qt has in C++ and
  // nothing here does. Names and not `export *`: a name two modules have is
  // one no file can import.
  const made = (context, module, chosen, seen = []) => {
    const about = composed(module);
    const native = natives()[`./${module}`];
    const names = new Set();
    if (native) exported(context, join(runtime, native), names);
    for (const name of about?.types.keys() ?? []) names.add(name);
    const styles = about?.style?.split(".");
    const imports = styles ? [[...styles.slice(0, -1), chosen ?? styles.at(-1)].join(".")] : (about?.imports ?? []);
    const brought = [];
    for (const uri of imports.map(path)) {
      if (uri === module || seen.includes(uri) || !has(uri)) continue;
      const theirs = [...made(context, uri, undefined, [...seen, module]).names].filter((name) => name !== "default" && !names.has(name));
      for (const name of theirs) names.add(name);
      if (theirs.length > 0) brought.push([uri, theirs]);
    }
    const missing = (needed(module) ?? []).filter((name) => !names.has(name));
    for (const name of missing) names.add(name);
    return { about, native, brought, missing, names };
  };
  return {
    name: "qml-solid",
    // Before Vite's own: a script is told from any other `.js` file by who
    // imports it, and only here is that known.
    enforce: "pre",
    configResolved(config) {
      cache = join(config.cacheDir, "qml-solid");
    },
    // Qt's own QML is outside the project.
    config(config) {
      if (!qt) return null;
      const allowed = config.server?.fs?.allow ? [] : [searchForWorkspaceRoot(config.root ?? process.cwd())];
      return { server: { fs: { allow: [...allowed, qt] } } };
    },
    async resolveId(source, importer, options) {
      const module = source.match(MODULE)?.[1];
      if (module && has(module)) {
        const chosen = composed(module)?.style;
        return `${VIRTUAL}${module}${chosen ? `?style=${styled(importer) ?? chosen.split(".").at(-1)}` : ""}`;
      }
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
        const { about, native, brought, missing } = made(this, module, new URLSearchParams(query).get("style") ?? undefined);
        const kernel = JSON.stringify(join(runtime, natives()["./object"]));
        const lines = [];
        // What the runtime has of the module: the types Qt has in C++.
        if (native) lines.push(`export * from ${JSON.stringify(join(runtime, native))};`);
        if (about) {
          this.addWatchFile(about.file);
          // Its QML files, which come before a type of the same name the
          // runtime has: a named export hides one that `export *` brings.
          for (const [name, file] of about.types) {
            lines.push(`export { default as ${name} } from ${JSON.stringify(join(qt, module, file))};`);
          }
          const pictures = kept(module, about);
          if (pictures.length > 0) {
            lines.push(`import { resources as $resources } from ${kernel};`);
            pictures.forEach(([url, file], index) => {
              lines.push(`import $${index} from ${JSON.stringify(file)};`, `$resources.set(${JSON.stringify(url)}, $${index});`);
            });
          }
        }
        for (const [uri, names] of brought) lines.push(`export { ${names.join(", ")} } from "qml-solid/${uri}";`);
        // What Qt has of it and the runtime does not, yet.
        if (missing.length > 0) {
          const uri = JSON.stringify(module.replaceAll("/", "."));
          lines.push(`import { absent as $absent } from ${kernel};`);
          for (const name of missing) lines.push(`export const ${name} = /* @__PURE__ */ $absent(${uri}, ${JSON.stringify(name)});`);
        }
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
