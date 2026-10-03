//! QtQuick objects as the runtime's components.
//!
//! Every object becomes a JSX element whose tag is its type, which Solid
//! turns into `createComponent(Type, props)`: a plain value for what is
//! written as one, a getter for a binding. Nothing is left of QML's structure
//! at run time but those calls:
//!
//! ```text
//! Item { id: root; width: 200; Text { text: root.width } }
//!
//! export default function Sample($props) {
//!   const root = $props.$self ?? $object();
//!   return <Item $self={root} $given={$props} width={200}><Text text={root.width}/>{$props.children}</Item>;
//! }
//! ```
//!
//! An object is held by a binding made before anything is created (its `id`,
//! or a name of ours), so an expression may name any object of its component
//! whatever the order they are created in.

use std::collections::{BTreeMap, BTreeSet, HashSet};

use oxc_allocator::{ArenaBox, ArenaVec};
use oxc_ast::ast::*;
use oxc_parser::qml::ast::*;
use oxc_span::Span;

use super::{
    scope::{self, Tree},
    types::{self, Member, Origin, Property, Types},
};
use crate::{Error, build::B, qt};

/// What the module has to import.
#[derive(Default)]
pub(crate) struct Uses {
    /// The kernel's own: `$object`, `$component`, `$url`.
    pub kernel: BTreeSet<&'static str>,
    /// QML's globals: `Qt`, `qsTr`.
    pub globals: BTreeSet<&'static str>,
    /// Qt's types, by the URI of the module the file imports them from.
    pub modules: BTreeMap<String, BTreeSet<String>>,
    /// Components, by name, and the file each is.
    pub files: BTreeMap<String, String>,
    /// What the file imports `as` something.
    pub namespaces: BTreeSet<String>,
    /// The objects something names: the others need no binding.
    pub handles: HashSet<String>,
}

impl Uses {
    pub(crate) fn origin(&mut self, name: &str, origin: &Origin) {
        // `C.Button` is reached through `C`.
        let first = name.split('.').next().unwrap_or(name);
        match origin {
            Origin::Module(uri) => {
                self.modules.entry(uri.clone()).or_default().insert(first.to_string());
            }
            Origin::File(file) => {
                self.files.insert(first.to_string(), file.clone());
            }
            Origin::Namespace => {
                self.namespaces.insert(first.to_string());
            }
            Origin::Inline => {}
        }
    }
}

