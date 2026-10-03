# qml-solid

Compiles QML to Solid 2 components for the web.

```text
.qml ──oxc (QML mode)──▶ QML tree with Oxc expression leaves
     ──lower──────────▶ Oxc Program: component function + JSX nodes
     ──resolve────────▶ QML names bound to JavaScript bindings
     ──solidjs-compiler▶ Solid's output: components, memos, effects
```

One parser, one arena, one AST. The QML grammar is a mode of Oxc's own parser,
so binding values, handlers and functions are ordinary Oxc nodes. The lowering
builds the nodes Solid's JSX transform takes as input directly in the arena (no
JSX text is ever printed or parsed), and Solid's transform runs on them
unchanged. Names are resolved at compile time, so nothing interprets QML at run
time: a binding is a getter Solid tracks, and an `id` is a JavaScript `const`.

A file that imports Qt's modules is compiled against Qt's own types
(`crates/qml_solid/src/qt/types.txt`, generated from the `.qmltypes` of a Qt
installation), and what it creates are the objects of `packages/runtime`:
QtQuick written for the DOM on Solid's signals. The yardstick is Qt's own
examples (`corpus/qtdoc`): `mise run gallery` compiles each, renders it in a
browser and compares it with the picture real Qt renders.

## Layout

- `crates/qml_solid`: the compiler (`qml_solid::compile`, `compile_script`) and the `qmlc` binary.
- `crates/qmltypes`: makes the table of Qt's types from a Qt installation (`mise run types`).
- `packages/runtime`: what compiled output imports, one module per QML module
  (`qml-solid/QtQuick`, `qml-solid/QtQuick/Layouts`, `qml-solid/QtQml`, ...), the kernel they
  are written on (`qml-solid/object`), and the Vite plugin (`qml-solid/vite`).
- `examples/gallery`: Qt's examples in the browser, and the report on how each does.
- `examples/web`: QML rendered in the browser with the `import OpenTUI` dialect.
- `corpus/qtdoc`: Qt's own examples (a submodule); `corpus/examples.json` says where each
  starts and what it needs, `corpus/reference` has Qt's pictures of them.
- `mise-tasks/`: install, build, run, test, gallery and corpus, see below.
- `vendor/`: patched upstream crates, see below.

## Use

```sh
cargo run --bin qmlc -- File.qml                  # JavaScript on stdout
cargo run --bin qmlc -- logic.js                  # a script a QML file imports, as a module
cargo run --bin qmlc -- --emit lowered File.qml   # the tree given to Solid, printed
cargo run --bin qmlc -- --out-dir out *.qml
cargo run --bin qmlc -- --root DIR File.qml       # where the project's modules are looked for
cargo run --bin qmlc -- --alone File.qml          # without the files next to it
cargo run --bin qmlc -- --types QtQuick.Layouts   # the types Qt has of a module in C++
```

