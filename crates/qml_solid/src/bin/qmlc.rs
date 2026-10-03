//! `qmlc [--emit js|lowered] [--out-dir DIR] [--root DIR] [--host MODULE] [--runtime MODULE] [--alone] FILE.qml...`
//!
//! Compiles each QML file to a JavaScript module, and each `.js` file as the
//! script a QML file imports. Without `--out-dir` the output goes to stdout. A file is compiled with the QML files next to it
//! and in the directories they import, which is where the components it
//! names are and where it is used, and with the modules of the project it
//! is in: what the `qmldir` and `CMakeLists.txt` files under `--root` say
//! they are. Without `--root` that is the nearest directory above the file
//! whose `CMakeLists.txt` starts a project. With
//! `--alone` it is compiled by itself: it takes only what it declares, and a
//! type it does not know is taken to be a component.

use std::{
    collections::HashSet,
    path::{Component, Path, PathBuf},
    process::ExitCode,
};

use qml_solid::{Options, Project, compile, compile_script, discover, lowered_source};

/// The directory the project `path` is in starts at.
fn project_root(path: &Path) -> PathBuf {
    let directory = path.parent().unwrap_or(Path::new("/"));
    directory
        .ancestors()
        .find(|ancestor| {
            std::fs::read_to_string(ancestor.join("CMakeLists.txt"))
                .is_ok_and(|text| text.lines().any(|line| line.trim_start().starts_with("project(")))
        })
        .unwrap_or(directory)
        .to_path_buf()
}

/// The files under `root` that say what a module is.
fn descriptions(root: &Path, found: &mut Vec<PathBuf>) {
    let Ok(entries) = std::fs::read_dir(root) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name();
        let name = name.to_string_lossy();
        if path.is_dir() {
            if is_source(&name) {
                descriptions(&path, found);
            }
        } else if name == "qmldir" || name == "CMakeLists.txt" {
            found.push(path);
        }
    }
}

/// What a build or a package manager put there is not the project.
fn is_source(name: &str) -> bool {
    !name.starts_with('.') && !name.starts_with("build") && name != "node_modules" && name != "target"
}

/// The QML files in `directory` and under it, by their path from `base`:
/// what a path put together when the program runs may name.
fn qml_files(directory: &Path, base: &Path, found: &mut Vec<String>) {
    let Ok(entries) = std::fs::read_dir(directory) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name();
        let name = name.to_string_lossy();
        if path.is_dir() {
            if is_source(&name) {
                qml_files(&path, base, found);
            }
        } else if name.ends_with(".qml") {
            found.push(relative(base, &path));
        }
    }
}

/// `to` from the directory `from`, both absolute: `../imports/Clock.qml`.
fn relative(from: &Path, to: &Path) -> String {
    let from: Vec<Component> = from.components().collect();
    let to: Vec<Component> = to.components().collect();
    let common = from.iter().zip(&to).take_while(|(a, b)| a == b).count();
    let mut parts: Vec<String> = vec!["..".to_string(); from.len() - common];
    parts.extend(to[common..].iter().map(|part| part.as_os_str().to_string_lossy().into_owned()));
    parts.join("/")
}

/// Adds the modules of the project under `root`, their files by the path
/// from `base`: the directory of the file being compiled.
fn modules(project: &mut Project, root: &Path, base: &Path) {
    let mut found = Vec::new();
    descriptions(root, &mut found);
    found.sort();
    for description in found {
        let Ok(text) = std::fs::read_to_string(&description) else { continue };
        let directory = description.parent().unwrap_or(root);
        let modules = if description.ends_with("qmldir") {
            discover::qmldir(&text).into_iter().collect()
        } else {
            discover::cmake(&text)
        };
        for module in modules {
            for ty in module.types {
                let Ok(file) = directory.join(&ty.path).canonicalize() else { continue };
                let path = relative(base, &file);
                let Some(key) = path.strip_suffix(".qml") else { continue };
                if !project.has(key) {
                    let Ok(source) = std::fs::read_to_string(&file) else { continue };
                    if project.add(key, &source).is_err() {
                        continue;
                    }
                }
                project.add_type(&module.uri, &ty.name, key);
            }
        }
    }
}

