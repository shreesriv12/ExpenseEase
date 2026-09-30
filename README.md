# ExpenseEase

A web-based collaborative expense management system for groups. Members record shared expenses, split them in different ways, see who owes whom, and record settlements. All balance calculations are deterministic, so the same inputs always produce the same balances.

> Course: Software Engineering and Project Management, MNNIT Allahabad
> Deliverable: Mid-Semester Evaluation (20 marks)

---

## 1. Features

| ID | Feature | Status |
|----|---------|--------|
| F1 | User login | Done |
| F2 | Group browsing | Done |
| F3 | Add expense with **equal** split | Done |
| F4 | Add expense with **exact-amount** split | Done |
| F5 | Add expense with **percentage** split | Done |
| F6 | Balance view (per member, per group) | Done |
| F7 | Settlement recording | Done |
| F8 | Activity tracking (audit trail) | Done |
| F9 | Debt simplification | Planned / in progress |

---

## 2. Tech Stack

- **Runtime:** Node.js 20+
- **Frontend:** `client/`
- **Backend:** `server/`
- **Database:** SQLite, accessed through Prisma ORM
- **Tooling:** npm scripts for test, lint and build (run from the repo root)

---

## 3. Repository Structure

```
ExpenseEase/
├── client/                     # Frontend application
├── server/                     # Backend API, Prisma schema, seed script
├── docs/                       # SRS, design documents, diagrams, reports
├── AI_USAGE_DISCLOSURE.md      # Declaration of AI tool usage
├── SUBMISSION_CHECKLIST.md     # Mid-sem submission checklist
├── package.json                # Root scripts (dev, test, lint, build)
└── README.md
```

---

## 4. Getting Started

### Prerequisites
- Node.js 20 or later
- npm

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp server/.env.example server/.env

# 3. Create the SQLite schema
cd server
npm exec prisma migrate dev --name init

# 4. Seed sample data
npm run seed
cd ..

# 5. Start the app
npm run dev
```

### Quality commands (run from the repository root)

```bash
npm test        # run automated tests
npm run lint    # static code checks
npm run build   # production build
```

---

## 5. Software Engineering Process

### 5.1 Lifecycle model
The project follows a **hybrid of Prototyping and Incremental development**:

- **Prototyping** was used first for unclear workflows (group creation, split entry, settlement flow), to collect feedback before fixing the requirements.
- **Incremental delivery** was used for the build. Each increment delivers a working slice.

| Increment | Scope |
|-----------|-------|
| 1 | Authentication, groups, group browsing |
| 2 | Expense creation with equal, exact and percentage splits |
| 3 | Balance calculation and balance views |
| 4 | Settlement recording and activity tracking |
| 5 | Debt simplification, reports, hardening |

**Why this model:** requirements were partly clear (splitting rules) and partly unclear (UI flow). Early working software was needed, and the system divides naturally into modules.

### 5.2 Requirements (SRS summary)
Full SRS: `docs/`. Requirements follow the pattern *"When [condition], the system shall [behaviour], with [measurable result]."*

**Functional**

| ID | Requirement |
|----|-------------|
| FR-AUTH-01 | The system shall allow a registered user to log in with valid credentials and reject invalid credentials with an error message. |
| FR-GRP-01 | The system shall let an authenticated user view the groups they belong to. |
| FR-EXP-01 | The system shall let a group member record an expense with payer, amount, description and participants. |
| FR-EXP-02 | For an equal split, the system shall divide the amount among participants so that the shares sum exactly to the total. |
| FR-EXP-03 | For an exact split, the system shall reject the expense if the entered shares do not sum to the total. |
| FR-EXP-04 | For a percentage split, the system shall reject the expense if the percentages do not sum to 100. |
| FR-BAL-01 | The system shall compute each member's net balance in a group as total paid minus total owed. |
| FR-SET-01 | The system shall record a settlement between two members and update both balances. |
| FR-ACT-01 | The system shall log every expense and settlement action in an activity feed. |

**Non-functional**

| ID | Requirement |
|----|-------------|
| NFR-PERF-01 | Balance views shall load within 2 seconds for a group of up to 50 members and 1,000 expenses. |
| NFR-SEC-01 | Passwords shall be stored using salted hashing, never as plain text. |
| NFR-REL-01 | Balance calculation shall be deterministic: identical inputs always give identical outputs. |
| NFR-MNT-01 | Business logic shall be separated from UI and data access to support unit testing. |

### 5.3 Architecture and design
Layered architecture, with responsibilities separated to give high cohesion and low coupling:

```
Client (UI)
   │  HTTP / JSON
Server API (routes / controllers)
   │
Service layer (split logic, balance logic, settlement logic)
   │
Data access (Prisma ORM)
   │
