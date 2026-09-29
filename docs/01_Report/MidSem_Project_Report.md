# ExpenseEase - Mid-Semester Project Report

## 1. Cover page

**Project:** ExpenseEase  
**Group number:** <<FILL: group number>>  
**Members and registration numbers:** <<FILL: members>>  
**Course and section:** <<FILL: course and section>>  
**Supervisor/instructor:** <<FILL: instructor>>

## 2. Problem statement and motivation

Friends, roommates, and trip groups often use chat messages or spreadsheets to track shared spending. This causes forgotten IOUs, unclear payers, unequal splits, and circular debts. ExpenseEase provides an auditable local web application to record group expenses, compute exact balances, and recommend a smaller set of repayments.

## 3. Project objectives

1. Record expenses with equal, exact, and percentage split rules.
2. Preserve monetary accuracy using integer paise.
3. Compute net balances and simplified debt transfers.
4. Protect group data with authentication and authorization.
5. Maintain an explainable, tested codebase.

## 4. Scope

Included scope is authentication, group membership, expenses, balances, settlements, activity, and dashboard summaries. Current implementation includes backend endpoints and a frontend demo flow for login, group browsing, equal expense entry, balances, and activity. Payment processing, OCR, multi-currency, social login, notifications, native apps, and recurring expenses are excluded. The application uses INR, English UI, local SQLite, and manually recorded settlements.

## 5. Stakeholders

| Stakeholder | Interest | Influence |
|---|---|---|
| Group member | Accurate shared costs | High |
| Group admin | Membership and data oversight | High |
| Course evaluator | Evidence of engineering practice | High |
| Development team | Deliverable quality and learning | High |
| Future maintainer | Clear design and tests | Medium |

## 6. Requirements specification

Functional requirements cover registration, group creation, member addition, expense CRUD, split validation, balance calculation, debt simplification, settlement recording, activity, and dashboard summaries. Non-functional requirements include bcrypt password hashing, JWT expiry, validated input, SQLite portability, accessible labels, and balance-sum-zero invariants.

## 7. Requirements model

The detailed use-case diagram, six use cases, and eighteen user stories are in the requirements document. Core acceptance requirement: submitted expense shares must total exactly to the stored paise amount, and only group members can access a group.

## 8. System design

The browser SPA calls an Express REST API. Routes delegate to controllers and services; Prisma accesses SQLite. The debt simplifier is a pure service, independent of database access. Balances are computed from expenses and settlements rather than stored, preventing stale records.

## 9. Technology stack and justification

| Layer | Choice | Why |
|---|---|---|
| Frontend | React/Vite/Axios | Fast local SPA and API integration |
| Backend | Node.js/Express | Small, familiar REST service |
| Validation | Zod | Declarative input contracts |
| Database | SQLite/Prisma | Zero-setup relational model |
| Security | bcrypt/JWT/helmet | Password hashing and protected routes |
| Tests | Vitest/Supertest | Fast unit and API-oriented testing |

## 10. Implementation progress

Completed backend capabilities: auth, groups, member authorization, expense CRUD, deterministic split calculators, balance calculation, simplification, settlement recording, activity, dashboard, seed data, and unit/service tests. Current frontend implements a live login-to-group-to-equal-expense-to-balance workflow. Exact/percentage split UI, settlement UI, broader test coverage, and polished responsive screens remain in progress.

Screenshots to capture from a real run: login_demo.png, groups_dashboard.png, group_expenses_empty.png, add_equal_expense.png, expenses_after_add.png, balances_suggestions.png, activity_feed.png, and test_results.png.

## 11. Testing performed

The current real automated run includes 13 backend tests and 1 frontend test, with lint and production build passing. Covered evidence includes equal remainder handling, invalid exact splits, percentage rounding, deterministic debt suggestions, balance invariants, health response, group authorization, expense edit/delete authorization, and persisted balance display. No unexecuted scenario is marked as passed.

## 12. Project-management status

The Gantt plan and risk register are in the project-management documents. Backend core services are ahead of frontend completeness; remaining risk is documentation, evidence, full UI coverage, packaging, and team-provided contribution records.

## 13. Individual contribution table

| Member | Tasks done | Modules / commits | Percentage |
|---|---|---|---|
| <<FILL: name>> | <<FILL>> | <<FILL>> | <<FILL>> |

## 14. Challenges faced and solutions attempted

The project addressed deterministic rounding by allocating leftover paise in ascending user-id order. Simplification matches largest creditor and debtor deterministically. Authorization is enforced through membership and creator/admin checks. Balance consistency is maintained by calculating from records, not caching balances. <<CONFIRM: add only genuine team challenges>>

## 15. Remaining-semester work

Complete exact/percentage expense UI and settlement UI, expand API and frontend tests, add screenshots and test evidence, generate migration evidence, improve accessibility and responsiveness, conduct usability testing, and prepare the verified submission package.

## 16. References

1. Prisma Documentation, https://www.prisma.io/docs
2. Express Documentation, https://expressjs.com/
3. React Documentation, https://react.dev/
4. OWASP Top 10, https://owasp.org/www-project-top-ten/
5. Ian Sommerville, Software Engineering.

## Appendix A. AI-use disclosure

See AI_USAGE_DISCLOSURE.md. Students must complete the verification/modification column honestly and remain responsible for correctness, security, and originality.
