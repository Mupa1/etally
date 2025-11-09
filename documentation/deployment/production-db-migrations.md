% Production Database Migration Playbook

## Purpose

This runbook explains how to apply Prisma migrations to the hosted `etally` production database on Railway without interrupting traffic. Follow it whenever a new migration lands on `main` and needs to reach production.

## Prerequisites

- Railway CLI installed (`npm i -g @railway/cli`) and authenticated (`railway login`).
- Access to the `etally` Railway project with permission to read variables and run commands.
- Local checkout of the repository on the commit that introduced the migrations.
- Node.js 18+ and npm available locally.
- VPN or network access permitted to Railway’s `switchback.proxy.rlwy.net` endpoints (standard internet access is sufficient).

## Key Commands

- `npx prisma migrate status` &mdash; Inspect migration state.
- `npx prisma migrate diff` &mdash; Preview changes.
- `npx prisma migrate deploy` &mdash; Apply pending migrations.
- `npm run prisma:seed` &mdash; Populate default data (run only when necessary).

## High-Level Flow

1. Verify schema before touching production.
2. Capture the production `DATABASE_URL`.
3. Run `prisma migrate deploy` against production.
4. (Optional) Seed or post-process data.
5. Smoke-test API and roll back if needed.

## Step-by-Step

### 1. Verify locally

```bash
cd /Users/<you>/Documents/work/etally2/backend
npm install
npx prisma migrate status
npx prisma migrate dev
npm test   # optional but recommended
```

Ensure migrations apply cleanly and tests pass before moving ahead.

### 2. Capture the production connection string

1. Open Railway → `etally-api` service → **Variables**.
2. Copy the `DATABASE_URL` value (looks like `postgresql://postgres:...@switchback.proxy.rlwy.net:PORT/railway`).
3. Store it temporarily (do **not** commit it). Consider exporting it in the current shell:

```bash
export PROD_DATABASE_URL="postgresql://postgres:...@switchback.proxy.rlwy.net:53616/railway"
```

### 3. Dry-run (optional but recommended)

To preview what will happen without touching data:

```bash
cd /Users/<you>/Documents/work/etally2/backend
npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema prisma/schema.prisma \
  --shadow-database-url "$PROD_DATABASE_URL"
```

Review the SQL output. If it looks unexpected, stop and investigate.

### 4. Apply migrations to production

```bash
cd /Users/<you>/Documents/work/etally2/backend
DATABASE_URL="$PROD_DATABASE_URL" npx prisma migrate deploy
```

This command:

- Connects directly to the Railway Postgres instance.
- Runs pending migrations sequentially.
- Exits with a non-zero status on failure (check the console output and fix issues before re-running).

### 5. (Optional) Seed baseline data

Run only when a migration requires new seed data (for example, first-time setup or newly introduced reference data). The seed assumes an empty or semi-empty state; avoid running during normal deploys unless the script is idempotent.

```bash
cd /Users/<you>/Documents/work/etally2/backend
DATABASE_URL="$PROD_DATABASE_URL" npm run prisma:seed
```

> **Note:** The seed script currently preloads super-admin users and default policies; it is safe to re-run because it uses `upsert` everywhere, but it does **not** cover configuration seeding. Update the seed file before re-running if your release depends on fresh configuration values.

### 6. Validate

- Check the API healthcheck: `curl https://etally-api-production.up.railway.app/health`.
- Inspect Railway Postgres console (Tables tab) to confirm new columns/tables appear.
- Monitor application logs for any regressions.

### 7. Clean up

- Unset the environment variable in your shell: `unset PROD_DATABASE_URL`.
- Clear any local notes that contain secrets.

## Running Migrations via Railway CLI (Alternative)

If you prefer to execute inside Railway’s network without exposing the connection string locally:

```bash
cd /Users/<you>/Documents/work/etally2/backend
railway login
railway link   # select the etally project
railway run --service etally-api --command "cd /app && npx prisma migrate deploy"
```

The CLI opens a remote shell inside the latest deployment container and runs the migrate command there. Use this only after verifying locally; the live container must include Prisma CLI binaries (current Dockerfile copies them).

## Troubleshooting

- **`P1001: Can’t reach database`**  
  Verify the `DATABASE_URL` host/port. Railway rotates ports on reboots; copy the latest value.

- **`P2021: Table ... does not exist`**  
  Migrations never ran. Execute `npx prisma migrate deploy` before seeding.

- **`Segmentation fault` during seed**  
  This occurs inside the Alpine container. Run seeds from your local environment using the production `DATABASE_URL`, as shown above.

- **Migration fails midway**  
  Prisma stops at the first failure. Fix the issue, adjust the migration (new migration preferred), and re-run `migrate deploy`. Avoid editing existing migration files once deployed to production.

## Operational Notes

- Commit every Prisma migration alongside the code change it supports.
- Never drop or rename tables directly in production; model it through Prisma migrations.
- Document manual data backfills in `documentation/runbooks/` for future reference.
- Consider scheduling migrations during low-traffic windows if they touch large tables.

## References

- Prisma migration docs: https://pris.ly/d/migrate
- Railway CLI docs: https://docs.railway.app/develop/cli
- Project deployment guide: `documentation/deployment/railway-production-deployment.md`
