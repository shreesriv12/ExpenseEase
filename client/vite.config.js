import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    restoreMocks: true,
    // *.live.test.jsx talks to a running server; it has its own config.
    exclude: [...configDefaults.exclude, "src/**/*.live.test.jsx"],
  },
});
