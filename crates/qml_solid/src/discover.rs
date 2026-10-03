//! Where a project says what its modules are.
//!
//! `import Thermostat` names a module, and which files are its types is not
//! in any QML file: it is in the `qmldir` next to them, or in the
//! `CMakeLists.txt` that has the build write one. Both are read here for
//! that and nothing else.

use std::collections::HashMap;

/// A module, and the files that are its types.
#[derive(Debug, PartialEq, Eq)]
pub struct Module {
    pub uri: String,
    pub types: Vec<Type>,
}

#[derive(Debug, PartialEq, Eq)]
pub struct Type {
    pub name: String,
    /// The file, from the directory of what describes the module.
    pub path: String,
}

/// What a `qmldir` describes: None when it names no module, and its
/// directory is only ever imported by its path.
///
/// ```text
/// module Thermostat
/// singleton Constants 1.0 Constants.qml
/// RoomView 1.0 RoomView.qml
/// ```
pub fn qmldir(text: &str) -> Option<Module> {
    let mut uri = None;
    let mut types = Vec::new();
    for line in text.lines() {
        let line = line.split('#').next().unwrap_or(line);
        let mut words: Vec<&str> = line.split_whitespace().collect();
        if let ["module", name] = words.as_slice() {
            uri = Some((*name).to_string());
            continue;
        }
        if matches!(words.first(), Some(&("singleton" | "internal"))) {
            words.remove(0);
        }
        // `Name File.qml`, or with a version between them.
        let (Some(name), Some(path)) = (words.first(), words.last()) else { continue };
        if matches!(words.len(), 2 | 3) && is_type_name(name) && path.ends_with(".qml") {
            types.push(Type { name: (*name).to_string(), path: (*path).to_string() });
        }
    }
    Some(Module { uri: uri?, types })
}

/// The modules a `CMakeLists.txt` makes:
///
/// ```text
/// qt_add_qml_module(app URI Thermostat QML_FILES Main.qml views/RoomView.qml)
/// ```
///
/// A file is the type its name says, as it is to the build. Only what is
/// written there is read: a list in a variable `set` in the same file is
/// followed, anything computed is not.
pub fn cmake(text: &str) -> Vec<Module> {
    let mut variables: HashMap<String, Vec<String>> = HashMap::new();
    for here in ["CMAKE_CURRENT_SOURCE_DIR", "CMAKE_CURRENT_LIST_DIR"] {
        variables.insert(here.to_string(), vec![".".to_string()]);
    }
    let mut modules = Vec::new();
    for (name, arguments) in commands(text) {
        let arguments = expand(&arguments, &variables);
        match name.to_ascii_lowercase().as_str() {
            "set" => {
                if let Some((name, values)) = arguments.split_first() {
                    variables.insert(name.clone(), values.to_vec());
                }
            }
            "list" => {
                if let [operation, name, values @ ..] = arguments.as_slice()
                    && operation == "APPEND"
                {
                    variables.entry(name.clone()).or_default().extend(values.iter().cloned());
                }
            }
            "qt_add_qml_module" | "qt6_add_qml_module" => modules.extend(module(&arguments)),
            _ => {}
        }
    }
    modules
}

fn module(arguments: &[String]) -> Option<Module> {
    let mut uri = None;
    let mut types = Vec::new();
    let mut keyword = "";
    for argument in arguments.iter().skip(1) {
        if is_keyword(argument) {
            keyword = argument;
            continue;
        }
        match keyword {
            "URI" => uri = Some(argument.clone()),
            "QML_FILES" => {
                let file = argument.rsplit('/').next().unwrap_or(argument);
                let name = file.split('.').next().unwrap_or(file);
                if file.ends_with(".qml") && is_type_name(name) {
                    types.push(Type { name: name.to_string(), path: argument.clone() });
                }
            }
            _ => {}
        }
    }
    Some(Module { uri: uri?, types })
}

/// `QML_FILES`, `NO_PLUGIN`: what says what the arguments after it are.
fn is_keyword(argument: &str) -> bool {
    argument.starts_with(|c: char| c.is_ascii_uppercase())
        && argument.chars().all(|c| c.is_ascii_uppercase() || c.is_ascii_digit() || c == '_')
}

/// A file is a type when its name starts with a capital: `main.qml` is not.
fn is_type_name(name: &str) -> bool {
    name.starts_with(|c: char| c.is_ascii_uppercase())
}

/// `${NAME}` by itself is the list the variable holds; inside an argument it
/// is its value. One nothing here set is left as it is written.
fn expand(arguments: &[String], variables: &HashMap<String, Vec<String>>) -> Vec<String> {
    let mut expanded = Vec::new();
    for argument in arguments {
        if let Some(name) = argument.strip_prefix("${").and_then(|rest| rest.strip_suffix('}'))
            && let Some(values) = variables.get(name)
        {
            expanded.extend(values.iter().cloned());
            continue;
        }
        let mut value = argument.clone();
        for (name, values) in variables {
            let reference = format!("${{{name}}}");
            if value.contains(&reference) {
                value = value.replace(&reference, &values.join(";"));
            }
        }
        expanded.push(value);
    }
    expanded
}

/// The commands of a CMake file, each with its arguments as they are
/// written.
fn commands(text: &str) -> Vec<(String, Vec<String>)> {
    let mut commands = Vec::new();
    let mut chars = text.chars().peekable();
    let mut word = String::new();
    // `if (` is `if(`: a space ends the word, and only another word drops it.
    let mut ended = false;
    while let Some(c) = chars.next() {
        match c {
            '#' => {
                for c in chars.by_ref() {
                    if c == '\n' {
                        break;
                    }
                }
            }
            '(' => {
                let name = std::mem::take(&mut word);
                let mut arguments = Vec::new();
                let mut argument = String::new();
                let mut depth = 1;
                while let Some(c) = chars.next() {
                    match c {
                        '#' => {
                            for c in chars.by_ref() {
                                if c == '\n' {
                                    break;
                                }
                            }
                        }
                        '"' => {
                            while let Some(c) = chars.next() {
                                match c {
                                    '"' => break,
                                    '\\' => argument.extend(chars.next()),
                                    c => argument.push(c),
                                }
                            }
                            arguments.push(std::mem::take(&mut argument));
                        }
                        '(' => depth += 1,
                        ')' => {
                            depth -= 1;
                            if depth == 0 {
                                break;
                            }
                        }
                        c if c.is_whitespace() => {
                            if !argument.is_empty() {
                                arguments.push(std::mem::take(&mut argument));
                            }
                        }
                        c => argument.push(c),
                    }
                }
                if !argument.is_empty() {
                    arguments.push(argument);
                }
                commands.push((name, arguments));
            }
            c if c.is_alphanumeric() || c == '_' => {
                if std::mem::take(&mut ended) {
                    word.clear();
                }
                word.push(c);
            }
            c if c.is_whitespace() => ended = true,
            _ => word.clear(),
        }
    }
    commands
}
