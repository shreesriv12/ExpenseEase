import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "./tests/globalSetup.js",
    globalTeardown: "./tests/globalTeardown.js",
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ||
        "postgresql://expenseease:expenseease@localhost:5432/expenseease_test?schema=public",
      JWT_SECRET: "test-secret",
      AUTH_RATE_LIMIT_MAX: "10000",
    },
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
