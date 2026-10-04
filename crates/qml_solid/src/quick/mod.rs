//! QtQuick: a QML file as a module of the runtime's components.
//!
//! This is the path a file takes when what it imports is Qt's. The types it
//! names are the ones Qt describes ([`crate::qt`]) and the components of the
//! project; what comes out is a function per component that creates its
//! objects with the runtime's types (`packages/runtime`).

mod lower;
mod names;
mod paths;
mod scope;
pub(crate) mod script;
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
    // `Screen.ui.qml` is the type `Screen`.
    let stem = stem.strip_suffix(".ui").unwrap_or(stem);
    // A file may name itself, for its enums or to make more of itself.
    let is_other = |origin: &Option<types::Origin>| match origin {
        Some(types::Origin::Inline) => false,
        Some(types::Origin::File(file)) => *file != options.name,
        _ => true,
    };
    let shadows = tree.objects.iter().any(|object| object.name == stem && is_other(&object.origin));
    // `pragma Singleton`: what the file exports is the one object, and the
    // function that makes it has to be called something else.
    let is_singleton = project.summary(&options.name).is_some_and(|summary| summary.is_singleton);
    let name = if shadows || is_singleton { format!("{stem}$component") } else { stem.to_string() };

    let mut lower = Lower::new(b, &tree, types, stem);
    lower.uses.paths.known.clone_from(&options.files);
    lower.uses.paths.pictures.clone_from(&options.pictures);
    let root = document.root.type_name.to_string();
    let (component, enums) = lower.component(&name, document.root, !is_singleton);
    errors.append(&mut lower.errors);

    let mut body = b.vec();
    body.extend(std::mem::take(&mut lower.module));
    body.push(component);
    if is_singleton {
        lower.uses.kernel.insert("$singleton");
        body.push(b.const_(stem, b.call(b.id("$singleton"), [b.id(&name), b.record(enums)])));
        body.push(b.export_default(b.id(stem)));
    } else {
        body.push(lower.extends(&name, &root));
        if !enums.is_empty() {
            body.push(lower.keys(&name, enums));
        }
    }
    let mut program = b.program(source, body);
    let mut uses = lower.uses;
    names::resolve(b, &mut program, &tree, types, stem, &lower.dynamic, &mut uses, &mut errors);
    if uses.handles.iter().any(|handle| handle.starts_with("$scope")) {
        uses.kernel.insert("$context");
    }
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
        if *file == options.name {
            continue;
        }
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
    let (files, tables) = uses.paths.statements(b, &options.component_extension);
    imports.extend(files);
    imports.extend(tables);
    for (index, import) in imports.into_iter().enumerate() {
        program.body.insert(index, import);
    }
    Ok(program)
}
