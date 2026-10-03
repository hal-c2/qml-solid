//! QtQuick: a QML file as a module of the runtime's components.
//!
//! This is the path a file takes when what it imports is Qt's. The types it
//! names are the ones Qt describes ([`crate::qt`]) and the components of the
//! project; what comes out is a function per component that creates its
//! objects with the runtime's types (`packages/runtime`).

mod lower;
mod names;
mod scope;
mod types;

use oxc_ast::ast::Program;
use oxc_parser::qml::ast::QmlDocument;

use self::{lower::Lower, scope::Tree, types::Types};
use crate::{Error, Options, build::B, project::Project};

pub(crate) fn lower<'a>(
    b: B<'a>,
    source: &'a str,
    document: QmlDocument<'a>,
    project: &Project,
    options: &Options,
) -> Result<Program<'a>, Vec<Error>> {
    let types = Types { project, file: &options.name };
    let mut errors = Vec::new();
    let tree = Tree::analyze(&document, types, &mut errors);

    // `Button.qml` whose root is the `Button` it imports: the function is not
    // what the name means inside it.
    // A file in a directory of the project is known by its path from it.
    let stem = options.name.rsplit('/').next().unwrap_or(&options.name);
    let shadows = tree.objects.iter().any(|object| object.name == stem && !matches!(object.origin, Some(types::Origin::Inline)));
    let name = if shadows { format!("{stem}$component") } else { stem.to_string() };

    let mut lower = Lower::new(b, &tree, types, stem);
    let component = lower.component(&name, document.root, true);
    errors.append(&mut lower.errors);

    let mut body = b.vec();
    body.extend(std::mem::take(&mut lower.module));
    body.push(component);
    let mut program = b.program(source, body);
    let mut uses = lower.uses;
    names::resolve(b, &mut program, &tree, types, &mut uses, &mut errors);
    if !errors.is_empty() {
        return Err(errors);
    }

    let prefix = &options.qt_module;
    let mut imports = Vec::new();
    if !uses.kernel.is_empty() {
        imports.push(b.import_named(uses.kernel.iter().copied(), &format!("{prefix}/object")));
    }
    if !uses.globals.is_empty() {
        imports.push(b.import_named(uses.globals.iter().copied(), &format!("{prefix}/QtQml")));
    }
    for (uri, names) in &uses.modules {
        let module = format!("{prefix}/{}", uri.replace('.', "/"));
        imports.push(b.import_named(names.iter().map(String::as_str), &module));
    }
    for (name, file) in &uses.files {
        let path = types::relative(&options.name, file);
        imports.push(b.import_default(name, &format!("{path}{}", options.component_extension)));
    }
    for name in &uses.namespaces {
        match types.namespace(name).and_then(|source| names::namespace_source(source, prefix)) {
            Some(module) => imports.push(b.import_namespace(name, &module)),
            None => errors.push(Error::new(
                format!("`{name}` is a directory: only a module or a script can be imported as a name yet"),
                document.span,
            )),
        }
    }
    if !errors.is_empty() {
        return Err(errors);
    }
    for (index, import) in imports.into_iter().enumerate() {
        program.body.insert(index, import);
    }
    Ok(program)
}
