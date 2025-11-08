## Production Secrets & Environment Management

### Purpose
- Provide a single source of truth for generating, storing, and rotating production secrets required by the eTally platform.
- Complements `env.template` by mapping each key to its production counterpart and Railway variable.

### Secret Inventory
- Core secrets (must be unique per environment):

| Variable | Purpose | Generation Command |
| --- | --- | --- |
| `JWT_SECRET` | Signs access tokens | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | Signs refresh tokens | `openssl rand -base64 64` |
| `SESSION_SECRET` | Express session encryption (if enabled) | `openssl rand -hex 64` |
| `DB_PASSWORD` | PostgreSQL admin password (if self-managed) | `openssl rand -base64 32` |
| `REDIS_PASSWORD` | Redis AUTH password (if self-managed) | `openssl rand -base64 24` |
| `MINIO_PASSWORD` | MinIO root secret | `openssl rand -base64 32` |
| `GRAFANA_PASSWORD` | Grafana admin login | `openssl rand -base64 24` |
| `PGADMIN_PASSWORD` | pgAdmin admin login | `openssl rand -base64 24` |
| `SMTP_PASSWORD` | Outbound email service credential | Provided by email provider |

- Derived URLs (populated by Railway service linking; no manual generation):
  - `DATABASE_URL`
  - `REDIS_URL`
  - `MINIO_ENDPOINT` + `MINIO_PORT`

- Optional feature toggles match the defaults in `env.template`; override only if business requirements differ.

### Secret Generation Workflow
1. Clone the repo and copy `env.template` to `env.production`.
2. Generate each secret using the commands above; paste into `env.production`.
3. Never commit `.env` files—add them to your password manager or secure vault.
4. For auditability, maintain a change log (date, secret class, operator) in your security tooling.

### Loading Secrets Into Railway
- Using the CLI:
  ```bash
  railway variables set \
    JWT_SECRET=$(openssl rand -base64 48) \
    JWT_REFRESH_SECRET=$(openssl rand -base64 64) \
    SESSION_SECRET=$(openssl rand -hex 64)
  ```
- Or via the Railway UI:
  1. Open the target service → **Variables** tab.
  2. Add key/value pairs, using service linking (`{{ service.VAR }}`) for database/redis URLs.
  3. Use the “Copy to other services” shortcut to replicate shared secrets (e.g., JWT configuration for backend workers).

- Suggested grouping:
  - **Backend (`etally-api`)**: all JWT, session, MinIO, Redis, PostgreSQL, logging, CORS variables.
  - **Frontend (`etally-frontend`)**: only expose non-secret build-time variables such as `VITE_API_URL`, `VITE_APP_NAME`.
  - **Observability services**: Grafana-specific credentials.

### Rotation Strategy
- Schedule rotation every 90 days for JWT, session, and storage credentials.
- Rotate immediately if:
  - a developer with access leaves the team,
  - secrets appear in logs or accidental commits,
  - Railway signals a possible compromise.
- Rotation procedure:
  1. Generate new secret.
  2. Update Railway variable (use “Deploy after apply”).
  3. For JWT/Session secrets, invalidate old tokens by triggering logout or revoking refresh tokens (`DELETE FROM sessions` if necessary).

### Local Development Mapping
- Developers should copy `env.template` to `.env` and use non-production values.
- Never reuse production secrets in local builds.
- Use `.env.local` for overrides specific to each developer (ignored by git).

### Secret Validation Checklist
- `npm run prisma:seed` and `npm run build` succeed after variables are set in Railway.
- `/health` endpoint returns `200` in production.
- MinIO buckets can be created using the configured credentials.
- Authentication flows (login, refresh, logout) work after rotation (tests tokens).

### References
- See `documentation/deployment/railway-production-deployment.md` for full deployment steps.
- `env.template` (repo root) enumerates every configurable environment key with defaults and descriptions.