Everything else is a [mise](https://mise.jdx.dev) task, a script in
`mise-tasks/` that names what it depends on, so each of these first does
whatever it needs:

```sh
mise run install        # the tooling in mise.toml: Rust (with the wasm target), Node, pnpm
mise run build          # build:compiler (qmlc) and build:web (the example's bundle)
mise run dev            # the example, with Vite; QML recompiles as it is edited
mise run test           # test:compiler, test:web, test:runtime and test:gallery
mise run gallery        # Qt's examples in a browser, against Qt's pictures of them
mise run gallery:serve  # the same page, to look at
mise run corpus         # how much of Qt's examples compiles, and what stops the rest
mise run reference      # take Qt's pictures again (needs Qt 6's `qml` tool)
mise run types          # the table of Qt's types, from the Qt installed here
```

`packages` (pnpm install) and `browser` (Playwright's Chromium) are tasks the
others depend on.

`qml-solid/vite` is a Vite plugin that runs `qmlc` on `.qml` imports and on the
scripts they import:

```js
import qml from "qml-solid/vite";
export default { plugins: [qml({ qmlc: "path/to/qmlc" })] };
```

```js
import { mount } from "qml-solid/object";
import Main from "./Main.qml";
mount(Main, document.getElementById("app"));
```

Much of Qt is QML itself: a style of Qt Quick Controls is a directory of QML
files over the types of `QtQuick.Templates`. Those are not rewritten here. The
plugin puts a module of Qt's together from what the runtime has of it (the
types Qt has in C++) and the QML files of the Qt that is installed, which it
compiles as it does the project's. `qt` is where that Qt keeps its QML modules,
when not where `qtpaths6 --query QT_INSTALL_QML` says; `style` is what
`import QtQuick.Controls` is (`"Material"`, `"Fusion"`), or a function of the
importing file that says. The pictures a style names by `qrc:/` are inside
its plugin; Qt's own `qml` tool reads them out, once, into Vite's cache. Qt's
QML and pictures are read from the installation and are not part of this
repository: what is built from them carries Qt's licence.

A type Qt has in C++ and the runtime does not have yet is in its module all the
same (`qmlc --types` says which those are): a style names every control, and a
program that uses three of them needs those three. Using one that is not there
is an error that names it, `QtQuick.Templates: Dial is not in qml-solid yet`.

## Components

QML lets an instance set any property of a component's root object, handle its
signals and give it children. A component is therefore compiled with the files
next to it and the modules it imports (`qml_solid::Project`; `qmlc` and the
Vite plugin read the file's directory, its `qmldir` and the directories it
imports): what a type is, what its properties are and which names are ids of
an enclosing file are all known when the file is compiled. A name nothing
declares is a compile error where it is used. `qmlc --alone` compiles a file by
itself: unknown types are taken to be components.

A file is a function that makes its root object:

```js
export default function Panel($props) {
  const root = $props.$self ?? $object();
  return <Rectangle $self={root} $given={$props} $declare={Panel$} color={...}>{$props.children}</Rectangle>;
}
```

(as nodes, not text). `$declare` is what the file declares on top of its root
type: properties, signals, functions, aliases. Enums are members of the
function, a `pragma Singleton` file exports the one object.

## Scripts and files named by path

`import "logic.js" as Logic` is a module import: `qmlc` makes an ES module of
the script, exporting what it declares, with `.import` lines as imports.

Qt compiles a QML file when the program first names it by path. Here files are
compiled ahead of time, so a path is turned into what it names when the file is
compiled: `Qt.createComponent("Block.qml")`, `source: "Page.qml"` and
`Qt.resolvedUrl("Page.qml")` import the file and give the component, there at
once, with Qt's `status` and `createObject`. A path put together at run time
(`"towers/" + name + ".qml"`) is looked up among the files of the directory
that it could name.

## What is supported

Of the language: property declarations (with `required`, `readonly`,
`default`, aliases of properties and of objects), ids, bindings and handlers,
functions, signals, inline components, enums, singletons, attached and grouped
properties, objects and lists of objects as property values, `Component`,
value sources and interceptors (`NumberAnimation on x`, `Behavior on x`),
`Connections`, `PropertyChanges`, qualified imports and type names, modules of
the project found through `qmldir`, scripts.

Not yet: scripts that are not `.pragma library` share their state between the
objects that import them and do not see those objects' names; `Qt.createQmlObject`
(there is no compiler in the page); types registered from C++, which need a
stand-in. Anything unsupported is a compile error that names what is missing.

Of Qt's modules, in `packages/runtime`: QtQuick (items, rectangles and
gradients, transforms, positioners, anchors, states and transitions,
animations and behaviors, timers, windows and screens, palettes, models,
Repeater, ListView, GridView, Flickable, Loader), QtQuick.Layouts,
QtQuick.Window, QtQml (the `Qt` object, locales, `Component`), QtCore and
Qt.labs.settings. `mise run gallery` says, for each of Qt's examples, which
modules it still lacks.

The `import OpenTUI` dialect (`crates/qml_solid/src/dialects`) is the other
way a module can be given: a table that says what its types and properties
mean on the DOM, compiled to Solid's templates with no runtime types at all
(`Item`, `Rectangle`, `Text`, `Span`, `Bold`, `Repeater`; a cell is `1ch` wide
and `1lh` tall). The fixtures in `crates/qml_solid/tests/fixtures/tui` use it.

## Vendored crates

- `vendor/oxc_parser`: crates.io `oxc_parser` 0.144.0 (MIT). Added `src/qml/`
  and `Parser::parse_qml` in `src/lib.rs`, plus a `qml` diagnostic in
  `src/diagnostics.rs`. Wired in with `[patch.crates-io]`.
- `vendor/solidjs-compiler`: `packages/compiler` of solidjs/solid at `e44b2e4`
  (2.0.0-rc.13, MIT). Added `compile_program`, which takes an Oxc `Program`
  instead of source text; default features are empty so nothing needs Node.
