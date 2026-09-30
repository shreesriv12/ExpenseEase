# Test Cases

| ID    | Module   | Input / Description | Expected Result | Actual Result | Pass/Fail | Evidence |
| ----- | -------- | ------------------- | --------------- | ------------- | --------- | -------- |
| TC-01 | Splits | Equal: 10,000 paise across user IDs 1, 2, 3 | Shares are 3,334, 3,333, 3,333 paise; total is 10,000 | Automated assertion passed | Pass | server/tests/services.test.js |
| TC-02 | Splits | Exact: total 18,500 paise; shares 6,000, 5,000, 7,500 | Valid shares are retained and sum to 18,500 | Automated assertion passed | Pass | server/tests/services.test.js |
| TC-03 | Splits | Exact: total 10,000 paise; shares 4,000 and 5,000 | 400 validation error: exact shares do not sum to total | Automated assertion passed | Pass | server/tests/services.test.js |
| TC-04 | Splits | Percentage: total 10,000 paise; percentages 50, 30, 20 | Shares are 5,000, 3,000, 2,000 paise | Automated assertion passed | Pass | server/tests/services.test.js |
| TC-05 | Splits | Percentage: total 10,000 paise; percentages 50 and 40 | 400 validation error: percentages do not total 100 | Automated assertion passed | Pass | server/tests/services.test.js |
| TC-06 | Debts | Two debtors and one creditor | Minimal transfers settle all balances | Automated assertion passed | Pass | server/tests/services.test.js |
| TC-07 | Balances | Expenses plus a 1,000-paise settlement | Net balances sum to zero and settlement changes both parties | Automated assertion passed | Pass | server/tests/services.test.js |
| TC-08 | API | Health endpoint | JSON `ok: true` | Automated assertion passed | Pass | server/tests/auth.test.js |

Manual-test request bodies and the runnable seed dataset are in [`sample_data/`](../../sample_data/). They use fictional local-only accounts and no personal or production data.

Current verification note: on 30 September 2026, the repository-level `npm test` run passed with 157 server tests and 22 client tests (179 total). The server suite resets only the isolated `expenseease_test` PostgreSQL database. `npm run lint` and `npm run build` also passed. Screenshots of the final command output and real browser workflows are still required as submission evidence.
