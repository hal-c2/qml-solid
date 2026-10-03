import { defineConfig } from "vite";

export default defineConfig({
  root: import.meta.dirname,
  resolve: { dedupe: ["solid-js", "@solidjs/web", "@solidjs/signals"] },
});
