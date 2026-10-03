//! The static shape of a QML file: its objects, ids and declared members.
//!
//! QML resolves names against a runtime context chain. Everything in that chain
//! is known when the file is compiled, so it is resolved here once and the
//! output contains plain JavaScript bindings instead of scope lookups.

use std::collections::{HashMap, HashSet};

use oxc_ast::ast::*;
use oxc_ast_visit::{Visit, walk};
use oxc_parser::qml::ast::*;
use oxc_span::Span;
use oxc_syntax::scope::ScopeFlags;

use crate::Error;

/// A declared member and the JavaScript binding that carries it.
#[derive(Debug, Clone)]
pub(crate) enum Member {
    /// A constant: read as `name`, which Solid treats as static.
    Const(String),
    /// A derivation cheap enough to re-read: `const name = () => value`.
    Getter(String),
    /// `const name = createMemo(() => value)`.
    Memo(String),
    /// A property something assigns to: `const [get, set] = createSignal(...)`.
    Signal { get: String, set: String },
    Function(String),
    Unsupported(&'static str),
}

/// A name the enclosing delegate provides (`modelData`, `index`).
#[derive(Debug, Clone, Copy)]
pub(crate) struct Provided {
    pub js: &'static str,
    pub accessor: bool,
}

#[derive(Debug, Clone, Copy)]
pub(crate) struct Delegate {
    pub model_data: Provided,
    pub index: Provided,
    /// A count model: the delegate is repeated, there are no items.
    pub count: bool,
}

impl Delegate {
    /// `<For>`: the item itself and an index accessor.
    const EACH: Delegate = Delegate {
        model_data: Provided { js: "$modelData", accessor: false },
        index: Provided { js: "$index", accessor: true },
        count: false,
    };
    /// `<Repeat>`: a plain index, which is also the model data.
    const COUNT: Delegate = Delegate {
        model_data: Provided { js: "$index", accessor: false },
        index: Provided { js: "$index", accessor: false },
        count: true,
    };
}

#[derive(Debug)]
pub(crate) struct Object<'a> {
    pub span: Span,
    pub type_name: &'a str,
    pub members: HashMap<&'a str, Member>,
    /// Set on the root object of a delegate.
    pub delegate: Option<Delegate>,
    /// The root of the component this object belongs to: the file's root or
    /// the nearest delegate root (possibly the object itself).
    pub component_root: usize,
    /// The component root of the scope the component was created in.
    pub outer: Option<usize>,
}

#[derive(Debug, Default)]
pub(crate) struct Scopes<'a> {
    pub objects: Vec<Object<'a>>,
    pub ids: HashMap<&'a str, usize>,
    by_start: HashMap<u32, usize>,
}

impl<'a> Scopes<'a> {
    pub(crate) fn analyze(document: &QmlDocument<'a>, errors: &mut Vec<Error>) -> Self {
        let mut assigned = Assigned::default();
        walk_leaves(&document.root, &mut assigned);

        let mut analysis =
            Analysis { scopes: Scopes::default(), assigned, taken: HashSet::new(), errors };
        collect_ids(&document.root, &mut analysis.taken);
        analysis.object(&document.root, None, None);
        analysis.scopes
    }

    pub(crate) fn index_of(&self, object: &QmlObject<'a>) -> usize {
        self.by_start[&object.span.start]
    }

    /// The innermost object whose source text contains `offset`.
    pub(crate) fn object_at(&self, offset: u32) -> usize {
        // Objects are stored in document order, so the last one that contains
        // the offset is the innermost.
        self.objects
            .iter()
            .rposition(|object| object.span.start <= offset && offset < object.span.end)
            .unwrap_or(0)
    }

    pub(crate) fn member(&self, object: usize, name: &str) -> Option<&Member> {
        self.objects[object].members.get(name)
    }
}

struct Analysis<'a, 'e> {
    scopes: Scopes<'a>,
    assigned: Assigned<'a>,
    /// Prefixes already used for generated binding names.
    taken: HashSet<String>,
    errors: &'e mut Vec<Error>,
}

