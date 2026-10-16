# ExpenseEase 💸

**ExpenseEase** is a full-stack web application for managing shared expenses, calculating group balances, and tracking repayments. Developed as part of the **Software Engineering & Project Management (CSN15101)** project at Motilal Nehru National Institute of Technology Allahabad (MNNIT Allahabad), it helps friends, flatmates, travel groups, and project teams manage shared spending transparently.

The application allows users to create groups, record expenses, divide costs using different splitting strategies, view balances, and record settlements. Its financial calculations use integer paise and deterministic rounding rules to ensure consistent, verifiable results.

## 🌐 Live Application

- **Frontend:** [Open ExpenseEase](https://expense-ease-cd1h43z6n-shreeya-srivastavas-projects.vercel.app/)
- **Backend API:** [ExpenseEase API on Render](https://expenseease-api-r8sx.onrender.com)
- **API Health Check:** [Check API status](https://expenseease-api-r8sx.onrender.com/api/health)
- **GitHub Repository:** [shreesriv12/ExpenseEase](https://github.com/shreesriv12/ExpenseEase)

The API health endpoint returns the following response when the service is available:

```json
{
  "ok": true
}
```

> **Note:** The live application depends on external hosting services. Availability may be affected by cold starts or service configuration. Use fictional demonstration data rather than sensitive financial information.

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Features](#-features)
3. [Technology Stack](#-technology-stack)
4. [System Architecture](#-system-architecture)
5. [Repository Structure](#-repository-structure)
6. [Run with Docker](#-run-with-docker-recommended)
7. [Local Development](#-local-development)
8. [Environment Variables](#-environment-variables)
9. [Demo Data](#-demo-data)
10. [Expense Splitting Algorithms](#-expense-splitting-algorithms)
11. [Balance Calculation and Debt Simplification](#-balance-calculation-and-debt-simplification)
12. [Database Design](#-database-design)
13. [API Overview](#-api-overview)
14. [Security and Reliability](#-security-and-reliability)
15. [Testing and Quality Assurance](#-testing-and-quality-assurance)
16. [Software Development Life Cycle](#-software-development-life-cycle-sdlc)
17. [Deployment](#-deployment)
18. [Scope and Future Enhancements](#-scope-and-future-enhancements)
19. [Team Members](#-team-members)
20. [Project Documentation](#-project-documentation)

---

## 📌 Project Overview

### Problem Statement

Managing shared expenses manually can be difficult. In groups of friends, flatmates, or travellers, different members pay for food, transport, accommodation, and other shared purchases. Keeping track of payments in chat messages or spreadsheets often results in:

- Missing or incomplete expense records.
- Incorrect manual calculations.
- Confusion about who owes whom.
- Multiple unnecessary repayment transactions.
- Difficulty verifying how a balance was calculated.

### Proposed Solution

ExpenseEase provides a centralized ledger for group expenses. Users can record payments, define how expenses should be divided, review individual balances, and record repayments.

The system is designed around three principles:

1. **Accuracy:** monetary calculations use integer paise rather than floating-point arithmetic.
2. **Transparency:** expense splits and balance calculations follow explicit rules.
3. **Consistency:** identical financial inputs produce deterministic results.

### Project Objectives

- Simplify the recording and management of shared expenses.
- Support equal, exact-amount, and percentage-based splits.
- Calculate balances accurately and consistently.
- Reduce unnecessary settlement transactions.
- Protect group data through authentication and authorization.
- Provide a reproducible development and evaluation environment using Docker.

---

## ✨ Features

| Module | Functionality |
|---|---|
| Authentication | User registration, login, password hashing, and JWT-based authentication |
| Group management | Create groups, view groups, and manage group membership |
| Roles and permissions | Administrator/member roles and membership-based access control |
| Expense management | Create, view, edit, and delete expenses |
| Equal splitting | Divide an expense as evenly as possible |
| Exact splitting | Specify each participant's exact share |
| Percentage splitting | Allocate expenses using whole-number percentages |
| Balance calculation | Calculate each member's net financial position |
| Debt simplification | Generate a deterministic list of suggested transfers |
| Settlement recording | Record repayments between group members |
| Activity tracking | Maintain a history of significant group actions |
| Dashboard | Display an overview of amounts owed and amounts receivable across groups |
| Request validation | Validate API inputs before processing |
| Error handling | Return structured API errors without exposing unexpected internal details |
| Developer tooling | Docker Compose, Prisma migrations, seed scripts, tests, linting, and production builds |

### User Roles

- **Group administrator:** A user who creates a group becomes its administrator and can add registered users by email.
- **Group member:** An authenticated member can access the group data permitted by the application.
- **Expense creator:** Can edit or delete their own expenses, subject to server-side authorization rules.

Group membership and permissions are enforced by the backend rather than relying solely on the frontend.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React | Interactive user interface |
| Frontend tooling | Vite | Development server and production build |
| Routing | React Router | Client-side navigation |
| API client | Axios | HTTP requests to the backend |
| Backend | Node.js | JavaScript runtime |
| API framework | Express.js | REST API and middleware |
| Validation | Zod | Request validation |
| Database | PostgreSQL 16 | Relational data storage |
| ORM | Prisma | Database access, schema management, and migrations |
| Authentication | JSON Web Tokens (JWT) | Authenticated sessions |
| Password security | bcrypt | Password hashing |
| HTTP security | Helmet | Security-related HTTP headers |
| Cross-origin requests | CORS | Browser origin policy |
| Rate limiting | express-rate-limit | Protection against excessive authentication attempts |
| Testing | Vitest, Supertest, React Testing Library | Automated server and client tests |
| Containerization | Docker | Application packaging |
| Orchestration | Docker Compose | Local application and database services |
| Frontend hosting | Vercel | Hosted frontend |
| Backend hosting | Render | Hosted API |

---

## 🏗️ System Architecture

ExpenseEase uses a layered client-server architecture. The React frontend communicates with the Express API through HTTP requests with JSON data. The backend validates requests, enforces authorization, executes business logic, and accesses PostgreSQL through Prisma.

```text
┌────────────────────────────────┐
│        React + Vite Client     │
│                                │
│  Pages, forms, dashboard, UI   │
└───────────────┬────────────────┘
                │
                │ HTTP / JSON
                ▼
┌────────────────────────────────┐
│          Express API           │
│                                │
│ Routes, middleware, validation │
│ JWT authentication, errors     │
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│       Business Services        │
│                                │
│ Split logic, balances,         │
│ settlements, debt simplification│
└───────────────┬────────────────┘
                │
                │ Prisma ORM
                ▼
┌────────────────────────────────┐
│          PostgreSQL            │
│                                │
│ Users, groups, expenses,        │
│ splits, settlements, activity  │
└────────────────────────────────┘
```

### Architectural Principles

**Separation of concerns:** The frontend, API routes, business services, and database access have separate responsibilities.

**Server-side validation:** Frontend validation improves usability, but the backend independently validates incoming data.

**Derived balances:** Balances are calculated from expenses, expense splits, and settlements rather than stored as an independent source of truth.

**Deterministic calculations:** Fixed rounding and ordering rules help produce repeatable financial results.

**Database migrations:** Prisma migrations provide a versioned record of schema changes.

---

## 📂 Repository Structure

```text
ExpenseEase/
├── client/                    # React + Vite frontend
│   └── src/                   # UI, API client, styles, client tests
├── server/                    # Express backend and server tests
│   ├── prisma/
│   │   ├── migrations/        # Database migrations
│   │   ├── schema.prisma      # Prisma database schema
│   │   └── seed.js            # Demonstration data
│   └── src/                   # API routes and middleware
├── docker/
│   └── postgres/              # PostgreSQL initialization scripts
├── docs/                      # Requirements, design, diagrams, reports
├── sample_data/               # Demo account and expected-result guidance
├── submission/                # Academic submission materials
├── Dockerfile                 # Production container definition
├── docker-compose.yml         # App, database, migration services
├── package.json               # Root npm workspace scripts
├── package-lock.json          # Dependency lockfile
├── AI_USAGE_DISCLOSURE.md     # AI-use disclosure
├── SUBMISSION_CHECKLIST.md    # Submission checklist
└── README.md
```

---

## 🐳 Run with Docker (Recommended)

Docker Compose is the recommended way to run the complete application locally. It starts PostgreSQL, applies the database migrations, and runs the application.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine with Docker Compose.
- Git, if cloning the repository.

### 1. Clone the repository

```bash
git clone https://github.com/shreesriv12/ExpenseEase.git
cd ExpenseEase
```

### 2. Start the application

From the repository root, run:

```bash
docker compose up --build
```

Once the containers are ready, open:

**http://localhost:3001**

Docker Compose starts three services:

| Service | Responsibility |
|---|---|
| `db` | PostgreSQL 16 database with persistent storage |
| `migrate` | Applies the checked-in Prisma migrations |
| `app` | Serves the production-built React frontend and Express API |

### 3. Stop the application

```bash
docker compose down
```

The database volume is retained when containers are stopped.

To remove the containers and intentionally delete the local database volume:

```bash
docker compose down -v
```

> **Warning:** The `-v` option deletes the local database volume and its data. Do not use it if you need to preserve your local records.

The credentials in Docker Compose are intended for local development only. Never reuse them as production credentials.

---

## 💻 Local Development

This setup runs the React frontend and Express API on your computer while PostgreSQL runs in Docker.

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Docker for PostgreSQL

### 1. Install dependencies

```bash
git clone https://github.com/shreesriv12/ExpenseEase.git
cd ExpenseEase
npm ci
```

### 2. Start PostgreSQL

```bash
docker compose up db -d
```

The local database is exposed on port `5432`.

### 3. Configure environment variables

Copy the example environment file.

**macOS, Linux, or Git Bash:**

```bash
cp server/.env.example server/.env
```

**Windows PowerShell:**

```powershell
Copy-Item server/.env.example server/.env
```

Review `server/.env`. It contains the configuration used by the backend. Replace the example JWT secret with a unique, randomly generated development secret.

### 4. Apply migrations and seed the database

```bash
npm run setup
```

The setup script generates Prisma Client, applies the checked-in migrations, and seeds demonstration data.

To apply database migrations without running the complete setup:

```bash
npm run db:migrate -w server
```

### 5. Start the frontend and backend

```bash
npm run dev
```

This command starts both npm workspaces.

| Component | Local address |
|---|---|
| React frontend | http://localhost:5173 |
| Express API | http://localhost:3001 |
| API health check | http://localhost:3001/api/health |
| PostgreSQL | localhost:5432 |

During development, Vite proxies requests under `/api` to the Express backend.

### Useful Commands

```bash
# Start only the backend
npm run dev -w server

# Start only the frontend
npm run dev -w client

# Seed demonstration data
npm run seed

# Generate Prisma Client
npm run prisma:generate -w server

# Apply checked-in Prisma migrations
npx prisma migrate deploy --schema=server/prisma/schema.prisma
```

---

## ⚙️ Environment Variables

The backend reads configuration from `server/.env` during local development. In production, environment variables should be configured through the hosting provider.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs |
| `PORT` | No | Backend port; defaults to `3001` |
| `CORS_ORIGIN` | No | Allowed browser frontend origin |
| `AUTH_RATE_LIMIT_MAX` | No | Authentication rate limit; defaults to 20 per minute |
| `VITE_API_URL` | For separate frontend/backend hosts | API base URL embedded in the Vite build |

Example local configuration:

```env
DATABASE_URL="postgresql://expenseease:expenseease@localhost:5432/expenseease?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
```

Use these values only for a local development database.

### Important configuration notes

- `VITE_API_URL` is embedded when the frontend is built. Redeploy the frontend after changing it.
- For the hosted frontend, set `VITE_API_URL` to the backend API base URL ending in `/api`.
- Set `CORS_ORIGIN` to the exact browser-facing frontend origin, without a trailing slash.
- Keep database URLs, passwords, JWT secrets, and access tokens out of Git.
- If a secret is exposed, rotate it immediately.

---

## 🧪 Demo Data

To seed demonstration records locally:

```bash
npm run seed
```

The seed script creates fictional demonstration accounts, a group, sample expenses using the supported split types, and a settlement.

Use the demo data for local development and evaluation only. Avoid running seed scripts against a production database containing real user data.

Refer to [`sample_data/README.md`](sample_data/README.md) for demonstration accounts, example API inputs, and expected results, if that file is included in your checkout.

---

## 🧮 Expense Splitting Algorithms

ExpenseEase supports three split strategies. Each strategy must allocate exactly the recorded expense amount.

Money is represented using **integer paise** to avoid floating-point arithmetic errors.

One rupee equals 100 paise.

### 1. Equal Split

The expense is divided as evenly as possible among the selected participants.

```text
base      = floor(totalPaise / participantCount)
remainder = totalPaise mod participantCount
```

The first `remainder` participants receive one extra paisa. The remaining participants receive `base` paise each.

**Example:** ₹100.00 divided among three participants:

| Participant | Share |
|---|---:|
| Participant 1 | ₹33.34 |
| Participant 2 | ₹33.33 |
| Participant 3 | ₹33.33 |
| **Total** | **₹100.00** |

The extra paisa is assigned using a fixed user-ID order, making the result deterministic.

### 2. Exact-Amount Split

Each participant's share is entered manually.

The server validates:

```text
sum(participantSharesPaise) = totalExpensePaise
```

If the sum of the shares does not equal the expense amount, the request is rejected.

### 3. Percentage Split

Each participant receives a whole-number percentage of the expense.

The validation rules are:

- Percentages must be whole numbers.
- All participant percentages must total exactly 100.
- Calculated shares must add up to the expense amount.
- Any leftover paise are distributed using the deterministic remainder rule.

For example, a `40% / 35% / 25%` allocation is valid, whereas `40% / 35% / 24%` is invalid.

### Calculation Guarantees

- Every valid split sums to the complete expense amount.
- Exact shares must equal the recorded total.
- Percentage allocations must total 100%.
- Integer paise avoids floating-point representation errors.
- Remainder allocation follows a deterministic rule.
- Split calculation services are covered by automated tests.

---

## 💰 Balance Calculation and Debt Simplification

Balances are derived from the amount each member paid, the amount allocated to that member, and recorded settlements.

Conceptually:

```text
net balance = total paid - total owed + settlement adjustments
```

Interpretation:

- **Positive balance:** Other group members collectively owe this member.
- **Negative balance:** This member owes other group members.
- **Zero balance:** The member has no outstanding net amount.

### Balance Invariant

For a valid group ledger:

```text
sum(all member net balances) = 0
```

This invariant is used in tests to identify calculation or reconciliation errors.

### Debt Simplification

ExpenseEase uses a deterministic greedy approach to propose settlement transfers:

1. Calculate the net balance of every member.
2. Separate members with negative balances (debtors) from those with positive balances (creditors).
3. Match a debtor with a creditor.
4. Propose a transfer equal to the smaller of the debtor's outstanding amount and the creditor's receivable amount.
5. Update both balances and repeat until all balances are zero.

This approach reduces unnecessary transfers and produces a stable settlement plan. It is a practical approximation and does not guarantee the globally minimum number of transfers for every possible balance distribution.

### Settlement Recording

A settlement records a repayment between two group members. It updates the derived financial position without rewriting historical expenses.

Keeping expense records intact preserves the group's transaction history and makes it easier to review previous activity.

---

## 🗄️ Database Design

ExpenseEase uses PostgreSQL with Prisma ORM.

The main database entities are:

| Entity | Purpose |
|---|---|
| `User` | Stores registered account information, email, password hash, and creation timestamp |
| `Group` | Represents a shared-expense group and its creator |
| `GroupMember` | Connects users to groups and stores their roles |
| `Expense` | Stores expense description, amount, payer, creator, category, date, and split type |
| `ExpenseSplit` | Stores the share assigned to a participant for an expense |
| `Settlement` | Records payments between group members |
| `Activity` | Records significant group activity, including actor and timestamp |

### Database Design Principles

- PostgreSQL maintains relational data and relationships.
- Prisma manages database queries and schema migrations.
- Monetary values are stored as integer paise.
- Expense shares are linked to their corresponding expense.
- Group membership links users to the groups they can access.
- Balances are derived from financial records rather than stored separately.

The Prisma schema is located at:

`server/prisma/schema.prisma`

Database migrations are located at:

`server/prisma/migrations/`

---

## 🔌 API Overview

The backend exposes a JSON REST API. The exact endpoint paths and request schemas are defined in the server source code.

| Resource | Operations | Access |
|---|---|---|
| Health | Check API availability | Public |
| Authentication | Register and log in | Public, rate-limited |
| Groups | Create and list groups; access group details | Authenticated users with appropriate membership |
| Membership | Add registered users by email | Group administrator |
| Expenses | Create, view, edit, and delete expenses | Group members, with additional update/delete authorization |
| Balances | View balances and settlement suggestions | Group members |
| Settlements | Record and view repayments | Group members |
| Activity | Review group activity | Group members |
| Dashboard | View combined balances across groups | Authenticated user |

### Health Check

```http
GET /api/health
```

Successful response:

```json
{
  "ok": true
}
```

### Error Response Format

API errors use a consistent structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

Validation and authorization errors use appropriate client-error status codes. Unexpected server failures return a generic response rather than exposing internal implementation details.

---

## 🔐 Security and Reliability

ExpenseEase implements several measures to protect users and maintain data consistency.

### Authentication and Authorization

- Passwords are hashed with bcrypt rather than stored in plaintext.
- Protected routes require a valid JWT.
- Group membership checks restrict access to group data.
- Administrative operations require appropriate permissions.
- Expense modification and deletion are subject to server-side authorization.

### Input Validation

Zod schemas validate incoming requests before business logic runs. The server remains responsible for validating split totals, percentages, and other business constraints.

### API Protection

- Helmet configures security-related HTTP response headers.
- CORS restricts browser requests according to the configured frontend origin.
- Rate limiting reduces excessive registration and login attempts.
- Unexpected errors do not intentionally expose internal stack traces to clients.

### Production Security Checklist

1. Generate a unique, strong `JWT_SECRET`.
2. Keep the production database connection string private.
3. Set `CORS_ORIGIN` to the exact public frontend origin.
4. Store production secrets in Vercel and Render environment settings.
5. Rotate any database password or signing secret that has been exposed.
6. Use fictional records for public demonstrations.

---

## 🧪 Testing and Quality Assurance

Run these commands from the repository root:

```bash
npm test
npm run lint
npm run build
```

| Command | Purpose |
|---|---|
| `npm test` | Runs the server test suite followed by the client test suite |
| `npm run lint` | Runs ESLint checks for server and client code |
| `npm run build` | Builds the production frontend |
| `npm run test:coverage` | Runs server tests with coverage instrumentation |

The project documentation records a test run of **179 automated tests**: 157 server tests and 22 client tests, all passing in that recorded run. Re-run the quality checks against the current code before a new release or submission.

### Testing Strategy

| Test level | Focus |
|---|---|
| Unit testing | Split calculations, rounding, validation, balances, and debt simplification |
| API/integration testing | Authentication, group access, expense operations, and authorization |
| Client testing | Component rendering, form behaviour, and client utilities |
| Manual verification | Registration, groups, expenses, balances, settlements, and dashboard workflows |

### Important Test Invariants

- Split shares equal the complete expense amount.
- Repeated calculations produce deterministic results.
- All group net balances sum to zero.
- Recorded settlements reconcile with derived balances.
- Unauthorized access is rejected.
- Invalid requests return appropriate errors.

### Test Database Safety

Server tests use an isolated PostgreSQL database named `expenseease_test`.

The test setup resets that database. Therefore, `TEST_DATABASE_URL` must point only to a disposable test database, never to production or a database containing records you need to preserve.

For an older Docker database volume where the test database has not yet been created, run:

```bash
docker compose exec db psql -U expenseease -d postgres -c "CREATE DATABASE expenseease_test;"
```

Verify the destination before overriding the test connection string.

---

## 📋 Software Development Life Cycle (SDLC)

The project followed an **iterative and incremental development approach**, with prototyping used where early feedback was useful.

Each increment was intended to pass through requirements clarification, design, implementation, integration, testing, review, and documentation.

| Phase | Planned work | Outcome |
|---|---|---|
| Initiation and planning | Define problem, scope, stakeholders, constraints, and risks | Selected shared-expense management and scoped the initial release |
| Requirements analysis | Define functional and non-functional requirements | Documented authentication, groups, expenses, splits, balances, and settlements |
| System design | Design architecture, database, and API boundaries | Prepared the React, Express, PostgreSQL, and Prisma architecture |
| Increment 1 | Implement access and group workflows | Authentication, group creation, and membership authorization |
| Increment 2 | Implement expense recording and splitting | Expense CRUD and equal, exact, and percentage splits |
| Increment 3 | Implement financial workflows | Balances, settlements, activity history, and dashboard |
| Verification | Execute tests, linting, and builds | Automated quality checks and workflow validation |
| Release preparation | Prepare code, documentation, and demo material | Docker configuration, seed data, deployment, and submission documents |

### Risk Management

| Risk | Impact | Mitigation |
|---|---|---|
| Incorrect monetary calculations | Incorrect balances | Integer paise, deterministic rounding, validation, and tests |
| Unauthorized group access | Exposure of group data | JWT authentication and membership checks |
| Inconsistent developer environments | Setup failures | Docker Compose, lockfile, and Prisma migrations |
| Regression during development | Previously working features may break | Automated tests, linting, and production builds |
| Scope growth | Delays and incomplete verification | Incremental delivery and documented scope exclusions |

---

## ☁️ Deployment

The current hosted deployment uses Vercel for the frontend and Render for the backend.

### Frontend — Vercel

For a Vercel project whose root directory is the repository root, use the following settings:

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Root directory | Repository root (`./`) |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `client/dist` |
| Environment variable | `VITE_API_URL` set to the backend API URL ending in `/api` |

After changing frontend environment variables, trigger a new deployment so the values are included in the frontend build.

### Backend — Render

The backend is deployed on Render using the repository's Dockerfile.

Configure the following environment variables in Render:

| Variable | Guidance |
|---|---|
| `DATABASE_URL` | Connection string for the deployed PostgreSQL database |
| `JWT_SECRET` | Unique, strong signing secret |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | Exact Vercel frontend origin, without a trailing slash |
| `PORT` | Use the platform-provided port when supplied; otherwise the server defaults to `3001` |

### Database Migrations

Migrations are stored in `server/prisma/migrations`.

Apply checked-in migrations to the intended database before deploying code that depends on new tables or columns. Use Prisma's deployment migration command against the correct database.

Avoid running development migration commands against production without reviewing the migration plan. Never point test setup scripts at production data.

---

## 🚀 Scope and Future Enhancements

### Included in the Current Scope

- Browser-based shared-expense management.
- User registration and login.
- Group creation and membership.
- Expense creation, editing, and deletion.
- Equal, exact-amount, and percentage splits.
- Derived balances and settlement suggestions.
- Settlement recording and activity history.
- Cross-group dashboard summaries.
- INR-only monetary calculations.

### Deliberately Out of Scope

The current release excludes:

- Payment processing.
- Receipt OCR and file attachments.
- Recurring expenses.
- Email and push notifications.
- Social login.
- Native Android or iOS applications.
- Offline-first functionality.
- Multi-currency conversion.

Expense categories are entered as text rather than restricted to a fixed category taxonomy.

### Possible Future Enhancements

- Export expense summaries to CSV or PDF.
- Password reset and email verification.
- Receipt uploads and OCR-assisted expense entry.
- Recurring expenses and notifications.
- Group archiving and enhanced administration.
- Multi-currency support.
- Expanded reporting and spending visualizations.
- More end-to-end browser automation and performance testing.

---

## 👩‍💻 Team Members

**Course:** Software Engineering & Project Management (CSN15101)  
**Section:** E  
**Instructor:** Dr. Satarupa Chakrabarti  
**Institute:** Motilal Nehru National Institute of Technology Allahabad (MNNIT Allahabad)

| Team member | Registration number | Main contributions |
|---|---|---|
| Shreeya Srivastava | 20243267 | Group and membership integration, group UI, tests, documentation review |
| Shraddha Sharma | 20243266 | Authentication API, JWT integration, registration/login UI, tests, README review |
| Rudransh Pratap Singh | 20243243 | Expense APIs, split validation, expense/activity UI, tests, test-case review |
| Sachit Jain | 20243245 | Balance, debt and settlement APIs, dashboard/balance UI, Docker verification, demo preparation |

---

## 📚 Project Documentation

Additional project material is organized in the repository, where included:

- **`docs/`** — Requirements, architecture, database design, diagrams, and project reports.
- **`sample_data/README.md`** — Demonstration accounts, example data, and expected results.
- **`submission/`** — Organized academic submission material and testing evidence.
- **`SUBMISSION_CHECKLIST.md`** — Final submission preparation checklist.
- **`AI_USAGE_DISCLOSURE.md`** — Disclosure of AI-assisted drafting and review.

## 📄 License

No open-source license is specified in this README. Unless a `LICENSE` file is added, the source remains subject to the copyright owner's default rights. Do not assume the project is available for unrestricted reuse.
