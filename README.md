# qml-solid

Compiles QML to Solid 2 components for the web.

```text
.qml ──oxc (QML mode)──▶ QML tree with Oxc expression leaves
     ──lower──────────▶ Oxc Program: component function + JSX nodes
     ──resolve────────▶ QML names bound to JavaScript bindings
     ──solidjs-compiler▶ templates, grouped effects, delegated events
```

One parser, one arena, one AST. The QML grammar is a mode of Oxc's own parser,
so binding values, handlers and functions are ordinary Oxc nodes. The lowering
builds the nodes Solid's JSX transform takes as input directly in the arena (no
JSX text is ever printed or parsed), and Solid's transform runs on them
unchanged. Names are resolved at compile time, so nothing interprets QML at run
time: `packages/runtime` is three unit helpers, `$model`, `Qt.callLater` and
`qsTr`.

The compiler knows the QML language, not a set of types. What `Item` or `Text`
is comes from the modules a file imports, each a table in
`crates/qml_solid/src/dialects` that says what its types and properties mean on
the DOM. A type no imported module has is a component: another `.qml` file, or
an inline `component` of the same file.

## Layout

- `crates/qml_solid`: the compiler (`qml_solid::compile`) and the `qmlc` binary.
- `packages/runtime`: what compiled output imports as `qml-solid/runtime`, and the Vite plugin.
- `examples/web`: QML rendered in the browser: hal-c2 TUI bricks, and components using each other.
- `corpus/qtdoc`: Qt's own examples (a submodule), the yardstick for what to support next.
- `mise-tasks/`: install, build, run, test and corpus, see below.
- `vendor/`: patched upstream crates, see below.

## Use

```sh
cargo run --bin qmlc -- File.qml                  # JavaScript on stdout
cargo run --bin qmlc -- --emit lowered File.qml   # the tree given to Solid, printed
cargo run --bin qmlc -- --out-dir out *.qml

cargo run --bin qmlc -- --alone File.qml          # without the files next to it

```

Everything else is a [mise](https://mise.jdx.dev) task, a script in
`mise-tasks/` that names what it depends on, so each of these first does
whatever it needs:

```sh
mise run install        # packages, Playwright's browser, the qtdoc submodule
mise run build          # build:compiler (qmlc) and build:web (the example's bundle)
mise run run            # the example, with Vite; QML recompiles as it is edited
mise run test           # test:compiler (cargo test) and test:web (Playwright)
mise run corpus         # how much of Qt's examples compiles, and what stops the rest
```

`qml-solid/vite` is a Vite plugin that runs `qmlc` on `.qml` imports.

Compiled modules import the host's singletons (`Shell`, `Theme`, ...) from
`qml-solid/host` and sibling components from `./Name.qml`; `--host`,
`--runtime` and `--component-extension` change those.

## Components

QML lets an instance set any property of a component's root object, handle its
signals and give it children. A component is therefore compiled with the files
next to it (`qml_solid::Project`; `qmlc` and the Vite plugin read the file's
directory): it takes exactly what some instance sets, and everything else stays
as static as it was written. `Badge { color: "red" }` makes `Badge.qml` read
`props.color`; with no such instance its colour is a literal in the template.
For the same reason a name no component has is a compile error where it is
set. `qmlc --alone` compiles a file by itself: it takes only what it declares
and unknown types are taken to be components.

## What is supported

Of the language: `property` declarations (constants, getters, lazy memos and
signals, chosen by how the property is used), ids, bindings and handlers,
functions, `signal` declarations and their handlers (with the signal's argument
names), `onXChanged` for declared properties, `Component.onCompleted` and
`Component.onDestruction`, `property alias` of `id.property`, `default property
alias` as the place for an instance's children, inline components, component
instances with bindings, handlers and children, and components whose root is a
component.

Not yet: objects as property values (`background: Rectangle {}`, `Component`,
`Loader`), reading built-in properties (`parent.width`, `label.text`),
`Connections`, value sources (`X on y`), object aliases, qualified type names.
Anything unsupported is a compile error that names what is missing.

Of types: the `import OpenTUI` dialect on the DOM (`Item`, `Rectangle`, `Text`,
`Span`, `Bold`, `Repeater`; a cell is `1ch` wide and `1lh` tall), which is what
the fixtures in `crates/qml_solid/tests/fixtures/tui` (hal-c2 TUI bricks) use.
There is no QtQuick dialect yet.

## Vendored crates

- `vendor/oxc_parser`: crates.io `oxc_parser` 0.144.0 (MIT). Added `src/qml/`
  and `Parser::parse_qml` in `src/lib.rs`, plus a `qml` diagnostic in
  `src/diagnostics.rs`. Wired in with `[patch.crates-io]`.
- `vendor/solidjs-compiler`: `packages/compiler` of solidjs/solid at `e44b2e4`
  (2.0.0-rc.13, MIT). Added `compile_program`, which takes an Oxc `Program`
  instead of source text; default features are empty so nothing needs Node.
