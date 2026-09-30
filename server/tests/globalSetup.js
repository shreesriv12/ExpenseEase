import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

export default function setup() {
  const require = createRequire(import.meta.url);
  const prismaCli = require.resolve("prisma/build/index.js");
  execFileSync(process.execPath, [prismaCli, "db", "push", "--force-reset", "--skip-generate"], {
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ||
        "postgresql://expenseease:expenseease@localhost:5432/expenseease_test?schema=public",
    },
    stdio: "inherit",
  });
}
