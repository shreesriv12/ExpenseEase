# Sample Input and Test Data

This folder fulfils the mid-semester source-code requirement for sample input or test data. It contains realistic, non-personal demo values for manual API testing. Monetary values are stored in **paise** (for example, `120000` is INR 1,200.00).

## Load the runnable demo dataset

After configuring `server/.env` and applying migrations, run this from the repository root:

```bash
npm run seed
```

The seed is safe to run again: it creates the `Goa Weekend Demo` group once and does not modify it on later runs. It creates three local-development-only accounts, all using password `DemoPass123!`:

| Name | Email |
| --- | --- |
| Aarav Mehta | `aarav.demo@expenseease.local` |
| Diya Nair | `diya.demo@expenseease.local` |
| Kabir Shah | `kabir.demo@expenseease.local` |

The dataset includes one equal split, one exact split, one percentage split, and a settlement. It is only for a local demo database; do not deploy these accounts or password to a production environment.

## API input examples

`demo-inputs.json` provides valid request bodies. Register or log in first, then replace the placeholder IDs with IDs from your own demo database. The expected split amounts are documented in the file so a tester can compare the API response with the intended result.

For negative validation checks, use an exact split whose `sharePaise` values do not sum to `amountPaise`, or a percentage split whose percentages do not total 100. The API should return a 400 `INVALID_SPLIT` error.
