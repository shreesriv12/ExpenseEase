import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "./tests/globalSetup.js",
    env: {
      DATABASE_URL: "file:./test.db",
      JWT_SECRET: "test-secret",
      AUTH_RATE_LIMIT_MAX: "10000",
    },
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
