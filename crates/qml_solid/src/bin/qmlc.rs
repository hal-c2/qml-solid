//! `qmlc [--emit js|lowered] [--out-dir DIR] [--host MODULE] [--runtime MODULE] FILE.qml...`
//!
//! Compiles each QML file to a JavaScript module. Without `--out-dir` the
//! output goes to stdout.

use std::{path::Path, process::ExitCode};

use qml_solid::{Options, compile, lowered_source};

fn main() -> ExitCode {
    let mut options = Options::default();
    let mut lowered = false;
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
