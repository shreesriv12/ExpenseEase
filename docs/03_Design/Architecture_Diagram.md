# Architecture

```mermaid
flowchart LR
 Browser[React / Vite SPA] --> API[Express REST API]
 API --> Services[Business services]
 Services --> Prisma[Prisma ORM]
Prisma --> PostgreSQL[(PostgreSQL)]
```

Routes handle transport, controllers coordinate requests, and services own business calculations. The debt simplifier is deliberately pure and has no database access.