/// What an object is to the code around it.
enum Role<'r> {
    /// The root of the file's component or of an inline one: what an
    /// instance sets is set on it.
    Root,
    /// The root of a template: the object a delegate makes, given `data`.
    Template(&'r str),
    Plain,
    /// `Animation on x { }`: a value source or interceptor of a property.
    Source { target: &'r str, property: String },
}

/// What an object's members come to.
struct Built<'a> {
    attributes: ArenaVec<'a, JSXAttributeItem<'a>>,
    children: ArenaVec<'a, JSXChild<'a>>,
    /// Declared properties and their type's default.
    properties: Vec<(String, Expression<'a>)>,
    signals: Vec<String>,
    functions: Vec<(String, Expression<'a>)>,
    aliases: Vec<(String, Expression<'a>)>,
    /// The types whose attached properties the object sets.
    attach: Vec<String>,
    /// What a `PropertyChanges` changes.
    changes: Vec<Expression<'a>>,
    /// The properties it asks whoever makes it for.
    required: Vec<String>,
}

/// The properties of `PropertyChanges` itself; any other name is a property
/// of its target.
const CHANGES: &[&str] = &["target", "explicit", "restoreEntryValues"];

pub(crate) struct Lower<'a, 's> {
    b: B<'a>,
    tree: &'s Tree<'a>,
    types: Types<'s>,
    name: &'s str,
    pub errors: Vec<Error>,
    /// What goes before the component in the module: what its objects
    /// declare, the URLs it names, its inline components.
    pub module: Vec<Statement<'a>>,
    pub uses: Uses,
    /// The bindings of the component being built and of each template in it
    /// that is open.
    frames: Vec<Vec<Statement<'a>>>,
    /// The object an instance's children go into.
    children: Option<String>,
    specs: usize,
    /// The files the module names, each once: `$url1` is the first.
    urls: Vec<String>,
    /// The keys of the enums the component being built declares.
    enums: Vec<(String, Expression<'a>)>,
    /// The names some component of the project takes from whatever made it.
    pub dynamic: HashSet<String>,
}

impl<'a, 's> Lower<'a, 's> {
    pub(crate) fn new(b: B<'a>, tree: &'s Tree<'a>, types: Types<'s>, name: &'s str) -> Self {
        Self {
            b,
            tree,
            types,
            name,
            errors: Vec::new(),
            module: Vec::new(),
            uses: Uses::default(),
            frames: Vec::new(),
            children: None,
            specs: 0,
            urls: Vec::new(),
            enums: Vec::new(),
            dynamic: types.project.dynamic_names(),
        }
    }

    /// `function Name($props) { const root = ...; return <Root .../>; }`, and
    /// the keys of the enums it declares: those are the type's, not an
    /// object's.
    pub(crate) fn component(
        &mut self,
        name: &str,
        root: QmlObject<'a>,
        export: bool,
    ) -> (Statement<'a>, Vec<(String, Expression<'a>)>) {
        let b = self.b;
        let index = self.tree.index_of(&root);
        let handle = self.tree.objects[index].handle.clone();
        let children = children_target(&root).unwrap_or_else(|| handle.clone());
        // What an instance gives the root goes through its binding.
        self.uses.handles.insert(handle.clone());
        self.uses.handles.insert(children.clone());
        let outer_children = self.children.replace(children);
        let outer_frames = std::mem::take(&mut self.frames);
        let outer_enums = std::mem::take(&mut self.enums);
        self.frames.push(Vec::new());
        let element = self.element(root, Role::Root);
        let frame = self.frames.pop().unwrap_or_default();
        self.frames = outer_frames;
        let enums = std::mem::replace(&mut self.enums, outer_enums);
        self.children = outer_children;

        self.uses.kernel.insert("$object");
        let mut statements = b.vec();
        // An instance that has an id made the object already.
        let given = b.member(b.id("$props"), "$self");
        statements.push(b.const_(&handle, b.coalesce(given, b.call(b.id("$object"), []))));
        statements.extend(frame);
        // Where the project looks a name up as it runs, the component says
        // what it has to be found: its ids, and its root for its properties.
        // What made it is where the search goes on.
        if !self.dynamic.is_empty() {
            let mut arguments = vec![b.member(b.id("$props"), "$context"), b.id(&handle)];
            let ids: Vec<_> =
                self.tree.ids_of(index).into_iter().filter(|id| self.dynamic.contains(*id)).collect();
            if !ids.is_empty() {
                arguments.push(b.arrow(&[], b.record(ids.iter().map(|id| ((*id).to_string(), b.id(id))))));
            }
            statements.push(b.const_(&self.tree.scope_of(index), b.call(b.id("$context"), arguments)));
        }
        statements.push(b.return_(element));
        let function = if export {
            b.export_default_function(name, &["$props"], statements)
        } else {
            b.function_declaration(name, &["$props"], statements)
        };
        (function, enums)
    }

    /// `Object.assign(Name, { Light: 0, Dark: 1 })`: `Name.Dark` is read off
    /// the component, as it is off a type of Qt's.
    pub(crate) fn keys(&self, name: &str, enums: Vec<(String, Expression<'a>)>) -> Statement<'a> {
        let b = self.b;
        b.statement(b.call(b.member(b.id("Object"), "assign"), [b.id(name), b.record(enums)]))
    }

    fn frame(&mut self) -> &mut Vec<Statement<'a>> {
        self.frames.last_mut().expect("an object is lowered inside a component")
    }

    fn element(&mut self, object: QmlObject<'a>, role: Role<'_>) -> Expression<'a> {
        let b = self.b;
        let tree = self.tree;
        let index = tree.index_of(&object);
        let info = &tree.objects[index];
        let handle = info.handle.as_str();
        let tag = object.type_name.to_string();
        if let Some(origin) = &info.origin {
            self.uses.origin(&tag, origin);
        }

        let mut built = Built {
            attributes: b.vec(),
            children: b.vec(),
            properties: Vec::new(),
            signals: Vec::new(),
            functions: Vec::new(),
            aliases: Vec::new(),
            attach: Vec::new(),
            changes: Vec::new(),
            required: Vec::new(),
        };
        built.attributes.push(b.attr("$self", b.id(handle)));
        match &role {
            Role::Root => built.attributes.push(b.attr("$given", b.id("$props"))),
            Role::Source { target, property } => {
                self.uses.handles.insert((*target).to_string());
                built.attributes.push(b.attr("$target", b.id(target)));
                built.attributes.push(b.attr_string("$property", property));
            }
            Role::Template(_) | Role::Plain => {}
        }
        // A component of the project may look for a name in what made it.
        if !self.dynamic.is_empty() && matches!(info.origin, Some(Origin::File(_) | Origin::Inline)) {
            let scope = tree.scope_of(index);
            built.attributes.push(b.attr("$context", b.id(&scope)));
            self.uses.handles.insert(scope);
        }
        if !matches!(role, Role::Root) {
            self.uses.kernel.insert("$object");
            let made = b.const_(handle, b.call(b.id("$object"), []));
            self.frame().push(made);
        }

        let bound: HashSet<&str> = object
            .members
            .iter()
            .filter_map(|member| match member {
                QmlMember::Binding(binding) => binding.name.as_simple(),
                QmlMember::Property(property) if property.value.is_some() => Some(property.name.name.as_str()),
                _ => None,
            })
            .collect();
        self.members(object.members, index, &[], &mut built);

        // A delegate's required properties are what it is given.
        if let Role::Template(data) = role {
            let mut required = std::mem::take(&mut built.required);
            if let Some(kind) = &info.kind {
                for name in self.types.required(kind) {
                    if !required.contains(&name) {
                        required.push(name);
                    }
                }
            }
            for name in required {
                if !bound.contains(name.as_str()) {
                    built.attributes.push(b.attr(&name, b.member(b.id(data), &name)));
                }
            }
        }

        if !built.properties.is_empty() || !built.signals.is_empty() {
            let spec = match self.specs {
                0 => format!("{}$", self.name),
                count => format!("{}${count}", self.name),
            };
            self.specs += 1;
            let mut entries = vec![("properties".to_string(), b.record(built.properties))];
            if !built.signals.is_empty() {
                let signals = built.signals.iter().map(|signal| b.string(signal));
                entries.push(("signals".to_string(), b.array(signals)));
            }
            self.module.push(b.const_(&spec, b.record(entries)));
            built.attributes.push(b.attr("$declare", b.id(&spec)));
        }
        if !built.functions.is_empty() {
            built.attributes.push(b.attr("$functions", b.record(built.functions)));
        }
        if !built.aliases.is_empty() {
            built.attributes.push(b.attr("$aliases", b.record(built.aliases)));
        }
        if !built.attach.is_empty() {
            let types = built.attach.iter().map(|name| match name.split_once('.') {
                Some((namespace, name)) => b.member(b.id(namespace), name),
                None => b.id(name),
            });
            built.attributes.push(b.attr("$attach", b.array(types)));
        }
        if !built.changes.is_empty() {
            built.attributes.push(b.attr("$changes", b.array(built.changes)));
        }
        if self.frames.len() == 1 && self.children.as_deref() == Some(handle) {
            built.children.push(b.child(b.member(b.id("$props"), "children")));
        }
        b.element(&tag, built.attributes, built.children)
    }

    /// The members of an object, or of a group of it (`font { }`), `group`
    /// being the names that lead there.
    fn members(
        &mut self,
        members: ArenaVec<'a, QmlMember<'a>>,
        index: usize,
        group: &[&'a str],
        built: &mut Built<'a>,
    ) {
        for member in members {
            match member {
                QmlMember::Object(child) if scope::is_group(&child) => {
                    let mut path = group.to_vec();
                    path.extend(child.type_name.parts.iter().copied());
                    self.members(child.members, index, &path, built);
                }
                QmlMember::Object(child) => self.child(child, index, built),
                QmlMember::Binding(binding) => self.binding(binding, index, group, built),
                QmlMember::Property(property) => self.property(property, built),
                QmlMember::Signal(signal) => built.signals.push(signal.name.name.to_string()),
                QmlMember::Function(function) => self.function(function, index, built),
                QmlMember::InlineComponent(inline) => {
                    let name = inline.name.name.as_str();
                    let (component, enums) = self.component(name, inline.object, false);
                    self.module.push(component);
                    if !enums.is_empty() {
                        let keys = self.keys(name, enums);
                        self.module.push(keys);
                    }
                }
                QmlMember::Enum(declaration) => {
                    for member in &declaration.members {
                        #[expect(clippy::cast_precision_loss)]
                        let value = self.b.number(member.value as f64);
                        self.enums.push((member.name.name.to_string(), value));
                    }
                }
            }
        }
    }

    /// An object written inside another.
    fn child(&mut self, child: QmlObject<'a>, index: usize, built: &mut Built<'a>) {
        let b = self.b;
        let tree = self.tree;
        if let Some(on) = &child.on {
            let property = on.parts.join("$");
            let target = tree.objects[index].handle.as_str();
            let element = self.element(child, Role::Source { target, property });
            built.children.push(b.child(element));
            return;
        }
        let is_template = tree.objects[tree.index_of(&child)].is_template;
        let default = tree.objects[index].kind.as_ref().and_then(|kind| self.types.default_component(kind));
        let value = self.object_value(child);
        match default {
            Some(name) => built.attributes.push(b.attr(name, value)),
            // Nothing takes a `Component` as a child: its id is how it is used.
            None if is_template => {}
            None => built.children.push(b.child(value)),
        }
    }

    /// An object where a value goes: the object, or the template it is.
    fn object_value(&mut self, object: QmlObject<'a>) -> Expression<'a> {
        let index = self.tree.index_of(&object);
        if self.tree.objects[index].is_template {
            self.template(object, index)
        } else if self.tree.is_root(index) {
            self.delegate(object, index)
        } else {
            self.element(object, Role::Plain)
        }
    }

    /// `Component { id: name; Object { } }`: the template of the object in it.
    fn template(&mut self, object: QmlObject<'a>, index: usize) -> Expression<'a> {
        let b = self.b;
        let handle = self.tree.objects[index].handle.as_str();
        let has_id = scope::id(&object).is_some();
        let span = object.type_name.span;
        let mut content = None;
        for member in object.members {
            match member {
                QmlMember::Object(child) if content.is_none() => content = Some(child),
                QmlMember::Binding(binding) if binding.name.as_simple() == Some("id") => {}
                _ => self.errors.push(Error::new("a Component holds one object and nothing else", span)),
            }
        }
        let component = match content {
            Some(child) => self.object_value(child),
            None => {
                self.errors.push(Error::new("a Component with no object in it", span));
                b.void_0()
            }
        };
        if !has_id {
            return component;
        }
        let named = b.const_(handle, component);
        self.frame().push(named);
        b.id(handle)
    }

    /// `$component((data) => { const ...; return <Root .../>; })`
    fn delegate(&mut self, object: QmlObject<'a>, index: usize) -> Expression<'a> {
        let b = self.b;
        let tree = self.tree;
        let data = tree.contexts[tree.objects[index].context].data.as_deref().unwrap_or("$data");
        self.frames.push(Vec::new());
        let element = self.element(object, Role::Template(data));
        let frame = self.frames.pop().unwrap_or_default();
        let mut statements = b.vec();
        statements.extend(frame);
        statements.push(b.return_(element));
        self.uses.kernel.insert("$component");
        b.call(b.id("$component"), [b.arrow_block(&[data], statements)])
    }

    fn binding(&mut self, binding: QmlBinding<'a>, index: usize, group: &[&'a str], built: &mut Built<'a>) {
        let b = self.b;
        let mut path = group.to_vec();
        path.extend(binding.name.parts.iter().copied());
        if path == ["id"] {
            return;
        }
        let span = binding.name.span;
        if path[0].starts_with(|c: char| c.is_ascii_uppercase()) {
            return self.attached(&path, binding.value, built, span);
        }
        if self.is_class(index, "QQuickPropertyChanges") && !CHANGES.contains(&path[0]) {
            return self.change(&path, binding.value, built);
        }

        let handler = match path.as_slice() {
            [name] => types::handled(name)
                .filter(|_| !matches!(self.tree.member(self.types, index, name), Some(Member::Property(_)))),
            _ => None,
        };
        let value = match handler {
            Some(signal) => {
                let parameters = self.tree.signal(self.types, index, &signal).unwrap_or_default();
                self.handler(binding.value, &parameters, span)
            }
            None => {
                let property = self.tree.property(self.types, index, &path).unwrap_or_default();
                self.value(binding.value, property)
            }
        };
        built.attributes.push(b.attr(&path.join("$"), value));
    }

    /// `Layout.fillWidth: true`, `Keys.onPressed: ...`: a property or a
    /// handler of the object a type attaches to this one.
    fn attached(&mut self, path: &[&'a str], value: QmlBindingValue<'a>, built: &mut Built<'a>, span: Span) {
        let b = self.b;
        // `T.Overlay.modal`: the type is the namespace's.
        let qualified = path.len() > 2 && self.types.namespace(path[0]).is_some();
        let (parts, rest) = path.split_at(if qualified { 2 } else { 1 });
        let type_name = parts.join(".");
        // The attached object is known by the type's own name.
        let name = path[parts.len() - 1..].join("$");
        // `Component.onCompleted` is the kernel's: every object has it.
        if type_name == "Component" {
            let value = self.handler(value, &[], span);
            built.attributes.push(b.attr(&name, value));
            return;
        }
        let Some(found) = self.types.find(parts) else {
            self.errors.push(Error::new(
                format!("`{type_name}` is not a type of anything the file imports"),
                span,
            ));
            return;
        };
        self.uses.origin(&type_name, &found.origin);
        if !built.attach.iter().any(|attached| *attached == type_name) {
            built.attach.push(type_name);
        }
        let attached = self.types.base(&found.kind).and_then(qt::Type::attached);
        let handler = match rest {
            [name] => types::handled(name)
                .filter(|_| attached.is_none_or(|attached| attached.property(name).is_none())),
            _ => None,
        };
        let value = match handler {
            Some(signal) => {
                let parameters: Vec<String> = attached
                    .and_then(|attached| attached.signal(&signal))
                    .map(|signal| signal.parameters.iter().map(|name| (*name).to_string()).collect())
                    .unwrap_or_default();
                self.handler(value, &parameters, span)
            }
            None => {
                let property = attached.and_then(|attached| qt_property(attached, rest)).unwrap_or_default();
                self.value(value, property)
            }
        };
        built.attributes.push(b.attr(&name, value));
    }

    /// `width: 10` in a `PropertyChanges`: a binding of its target's while
    /// the state is the current one.
    fn change(&mut self, path: &[&'a str], value: QmlBindingValue<'a>, built: &mut Built<'a>) {
        let b = self.b;
        // `rect.width: 10` names the object too.
        let (target, path) = match path {
            [target, rest @ ..] if !rest.is_empty() && self.tree.is_id(target) => (Some(*target), rest),
            path => (None, path),
        };
        let value = match value {
            QmlBindingValue::Expression(expression) => b.arrow(&[], expression),
            QmlBindingValue::Statement(statement) => b.arrow_block(&[], self.statements(statement)),
            value => {
                let value = self.value(value, Property::default());
                b.arrow(&[], value)
            }
        };
        let mut entry = vec![b.string(&path.join(".")), value];
        if let Some(target) = target {
            entry.push(b.arrow(&[], b.id(target)));
        }
        built.changes.push(b.array(entry));
    }

    fn property(&mut self, property: QmlPropertyDeclaration<'a>, built: &mut Built<'a>) {
        let b = self.b;
        let name = property.name.name.as_str();
        let span = property.span;
        let Some(type_name) = property.type_name else {
            // `required name`: an inherited property, asked of whoever makes
            // the object.
            built.required.push(name.to_string());
            return;
        };
        let declared = type_name.name.to_string();
        if declared == "alias" {
            let path = match &property.value {
                Some(QmlBindingValue::Expression(expression)) => self.alias(expression),
                _ => None,
            };
            match path {
                Some(path) => built.aliases.push((name.to_string(), path)),
                None => self.errors.push(Error::new(
                    format!("`{name}` is an alias of nothing: an alias names an id, or a property of one"),
                    span,
                )),
            }
            return;
        }
        built.properties.push((name.to_string(), default_of(b, &declared, type_name.is_list)));
        if property.is_required {
            built.required.push(name.to_string());
        }
        if let Some(value) = property.value {
            let value = self.value(value, types::declared_property(&declared, type_name.is_list));
            built.attributes.push(b.attr(name, value));
        }
    }

    /// `label.font.bold` as `[label, "font", "bold"]`.
    fn alias(&mut self, expression: &Expression<'a>) -> Option<Expression<'a>> {
        let b = self.b;
        let mut names = Vec::new();
        let mut current = expression;
        loop {
            match current {
                Expression::StaticMemberExpression(member) => {
                    names.push(member.property.name.as_str());
                    current = &member.object;
                }
                Expression::Identifier(id) => {
                    names.push(id.name.as_str());
                    break;
                }
                _ => return None,
            }
        }
        let target = names.pop()?;
        if !self.tree.is_id(target) {
            return None;
        }
        let mut path = vec![b.id(target)];
        path.extend(names.iter().rev().map(|name| b.string(name)));
        Some(b.array(path))
    }

    fn function(&mut self, mut function: ArenaBox<'a, Function<'a>>, index: usize, built: &mut Built<'a>) {
        let Some(name) = function.id.as_ref().map(|id| id.name.to_string()) else { return };
        function.r#type = FunctionType::FunctionExpression;
        let expression = Expression::FunctionExpression(function);
        // In a `Connections`, `function onClicked() { }` is a handler of its
        // target's signal.
        if self.is_class(index, "QQmlConnections") && types::handled(&name).is_some() {
            built.attributes.push(self.b.attr(&name, expression));
        } else {
            built.functions.push((name, expression));
        }
    }

    fn is_class(&self, index: usize, class: &str) -> bool {
        self.tree.objects[index]
            .kind
            .as_ref()
            .and_then(|kind| self.types.base(kind))
            .is_some_and(|ty| ty.class == class)
    }

    /// What a handler is: a function of the signal's arguments, by the names
    /// the signal gives them.
    fn handler(&mut self, value: QmlBindingValue<'a>, parameters: &[String], span: Span) -> Expression<'a> {
        let b = self.b;
        // An argument Qt gives no name still has its place.
        let unnamed: Vec<String> = (0..parameters.len()).map(|index| format!("$argument{index}")).collect();
        let parameters: Vec<&str> = parameters
            .iter()
            .zip(&unnamed)
            .map(|(name, unnamed)| if name.is_empty() { unnamed.as_str() } else { name.as_str() })
            .collect();
        match value {
            // `onClicked: (mouse) => ...` says what its arguments are itself.
            QmlBindingValue::Expression(
                expression @ (Expression::FunctionExpression(_) | Expression::ArrowFunctionExpression(_)),
            ) => expression,
            QmlBindingValue::Expression(expression) => b.arrow(&parameters, expression),
            QmlBindingValue::Statement(statement) => b.arrow_block(&parameters, self.statements(statement)),
            QmlBindingValue::Object(_) | QmlBindingValue::Objects(_) => {
                self.errors.push(Error::new("a handler is a script, not an object", span));
                b.void_0()
            }
        }
    }

    fn statements(&self, statement: Statement<'a>) -> ArenaVec<'a, Statement<'a>> {
        match statement {
            Statement::BlockStatement(block) => block.unbox().body,
            statement => self.b.vec1(statement),
        }
    }

    fn value(&mut self, value: QmlBindingValue<'a>, property: Property) -> Expression<'a> {
        let b = self.b;
        match value {
            QmlBindingValue::Expression(expression) if property.is_url => self.url(expression),
            QmlBindingValue::Expression(expression) => expression,
            // A block is the body of a function whose result is the value.
            QmlBindingValue::Statement(statement) => b.iife(self.statements(statement)),
            // `transitions: Transition { }` is a list of one.
            QmlBindingValue::Object(object) if property.is_list => b.array([self.object_value(object)]),
            QmlBindingValue::Object(object) => self.object_value(object),
            QmlBindingValue::Objects(objects) => {
                let objects: Vec<_> = objects.into_iter().map(|object| self.object_value(object)).collect();
                b.array(objects)
            }
        }
    }

    /// A URL is relative to the file it is written in, which only the
    /// compiled module knows: `import.meta.url`.
    fn url(&mut self, expression: Expression<'a>) -> Expression<'a> {
        let b = self.b;
        let Expression::StringLiteral(literal) = &expression else {
            self.uses.kernel.insert("$url");
            return b.call(b.id("$url"), [expression, b.import_meta_url()]);
        };
        let value = literal.value.as_str();
        if value.is_empty() || is_absolute(value) {
            return expression;
        }
        // A QML file is a module, loaded when it is asked for.
        if value.ends_with(".qml") {
            let path = if value.starts_with("./") || value.starts_with("../") {
                value.to_string()
            } else {
                format!("./{value}")
            };
            return b.arrow(&[], b.import_call(&path));
        }
        if let Some(index) = self.urls.iter().position(|url| url == value) {
            return b.id(&format!("$url{}", index + 1));
        }
        self.urls.push(value.to_string());
        let name = format!("$url{}", self.urls.len());
        let url = b.new_(b.id("URL"), [b.string(value), b.import_meta_url()]);
        self.module.push(b.const_(&name, b.member(url, "href")));
        b.id(&name)
    }
}

/// `scheme:...` or `/...`: a URL that is not relative to the file.
fn is_absolute(url: &str) -> bool {
    if url.starts_with('/') {
        return true;
    }
    let Some((scheme, _)) = url.split_once(':') else { return false };
    scheme.starts_with(|c: char| c.is_ascii_alphabetic())
        && scheme.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '+' | '.' | '-'))
}

fn qt_property(ty: &'static qt::Type, path: &[&str]) -> Option<Property> {
    let (first, rest) = path.split_first()?;
    let mut property = types::qt_property(ty.property(first)?);
    for name in rest {
        property = types::qt_property(property.value?.property(name)?);
    }
    Some(property)
}

/// What a declared property is before anything is bound to it.
fn default_of<'a>(b: B<'a>, type_name: &str, is_list: bool) -> Expression<'a> {
    if is_list {
        return b.array([]);
    }
    match type_name {
        "int" | "real" | "double" | "float" => b.number(0.0),
        "bool" => b.boolean(false),
        "string" | "url" => b.string(""),
        // An object that is not there yet.
        name if name.starts_with(|c: char| c.is_ascii_uppercase()) => b.null(),
        _ => b.void_0(),
    }
}

/// `default property alias content: column.children`: the object the
/// children of an instance are children of.
fn children_target(root: &QmlObject<'_>) -> Option<String> {
    root.members.iter().find_map(|member| {
        let QmlMember::Property(property) = member else { return None };
        if !property.is_default {
            return None;
        }
        let mut target = match property.value.as_ref()? {
            QmlBindingValue::Expression(expression) => expression,
            _ => return None,
        };
        while let Expression::StaticMemberExpression(member) = target {
            target = &member.object;
        }
        match target {
            Expression::Identifier(id) => Some(id.name.to_string()),
            _ => None,
        }
    })
}
