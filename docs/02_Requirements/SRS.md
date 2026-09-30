# ExpenseEase Software Requirements Specification

## Purpose and scope

ExpenseEase records shared group expenses, calculates balances, and proposes simplified settlement transfers. It supports local, single-currency INR use. Payment processing, OCR, mobile apps, notifications, recurring expenses, social login, and multi-currency support are out of scope.

## Functional requirements

| ID    | Requirement                                          | Priority |
| ----- | ---------------------------------------------------- | -------- |
| FR-01 | Users register and authenticate securely.            | Must     |
| FR-02 | Members create and manage groups.                    | Must     |
| FR-03 | Members add equal, exact, or percentage expenses.    | Must     |
| FR-04 | The system computes balances from immutable records. | Must     |
| FR-05 | The system suggests deterministic simplified debts.  | Must     |
| FR-06 | Authorized users record settlements.                 | Should   |

## Non-functional requirements

Passwords use bcrypt with cost 10 or greater. Money is stored as integer paise and balance sums must equal zero. Inputs are validated before persistence. PostgreSQL runs in Docker for reproducible development and deployment.

## Traceability

| FR    | User story                                      | Test             |
| ----- | ----------------------------------------------- | ---------------- |
| FR-03 | As a member, I want to split an expense fairly. | services.test.js |
| FR-04 | As a member, I want accurate balances.          | services.test.js |
| FR-05 | As a member, I want fewer transfers.            | services.test.js |
