#!/usr/bin/env node
// A stand-in for `qmlc`, so that the harness can be tested whatever the real
// compiler takes today: `FILE.qml` compiles to what `FILE.qml.js` holds, and
// without one it is an error, said as `qmlc` says its own.
import { existsSync, readFileSync } from "node:fs";

const file = process.argv.at(-1);
if (!existsSync(`${file}.js`)) {
  console.error(`${file}:1:1: the stand-in compiler has no output for this file`);
  process.exit(1);
}
process.stdout.write(readFileSync(`${file}.js`, "utf8"));
