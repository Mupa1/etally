## Railway Production Deployment Guide

### Overview
- Railway provides a managed platform for deploying containers, databases, and supporting services with integrated logs, metrics, and secret management, making it a strong fit for eTally's multi-service architecture [[1]](https://railway.com/).
- This guide documents the production rollout of the eTally stack (API, frontend, PostgreSQL, Redis, MinIO, and observability) on Railway, including environment configuration, deployment automation, and operational runbooks.

### Architecture At A Glance
- Services to provision:
  - `etally-postgres` (Railway managed PostgreSQL)
  - `etally-redis` (Railway managed Redis)
  - `etally-minio` (custom Docker service + 10 GB Railway Volume)
  - `etally-api` (backend service via Dockerfile)
  - `etally-frontend` (static frontend via Dockerfile)
  - Optional: `etally-prometheus`, `etally-grafana`, `etally-backup` if production monitoring is required.
- All services live inside a single Railway project so environment variables and service URLs can be shared via the Railway service linking feature.

### Prerequisites
- Railway account with access to a paid plan (volumes and multiple services require the Teams plan) [[1]](https://railway.com/).
- Railway CLI installed locally: `npm install -g @railway/cli`.
- Production domain + TLS certificate (optional; Railway can issue managed certificates).
- Secrets generated using the `production-secrets` guide in `documentation/setup/production-secrets.md`.
- Docker is **not** required locally; Railway builds the images using the repo Dockerfiles.

### 1. Prepare the Repository
- Ensure the default branch contains the latest migrations and build artefacts.
- Remove or gate any debug-only routes (e.g., uncomment `requirePermission` calls in observer routes once RBAC is confirmed).
- Confirm `backend/Dockerfile` and `frontend/Dockerfile` build successfully with `docker build .`.

### 2. Create The Railway Project
- `railway login` and `railway init` inside the repo root.
- Accept prompts to create a new project named `etally-production` (or reuse an existing project).
- Commit the generated `.railway` directory; it contains the project id reference for local CLI workflows (keep out of gitignore).

### 3. Provision Core Services
#### PostgreSQL
- From the Railway UI: **New → Database → PostgreSQL**.
- Rename service to `etally-postgres`.
- Capture the Railway-generated `DATABASE_URL` (will be used as `${DATABASE_URL}` in backend).
- Enforce continuous backups via Railway's retention UI (or rely on the existing `backup` container if you choose to deploy it).

#### Redis
- **New → Database → Redis**.
- Rename to `etally-redis`.
- Store the auto-generated connection string as `${REDIS_URL}`.

#### MinIO (Object Storage)
- Railway does not offer S3 natively; deploy MinIO as a container service:
  - **New → Deploy from GitHub** → choose `minio/minio` image or use a minimal Dockerfile:
    ```Dockerfile
    FROM minio/minio:latest
    CMD ["server", "/data", "--console-address", ":9001"]
    ```
  - Attach a 10 GB Railway Volume mounted at `/data`.
  - Set environment variables:
    - `MINIO_ROOT_USER=admin`
    - `MINIO_ROOT_PASSWORD=<MINIO_PASSWORD from secrets guide>`
  - Expose internal port `9000` (console `9001` optional). No public domain required; the API service will reach MinIO over the internal network.

### 4. Deploy The Backend (`etally-api`)
- Create a new service -> **Deploy from GitHub** -> select repo root. Railway will detect `backend/Dockerfile`.
- Set build and start commands (Railway's Docker deployer reads `CMD` from Dockerfile; no extra config needed).
- Configure environment variables (use “Variables” tab):
  - `NODE_ENV=production`
  - `DATABASE_URL` → `{{ etally-postgres.DATABASE_URL }}`
  - `REDIS_URL` → `{{ etally-redis.REDIS_URL }}`
  - `MINIO_ENDPOINT={{ etally-minio.internal_url }}` (search in Railway UI for the internal hostname)
  - `MINIO_PORT=9000`
  - `MINIO_ACCESS_KEY=admin`
  - `MINIO_SECRET_KEY=<MINIO_PASSWORD>`
  - `MINIO_USE_SSL=false`
  - `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET` (from secrets guide)
  - Optional overrides: `CORS_ORIGIN`, `LOG_LEVEL`, `ENABLE_METRICS`.
- Enable Railway’s “deployment hooks”:
  - **Post-Deploy Command**: `npx prisma migrate deploy && npm run prisma:generate` (Railway executes inside the container after build).
  - After first deploy, manually run seeding: `railway run npm run prisma:seed`.
- Expose port `3000` (already defined in Dockerfile); assign a production domain via Railway if required (e.g., `api.etally.example`).

### 5. Deploy The Frontend (`etally-frontend`)
- Create another service pointing at the repo root but override build directory:
  - In Railway settings, set `RAILWAY_DOCKERFILE_PATH=frontend/Dockerfile`.
  - Provide build args: `VITE_API_URL=https://api.etally.example/api/v1` (or Railway internal host if using service linking).
- Environment variables to set:
  - `VITE_API_URL` (public API endpoint).
  - Optionally `VITE_APP_NAME`, `VITE_APP_VERSION`, feature flags mirroring production.
- Expose port `80`. Attach a production domain (e.g., `dashboard.etally.example`) and enable HTTPS in Railway.

### 6. Optional Monitoring Stack
- Prometheus & Grafana can be deployed using the existing `deployment/prometheus` and `deployment/grafana` assets:
  - Create two additional Docker services referencing those directories.
  - Attach persistent volumes for Grafana dashboards.
  - Link `etally-prometheus` to scrape the API/Redis exporters if you choose to run them.
- Alternatively, leverage Railway’s built-in metrics tab for CPU, memory, and network.

### 7. Service Linking & Networking
- Railway automatically provisions an internal private network; use the `${SERVICE_NAME.${VAR}}` syntax to inject service URLs into other services without exposing them publicly.
- Ensure the backend service can resolve `etally-minio` by using the internal hostname shown in the MinIO service settings (`MINIO_URL`).
- For outbound-only services (Redis, Postgres), keep external access disabled for improved security.

### 8. Continuous Deployment Workflow
- Connect the Railway project to your GitHub repository branch.
- Enable “auto-deploy on push” for the backend and frontend services.
- Protect migrations: consider requiring manual approval before promote if a migration is detected (`prisma migrate deploy --schema` logs appear in build output).
- Document rollback steps (Railway retains previous deploys; you can roll back from the Deployments tab).

### 9. Post-Deployment Checklist
- `railway run curl -f http://localhost:3000/health` should return 200 from the backend service.
- Verify MinIO buckets exist: `railway run mc ls etally-minio` (using MinIO client) or via console at `https://<railway-minio-domain>:9001`.
- Run the seed script once. Ensure the console output lists the seeded policies and configurations.
- Test the admin UI against the deployed API; confirm CORS settings include the production frontend domain.
- Update DNS records for frontend and API to point to Railway’s provided CNAMEs.

### 10. Disaster Recovery & Backups
- Database: enable Railway automated backups or deploy the `backup` container (requires volume + cron). Store artifacts in an off-site bucket if regulatory requirements demand it.
- Redis: enable snapshotting if session recovery is important; otherwise treat as volatile cache.
- MinIO: configure lifecycle policies or replicate to a long-term storage bucket outside Railway if needed.

### 11. Cost & Scaling Considerations
- Monitor the Railway usage dashboard; Redis + Postgres managed plans bill separately.
- Configure horizontal scaling by enabling multiple deploys for the API service when traffic grows; add a load balancer by enabling Railway’s built-in scaling slider.
- Tune the Node.js service (e.g., `NODE_OPTIONS=--max-old-space-size=512`) if memory pressure is observed in logs.

### References
- [[1]](https://railway.com/) Railway – Deploy infrastructure with instant scaling and integrated observability.

