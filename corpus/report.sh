#!/bin/sh
# How much of Qt's own examples (the qtdoc submodule) the compiler takes, and
# what stops the rest: the yardstick for what to do next.
#
#   git submodule update --init --depth 1 corpus/qtdoc
#   corpus/report.sh [DIRECTORY]      # default: every example
#
# Each file is compiled alone, so types are not checked: this measures the
# language, not which QtQuick types render.
set -eu
root=$(cd "$(dirname "$0")/.." && pwd)
examples=${1:-$root/corpus/qtdoc/examples}
errors=$(mktemp)
trap 'rm -rf "$errors" "$errors.out"' EXIT

cargo build --quiet --manifest-path "$root/Cargo.toml" --bin qmlc
find "$examples" -name '*.qml' | sort | xargs "$root/target/debug/qmlc" --alone --out-dir "$errors.out" 2>"$errors" >/dev/null || true

tail -n 1 "$errors"
echo
echo "errors, by kind:"
grep -v ' compiled, ' "$errors" | sed -E 's/^[^ ]+ //; s/`[^`]*`/`_`/g' | sort | uniq -c | sort -rn
