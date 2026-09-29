# Test Cases

| ID | Module | Description | Expected Result | Actual Result | Pass/Fail | Evidence |
|---|---|---|---|---|---|---|
| TC-01 | Splits | Equal 10,000 paise across three users | Shares total 10,000 and remainder is deterministic | Automated assertion passed | Pass | server/tests/services.test.js |
| TC-02 | Splits | Reject invalid exact split | Validation error | Automated assertion passed | Pass | server/tests/services.test.js |
| TC-03 | Debts | Simplify two debtors to one creditor | Two transfers | Automated assertion passed | Pass | server/tests/services.test.js |
| TC-04 | Balances | Compute paid minus shares | Sum is zero | Automated assertion passed | Pass | server/tests/services.test.js |
| TC-05 | API | Health endpoint | JSON `ok: true` | Automated assertion passed | Pass | server/tests/auth.test.js |

Additional API and UI scenarios must be executed and recorded as their endpoints are implemented; no unrun scenario is labelled passed.
