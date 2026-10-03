//! QML in, Solid out.
//!
//! ```text
//! .qml ──oxc (QML mode)──▶ QML tree with Oxc expression leaves
//!      ──lower──────────▶ Oxc Program: component function + JSX nodes
//!      ──resolve────────▶ QML names bound to JavaScript bindings
//!      ──solidjs-compiler▶ templates, grouped effects, delegated events
//! ```
//!
//! One parser, one arena, one AST. The QML grammar is a mode of Oxc's own
//! parser, the lowering builds the nodes Solid's JSX transform takes as input,
//! and Solid's transform runs on them unchanged.

mod build;
mod lower;
mod registry;
mod resolve;
mod scope;

use oxc_allocator::Allocator;
use oxc_ast::ast::Program;
use oxc_parser::Parser;
use oxc_span::{SourceType, Span};

pub use solidjs_compiler::CompileOptions as SolidOptions;

use crate::{build::B, lower::Lower, scope::Scopes};

#[derive(Debug, Clone)]
pub struct Options {
    /// The component's name, normally the file's stem.
    pub name: String,
    /// Module that exports the dialect's singletons (`Shell`, `Theme`, ...).
    pub host_module: String,
    /// Module that exports the unit helpers and `Qt`.
    pub runtime_module: String,
    /// Extension put on the import of a sibling component (`./Name.qml`).
    pub component_extension: String,
    pub solid: SolidOptions,
}

impl Default for Options {
    fn default() -> Self {
        Self {
            name: "Component".to_string(),
            host_module: "qml-solid/host".to_string(),
            runtime_module: "qml-solid/runtime".to_string(),
            component_extension: ".qml".to_string(),
            solid: SolidOptions::default(),
        }
    }
}

#[derive(Debug)]
pub struct Output {
    pub code: String,
    pub map: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Error {
    pub message: String,
    /// Offsets into the QML source.
    pub span: Span,
}

impl Error {
    pub(crate) fn new(message: impl Into<String>, span: Span) -> Self {
        Self { message: message.into(), span }
    }

    /// One-based line and column of the error in `source`.
    pub fn position(&self, source: &str) -> (usize, usize) {
        let before = &source[..(self.span.start as usize).min(source.len())];
        let line = before.matches('\n').count() + 1;
        let column = before.chars().rev().take_while(|c| *c != '\n').count() + 1;
        (line, column)
    }
}

/// Compiles a QML file to a JavaScript module whose default export is a Solid
/// component.
pub fn compile(source: &str, options: &Options) -> Result<Output, Vec<Error>> {
    let allocator = Allocator::default();
    let program = lower(&allocator, source, options)?;
    solidjs_compiler::compile_program(&allocator, program, source, &options.solid)
        .map(|output| Output { code: output.code, map: output.source_map })
        .map_err(|error| vec![Error::new(error.to_string(), Span::default())])
}

/// The tree handed to Solid's compiler, printed. Solid never sees this text;
/// it is here to look at what the lowering built.
pub fn lowered_source(source: &str, options: &Options) -> Result<String, Vec<Error>> {
    let allocator = Allocator::default();
    let program = lower(&allocator, source, options)?;
    Ok(oxc_codegen::Codegen::new().build(&program).code)
}

fn lower<'a>(
    allocator: &'a Allocator,
    source: &'a str,
    options: &Options,
) -> Result<Program<'a>, Vec<Error>> {
    let parsed = Parser::new(allocator, source, SourceType::ts()).parse_qml();
    if !parsed.diagnostics.is_empty() {
        return Err(parsed
            .diagnostics
            .into_iter()
            .map(|diagnostic| {
                let span = diagnostic.labels.first().map_or_else(Span::default, |label| {
                    let start = label.offset() as u32;
                    Span::new(start, start + label.len() as u32)
                });
                Error::new(diagnostic.message.to_string(), span)
            })
            .collect());
    }

    let b = B::new(allocator);
    let mut errors = Vec::new();
    let scopes = Scopes::analyze(&parsed.document, &mut errors);
    let mut lower = Lower::new(b, &scopes);
    let component = lower.component(&options.name, parsed.document.root);
    errors.append(&mut lower.errors);
    let Some(component) = component else { return Err(errors) };

    let mut program = b.program(source, b.vec1(component));
    let resolved = resolve::resolve(b, &mut program, &scopes, &mut errors);
    if !errors.is_empty() {
        return Err(errors);
    }

    let mut imports = Vec::new();
    if !lower.solid.is_empty() {
        imports.push(b.import_named(lower.solid.iter().copied(), "solid-js"));
    }
    let mut runtime = lower.runtime.clone();
    if resolved.qt {
        runtime.insert("Qt");
    }
    if !runtime.is_empty() {
        imports.push(b.import_named(runtime.iter().copied(), &options.runtime_module));
    }
    if !resolved.host.is_empty() {
        imports.push(b.import_named(resolved.host.iter().map(String::as_str), &options.host_module));
    }
    for component in &lower.components {
        let source = format!("./{component}{}", options.component_extension);
        imports.push(b.import_default(component, &source));
    }
    for (index, import) in imports.into_iter().enumerate() {
        program.body.insert(index, import);
    }
    Ok(program)
}
