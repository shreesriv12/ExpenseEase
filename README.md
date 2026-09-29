# ExpenseEase

ExpenseEase is a local web app for recording shared expenses and calculating deterministic balances.

## Run locally

Requires Node 20+. Run `npm install`, copy `server/.env.example` to `server/.env`, then run `npm run dev`. Create the SQLite schema with `cd server; npm exec prisma migrate dev --name init`; seed data will be added as implementation progresses.

Run `npm test`, `npm run lint`, and `npm run build` from the repository root. Money is stored as integer paise; the browser formats it only for display.

Demo credentials and group-specific details are intentionally not yet provided because they must be verified from the real seed and team records.
