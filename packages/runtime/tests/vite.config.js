import { join } from "node:path";
import { defineConfig } from "vite";
import qml from "../vite.js";

export default defineConfig({
  root: import.meta.dirname,
  plugins: [qml({ qmlc: process.env.QMLC ?? join(import.meta.dirname, "../../../target/debug/qmlc") })],
  resolve: { dedupe: ["solid-js", "@solidjs/web", "@solidjs/signals"] },
});
