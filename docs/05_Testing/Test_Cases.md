# Test Cases

| ID    | Module   | Description                           | Expected Result                                    | Actual Result              | Pass/Fail | Evidence                      |
| ----- | -------- | ------------------------------------- | -------------------------------------------------- | -------------------------- | --------- | ----------------------------- |
| TC-01 | Splits   | Equal 10,000 paise across three users | Shares total 10,000 and remainder is deterministic | Automated assertion passed | Pass      | server/tests/services.test.js |
| TC-02 | Splits   | Reject invalid exact split            | Validation error                                   | Automated assertion passed | Pass      | server/tests/services.test.js |
| TC-03 | Debts    | Simplify two debtors to one creditor  | Two transfers                                      | Automated assertion passed | Pass      | server/tests/services.test.js |
| TC-04 | Balances | Compute paid minus shares             | Sum is zero                                        | Automated assertion passed | Pass      | server/tests/services.test.js |
| TC-05 | API      | Health endpoint                       | JSON `ok: true`                                    | Automated assertion passed | Pass      | server/tests/auth.test.js     |

Current verification note: on 30 September 2026, the repository-level `npm test` run passed with 157 server tests and 22 client tests (179 total). The server suite resets only the isolated `expenseease_test` PostgreSQL database. `npm run lint` and `npm run build` also passed. Screenshots of the final command output and real browser workflows are still required as submission evidence.