SQLite database
```

- **UI never touches the database directly.**
- **Split and balance logic** lives in the service layer, independent of HTTP and the database, so it is unit-testable.
- **Information hiding:** clients call operations such as "add expense" and "get balances". They do not know the storage schema.

**Core entities:** `User`, `Group`, `Membership`, `Expense`, `ExpenseShare`, `Settlement`, `Activity`.

### 5.4 Traceability (excerpt)

| Need | Requirement | Design element | Test |
|------|-------------|----------------|------|
| Split bills fairly | FR-EXP-02 | Equal-split service | Unit test: shares sum to total |
| Prevent wrong entries | FR-EXP-03 / 04 | Split validators | Unit test: invalid sums rejected |
| Know who owes what | FR-BAL-01 | Balance service | Unit test: net balances sum to zero |
| Clear debts | FR-SET-01 | Settlement service | Integration test: balances update |

A full RTM is in `docs/`.

### 5.5 Testing and verification
- **Unit tests:** split calculation, balance calculation, validators.
- **Integration tests:** API routes against a test database.
- **Verification vs validation:** requirement reviews and code reviews check that we built it correctly. Demos and walkthroughs check that we built the right thing.
- **Quality gates:** `npm test`, `npm run lint` and `npm run build` must pass before merging.

### 5.6 Configuration and change management
- Git for version control, with small focused commits.
- Requirement changes are recorded with reason, impact and approval, and the SRS and traceability links are updated.
- The main branch is kept in a buildable, testable state.

---

## 6. Core Logic Explained

### 6.1 Split types

Every expense has a total amount and a set of participants. The split type decides each participant's share.

**Equal split**
```
share = total / number_of_participants
```
Money is handled in the smallest currency unit (e.g. paise) as integers to avoid floating-point errors. If the total does not divide evenly, the leftover units are distributed one each to the first participants in a fixed order. This keeps the result deterministic and ensures the shares always sum exactly to the total.

Example: 100 split among 3 → 34, 33, 33.

**Exact split**
Each participant's share is entered by the user. Validation: `sum(shares) == total`, otherwise the request is rejected.

**Percentage split**
Each participant's percentage is entered. Validation: `sum(percentages) == 100`. Then `share = total × percentage / 100`, with the same rounding-remainder rule as the equal split.

### 6.2 Balance calculation

For each member in a group:

```
net_balance = total_paid − total_owed ± settlements
```

- **Positive** balance: the group owes this member.
- **Negative** balance: this member owes the group.
- **Invariant:** the sum of all net balances in a group is always 0. This is used as a test oracle.

### 6.3 Settlements

A settlement records that member A paid member B. It is treated as a payment that reduces A's debt and B's credit, so balances update without editing past expenses. The original expense history stays intact for audit.

### 6.4 Debt simplification (minimising transactions)

Instead of every member paying every creditor, reduce the number of transfers:

```
1. Compute the net balance of each member.
2. Split members into debtors (balance < 0) and creditors (balance > 0).
3. Repeat until all balances are 0:
     a. Take the largest debtor and the largest creditor.
     b. Transfer min(|debtor|, creditor) from debtor to creditor.
     c. Update both balances and drop anyone now at 0.
```

**Why greedy:** it is simple, deterministic, and produces at most `n − 1` transactions for `n` members with non-zero balances. Finding the true minimum is NP-hard, so this is a practical approximation.

**Example:** A owes 50, B owes 30, C is owed 80 → A→C 50, B→C 30 (2 transfers instead of a full mesh).

### 6.5 Activity tracking

Every create/settle action writes an `Activity` record (who, what, when). This gives a read-only audit trail and supports traceability of balance changes.

---

## 7. Project Management

### 7.1 Work breakdown structure

```
ExpenseEase
├── Requirements and analysis (SRS, use cases)
├── Design (architecture, data model, interfaces)
├── Implementation
│   ├── Auth and groups
│   ├── Expenses and splits
│   ├── Balances and settlements
│   └── Activity feed
├── Quality (tests, lint, reviews)
└── Delivery (docs, README, submission)
```

### 7.2 Estimation
Two methods were used and compared:

- **Function Points:** count inputs, outputs, inquiries, files and interfaces, apply weights to get UFP, then multiply by the technical complexity factor (`TCF = 0.65 + 0.01 × DI`).
- **Basic COCOMO (organic mode):**
  `Effort = 2.4 × (KLOC)^1.05` person-months
  `Tdev = 2.5 × (Effort)^0.38` months

Fill in with the project's own numbers: `KLOC = <value>`, `Effort = <value> PM`, `Tdev = <value> months`, `Adjusted FP = <value>`.

### 7.3 Schedule
Activities were sequenced with dependencies and durations estimated with three-point (PERT) estimates, `te = (O + 4M + P) / 6`. The critical path was found with forward and backward passes. See `docs/` for the network diagram.

### 7.4 Risk register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Rounding errors in splits | Wrong balances | Integer money units, deterministic remainder rule, invariant tests |
| Changing requirements | Rework | Incremental delivery, controlled change process |
| Team availability | Schedule slip | Small increments, shared ownership of modules |
| Integration failures | Late defects | Incremental integration, tests on every change |

---

## 8. Team

 Name 
| `Shreeya Srivastava 20243267` |
| `Shraddha Sharma 20243266` |
| `Rudransh Pratap Singh 20243243` |
| `Sachit Jain 20243245` |

---

## 9. Documentation Index

| Document | Location |
|----------|----------|
| SRS, design, diagrams, reports | `docs/` |
| Submission checklist | `SUBMISSION_CHECKLIST.md` |
| AI usage disclosure | `AI_USAGE_DISCLOSURE.md` |
| Mid-sem master plan | `ExpenseEase_Complete_MidSem_Master_Plan.pdf` |

---

## 10. Academic Integrity

AI tool usage is declared in `AI_USAGE_DISCLOSURE.md`.
