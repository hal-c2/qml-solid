#!/usr/bin/env node
// What the build of an example downloads before it compiles anything:
// pictures, meshes and fonts that are in no repository. They are kept
// outside this one too, in a cache, and are found there by what renders the
// example: the gallery, and Qt when it is run for a reference picture.
//
//   corpus/assets.mjs            # which examples have such assets, and whether they are here
//   corpus/assets.mjs ID...      # download and unpack those of each
//
// `assets` in `corpus/examples.json` says where an example's are downloaded
// from and where its build puts them. The cache is QML_SOLID_ASSETS, or
// `qml-solid/assets` in the user's cache directory.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const cache = process.env.QML_SOLID_ASSETS ?? join(process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache"), "qml-solid", "assets");

// Where an example's assets are kept, and where each directory of them is
// in the example as built: `[in the example, in the cache]`. Null for an
// example that has none, or whose assets are not here.
export function assetsOf(example) {
  if (!example.assets) return null;
  const directory = join(cache, example.id);
  const places = Object.entries(example.assets.places).map(([to, from]) => [to, join(directory, from)]);
  return places.every(([, from]) => existsSync(from)) ? { directory, places } : null;
}

async function download(example) {
  const directory = join(cache, example.id);
  const archive = join(directory, basename(new URL(example.assets.url).pathname));
  mkdirSync(directory, { recursive: true });
  if (!existsSync(archive)) {
    console.log(`${example.id}: downloading ${example.assets.url}`);
    const answer = await fetch(example.assets.url);
    if (!answer.ok) throw new Error(`${example.assets.url}: ${answer.status} ${answer.statusText}`);
    // Whole or not at all: half an archive is not one to unpack next time.
    writeFileSync(`${archive}.part`, Buffer.from(await answer.arrayBuffer()));
    renameSync(`${archive}.part`, archive);
  }
  const unpacked = [
    ["unzip", ["-o", "-q", archive, "-d", directory]],
    ["bsdtar", ["-xf", archive, "-C", directory]],
  ].some(([tool, args]) => spawnSync(tool, args, { stdio: "inherit" }).status === 0);
  if (!unpacked) throw new Error(`${archive} could not be unpacked: neither unzip nor bsdtar did`);
  if (!assetsOf(example)) {
    rmSync(archive);
    throw new Error(`${archive} has not got ${Object.values(example.assets.places).join(", ")}`);
  }
  console.log(`${example.id}: ${directory}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifest = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "examples.json"), "utf8"));
  const having = manifest.examples.filter((example) => example.assets);
  const wanted = process.argv.slice(2);
  const unknown = wanted.filter((id) => !having.some((example) => example.id === id));
  if (unknown.length) {
    console.error(`no assets to download for: ${unknown.join(", ")}`);
    process.exit(1);
  }
  if (!wanted.length) {
    for (const example of having) console.log(`${example.id}: ${assetsOf(example) ? "here" : "not here"} (${example.assets.url})`);
  }
  for (const example of having.filter((example) => wanted.includes(example.id))) await download(example);
}
