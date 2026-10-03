//! Parse every `.qml` file given on the command line and report syntax errors.

use oxc_allocator::Allocator;
use oxc_parser::Parser;
use oxc_span::SourceType;

fn main() {
    let (mut ok, mut failed) = (0, 0);
    for path in std::env::args().skip(1) {
        let source = std::fs::read_to_string(&path).expect("readable file");
        let allocator = Allocator::default();
        let parsed = Parser::new(&allocator, &source, SourceType::ts()).parse_qml();
        if parsed.diagnostics.is_empty() {
            ok += 1;
            continue;
        }
        failed += 1;
        for diagnostic in parsed.diagnostics {
            let offset = diagnostic
                .labels
                .first()
                .map_or(0, |label| label.offset() as usize);
            let line = source[..offset.min(source.len())].matches('\n').count() + 1;
            println!("{path}:{line}: {}", diagnostic.message);
        }
    }
    println!("{ok} parsed, {failed} failed");
}
