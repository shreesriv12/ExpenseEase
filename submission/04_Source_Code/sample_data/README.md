# Sample Input and Test Data

Copy `.env.example` to `source_files/server/.env`, then configure a local database and JWT secret. Run `npm run seed` from `source_files/` after migrations to load fictional demo users, the Goa Weekend Demo group, equal/exact/percentage expenses, and a settlement. All demo accounts use the development-only password `DemoPass123!`.

`demo-inputs.json` provides manual API-test payloads and expected split values. Monetary amounts are in paise. Do not use this password or data in production.
