# ExpenseEase

ExpenseEase is a local web app for recording shared expenses and calculating deterministic balances. The current app supports registration and login, group creation and membership, equal/exact/percentage split expenses, expense editing and deletion, balance views, settlement recording, activity tracking, and a cross-group dashboard summary.

## Run with Docker (recommended)

Install Docker Desktop, then run this from the repository root:

```bash
docker compose up --build
```

Open `http://localhost:3001`. This starts the React application and Express API in one container and PostgreSQL 16 in a separate persistent container. Prisma migrations run automatically before the API starts. Stop it with `docker compose down`; add `-v` only when you intentionally want to delete the PostgreSQL data volume.

## Requirements for local development

- Node.js 20 or newer
- npm 10 or newer

## Run locally

From the repository root:

```bash
npm install
cp server/.env.example server/.env
npm run setup
npm run dev
```

Start PostgreSQL first with `docker compose up db -d`, then run `npm run setup`. The API serves on `http://localhost:3001` and the web app on `http://localhost:5173`.

For a ready-to-use local demonstration, run `npm run seed`. It creates fictional local-only accounts, a demo group, three expense split types, and a settlement. Account details, sample API inputs, and expected results are in [`../sample_data/README.md`](../sample_data/README.md).

To create the schema manually:

```bash
npm run db:migrate -w server
```

## Quality checks

Run these from the repository root:

```bash
npm test
npm run lint
npm run build
```

`npm test` runs the server suite against the isolated `expenseease_test` PostgreSQL database and then the client suite. Start Docker first and use `TEST_DATABASE_URL` to override its connection string if needed. The test setup resets only that test database; never point `TEST_DATABASE_URL` at a database containing data you want to keep.

For a database volume that was created before this test database was added, create it once:

```bash
docker compose exec db psql -U expenseease -d postgres -c "CREATE DATABASE expenseease_test;"
```

## Design notes

- Money is stored as integer paise. Rounding happens only in the split calculation services, and each split type is covered by tests that prove the shares sum to the stored amount.
- Percentage splits accept whole numbers only and must total exactly 100.
- Passwords are hashed with bcrypt. Every protected route requires a valid JWT, and group data is scoped to the caller's membership.
- The API returns `{ "error": { "code", "message" } }` for failures. Validation problems use 4xx codes; unexpected failures return a generic 500 so internals are not leaked to clients.

## Project overview

ExpenseEase is a full-stack group-expense management system created for the Software Engineering Project Management (SEPM) submission. It helps a group record shared spending, calculate what each member owes, and settle debts with fewer transfers.

### Objectives

- Make shared expenses easy to record and review.
- Support fair equal, exact, and percentage-based splits.
- Keep financial calculations accurate by storing money in integer paise.
- Show every member's balance and suggested settlement transfers.
- Protect group data through authentication and group-membership authorization.
- Provide an environment that any evaluator can run consistently with Docker.

## Implemented functionality

| Area | What the system provides |
| --- | --- |
| Authentication | Account registration, login, bcrypt password hashing, JWT-based sessions, and protected API routes |
| Group management | Group creation, group membership, and admin/member roles |
| Expense management | Create, edit, and delete expenses with payer, description, category, date, and amount |
| Expense splitting | Equal, exact, and percentage split modes with validation that all shares total the expense amount |
| Financial insight | Group balances, overall dashboard totals, and deterministic simplified debt transfers |
| Settlement workflow | Record settlements between members and update balances accordingly |
| Audit trail | Activity records for significant actions in a group |
| Quality | Validation, authorization, structured API errors, automated tests, linting, and production builds |

## Architecture and source layout

ExpenseEase uses a React client, an Express API, and PostgreSQL managed through Prisma.

```text
React client
    |
    | HTTP / JSON
    v
Express API
    |-- routes, controllers, and middleware
    |-- authentication, validation, and business services
    v
Prisma ORM -> PostgreSQL
```

```text
source_files/
├── client/                 React UI, API client, styles, and client tests
├── server/                 Express API and automated server tests
│   ├── prisma/             Schema, migrations, and seed data
│   └── src/                Routes, controllers, middleware, and services
├── docker/                 PostgreSQL initialization configuration
├── Dockerfile              Production image definition
├── docker-compose.yml      Local application and database environment
└── package.json            Workspace scripts
```

### Core data model and calculation rules

The database uses `User`, `Group`, `GroupMember`, `Expense`, `ExpenseSplit`, `Settlement`, and `Activity` entities. Each expense records a payer and one or more split records. Balances are calculated from expense splits and recorded settlements.

