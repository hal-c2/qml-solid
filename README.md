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
time: `packages/runtime` is three unit helpers, `$model` and `Qt.callLater`.

## Layout

- `crates/qml_solid`: the compiler (`qml_solid::compile`) and the `qmlc` binary.
- `packages/runtime`: what compiled output imports as `qml-solid/runtime`, and the Vite plugin.
- `examples/web`: hal-c2 TUI bricks rendered in the browser.
- `vendor/`: patched upstream crates, see below.

## Use

```sh
cargo run --bin qmlc -- File.qml                  # JavaScript on stdout
cargo run --bin qmlc -- --emit lowered File.qml   # the tree given to Solid, printed
cargo run --bin qmlc -- --out-dir out *.qml

cargo test                                        # parser, compiler, fixture snapshots

pnpm install
pnpm --filter qml-solid-example-web dev           # the example, with Vite
pnpm --filter qml-solid-example-web test          # Playwright, against the built bundle
```

`qml-solid/vite` is a Vite plugin that runs `qmlc` on `.qml` imports.

Compiled modules import the dialect's singletons (`Shell`, `Theme`, ...) from
`qml-solid/host` and sibling components from `./Name.qml`; `--host`,
`--runtime` and `--component-extension` change those.

## What is supported

The `import OpenTUI` dialect, on the DOM: `Item`, `Rectangle`, `Text`, `Span`,
`Bold`, `Repeater`, component instances with bindings, `property`
declarations, ids, handlers. A cell is `1ch` wide and `1lh` tall. Anything else
is a compile error that names what is missing. 10 of hal-c2's 30 TUI bricks
compile; they are the fixtures in `crates/qml_solid/tests/fixtures/tui`.

## Vendored crates

- `vendor/oxc_parser`: crates.io `oxc_parser` 0.144.0 (MIT). Added `src/qml/`
  and `Parser::parse_qml` in `src/lib.rs`, plus a `qml` diagnostic in
  `src/diagnostics.rs`. Wired in with `[patch.crates-io]`.
- `vendor/solidjs-compiler`: `packages/compiler` of solidjs/solid at `e44b2e4`
  (2.0.0-rc.13, MIT). Added `compile_program`, which takes an Oxc `Program`
  instead of source text; default features are empty so nothing needs Node.
