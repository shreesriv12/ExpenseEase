# ExpenseEase — Mid-Semester Project Report

**Course:** Software Engineering & Project Management (CSN15101)  
**Section:** [Your Section]  
**Group Number:** [Your Group Number]  
**Instructor:** Dr. Satarupa Chakrabarti  
**Submission Date:** September 2026

---

## Team Members

| Name | Registration Number | Role |
|---|---|---|
| Shreeya Srivastava | 20243267 | Team Lead / Full-stack |
| Shraddha Sharma | 20243266 | Backend / Testing |
| Rudransh Pratap Singh | 20243243 | Frontend / UI |
| Sachit Jain | 20243245 | Database / DevOps |

---

## 1. Problem Statement and Motivation

Managing shared expenses within a group — whether it is a college trip, shared accommodation, or a project team dinner — is inherently messy. The typical approach is a WhatsApp thread of receipts and informal "you owe me" messages, which quickly becomes untrackable. People forget who paid what, calculations are done mentally and are prone to error, and settling debts often requires multiple rounds of back-and-forth negotiation.

Existing solutions like Splitwise exist but are either locked behind paywalls for core features, require app installation, or are overkill for a student group that simply wants to know "who owes whom and how much." There is also a trust problem: when an app calculates balances, users often cannot verify how those numbers were arrived at.

This project addresses this problem directly. ExpenseEase is a web-based expense-splitting application built specifically for small, trust-based groups such as student flat-mates, trip groups, or project teams. It records shared expenses, computes individual balances transparently using a published formula, and minimises the number of cash transfers needed to clear all debts. Every calculation is deterministic — the same input always produces the same output — so any member can manually verify the results.

The motivation for building this system came from a real pain point experienced by the team itself during inter-college events and shared accommodation. The project is also an opportunity to put software engineering principles into practice in a meaningful, self-contained domain.

---

## 2. Project Objectives

The primary goal of ExpenseEase is to provide a group with a single, honest ledger for shared expenses. Specifically, the system is designed to:

1. **Eliminate manual calculation errors** — all split arithmetic is performed server-side and validated by automated tests.
2. **Support multiple split strategies** — equal division, exact amounts, and percentage-based splits cover the most common real-world scenarios.
3. **Produce verifiable balances** — the balance formula is documented and the invariant (all balances in a group sum to zero) is enforced in code.
4. **Minimise settlement transactions** — a greedy debt-simplification algorithm reduces the number of transfers needed to clear all debts.
5. **Maintain a full audit trail** — every expense and settlement is logged so members can trace how the current balance was reached.
6. **Be accessible without installation** — the application runs in any modern browser; no mobile app is required.
7. **Protect member data** — passwords are hashed with bcrypt, every API endpoint requires a valid JWT, and group data is scoped to members only.

---

## 3. Scope of the Project

### 3.1 Features Included

| Feature | Description |
|---|---|
| User registration and login | Email + password authentication with JWT session tokens (7-day expiry) |
| Group creation | Any authenticated user can create a group and becomes its administrator |
| Member management | Group admin can add registered users by email address |
| Expense recording | Members record expenses with description, amount, category, date, payer, and split type |
| Equal split | Amount divided equally; remainder paise distributed deterministically by user ID |
| Exact split | Each participant's share entered manually; validated to sum to total |
| Percentage split | Each participant's percentage entered; validated to total 100; shares computed server-side |
| Balance calculation | Net balance per member computed as total paid minus total owed, adjusted for settlements |
| Debt simplification | Greedy algorithm reduces the number of cash transfers needed to clear all debts |
| Settlement recording | Any member can record a payment between two group members |
| Activity log | Every expense and settlement action is timestamped and logged per group |
| Cross-group dashboard | Logged-in user sees total "you owe" and "owed to you" across all groups |
| Expense editing | Expense creator or group admin can edit any field, including split details |
| Expense deletion | Expense creator or group admin can delete an expense |

### 3.2 Features Excluded

The following were considered but deliberately excluded from the mid-semester deliverable:

- **Password reset** — no email delivery mechanism is in scope; a placeholder message is shown.
- **Notifications** — no email or push notification system.
- **File/receipt attachments** — expenses are text-only.
- **Currency support beyond INR** — all amounts are stored in paise (Indian Rupees only).
- **Recurring expenses** — no auto-repeat functionality.
- **Expense categories as a dropdown** — category is a free-text field; no enforcement of a fixed taxonomy.
- **Group deletion or archiving** — groups persist indefinitely.
- **Mobile application** — the system is web-only; no native Android or iOS app.
- **Offline mode** — no service worker or local-first data strategy.

### 3.3 Assumptions and Constraints

**Assumptions:**
- All group members must be registered users before they can be added to a group; adding by name alone is not supported.
- All monetary amounts are in Indian Rupees. Amounts are entered in rupees (e.g., ₹ 150.00) and stored as integers in paise (15000) to avoid floating-point rounding.
- Percentage splits accept whole-number percentages only (e.g., 33% is valid; 33.3% is not).
- The group administrator who creates the group is the only user who can add new members.
- Settlements do not automatically close or archive; balances accumulate across all expenses and settlements.

