import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4174" },
  webServer: {
    command: "vite --config vite.config.js --host 127.0.0.1 --port 4174 --strictPort",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
  },
});