impl<'a> Analysis<'a, '_> {
    fn object(
        &mut self,
        object: &QmlObject<'a>,
        component: Option<usize>,
        delegate: Option<Delegate>,
    ) {
        let index = self.scopes.objects.len();
        let is_component_root = component.is_none() || delegate.is_some();
        let id = object_id(object);
        if let Some(id) = id {
            if self.scopes.ids.insert(id, index).is_some() {
                self.errors.push(Error::new(format!("id `{id}` is not unique"), object.span));
            }
        }
        self.scopes.by_start.insert(object.span.start, index);
        self.scopes.objects.push(Object {
            span: object.span,
            type_name: object.type_name.last(),
            members: HashMap::new(),
            delegate,
            component_root: if is_component_root { index } else { component.unwrap_or(index) },
            outer: if is_component_root { component } else { None },
        });

        let prefix = self.prefix(object, id, component.is_none());
        let mut members = HashMap::new();
        for member in &object.members {
            match member {
                QmlMember::Property(property) => {
                    let kind = self.property(property, id, &prefix, component.is_none());
                    members.insert(property.name.name.as_str(), kind);
                }
                QmlMember::Function(function) => {
                    if let Some(name) = &function.id {
                        members.insert(
                            name.name.as_str(),
                            Member::Function(format!("{prefix}${}", name.name)),
                        );
                    }
                }
                QmlMember::Signal(signal) => {
                    members.insert(
                        signal.name.name.as_str(),
                        Member::Unsupported("signal declarations"),
                    );
                }
                _ => {}
            }
        }
        self.scopes.objects[index].members = members;

        let component = self.scopes.objects[index].component_root;
        let is_repeater = object.type_name.as_simple() == Some("Repeater");
        let child_delegate = is_repeater.then(|| repeater_delegate(object));
        for member in &object.members {
            match member {
                QmlMember::Object(child) => self.object(child, Some(component), child_delegate),
                QmlMember::Binding(binding) => {
                    let delegate = if binding.name.as_simple() == Some("delegate") {
                        child_delegate
                    } else {
                        None
                    };
                    self.value(&binding.value, component, delegate);
                }
                QmlMember::Property(property) => {
                    if let Some(value) = &property.value {
                        self.value(value, component, None);
                    }
                }
                QmlMember::InlineComponent(inline) => self.object(&inline.object, Some(component), None),
                _ => {}
            }
        }
    }

    fn value(&mut self, value: &QmlBindingValue<'a>, component: usize, delegate: Option<Delegate>) {
        match value {
            QmlBindingValue::Object(object) => self.object(object, Some(component), delegate),
            QmlBindingValue::Objects(objects) => {
                for object in objects {
                    self.object(object, Some(component), delegate);
                }
            }
            _ => {}
        }
    }

    /// The stem generated bindings of this object are named after.
    fn prefix(&mut self, object: &QmlObject<'a>, id: Option<&'a str>, is_root: bool) -> String {
        if let Some(id) = id {
            return id.to_string();
        }
        let has_members = object
            .members
            .iter()
            .any(|member| matches!(member, QmlMember::Property(_) | QmlMember::Function(_)));
        if !has_members {
            return String::new();
        }
        let stem = if is_root {
            "root".to_string()
        } else {
            let mut stem = object.type_name.last().to_string();
            stem[..1].make_ascii_lowercase();
            stem
        };
        let mut candidate = stem.clone();
        let mut counter = 1;
        while !self.taken.insert(candidate.clone()) {
            counter += 1;
            candidate = format!("{stem}{counter}");
        }
        candidate
    }

    fn property(
        &mut self,
        property: &QmlPropertyDeclaration<'a>,
        id: Option<&'a str>,
        prefix: &str,
        is_root: bool,
    ) -> Member {
        let name = property.name.name.as_str();
        let js = format!("{prefix}${name}");
        let Some(type_name) = &property.type_name else {
            return Member::Unsupported("`required` on an inherited property");
        };
        if type_name.name.as_simple() == Some("alias") {
            return Member::Unsupported("property aliases");
        }
        let expression = match &property.value {
            None => None,
            Some(QmlBindingValue::Expression(expression)) => Some(expression),
            Some(QmlBindingValue::Statement(_)) => return self.writable_or(property, id, js, Member::Memo),
            Some(_) => return Member::Unsupported("objects as property values"),
        };
        if property.is_required {
            return if is_root {
                Member::Getter(js)
            } else {
                Member::Unsupported("required properties outside the root object")
            };
        }
        let literal = expression.is_none_or(is_literal);
        let cheap = literal || expression.is_some_and(is_member_chain);
        let overridable = is_root && !property.is_readonly;
        self.writable_or(property, id, js, |js| {
            if overridable {
                if cheap { Member::Getter(js) } else { Member::Memo(js) }
            } else if literal {
                Member::Const(js)
            } else if cheap {
                Member::Getter(js)
            } else {
                Member::Memo(js)
            }
        })
    }

    fn writable_or(
        &self,
        property: &QmlPropertyDeclaration<'a>,
        id: Option<&'a str>,
        js: String,
        otherwise: impl FnOnce(String) -> Member,
    ) -> Member {
        let name = property.name.name.as_str();
        let assigned = self.assigned.bare.contains(name)
            || id.is_some_and(|id| self.assigned.members.contains(&(id, name)));
        if assigned && !property.is_readonly {
            let set = format!("set${js}");
            Member::Signal { get: js, set }
        } else {
            otherwise(js)
        }
    }
}

fn collect_ids(object: &QmlObject<'_>, ids: &mut HashSet<String>) {
    if let Some(id) = object_id(object) {
        ids.insert(id.to_string());
    }
    for member in &object.members {
        match member {
            QmlMember::Object(child) => collect_ids(child, ids),
            QmlMember::Binding(QmlBinding { value, .. })
            | QmlMember::Property(QmlPropertyDeclaration { value: Some(value), .. }) => match value {
                QmlBindingValue::Object(child) => collect_ids(child, ids),
                QmlBindingValue::Objects(children) => {
                    for child in children {
                        collect_ids(child, ids);
                    }
                }
                _ => {}
            },
            QmlMember::InlineComponent(inline) => collect_ids(&inline.object, ids),
            _ => {}
        }
    }
}

