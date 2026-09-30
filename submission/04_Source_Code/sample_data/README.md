# Sample configuration and data

Copy `.env.example` to `server/.env` for local development, then set an appropriate local `DATABASE_URL` and `JWT_SECRET`.

ExpenseEase deliberately starts with no seeded users, groups, or expenses. Create accounts and sample expenses through the registration and application screens. Automated tests create and reset their own isolated PostgreSQL test data.
