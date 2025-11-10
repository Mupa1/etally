% Production Database Migration Playbook (DigitalOcean)

## Purpose

This runbook explains how to apply Prisma migrations to the production PostgreSQL instance running on the DigitalOcean droplet. Follow it whenever a new migration lands on `main` and must reach production without disrupting traffic.

## Prerequisites

- SSH access to the droplet (`root@134.122.78.111`).
- Repository checkout on the commit that introduced the migration.
- Node.js 18+ and npm locally (for dry runs).
- Prisma CLI (bundled with the repo, callable via `npx`).
- Knowledge of the production database password (`/opt/etally/secrets/db_password.txt`).

## Key Commands

- `npx prisma migrate status`
- `npx prisma migrate diff`
- `npx prisma migrate deploy`
- `npm run prisma:seed` (and the specific seed scripts under `prisma/seeds/`)

## High-Level Flow

1. Verify the migration locally.
2. Obtain the production `DATABASE_URL`.
3. Run `prisma migrate deploy` (either locally or via Docker Compose on the droplet).
4. Seed data if required.
5. Validate API health and application logs.

## Step-by-Step

### 1. Verify locally

```bash
cd /path/to/etally2/backend
npm install
npx prisma migrate status
npx prisma migrate dev
# optional
npm test
```

Do not proceed if local tests fail.

### 2. Capture the production connection string

On the droplet:

```bash
ssh root@134.122.78.111
cd /opt/etally
grep DATABASE_URL .env
cat secrets/db_password.txt
```

Compose the public URL (for running commands from your laptop):

```bash
export PROD_DATABASE_URL="postgresql://admin:<db-password>@134.122.78.111:5432/elections?schema=public"
```

### 3. Optional dry-run

```bash
cd /path/to/etally2/backend
npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema prisma/schema.prisma \
  --shadow-database-url "$PROD_DATABASE_URL"
```

Inspect the SQL and stop if unexpected changes appear.

### 4. Apply migrations

**Option A – local machine using the public URL**

```bash
cd /path/to/etally2/backend
DATABASE_URL="$PROD_DATABASE_URL" npx prisma migrate deploy
```

**Option B – inside the production container (recommended)**

```bash
ssh root@134.122.78.111
cd /opt/etally/deployment
docker compose --env-file ../.env -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
```

This reuses the production image and environment, avoiding public exposure of credentials.

### 5. Seed baseline data (when required)

```bash
docker compose --env-file ../.env -f docker-compose.prod.yml run --rm api npx tsx prisma/seeds/configurations.seed.ts
docker compose --env-file ../.env -f docker-compose.prod.yml run --rm api node prisma/seeds/email-templates.seed.js
```

These scripts are idempotent but review them before re-running.

### 6. Validate

- API: `curl http://134.122.78.111:3000/health`
- Database structure: `docker exec -it etally-postgres psql -U admin -d elections -c '\dt'`
- Application logs: `docker compose --env-file ../.env -f docker-compose.prod.yml logs -f api`

### 7. Clean up

- `unset PROD_DATABASE_URL` on your local machine.
- Remove any temporary files containing secrets.

## Troubleshooting

- **`P1001: Can’t reach database`**  
  Ensure Postgres is running (`docker ps`) and that you’re using the correct host/port. Incoming connections must use the public IP `134.122.78.111`.

- **`P2021: Table ... does not exist`**  
  Run `npx prisma migrate deploy` before executing seeds or application code that depends on the table.

- **`Segmentation fault` during seed`**  
  Execute seeds via the Docker Compose commands above to leverage the production image with rebuilt native modules.

- **Migration fails midway**  
  Fix the issue locally, generate a corrective migration, rebuild the image, and re-run `migrate deploy`. Avoid editing applied migration files.

## Operational Notes

- Commit migrations alongside their code changes.
- Schedule complex migrations during low-traffic windows.
- Document manual data fixes in `documentation/runbooks/`.
- Refer to `documentation/deployment/prod-support-commands.md` for day-to-day operations.

## References

- Prisma migrations: https://pris.ly/d/migrate
- DigitalOcean docs: https://docs.digitalocean.com/
- Deployment guide: `documentation/deployment/railway-production-deployment.md`
