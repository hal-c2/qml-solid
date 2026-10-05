// The examples the gallery shows and the report measures: the manifest
// (`corpus/examples.json`, or the one GALLERY_MANIFEST names) with every path
// made absolute. Read by the Vite config and by the tests, in Node.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assetsOf } from "../../corpus/assets.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const manifestFile = resolve(process.env.GALLERY_MANIFEST ?? join(here, "../../corpus/examples.json"));

// The screen the references were taken on.
export const readScreen = () => JSON.parse(readFileSync(manifestFile, "utf8")).screen;

export function readManifest() {
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  const corpus = dirname(manifestFile);
  const references = join(corpus, "reference");
  const index = existsSync(join(references, "reference.json"))
    ? JSON.parse(readFileSync(join(references, "reference.json"), "utf8"))
    : {};
  return manifest.examples.map((example) => {
    const directory = join(corpus, manifest.root, example.dir);
    const reference = join(references, `${example.id}.png`);
    // What stands in for the example's C++: QML for the types it registers,
    // and a `main.js` for what its main.cpp does: `properties()` are what
    // it gives the entry file, `loaded(root)` what it does once that is made.
    const standins = join(corpus, "standins", example.id);
    return {
      ...example,
      directory,
      entryFile: join(directory, example.entry),
      reference: existsSync(reference) ? reference : null,
      standins: existsSync(standins) ? standins : null,
      main: existsSync(join(standins, "main.js")) ? join(standins, "main.js") : null,
      capturedAt: index[example.id]?.capturedAt ?? null,
      // What the example's build downloads, where that has been fetched
      // (`mise run assets`): each directory of it, where the build puts it
      // and where it is.
      fetched: (assetsOf(example)?.places ?? []).map(([to, from]) => [join(directory, to), from]),
      // And what the example downloads itself, fetched likewise: the address
      // it asks for each directory at, where that is, and where the gallery
      // serves it.
      served: (assetsOf(example)?.addresses ?? []).map(([address, from], index) => [address, from, `/@assets/${example.id}/${index}/`]),
    };
  });
}
