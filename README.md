# ExpenseEase

ExpenseEase is a local web app for recording shared expenses and calculating deterministic balances. The current app supports registration and login, group creation and membership, equal/exact/percentage split expenses, expense editing and deletion, balance views, settlement recording, activity tracking, and a cross-group dashboard summary.

## Requirements

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

`npm run setup` creates the SQLite schema and loads the demo data. The API serves on `http://localhost:3001` and the web app on `http://localhost:5173`.

The demo accounts are `asha@demo.local` through `dev@demo.local`, each using the seed password `Demo@1234`.

To create the schema and seed data separately:

```bash
npm run db:migrate -w server
npm run seed
```

## Quality checks

Run these from the repository root:

```bash
npm test
npm run lint
npm run build
```

`npm test` runs the server suite against an isolated SQLite database (`server/prisma/test.db`, recreated on every run) and then the client suite. Server test files run sequentially so they share one database without interfering with each other.

## Design notes

- Money is stored as integer paise. Rounding happens only in the split calculation services, and each split type is covered by tests that prove the shares sum to the stored amount.
- Percentage splits accept whole numbers only and must total exactly 100.
- Passwords are hashed with bcrypt. Every protected route requires a valid JWT, and group data is scoped to the caller's membership.
- The API returns `{ "error": { "code", "message" } }` for failures. Validation problems use 4xx codes; unexpected failures return a generic 500 so internals are not leaked to clients.
