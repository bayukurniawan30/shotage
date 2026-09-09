# Database migrations

The Drizzle schema in `src/server/db/schema.ts` is the source of truth. Generated SQL
and migration metadata are committed in this directory.

## Workflow

1. Edit the Drizzle schema.
2. Generate a migration with `pnpm db:generate --name=<short-name>`.
3. Review the generated SQL in this directory.
4. Validate the migration history with `pnpm db:check`.
5. Apply pending migrations with `pnpm db:migrate`.
6. After credit-system migrations, run `pnpm db:verify:credits` against a development
   branch. The check creates and removes an isolated temporary profile.
7. After Polar migrations, run `pnpm db:verify:polar` against a development branch.
   It verifies purchase/refund idempotency, purchase statuses, expired checkouts, and
   credit debt with isolated temporary data.

`DATABASE_URL` must point to the intended Neon branch before running a migration.
Use a preview/development branch first, and do not use `drizzle-kit push` for production
changes because it bypasses the committed migration history.