/// The QML files `path` is compiled with: the ones next to it, which is
/// where the components it names are and where it is used, and the ones in
/// the directories any of them imports. One that does not parse is left out
/// here and reported when it is compiled itself.
fn project(path: &Path, project_root: Option<&Path>) -> Project {
    let mut project = Project::new();
    let root = match path.parent() {
        Some(parent) if !parent.as_os_str().is_empty() => parent,
        _ => Path::new("."),
    };
    if let (Ok(base), Ok(path)) = (root.canonicalize(), path.canonicalize()) {
        let project_root = project_root.map_or_else(|| self::project_root(&path), Path::to_path_buf);
        if let Ok(project_root) = project_root.canonicalize() {
            modules(&mut project, &project_root, &base);
        }
    }
    // A file's key is its path from the compiled file's directory, without
    // the extension: `Clock`, `content/Clock`.
    let mut loaded = HashSet::new();
    let mut pending = vec![String::new()];
    while let Some(directory) = pending.pop() {
        if !loaded.insert(directory.clone()) {
            continue;
        }
        let Ok(entries) = std::fs::read_dir(root.join(&directory)) else { continue };
        for entry in entries.flatten() {
            let file = entry.path();
            if file.extension().is_none_or(|extension| extension != "qml") {
                continue;
            }
            let (Some(stem), Ok(source)) =
                (file.file_stem().and_then(|stem| stem.to_str()), std::fs::read_to_string(&file))
            else {
                continue;
            };
            let key = if directory.is_empty() { stem.to_string() } else { format!("{directory}/{stem}") };
            if !project.has(&key) {
                let _ = project.add(&key, &source);
            }
        }
        pending.extend(project.directories());
    }
    project
}

fn main() -> ExitCode {
    let mut options = Options::default();
    let mut lowered = false;
    let mut alone = false;
    let mut out_dir = None;
    let mut root = None;
    let mut files = Vec::new();
    let mut args = std::env::args().skip(1);
    while let Some(arg) = args.next() {
        let mut value = |flag: &str| args.next().unwrap_or_else(|| panic!("{flag} needs a value"));
        match arg.as_str() {
            "--emit" => lowered = value("--emit") == "lowered",
            "--out-dir" => out_dir = Some(value("--out-dir")),
            "--root" => root = Some(PathBuf::from(value("--root"))),
            "--host" => options.host_module = value("--host"),
            "--runtime" => options.runtime_module = value("--runtime"),
            "--alone" => alone = true,
            "--component-extension" => options.component_extension = value("--component-extension"),
            _ => files.push(arg),
        }
    }

    let (mut compiled, mut failed) = (0, 0);
    for file in &files {
        let path = Path::new(file);
        let source = match std::fs::read_to_string(path) {
            Ok(source) => source,
            Err(error) => {
                eprintln!("{file}: {error}");
                failed += 1;
                continue;
            }
        };
        let stem = path.file_stem().and_then(|stem| stem.to_str()).unwrap_or("Component");
        let is_script = path.extension().is_some_and(|extension| extension == "js");
        options.name = stem.to_string();
        options.project = (!alone && !is_script).then(|| project(path, root.as_deref()));
        options.files = (!alone).then(|| {
            let directory = match path.parent() {
                Some(parent) if !parent.as_os_str().is_empty() => parent,
                _ => Path::new("."),
            };
            let mut files = Vec::new();
            qml_files(directory, directory, &mut files);
            files.sort();
            files
        });
        let result = if is_script {
            compile_script(&source, &options).map(|output| output.code)
        } else if lowered {
            lowered_source(&source, &options)
        } else {
            compile(&source, &options).map(|output| output.code)
        };
        match result {
            Ok(code) => {
                compiled += 1;
                match &out_dir {
                    Some(dir) => {
                        let name = if is_script { format!("{stem}.js") } else { format!("{stem}.qml.js") };
                        let target = Path::new(dir).join(name);
                        std::fs::create_dir_all(dir).expect("output directory");
                        std::fs::write(&target, code).expect("writable output");
                    }
                    None => println!("{code}"),
                }
            }
            Err(errors) => {
                failed += 1;
                for error in errors {
                    let (line, column) = error.position(&source);
                    eprintln!("{file}:{line}:{column}: {}", error.message);
                }
            }
        }
    }
    if files.len() > 1 {
        eprintln!("{compiled} compiled, {failed} failed");
    }
    if failed == 0 { ExitCode::SUCCESS } else { ExitCode::FAILURE }
}
