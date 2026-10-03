//! `qmlc [--emit js|lowered] [--out-dir DIR] [--host MODULE] [--runtime MODULE] [--alone] FILE.qml...`
//!
//! Compiles each QML file to a JavaScript module. Without `--out-dir` the
//! output goes to stdout. A file is compiled with the QML files next to it
//! and in the directories they import, which is where the components it
//! names are and where it is used. With
//! `--alone` it is compiled by itself: it takes only what it declares, and a
//! type it does not know is taken to be a component.

use std::{collections::HashSet, path::Path, process::ExitCode};

use qml_solid::{Options, Project, compile, lowered_source};

/// The QML files `path` is compiled with: the ones next to it, which is
/// where the components it names are and where it is used, and the ones in
/// the directories any of them imports. One that does not parse is left out
/// here and reported when it is compiled itself.
fn project(path: &Path) -> Project {
    let mut project = Project::new();
    let root = match path.parent() {
        Some(parent) if !parent.as_os_str().is_empty() => parent,
        _ => Path::new("."),
    };
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
            let _ = project.add(&key, &source);
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
    let mut files = Vec::new();
    let mut args = std::env::args().skip(1);
    while let Some(arg) = args.next() {
        let mut value = |flag: &str| args.next().unwrap_or_else(|| panic!("{flag} needs a value"));
        match arg.as_str() {
            "--emit" => lowered = value("--emit") == "lowered",
            "--out-dir" => out_dir = Some(value("--out-dir")),
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
        options.name = stem.to_string();
        options.project = (!alone).then(|| project(path));
        let result = if lowered {
            lowered_source(&source, &options)
        } else {
            compile(&source, &options).map(|output| output.code)
        };
        match result {
            Ok(code) => {
                compiled += 1;
                match &out_dir {
                    Some(dir) => {
                        let target = Path::new(dir).join(format!("{stem}.qml.js"));
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
