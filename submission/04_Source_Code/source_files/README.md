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
