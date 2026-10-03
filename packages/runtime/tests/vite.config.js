import { join } from "node:path";
import { defineConfig } from "vite";
import qml from "../vite.js";

export default defineConfig({
  root: import.meta.dirname,
  plugins: [qml({ qmlc: process.env.QMLC ?? join(import.meta.dirname, "../../../target/debug/qmlc") })],
  resolve: { dedupe: ["solid-js", "@solidjs/web", "@solidjs/signals"] },
  // SQLite for the browser is not written as a module: Vite makes it one
  // before the first page asks, not when one does.
  optimizeDeps: { include: ["sql.js"] },
});
