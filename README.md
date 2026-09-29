# ExpenseEase

ExpenseEase is a local web app for recording shared expenses and calculating deterministic balances.

## Run locally

Requires Node 20+. Run `npm install`, copy `server/.env.example` to `server/.env`, then run `npm run dev`. Create the SQLite schema with `cd server; npm exec prisma migrate dev --name init`, then run `npm run seed`.

Run `npm test`, `npm run lint`, and `npm run build` from the repository root. Money is stored as integer paise; the browser formats it only for display.

The local demo accounts are `asha@demo.local` through `dev@demo.local`, each using the documented seed password `Demo@1234`.
