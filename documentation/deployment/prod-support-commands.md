# Production Support Commands

These snippets assume you are working directly on the DigitalOcean droplet where the eTally production stack is running.

## 1. Log In and Navigate

```bash
ssh root@134.122.78.111
cd /opt/etally/deployment
```

All commands below run from this directory unless noted otherwise.

## 2. Build, Start, Stop Containers

```bash
# Build all images (or specify services)
docker compose --env-file ../.env -f docker-compose.prod.yml build
docker compose --env-file ../.env -f docker-compose.prod.yml build api frontend

# Start / recreate containers
docker compose --env-file ../.env -f docker-compose.prod.yml up -d
docker compose --env-file ../.env -f docker-compose.prod.yml up -d api frontend

# Stop and remove containers (keeps data volumes)
docker compose --env-file ../.env -f docker-compose.prod.yml down
# Add --volumes only if you want to delete data
```

## 3. Service Status & Logs

```bash
# List running containers
docker compose --env-file ../.env -f docker-compose.prod.yml ps

# Tail logs (replace service with api, frontend, pgadmin, etc.)
docker compose --env-file ../.env -f docker-compose.prod.yml logs -f api

# One-off service restart
docker compose --env-file ../.env -f docker-compose.prod.yml restart api
```

## 4. Database & Redis CLI

```bash
# Postgres psql shell
docker exec -it etally-postgres psql -U admin -d elections

# Redis CLI (auth using password from /opt/etally/.env)
docker exec -it etally-redis redis-cli -a "$REDIS_PASSWORD"
```

## 5. Prisma Migrations & Seeds

```bash
# Apply migrations
docker compose --env-file ../.env -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

# Seed configurations
docker compose --env-file ../.env -f docker-compose.prod.yml run --rm api npx tsx prisma/seeds/configurations.seed.ts

# Seed email templates
docker compose --env-file ../.env -f docker-compose.prod.yml run --rm api node prisma/seeds/email-templates.seed.js
```

## 6. Secrets & Credentials

- All runtime secrets are stored in `/opt/etally/.env`.
- Generated passwords live in `/opt/etally/secrets/`:
  - `db_password.txt`, `redis_password.txt`, `minio_password.txt`
  - `pgadmin_password.txt`, `grafana_password.txt`
- MinIO UI: `http://134.122.78.111:9001` (user: `admin`, password from `minio_password.txt`).
- pgAdmin UI: `http://134.122.78.111:5050` (email from `.env`, password from `pgadmin_password.txt`).
- Grafana UI: `http://134.122.78.111:3001` (user/password from `.env` or `grafana_password.txt`).

## 7. Useful MinIO Checks

```bash
# List MinIO buckets
docker exec -it etally-minio mc alias set local http://127.0.0.1:9000 admin "$(grep MINIO_PASSWORD ../.env | cut -d= -f2)"
docker exec -it etally-minio mc ls local
```

## 8. Backups & Monitoring

- Postgres backup container (`etally-backup`) writes to `/opt/etally/backups/`.
- Prometheus: `http://134.122.78.111:9090`
- Grafana dashboards live in `deployment/grafana`.

Keep this page updated as operational practices evolve.