pub(crate) fn object_id<'a>(object: &QmlObject<'a>) -> Option<&'a str> {
    object.members.iter().find_map(|member| match member {
        QmlMember::Binding(QmlBinding {
            name,
            value: QmlBindingValue::Expression(Expression::Identifier(id)),
            ..
        }) if name.as_simple() == Some("id") => Some(id.name.as_str()),
        _ => None,
    })
}

/// What a `Repeater` hands its delegate, decided by the shape of its model.
fn repeater_delegate(repeater: &QmlObject<'_>) -> Delegate {
    let count = repeater.members.iter().any(|member| {
        matches!(
            member,
            QmlMember::Binding(QmlBinding {
                name,
                value: QmlBindingValue::Expression(Expression::NumericLiteral(_)),
                ..
            }) if name.as_simple() == Some("model")
        )
    });
    if count { Delegate::COUNT } else { Delegate::EACH }
}

pub(crate) fn is_literal(expression: &Expression<'_>) -> bool {
    match expression {
        Expression::NumericLiteral(_)
        | Expression::StringLiteral(_)
        | Expression::BooleanLiteral(_)
        | Expression::NullLiteral(_) => true,
        Expression::UnaryExpression(unary) => {
            matches!(unary.argument, Expression::NumericLiteral(_))
        }
        Expression::ParenthesizedExpression(inner) => is_literal(&inner.expression),
        _ => false,
    }
}

/// `a`, `a.b`, `a.b.c`: a read with no work in it.
fn is_member_chain(expression: &Expression<'_>) -> bool {
    match expression {
        Expression::Identifier(_) => true,
        Expression::StaticMemberExpression(member) => is_member_chain(&member.object),
        // Type syntax is erased, so it does not make a read any heavier.
        Expression::ParenthesizedExpression(inner) => is_member_chain(&inner.expression),
        Expression::TSAsExpression(inner) => is_member_chain(&inner.expression),
        Expression::TSSatisfiesExpression(inner) => is_member_chain(&inner.expression),
        Expression::TSNonNullExpression(inner) => is_member_chain(&inner.expression),
        _ => false,
    }
}

/// Every name the file's scripts assign to. A property nothing assigns to
/// needs no setter, whatever its declaration says.
#[derive(Default)]
struct Assigned<'a> {
    bare: HashSet<&'a str>,
    members: HashSet<(&'a str, &'a str)>,
}

impl<'a> Assigned<'a> {
    fn member(&mut self, member: &StaticMemberExpression<'a>) {
        if let Expression::Identifier(object) = &member.object {
            self.members.insert((object.name.as_str(), member.property.name.as_str()));
        }
    }
}

impl<'a> Visit<'a> for Assigned<'a> {
    fn visit_assignment_expression(&mut self, it: &AssignmentExpression<'a>) {
        match &it.left {
            AssignmentTarget::AssignmentTargetIdentifier(id) => {
                self.bare.insert(id.name.as_str());
            }
            AssignmentTarget::StaticMemberExpression(member) => self.member(member),
            _ => {}
        }
        walk::walk_assignment_expression(self, it);
    }

    fn visit_update_expression(&mut self, it: &UpdateExpression<'a>) {
        match &it.argument {
            SimpleAssignmentTarget::AssignmentTargetIdentifier(id) => {
                self.bare.insert(id.name.as_str());
            }
            SimpleAssignmentTarget::StaticMemberExpression(member) => self.member(member),
            _ => {}
        }
        walk::walk_update_expression(self, it);
    }
}

fn walk_value<'a>(value: &QmlBindingValue<'a>, visitor: &mut impl Visit<'a>) {
    match value {
        QmlBindingValue::Expression(expression) => visitor.visit_expression(expression),
        QmlBindingValue::Statement(statement) => visitor.visit_statement(statement),
        QmlBindingValue::Object(object) => walk_leaves(object, visitor),
        QmlBindingValue::Objects(objects) => {
            for object in objects {
                walk_leaves(object, visitor);
            }
        }
    }
}

fn walk_leaves<'a>(object: &QmlObject<'a>, visitor: &mut impl Visit<'a>) {
    for member in &object.members {
        match member {
            QmlMember::Object(child) => walk_leaves(child, visitor),
            QmlMember::Binding(binding) => walk_value(&binding.value, visitor),
            QmlMember::Property(property) => {
                if let Some(value) = &property.value {
                    walk_value(value, visitor);
                }
            }
            QmlMember::Function(function) => visitor.visit_function(function, ScopeFlags::Function),
            QmlMember::InlineComponent(inline) => walk_leaves(&inline.object, visitor),
            QmlMember::Signal(_) => {}
        }
    }
}