**Constraints:**
- The system requires Node.js 20+ and a PostgreSQL 16 database.
- The Docker Compose deployment is the supported production setup; local development requires manual environment variable configuration.
- There is a rate limit of 20 login or registration attempts per minute per IP to prevent brute-force attacks.
- JWT tokens expire after 7 days; there is no token refresh mechanism in the current version.

---

## 4. Stakeholders

| Stakeholder          | Interest                          | Influence |
|----------------------|------------------------------------|-----------|
| Group members        | Accurate shared costs             | High      |
| Group admins         | Membership and data oversight     | High      |
| Course evaluator     | Evidence of engineering practice  | High      |
| Development team     | Deliverable quality and learning  | High      |
| Future maintainers   | Clear design and tests            | Medium    |

---

## 5. Requirements Specification

### Functional Requirements

- User registration and login.
- Group creation and member addition.
- Expense CRUD operations.
- Split validation (equal, exact, percentage).
- Balance calculation and debt simplification.
- Settlement recording.
- Activity log and dashboard summaries.

### Non-Functional Requirements

- bcrypt password hashing.
- JWT-based authentication.
- Validated input.
- Dockerized PostgreSQL.
- Balance invariants.

---

## 6. System Design

The system is a browser-based SPA (Single Page Application) that communicates with an Express REST API. The backend uses Prisma for database access, and balances are computed dynamically from expenses and settlements to prevent stale data.

---

## 7. Technology Stack

| Layer       | Choice               | Justification                          |
|-------------|----------------------|----------------------------------------|
| Frontend    | React/Vite/Axios     | Fast SPA and API integration.          |
| Backend     | Node.js/Express      | Small REST service with clear routes.  |
| Validation  | Zod                  | Declarative input contracts.           |
| Database    | PostgreSQL/Prisma    | Dockerized relational persistence.     |
| Security    | bcrypt/JWT/helmet    | Password hashing and protected routes. |
| Tests       | Vitest/Supertest     | Fast unit and API-oriented testing.    |

---

## 10. Implementation progress

Verified backend capabilities in the current repository include authentication, group membership and authorization, expense CRUD, deterministic split validation, balance calculation, debt simplification, settlement support, activity, dashboard summaries, and service-level tests. The current frontend implements a live registration-to-group-to-expense-to-balance workflow.

The frontend supports equal, exact, and percentage split input flows, expense editing/deletion, settlement recording, balance views, activity, and dashboard summaries.

## 11. Testing performed

On 30 September 2026, `npm test` completed successfully with 157 server tests and 22 client tests passing (179 total). `npm run lint` and `npm run build` also completed successfully. The server tests run against the isolated `expenseease_test` PostgreSQL database.

## 12. Project-management status

The project uses an iterative and incremental SDLC: requirements and design establish a traceable baseline, then each working increment is implemented, integrated, tested, and reviewed before the next increment. The completed increments are authentication/group workflows, expense/split workflows, and balance/settlement/dashboard workflows. This approach provided working software early, controlled change through scoped increments, and used automated tests and screenshots as validation evidence.

The project-management documents contain the live status and discovered risks. Git history confirms implemented backend services and frontend authentication, equal/exact/percentage splits, settlement, and group workflows. Each of the four members has an equal 25% contribution spanning frontend and backend work; the primary ownership record is in `Task_Allocation.md` and `Contribution_Record.md`.

## 13. Individual contribution table

| Member         | Tasks done | Modules / commits | Percentage |
| -------------- | ---------- | ----------------- | ---------- |
| Shreeya Srivastava (20243267) | Group and membership integration | Group/group-data APIs, membership rules, group UI, tests, documentation review | 25% |
| Shraddha Sharma (20243266) | Authentication requirements and integration | Auth API, validation, JWT, registration/login UI, tests, README review | 25% |
| Rudransh Pratap Singh (20243243) | Expense and split integration | Expense APIs, split validation, expense/activity UI, tests, test-case review | 25% |
| Sachit Jain (20243245) | Balance and settlement integration | Balance/debt/settlement APIs, dashboard/balance UI, Docker verification, evidence, demo preparation | 25% |

## 14. Challenges faced and solutions attempted

The project addressed deterministic rounding by allocating leftover paise in ascending user-id order. Simplification matches the largest creditor and debtor deterministically. Authorization is enforced through membership and creator/admin checks. Balance consistency is maintained by calculating from records rather than storing a cached balance. Prisma Client generation is included in the Docker build and setup workflow, and the authentication suite now passes.

## 15. Remaining-semester work

Capture screenshots and verified test evidence, complete truthful team/project-management details, record and publish the demo video, export required PDFs, improve accessibility and responsiveness, and prepare the final submission package.

## 16. References

1. Prisma Documentation, https://www.prisma.io/docs
2. Express Documentation, https://expressjs.com/
3. React Documentation, https://react.dev/
4. OWASP Top 10, https://owasp.org/www-project-top-ten/
5. Ian Sommerville, Software Engineering.
6. Course lecture material: Life Cycle Models; Incremental, Iterative and Prototyping Development Models; Requirements Validation, Traceability and Change Management; Software Design Principles; Software Testing.

## Appendix A. AI-use disclosure

See AI_USAGE_DISCLOSURE.md. Students must complete the verification/modification column honestly and remain responsible for correctness, security, and originality.
