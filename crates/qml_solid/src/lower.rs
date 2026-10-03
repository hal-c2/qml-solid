//! QML object tree → the Oxc AST Solid's compiler consumes.
//!
//! The output is the tree Solid would have parsed out of JSX: elements,
//! attributes, a `style` object, `<For>` around delegates, a component function
//! around the lot. It is built node by node in the parser's arena. No JSX text
//! exists at any point, and the binding expressions are the nodes the QML
//! parser produced, moved into place with their source spans intact.

use std::collections::BTreeSet;

use oxc_allocator::{ArenaVec, CloneIn};
use oxc_ast::ast::*;
use oxc_parser::qml::ast::*;
use oxc_span::Span;
use oxc_syntax::operator::BinaryOperator;

use crate::{
    Error,
    build::B,
    registry::{self, Element, Prop, Type, Unit},
    scope::{Member, Scopes, is_literal},
};

/// The declarations of one JavaScript scope: the component function or a
/// delegate callback. Kept in tiers so that nothing reads a binding before its
/// declaration ran, whatever order the QML declared them in.
#[derive(Default)]
struct Declarations<'a> {
    constants: Vec<Statement<'a>>,
    lazy: Vec<Statement<'a>>,
    eager: Vec<Statement<'a>>,
}

impl<'a> Declarations<'a> {
    fn is_empty(&self) -> bool {
        self.constants.is_empty() && self.lazy.is_empty() && self.eager.is_empty()
    }

    fn finish(self, b: B<'a>, result: Expression<'a>) -> ArenaVec<'a, Statement<'a>> {
        let mut statements = b.vec();
        statements.extend(self.constants);
        statements.extend(self.lazy);
        statements.extend(self.eager);
        statements.push(b.return_(result));
        statements
    }
}

/// The pieces of an element, gathered while walking its members.
struct Parts<'a> {
    attributes: ArenaVec<'a, JSXAttributeItem<'a>>,
    style: Vec<(&'a str, Expression<'a>)>,
    events: Vec<JSXAttributeItem<'a>>,
    text: Option<Expression<'a>>,
    children: ArenaVec<'a, JSXChild<'a>>,
}

pub(crate) struct Lower<'a, 's> {
    b: B<'a>,
    scopes: &'s Scopes<'a>,
    pub errors: Vec<Error>,
    /// Component types used, each an import of a sibling file.
    pub components: BTreeSet<&'a str>,
    /// Names needed from `solid-js`.
    pub solid: BTreeSet<&'static str>,
    /// Names needed from the runtime module.
    pub runtime: BTreeSet<&'static str>,
}

impl<'a, 's> Lower<'a, 's> {
    pub(crate) fn new(b: B<'a>, scopes: &'s Scopes<'a>) -> Self {
        Self {
            b,
            scopes,
            errors: Vec::new(),
            components: BTreeSet::new(),
            solid: BTreeSet::new(),
            runtime: BTreeSet::new(),
        }
    }

    /// `export default function Name(props) { declarations; return <root/>; }`
    pub(crate) fn component(&mut self, name: &str, root: QmlObject<'a>) -> Option<Statement<'a>> {
        let mut declarations = Declarations::default();
        let element = self.object(root, &mut declarations)?;
        let body = declarations.finish(self.b, element);
        Some(self.b.export_default_function(name, &["props"], body))
    }

    fn error(&mut self, message: impl Into<String>, span: Span) {
        self.errors.push(Error::new(message, span));
    }

    fn object(
        &mut self,
        object: QmlObject<'a>,
        declarations: &mut Declarations<'a>,
    ) -> Option<Expression<'a>> {
        if object.on.is_some() {
            self.error("`Type on property` value sources are not supported yet", object.span);
            return None;
        }
        let Some(type_name) = object.type_name.as_simple() else {
            self.error(
                format!("qualified type `{}` is not supported yet", object.type_name),
                object.type_name.span,
            );
            return None;
        };
        match registry::lookup(type_name) {
            Some(Type::Element(element)) => self.element(element, object, declarations),
            Some(Type::Repeater) => self.repeater(object),
            None if registry::is_known_unsupported(type_name) => {
                self.error(
                    format!("`{type_name}` is not supported by the web target yet"),
                    object.type_name.span,
                );
                None
            }
            None if type_name.starts_with(|c: char| c.is_ascii_uppercase()) => {
                self.instance(type_name, object)
            }
            None => {
                self.error(format!("`{type_name}` is not a type"), object.type_name.span);
                None
            }
        }
    }