- Values are stored as integer paise to avoid floating-point errors.
- Equal splits distribute remainders deterministically.
- Exact split values must add up to the expense amount.
- Percentage values must be whole numbers and total exactly 100.
- The sum of all balances in a group is zero.
- Settlement suggestions reduce transfers by matching debtors to creditors in a deterministic order.

## SDLC plan and execution

The team followed an iterative and incremental SDLC. Each feature increment was taken through requirements clarification, design, implementation, integration, testing, review, and documentation before the next workflow was added. This delivered a usable core early, then expanded it without losing test coverage.

| Phase | Planned work | ExpenseEase result |
| --- | --- | --- |
| 1. Initiation and planning | Define problem, scope, stakeholders, constraints, risks, roles, and timeline | Shared-expense management was selected as the project problem; first release scope was limited to local, single-currency INR use |
| 2. Requirements analysis | Capture functional and non-functional requirements, user stories, and acceptance criteria | Requirements cover secure access, groups, expenses, splits, balances, and settlements |
| 3. System design | Design architecture, database, API boundaries, UML diagrams, and wireframes | React-Express-PostgreSQL architecture, Prisma schema, wireframes, and UML diagrams were prepared |
| 4. Increment 1 | Implement access and membership workflows | Registration, login, protected endpoints, group creation, and membership checks were completed |
| 5. Increment 2 | Implement expense recording and split calculations | Expense CRUD and equal, exact, and percentage splits were completed and tested |
| 6. Increment 3 | Implement financial and activity workflows | Balances, debt simplification, settlements, dashboard, and activity history were completed |
| 7. Verification | Execute automated tests, linting, build, and workflow review | Server, API integration, client, lint, and production build checks support the completed workflows |
| 8. Release preparation | Package source, documentation, test evidence, Docker setup, and demo materials | Submission source code, Docker configuration, seed data, screenshots, and supporting documentation were prepared |

### Increment milestones

| Increment | Goal | Acceptance criteria |
| --- | --- | --- |
| Increment 1 | Secure access to a group space | A user can register and log in; unauthenticated users cannot access protected data; group members are authorized |
| Increment 2 | Accurate expense records | All split modes validate and the stored shares equal the original expense amount |
| Increment 3 | Clear debt settlement | Balances reconcile to zero, suggested transfers are stable, and settlements update the financial position |
| Increment 4 | Evaluation-ready system | The app starts with Docker; tests, lint, build, documentation, and evidence are available |

### Risk management

| Risk | Mitigation applied |
| --- | --- |
| Incorrect money calculations | Store money in paise, validate split totals, and test split and balance services |
| Unauthorized group access | Apply JWT authentication and membership checks on protected group routes |
| Inconsistent developer environments | Use Docker Compose, Prisma migrations, and seed data |
| Regression while adding features | Maintain unit, API integration, and client tests; run lint and build checks |
| Scope growth | Defer payments, OCR, mobile apps, recurring expenses, notifications, and multi-currency support |

## Testing strategy

| Test level | Coverage |
| --- | --- |
| Unit testing | Split calculations, balances, debt simplification, validation, errors, and money formatting |
| API integration testing | Authentication, groups, group data, expenses, and authorization boundaries |
| Client testing | Rendering, user interaction, and client utilities |
| Manual verification | Submission screenshots demonstrate the main user workflows |

The root test command runs the server suite before the client suite. The server tests use an isolated `expenseease_test` database. Set `TEST_DATABASE_URL` only to a disposable database because the test setup resets that database before execution.

## Security and reliability decisions

- Passwords are hashed with bcrypt and are never stored in plain text.
- Protected routes require a valid JWT.
- Group records are available only to authenticated group members.
- Zod validates request data before business logic executes.
- Helmet adds security-related HTTP headers and rate limiting protects API endpoints.
- API errors use a consistent `{ "error": { "code", "message" } }` response shape.
- Unexpected errors return a generic response so internal details are not exposed.
- Docker and database migrations make the local environment repeatable.

## Scope and future work

The current release is designed for local, single-currency INR shared-expense management. Payment processing, receipt OCR, mobile applications, recurring expenses, notifications, social login, and multi-currency support are outside the submitted scope.

Future work can include email verification, password reset, receipt uploads, exportable reports, recurring expense schedules, notifications, hosted deployment, and enhanced group administration.

## Submission contents

This folder contains the runnable source code and its configuration. The complete submission also includes the SRS, UML diagrams, architecture and database design, wireframes, project plan, risk register, contribution record, test evidence, and demo materials.
