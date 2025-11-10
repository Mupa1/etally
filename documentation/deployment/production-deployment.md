## DigitalOcean Production Deployment Guide

This guide documents the production rollout of the eTally stack (API, frontend, PostgreSQL, Redis, MinIO, Prometheus, Grafana, pgAdmin) on a DigitalOcean droplet using Docker Compose.

### Architecture At A Glance

- Infrastructure: single Ubuntu droplet (currently 1 vCPU / 1 GB RAM) running Docker and Docker Compose.
- Services deployed via `deployment/docker-compose.prod.yml`:
  - `etally-postgres` (PostgreSQL 15)
  - `etally-redis`
  - `etally-minio`
  - `etally-api` (backend API)
  - `etally-frontend` (Nginx hosting SPA + reverse proxy)
  - `etally-pgadmin`
  - `etally-prometheus`
  - `etally-grafana`
- Persistent volumes (`docker` named volumes) store Postgres, Redis, MinIO, Grafana, and pgAdmin data.

### 1. Prerequisites

- DigitalOcean account and a droplet (Ubuntu 25.10 x64 recommended).
- SSH key configured for password-less root login.
- Repository access (`git clone https://github.com/Mupa1/etally.git`).
- Secrets generated via `scripts/setup-secrets.sh` or taken from `documentation/setup/production-secrets.md`.
- DNS records pointing to the droplet for the public hosts you intend to expose.

### 2. Initial Droplet Setup

```bash
ssh root@<droplet-ip>
apt-get update && DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 3. Pull the Repository & Generate Secrets

```bash
cd /opt
git clone https://github.com/Mupa1/etally.git etally
cd /opt/etally
bash scripts/setup-secrets.sh        # creates secrets/*.txt
cp env.template .env                 # update with generated values & production settings
```

Key environment variables to review in `.env`:

- `DB_PASSWORD`, `REDIS_PASSWORD`, `MINIO_PASSWORD`, `PGADMIN_PASSWORD`, `GRAFANA_PASSWORD`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`
- `VITE_API_URL`, `CORS_ORIGIN`
- `MINIO_PRESIGNED_ENDPOINT=134.122.78.111` (ensures presigned URLs use the public IP)

### 4. Deploy Services (Docker Compose)

```bash
cd /opt/etally/deployment
docker compose --env-file ../.env -f docker-compose.prod.yml up -d
```

This command builds images for the API and frontend, then starts all services.  
To rebuild and redeploy changes later:

```bash
docker compose --env-file ../.env -f docker-compose.prod.yml build api frontend
docker compose --env-file ../.env -f docker-compose.prod.yml up -d api frontend
```

### 5. Post-Deployment Tasks

- Apply Prisma migrations & seed data:
  ```bash
  docker compose --env-file ../.env -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
  docker compose --env-file ../.env -f docker-compose.prod.yml run --rm api npx tsx prisma/seeds/configurations.seed.ts
  docker compose --env-file ../.env -f docker-compose.prod.yml run --rm api node prisma/seeds/email-templates.seed.js
  ```
- Confirm health checks:
  - API: `curl http://<ip>:3000/health`
  - Frontend: `curl -I http://<ip>/`
- Log in to MinIO console (`http://<ip>:9001`), pgAdmin (`http://<ip>:5050`), Grafana (`http://<ip>:3001`) using passwords from `secrets/*.txt`.
- Change default account passwords (admin login, Grafana, pgAdmin) on first use.

### 6. TLS / Reverse Proxy (Optional)

- For HTTPS, install nginx on the host or use a managed load balancer.
- Example snippet for nginx terminating TLS and proxying to the frontend:
  ```nginx
  server {
    listen 80;
    server_name dashboard.example.com;
    location / {
      proxy_pass http://127.0.0.1:80;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }
  }
  ```
- Use Certbot (`snap install certbot --classic`) to obtain TLS certificates.

### 7. Backups & Monitoring

- Postgres backups: install and configure the `backup` service from `docker-compose.yml` (or rely on `pg_dump` cron jobs).
- MinIO and Redis volumes are stored locally; schedule offsite sync if long-term retention is required.
- Prometheus UI (`http://<ip>:9090`) provides metrics; Grafana dashboards reside in `deployment/grafana`.
- System-level backups: consider DigitalOcean snapshots or Terraform automation.

### 8. Updating the Deployment

- Pull latest code:
  ```bash
  cd /opt/etally
  git pull
  ```
- Rebuild and restart services as noted above.
- Tail logs to confirm successful restarts:
  ```bash
  docker compose --env-file ../.env -f docker-compose.prod.yml logs -f api
  ```

### 9. Disaster Recovery

- Snapshot DigitalOcean droplet or volumes before major releases.
- Store secure copies of `.env` and `/opt/etally/secrets/*.txt`.
- Document manual recovery procedures (e.g., restoring Postgres from `backups/`).

### 10. Cost & Scaling Considerations

- Monitor droplet usage (`docker stats`, `prometheus`).
- If CPU or memory becomes a bottleneck, scale vertically (larger droplet) or split services across multiple droplets (e.g., managed Postgres).
- Consider Managed Databases or Load Balancers when user load increases.

Keep this document aligned with the production environment; update it after every significant change.
