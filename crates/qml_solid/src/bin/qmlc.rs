//! `qmlc [--emit js|lowered] [--out-dir DIR] [--host MODULE] [--runtime MODULE] [--alone] FILE.qml...`
//!
//! Compiles each QML file to a JavaScript module. Without `--out-dir` the
//! output goes to stdout. A file is compiled with the QML files next to it,
//! which is where the components it names are and where it is used. With
//! `--alone` it is compiled by itself: it takes only what it declares, and a
//! type it does not know is taken to be a component.

use std::{path::Path, process::ExitCode};

use qml_solid::{Options, Project, compile, lowered_source};

/// The QML files next to `path`: what a file is compiled with. One that does
/// not parse is left out here and reported when it is compiled itself.
fn project(path: &Path) -> Project {
    let mut project = Project::new();
    let directory = match path.parent() {
        Some(parent) if !parent.as_os_str().is_empty() => parent,
        _ => Path::new("."),
    };
    let Ok(entries) = std::fs::read_dir(directory) else { return project };
    for entry in entries.flatten() {
        let sibling = entry.path();
        if sibling.extension().is_none_or(|extension| extension != "qml") {
            continue;
        }
        let (Some(stem), Ok(source)) =
            (sibling.file_stem().and_then(|stem| stem.to_str()), std::fs::read_to_string(&sibling))
        else {
            continue;
        };
        let _ = project.add(stem, &source);
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
