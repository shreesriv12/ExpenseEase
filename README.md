# ExpenseEase

ExpenseEase is a full-stack web application for recording shared expenses and calculating deterministic group balances. It was developed for **Software Engineering & Project Management (CSN15101)**.

## Team

| Member | Registration number |
| --- | --- |
| Shreeya Srivastava | 20243267 |
| Shraddha Sharma | 20243266 |
| Rudransh Pratap Singh | 20243243 |
| Sachit Jain | 20243245 |

**Instructor:** Dr. Satarupa Chakrabarti

## Features

- Account registration and JWT-protected login
- Group creation and membership management
- Expense creation, editing, and deletion
- Equal, exact, and percentage expense splits
- Deterministic balance calculation and debt simplification
- Settlement recording and activity history
- Cross-group dashboard summaries
- Dockerized Express, React, Prisma, and PostgreSQL setup

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Axios |
| Backend | Node.js, Express, Zod |
| Database | PostgreSQL 16, Prisma ORM |
| Security | bcrypt, JWT, Helmet |
| Testing | Vitest, Supertest |
| Deployment | Docker Compose |

## Run with Docker (recommended)

Install Docker Desktop, then run this from the repository root:

```bash
docker compose up --build
```

Open `http://localhost:3001`. This starts the React application and Express API in one container and PostgreSQL 16 in a separate persistent container. Prisma migrations run automatically before the API starts. Stop it with `docker compose down`; add `-v` only when you intentionally want to delete the PostgreSQL data volume.

The application intentionally starts with no demo accounts or expenses. Register users, create a group, and add registered members by email.

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

The app starts with no accounts or expenses. Create an account from the registration screen, then create a group and add registered members by email.

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

Latest verified result: **179 automated tests passed** (157 server tests and 22 client tests), along with lint and production-build checks.

## Design notes

- Money is stored as integer paise. Rounding happens only in the split calculation services, and each split type is covered by tests that prove the shares sum to the stored amount.
- Percentage splits accept whole numbers only and must total exactly 100.
- Passwords are hashed with bcrypt. Every protected route requires a valid JWT, and group data is scoped to the caller's membership.
- The API returns `{ "error": { "code", "message" } }` for failures. Validation problems use 4xx codes; unexpected failures return a generic 500 so internals are not leaked to clients.

## Project materials

The mid-semester submission material is organized in `submission/`:

```text
01_Report/                 Project report and AI-use disclosure
02_Requirements/           SRS and user stories
03_Design/                 Architecture, database, UML, and wireframes
04_Source_Code/            Clean source-code snapshot and sample configuration
05_Testing/                Test cases and UI/test evidence
06_Project_Management/     Plan, contribution record, meetings, risks, and Git history
07_Demo/                   Demo-video link file
```

Before final submission, replace the group-number/section placeholders and add a verified view-only demo-video URL.