    fn element(
        &mut self,
        element: &'static Element,
        object: QmlObject<'a>,
        declarations: &mut Declarations<'a>,
    ) -> Option<Expression<'a>> {
        let b = self.b;
        let index = self.scopes.index_of(&object);
        let type_name = object.type_name.last();
        let mut parts = Parts {
            attributes: b.vec(),
            style: Vec::new(),
            events: Vec::new(),
            text: None,
            children: b.vec(),
        };
        if let Some(class) = element.class {
            parts.attributes.push(b.attr_string("class", class));
        }
        let mut ok = true;
        for member in object.members {
            match member {
                QmlMember::Binding(binding) => {
                    let name = binding.name.to_string();
                    ok &= self.binding(element, type_name, &name, binding, &mut parts);
                }
                // `font { bold: true }` is `font.bold: true`.
                QmlMember::Object(group) if is_group(&group) => {
                    let prefix = group.type_name.to_string();
                    for member in group.members {
                        let QmlMember::Binding(binding) = member else {
                            self.error("only bindings are allowed in a property group", group.span);
                            ok = false;
                            continue;
                        };
                        let name = format!("{prefix}.{}", binding.name);
                        ok &= self.binding(element, type_name, &name, binding, &mut parts);
                    }
                }
                QmlMember::Object(child) => match self.object(child, declarations) {
                    Some(child) => parts.children.push(b.child(child)),
                    None => ok = false,
                },
                QmlMember::Property(property) => {
                    ok &= self.property(property, index, declarations);
                }
                QmlMember::Function(mut function) => {
                    let name = function.id.as_ref().map(|id| id.name.as_str()).unwrap_or_default();
                    if let Some(Member::Function(js)) = self.scopes.member(index, name) {
                        if let Some(id) = &mut function.id {
                            id.name = b.ident(js);
                        }
                        declarations.constants.push(Statement::FunctionDeclaration(function));
                    }
                }
                QmlMember::Signal(signal) => {
                    self.error("signal declarations are not supported yet", signal.span);
                    ok = false;
                }
                QmlMember::InlineComponent(inline) => {
                    self.error("inline components are not supported yet", inline.span);
                    ok = false;
                }
            }
        }
        if !ok {
            return None;
        }

