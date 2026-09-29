# ExpenseEase - Mid-Semester Project Report

## 1. Cover page

**Project:** ExpenseEase  
**Group number:** Pending team confirmation  
**Members and registration numbers:** Pending confirmation  
**Course and section:** Pending confirmation  
**Supervisor/instructor:** Pending confirmation

## 2. Problem statement and motivation

Friends, roommates, and trip groups often use chat messages or spreadsheets to track shared spending. This causes forgotten IOUs, unclear payers, unequal splits, and circular debts. ExpenseEase provides a local web application to record group expenses, compute exact balances, and recommend a smaller set of repayments.

## 3. Project objectives

1. Record expenses with equal, exact, and percentage split rules.
2. Preserve monetary accuracy using integer paise.
3. Compute net balances and simplified debt transfers.
4. Protect group data with authentication and authorization.
5. Maintain an explainable, testable codebase.

## 4. Scope

Included scope is authentication, group membership, expenses, balances, settlements, activity, and dashboard summaries. The current implementation includes backend services and a frontend demo flow for login, group browsing, equal expense entry, balances, and activity. Payment processing, OCR, multi-currency support, social login, notifications, native apps, and recurring expenses remain out of scope. The application uses INR, local SQLite, and manually recorded settlements.

## 5. Stakeholders

| Stakeholder       | Interest                         | Influence |
| ----------------- | -------------------------------- | --------- |
| Group member      | Accurate shared costs            | High      |
| Group admin       | Membership and data oversight    | High      |
| Course evaluator  | Evidence of engineering practice | High      |
| Development team  | Deliverable quality and learning | High      |
| Future maintainer | Clear design and tests           | Medium    |

## 6. Requirements specification

Functional requirements cover registration, group creation, member addition, expense CRUD, split validation, balance calculation, debt simplification, settlement recording, activity, and dashboard summaries. Non-functional requirements include bcrypt password hashing, JWT-based authentication, validated input, SQLite portability, and balance invariants.

## 7. Requirements model

The detailed use-case diagram, six use cases, and eighteen user stories are in the requirements document. The core acceptance condition remains that submitted expense shares must total exactly to the stored paise amount and that only group members can access a group.

## 8. System design

The browser SPA calls an Express REST API. Routes delegate to controllers and services; Prisma accesses SQLite. The debt simplifier is a pure service, separated from database access. Balances are computed from expenses and settlements rather than stored, preventing stale records.

## 9. Technology stack and justification

| Layer      | Choice            | Why                                   |
| ---------- | ----------------- | ------------------------------------- |
| Frontend   | React/Vite/Axios  | Fast local SPA and API integration    |
| Backend    | Node.js/Express   | Small REST service with clear routes  |
| Validation | Zod               | Declarative input contracts           |
| Database   | SQLite/Prisma     | Zero-setup relational model           |
| Security   | bcrypt/JWT/helmet | Password hashing and protected routes |
| Tests      | Vitest/Supertest  | Fast unit and API-oriented testing    |

## 10. Implementation progress

Verified backend capabilities in the current repository include authentication, group membership and authorization, expense CRUD, deterministic split validation, balance calculation, debt simplification, settlement support, activity, dashboard summaries, seed data, and service-level tests. The current frontend implements a live login-to-group-to-equal-expense-to-balance workflow.

Verified status of remaining UI functionality: exact-split and percentage-split input flows, settlement UI, and broader interface coverage remain pending and are not claimed as complete.

## 11. Testing performed

The current repository-level test run is not fully passing. Running `npm test` from the project root produced 4 passing suites and 1 failing auth suite. The failure is from `tests/auth.test.js` because `@prisma/client` was not initialized; the error states that Prisma client generation is required before the auth tests can run successfully.

This means the current evidence must be reported accurately: the split, balance, group, and expense service logic is passing in the available automated checks, while auth integration remains a verified outstanding issue.

## 12. Project-management status

The project-management documents in this repository contain the live status and discovered risks. The Git history confirms implemented work in backend services and the equal-split frontend flow. Final packaging, evidence verification, and contribution confirmation remain pending.

## 13. Individual contribution table

| Member         | Tasks done | Modules / commits | Percentage |
| -------------- | ---------- | ----------------- | ---------- |
| Member 1       | Pending confirmation | Git history shows implementation work, but specific individual allocation is not yet verified | Pending |
| Member 2       | Pending confirmation | Git history shows implementation work, but specific individual allocation is not yet verified | Pending |

## 14. Challenges faced and solutions attempted

The project addressed deterministic rounding by allocating leftover paise in ascending user-id order. Simplification matches the largest creditor and debtor deterministically. Authorization is enforced through membership and creator/admin checks. Balance consistency is maintained by calculating from records rather than storing a cached balance. The current project also highlights the need to stabilize Prisma client generation before final authentication testing can be considered complete.

## 15. Remaining-semester work

Complete exact/percentage expense UI and settlement UI, resolve Prisma client initialization for auth tests, expand API and frontend tests, add screenshots and verified test evidence, generate migration evidence, improve accessibility and responsiveness, and prepare the final submission package.

## 16. References

1. Prisma Documentation, https://www.prisma.io/docs
2. Express Documentation, https://expressjs.com/
3. React Documentation, https://react.dev/
4. OWASP Top 10, https://owasp.org/www-project-top-ten/
5. Ian Sommerville, Software Engineering.

## Appendix A. AI-use disclosure

See AI_USAGE_DISCLOSURE.md. Students must complete the verification/modification column honestly and remain responsible for correctness, security, and originality.
