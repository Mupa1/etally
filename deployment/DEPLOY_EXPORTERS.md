# Deploy Node Exporter and PostgreSQL Exporter

## Step 1: Verify Database Password Variable

Before deploying, check your `.env` file to confirm the PostgreSQL password variable name:

```bash
# On production server
cd /opt/etally
grep -i "password\|postgres" .env | grep -v "^#"
```

Common variable names:
- `DB_PASSWORD`
- `POSTGRES_PASSWORD`
- `DATABASE_PASSWORD`

**If your variable name is different from `DB_PASSWORD`**, update line 182 in `deployment/docker-compose.prod.yml`:

```yaml
DATA_SOURCE_NAME: "postgresql://admin:${YOUR_VARIABLE_NAME}@postgres:5432/elections?sslmode=disable"
```

## Step 2: Deploy the Exporters

```bash
# SSH into production
ssh root@134.122.78.111
cd /opt/etally

# Pull latest changes (if using git)
git pull origin main

# Start the new exporter services
docker compose --env-file .env -f deployment/docker-compose.prod.yml up -d node-exporter postgres-exporter

# Verify they're running
docker compose --env-file .env -f deployment/docker-compose.prod.yml ps node-exporter postgres-exporter
```

## Step 3: Verify in Prometheus

1. Go to: `http://134.122.78.111:9090/targets`
2. Check that:
   - `node` target shows **1/1 up** (green)
   - `postgres` target shows **1/1 up** (green)

## Troubleshooting

### If postgres-exporter fails to start:

Check logs:
```bash
docker compose --env-file .env -f deployment/docker-compose.prod.yml logs postgres-exporter
```

Common issues:
- Wrong password variable name
- Database not accessible
- Network connectivity issue

### If node-exporter fails to start:

Check logs:
```bash
docker compose --env-file .env -f deployment/docker-compose.prod.yml logs node-exporter
```

Common issues:
- Permission issues with /proc or /sys mounts
- Port 9100 already in use