        let Parts { mut attributes, style, events, text, children } = parts;
        if !style.is_empty() {
            attributes.push(b.attr("style", b.object(style)));
        }
        attributes.extend(events);
        let mut all_children = b.vec();
        if let Some(text) = text {
            all_children.push(b.child(text));
        }
        all_children.extend(children);
        Some(b.element(element.tag, attributes, all_children))
    }

    /// One `name: value` on an element, placed by what the registry says the
    /// property means on this target.
    fn binding(
        &mut self,
        element: &'static Element,
        type_name: &str,
        name: &str,
        binding: QmlBinding<'a>,
        parts: &mut Parts<'a>,
    ) -> bool {
        let b = self.b;
        if name == "id" {
            return true;
        }
        let Some(prop) = element.prop(name) else {
            self.error(
                format!("`{type_name}` has no property `{name}` on the web target yet"),
                binding.name.span,
            );
            return false;
        };
        let span = binding.span;
        if let Prop::Event(event) = prop {
            let Some(handler) = self.handler(binding.value, span) else { return false };
            parts.events.push(b.attr(event, handler));
            return true;
        }
        let Some(value) = self.expression(binding.value, span) else { return false };
        match prop {
            Prop::Style { css, unit } => {
                let value = self.with_unit(value, unit);
                self.spread(css.iter().copied(), value, &mut parts.style);
            }
            Prop::Toggle { on, off } => match as_boolean(&value) {
                Some(true) => parts.style.extend(on.iter().map(|(k, v)| (*k, b.string(v)))),
                Some(false) => parts.style.extend(off.iter().map(|(k, v)| (*k, b.string(v)))),
                None => {
                    let mut names: Vec<&'static str> = on.iter().map(|(k, _)| *k).collect();
                    names.extend(off.iter().map(|(k, _)| *k).filter(|k| !on.iter().any(|o| o.0 == *k)));
                    let declared = |table: &'static [(&'static str, &'static str)], key| {
                        table
                            .iter()
                            .find(|(k, _)| *k == key)
                            .map_or_else(|| b.void_0(), |(_, v)| b.string(v))
                    };
                    let last = names.len() - 1;
                    let mut test = Some(value);
                    for (position, key) in names.into_iter().enumerate() {
                        let test = if position == last {
                            test.take().expect("one test per declaration")
                        } else {
                            test.as_ref().expect("test kept until the last").clone_in(b.allocator())
                        };
                        parts.style.push((
                            key,
                            b.conditional(test, declared(on, key), declared(off, key)),
                        ));
                    }
                }
            },
            Prop::Keyword(table) => {
                let Expression::StringLiteral(literal) = &value else {
                    self.error(
                        format!("`{name}` must be a string literal on the web target for now"),
                        span,
                    );
                    return false;
                };
                let keyword = literal.value.as_str();
                let Some((_, declarations)) = table.iter().find(|(k, _)| *k == keyword) else {
                    self.error(format!("`{keyword}` is not a known value for `{name}`"), span);
                    return false;
                };
                parts.style.extend(declarations.iter().map(|(k, v)| (*k, b.string(v))));
            }
            Prop::Attribute(attribute) => parts.attributes.push(match &value {
                Expression::StringLiteral(literal) => b.attr_string(attribute, literal.value.as_str()),
                _ => b.attr(attribute, value),
            }),
            Prop::Text => parts.text = Some(value),
            Prop::Event(_) => unreachable!("handled above"),
        }
        true
    }

    /// The same value for each of several CSS properties.
    fn spread(
        &self,
        names: impl ExactSizeIterator<Item = &'a str>,
        value: Expression<'a>,
        style: &mut Vec<(&'a str, Expression<'a>)>,
    ) {
        let last = names.len() - 1;
        let mut value = Some(value);
        for (position, name) in names.enumerate() {
            let value = if position == last {
                value.take().expect("one value per property")
            } else {
                value.as_ref().expect("value kept until the last").clone_in(self.b.allocator())
            };
            style.push((name, value));
        }
    }

    /// Gives a cell count its CSS unit. Literals are converted here, so they
    /// stay static and Solid folds them into the template; only a value that
    /// is not known until run time pays for a helper call.
    fn with_unit(&mut self, value: Expression<'a>, unit: Unit) -> Expression<'a> {
        let b = self.b;
        if unit == Unit::None {
            return value;
        }
        match value {
            Expression::NumericLiteral(number) => {
                b.string(&format!("{}{}", number.value, unit.suffix()))
            }
            Expression::StringLiteral(_) => value,
            Expression::ParenthesizedExpression(inner) => {
                self.with_unit(inner.unbox().expression, unit)
            }
            Expression::ConditionalExpression(conditional) => {
                let conditional = conditional.unbox();
                let consequent = self.with_unit(conditional.consequent, unit);
                let alternate = self.with_unit(conditional.alternate, unit);
                b.conditional(conditional.test, consequent, alternate)
            }
            value => {
                let helper = match unit {
                    Unit::Ch => "$ch",
                    Unit::Lh => "$lh",
                    Unit::Px => "$px",
                    Unit::None => unreachable!(),
                };
                self.runtime.insert(helper);
                b.call(b.id(helper), [value])
            }
        }
    }

    /// A binding's value as an expression. A script block becomes a call of an
    /// arrow with that body, which Solid reads as a reactive expression.
    fn expression(&mut self, value: QmlBindingValue<'a>, span: Span) -> Option<Expression<'a>> {
        let b = self.b;
        match value {
            QmlBindingValue::Expression(expression) => Some(expression),
            QmlBindingValue::Statement(statement) => {
                Some(b.call(b.arrow_block(&[], self.statements(statement)), []))
            }
            QmlBindingValue::Object(_) | QmlBindingValue::Objects(_) => {
                self.error("an object is not supported as this property's value yet", span);
                None
            }
        }
    }

    fn statements(&self, statement: Statement<'a>) -> ArenaVec<'a, Statement<'a>> {
        match statement {
            Statement::BlockStatement(block) => block.unbox().body,
            statement => self.b.vec1(statement),
        }
    }

    /// A signal handler: the function to call, not a value to track.
    fn handler(&mut self, value: QmlBindingValue<'a>, span: Span) -> Option<Expression<'a>> {
        let b = self.b;
        match value {
            QmlBindingValue::Expression(expression) => Some(match unparenthesized(&expression) {
                Expression::ArrowFunctionExpression(_) | Expression::FunctionExpression(_) => {
                    expression
                }
                _ => b.arrow(&[], expression),
            }),
            QmlBindingValue::Statement(statement) => {
                Some(b.arrow_block(&[], self.statements(statement)))
            }
            QmlBindingValue::Object(_) | QmlBindingValue::Objects(_) => {
                self.error("a signal handler must be a script", span);
                None
            }
        }
    }

    fn property(
        &mut self,
        property: QmlPropertyDeclaration<'a>,
        object: usize,
        declarations: &mut Declarations<'a>,
    ) -> bool {
        let b = self.b;
        let name = property.name.name.as_str();
        let Some(member) = self.scopes.member(object, name).cloned() else { return false };
        let is_root = object == 0;
        // A root property is the component's interface: the parent's value
        // wins over the default.
        let from_props = is_root && !property.is_readonly;
        let literal = match &property.value {
            None => true,
            Some(QmlBindingValue::Expression(expression)) => is_literal(expression),
            Some(_) => false,
        };

        let default = match property.value {
            None => Value::Expression(b.void_0()),
            Some(QmlBindingValue::Expression(expression)) => Value::Expression(expression),
            Some(QmlBindingValue::Statement(statement)) => Value::Block(self.statements(statement)),
            Some(_) => {
                self.error("an object is not supported as a property value yet", property.span);
                return false;
            }
        };
        let value = if property.is_required {
            Value::Expression(b.member(b.id("props"), name))
        } else if from_props {
            Value::Expression(b.conditional(
                b.binary(b.string(name), BinaryOperator::In, b.id("props")),
                b.member(b.id("props"), name),
                default.into_expression(b),
            ))
        } else {
            default
        };

        match member {
            Member::Const(js) => {
                declarations.constants.push(b.const_(&js, value.into_expression(b)));
            }
            Member::Getter(js) => declarations.constants.push(b.const_(&js, value.into_thunk(b))),
            Member::Memo(js) => {
                self.solid.insert("createMemo");
                // Lazy: a binding is computed when something first reads it,
                // so declaration order never matters, as in QML.
                let options = b.object([("lazy", b.boolean(true))]);
                let memo = b.call(b.id("createMemo"), [value.into_thunk(b), options]);
                declarations.lazy.push(b.const_(&js, memo));
            }
            Member::Signal { get, set } => {
                self.solid.insert("createSignal");
                // A derived default is a writable memo: an assignment holds
                // until the default's own dependencies change.
                let initial = if literal && !from_props {
                    value.into_expression(b)
                } else {
                    value.into_thunk(b)
                };
                let signal = b.call(b.id("createSignal"), [initial]);
                declarations.eager.push(b.const_pair(&get, &set, signal));
            }
            Member::Function(_) => {}
            Member::Unsupported(what) => {
                self.error(format!("{what} are not supported yet"), property.span);
                return false;
            }
        }
        true
    }

    /// `Repeater { model; delegate }` → `<For each={model}>{(item, index) => delegate}</For>`,
    /// or `<Repeat count={n}>` when the model is a number.
    fn repeater(&mut self, object: QmlObject<'a>) -> Option<Expression<'a>> {
        let b = self.b;
        let span = object.span;
        let mut model = None;
        let mut delegate = None;
        let mut ok = true;
        for member in object.members {
            match member {
                QmlMember::Binding(binding) => match binding.name.to_string().as_str() {
                    "id" => {}
                    "model" => model = self.expression(binding.value, binding.span),
                    "delegate" => match binding.value {
                        QmlBindingValue::Object(object) => delegate = Some(object),
                        _ => {
                            self.error("a delegate must be an object", binding.span);
                            ok = false;
                        }
                    },
                    name => {
                        self.error(
                            format!("`Repeater` has no property `{name}` on the web target yet"),
                            binding.name.span,
                        );
                        ok = false;
                    }
                },
                QmlMember::Object(object) if delegate.is_none() => delegate = Some(object),
                _ => {
                    self.error("a Repeater takes a model and one delegate", span);
                    ok = false;
                }
            }
        }
        let (Some(model), Some(delegate), true) = (model, delegate, ok) else {
            if ok {
                self.error("a Repeater needs a model and a delegate", span);
            }
            return None;
        };

        let provided = self.scopes.objects[self.scopes.index_of(&delegate)]
            .delegate
            .expect("the analysis marks every delegate root");
        let mut declarations = Declarations::default();
        let element = self.object(delegate, &mut declarations)?;
        let (tag, source, parameters): (_, _, &[&str]) = if provided.count {
            ("Repeat", "count", &[provided.index.js])
        } else {
            ("For", "each", &[provided.model_data.js, provided.index.js])
        };
        // Only a literal is known to be a count. Any other model may still
        // turn out to be a number, which `$model` makes into its indices.
        let model = if provided.count {
            model
        } else {
            self.runtime.insert("$model");
            b.call(b.id("$model"), [model])
        };
        let callback = if declarations.is_empty() {
            b.arrow(parameters, element)
        } else {
            b.arrow_block(parameters, declarations.finish(b, element))
        };
        Some(b.element(tag, b.vec1(b.attr(source, model)), b.vec1(b.child(callback))))
    }

    /// A type that is not in the registry is another QML file: a component.
    fn instance(&mut self, type_name: &'a str, object: QmlObject<'a>) -> Option<Expression<'a>> {
        let b = self.b;
        let mut attributes = b.vec();
        let mut ok = true;
        let mut bindings_only = true;
        for member in object.members {
            let QmlMember::Binding(binding) = member else {
                // One report for the instance, however many members it has.
                if std::mem::take(&mut bindings_only) {
                    self.error(
                        format!("only bindings are supported on a `{type_name}` instance yet"),
                        object.span,
                    );
                }
                ok = false;
                continue;
            };
            let span = binding.span;
            let Some(name) = binding.name.as_simple() else {
                self.error(
                    format!("`{}` on a component instance is not supported yet", binding.name),
                    span,
                );
                ok = false;
                continue;
            };
            if name == "id" {
                continue;
            }
            if registry::is_item_prop(name) {
                self.error(
                    format!(
                        "setting `{name}` of a component's root item from outside is not supported yet"
                    ),
                    span,
                );
                ok = false;
                continue;
            }
            let value = if is_handler_name(name) {
                self.handler(binding.value, span)
            } else {
                self.expression(binding.value, span)
            };
            match value {
                Some(value) => attributes.push(b.attr(name, value)),
                None => ok = false,
            }
        }
        if !ok {
            return None;
        }
        self.components.insert(type_name);
        Some(b.element(type_name, attributes, b.vec()))
    }
}

enum Value<'a> {
    Expression(Expression<'a>),
    Block(ArenaVec<'a, Statement<'a>>),
}

impl<'a> Value<'a> {
    fn into_expression(self, b: B<'a>) -> Expression<'a> {
        match self {
            Value::Expression(expression) => expression,
            Value::Block(statements) => b.call(b.arrow_block(&[], statements), []),
        }
    }

    fn into_thunk(self, b: B<'a>) -> Expression<'a> {
        match self {
            Value::Expression(expression) => b.arrow(&[], expression),
            Value::Block(statements) => b.arrow_block(&[], statements),
        }
    }
}

/// `font { ... }`: an object whose "type" is a lowercase property name.
fn is_group(object: &QmlObject<'_>) -> bool {
    object.type_name.parts[0].starts_with(|c: char| c.is_ascii_lowercase())
}

/// `onClicked`, `onMouseDown`: `on` followed by a capital.
fn is_handler_name(name: &str) -> bool {
    name.strip_prefix("on").is_some_and(|rest| rest.starts_with(|c: char| c.is_ascii_uppercase()))
}

fn unparenthesized<'e, 'a>(expression: &'e Expression<'a>) -> &'e Expression<'a> {
    match expression {
        Expression::ParenthesizedExpression(inner) => unparenthesized(&inner.expression),
        expression => expression,
    }
}

fn as_boolean(expression: &Expression<'_>) -> Option<bool> {
    match unparenthesized(expression) {
        Expression::BooleanLiteral(literal) => Some(literal.value),
        _ => None,
    }
}
