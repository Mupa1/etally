# Grafana Dashboards Implementation Guide

This guide provides step-by-step instructions for implementing the security and monitoring dashboards outlined in `grafana-dashboards.md`.

## 📋 Prerequisites

### Already Configured ✅

Based on your `deployment/docker-compose.prod.yml`, the following are already set up:

- **Grafana**: Running at `http://134.122.78.111:3001` (container: `etally-grafana`)
- **Prometheus**: Running at `http://134.122.78.111:9090` (container: `etally-prometheus`)
- **PostgreSQL**: Running (container: `etally-postgres`)
- **Docker Network**: `etally` (all services on same network)

### What We Need to Add

- **Node Exporter**: For system metrics (CPU, memory, disk)
- **PostgreSQL Exporter**: For database metrics
- **Loki + Promtail**: For log aggregation (optional but recommended)
- **Application Logging**: Security event logging in backend
- **Database Audit Logging**: PostgreSQL audit triggers
- **Grafana Dashboards**: SOC, System Health, API Performance, etc.
- **Alert Rules**: SEV-1, SEV-2, SEV-3 alerts

### Required Access

- SSH access to production server (`root@134.122.78.111`)
- Grafana admin credentials (from `.env`: `GRAFANA_ADMIN_USER` and `GRAFANA_PASSWORD`)
- Database admin access (user: `admin`, password from `.env`)
- Application codebase access (for adding logging)

### Docker Compose Command Format

All commands in this guide use the following format:

```bash
cd /opt/etally
docker compose --env-file .env -f deployment/docker-compose.prod.yml <command>
```

---

## 🚀 Phase 1: Foundation Setup (Week 1-2)

### Step 1.1: Verify Current Infrastructure

**Objective**: Ensure all required components are available

```bash
# SSH into production
ssh root@134.122.78.111
cd /opt/etally

# Check if Prometheus is running
docker compose --env-file .env -f deployment/docker-compose.prod.yml ps prometheus

# Check if Grafana is running
docker compose --env-file .env -f deployment/docker-compose.prod.yml ps grafana

# Check PostgreSQL
docker compose --env-file .env -f deployment/docker-compose.prod.yml ps postgres

# Check all services
docker compose --env-file .env -f deployment/docker-compose.prod.yml ps
```

**Actions**:

- [x] Verify Grafana is accessible at `http://134.122.78.111:3001` ✅ **COMPLETED**
- [x] Verify Prometheus is accessible at `http://134.122.78.111:9090` ✅ **COMPLETED**
- [x] Verify PostgreSQL is running (etally-postgres) ✅ **COMPLETED**
- [x] Check if Prometheus configuration exists at `deployment/prometheus/prometheus.yml` ✅ **FOUND - Already configured**
- [ ] Check current log aggregation setup

---

### Step 1.2: Configure Prometheus and Add Exporters

**Objective**: Configure Prometheus for metrics collection and add exporters

**Note**: Prometheus is already configured in your `docker-compose.prod.yml`. We need to:

1. Create/update the Prometheus configuration file
2. Add Node Exporter for system metrics
3. Add PostgreSQL Exporter for database metrics

#### 1.2.1: Create Prometheus Configuration Directory

```bash
# On production server
cd /opt/etally
mkdir -p deployment/prometheus
```

#### 1.2.2: Create Prometheus Configuration

Create `deployment/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'etally-production'
    environment: 'production'

scrape_configs:
  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Node Exporter for system metrics
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  # PostgreSQL Exporter
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Application metrics (if you add Prometheus client)
  - job_name: 'api'
    static_configs:
      - targets: ['api:3000']
    metrics_path: '/metrics' # Adjust if your API exposes metrics at different path
```

#### 1.2.3: Add Node Exporter and PostgreSQL Exporter to Docker Compose

Edit `deployment/docker-compose.prod.yml` and add these services before the `volumes:` section:

```yaml
node-exporter:
  image: prom/node-exporter:latest
  container_name: etally-node-exporter
  restart: unless-stopped
  volumes:
    - /proc:/host/proc:ro
    - /sys:/host/sys:ro
    - /:/rootfs:ro
  command:
    - '--path.procfs=/host/proc'
    - '--path.sysfs=/host/sys'
    - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
  networks:
    - etally
  ports:
    - '9100:9100'

postgres-exporter:
  image: prometheuscommunity/postgres-exporter:latest
  container_name: etally-postgres-exporter
  restart: unless-stopped
  env_file:
    - ../.env
  environment:
    # Update DB_PASSWORD with the actual variable name from your .env file
    DATA_SOURCE_NAME: 'postgresql://admin:${DB_PASSWORD}@postgres:5432/elections?sslmode=disable'
  depends_on:
    postgres:
      condition: service_healthy
  networks:
    - etally
  ports:
    - '9187:9187'
```

**Note**: The `volumes:` section already exists in your docker-compose. No changes needed there unless you plan to add Loki later.

**Actions**:

- [x] Create `deployment/prometheus/prometheus.yml` with above configuration ✅ **COMPLETED** - Updated existing config with cluster/environment labels
- [x] Add Node Exporter service to `deployment/docker-compose.prod.yml` ✅ **COMPLETED**
- [x] Add PostgreSQL Exporter service to `deployment/docker-compose.prod.yml` ✅ **COMPLETED**
- [x] Deploy to production ✅ **COMPLETED** - Services deployed successfully
- [x] Verify Prometheus UI at `http://134.122.78.111:9090` ✅ **COMPLETED**
- [x] Check targets at `http://134.122.78.111:9090/targets` ✅ **COMPLETED** - node: 1/1 up, postgres: 1/1 up, prometheus: 1/1 up

**⚠️ IMPORTANT**: Before deploying, verify the `DB_PASSWORD` variable name in your `.env` file matches what's used in the postgres-exporter service. Common names: `DB_PASSWORD`, `POSTGRES_PASSWORD`, or `DATABASE_PASSWORD`.

---

### Step 1.3: Configure Grafana Data Sources

**Objective**: Connect Grafana to Prometheus and other data sources

1. **Access Grafana**: `http://134.122.78.111:3001`
2. **Login** with admin credentials
3. **Add Data Sources**:

   **Prometheus**:

   - Go to: Configuration → Data Sources → Add data source
   - Select: Prometheus
   - URL: `http://prometheus:9090` (use service name since they're on same Docker network)
   - Access: Server (default)
   - Click: Save & Test
   - **Expected**: "Data source is working"

   **PostgreSQL** (for custom queries):

   - Go to: Configuration → Data Sources → Add data source
   - Select: PostgreSQL
   - Host: `postgres:5432` (use service name)
   - Database: `elections`
   - User: `admin`
   - Password: (from `.env` - `DB_PASSWORD`)
   - SSL Mode: `disable`
   - Click: Save & Test
   - **Expected**: "Database Connection OK"

**Note**: Since Grafana and Prometheus are in the same Docker network (`etally`), use service names (`prometheus`, `postgres`) instead of `localhost`.

**Actions**:

- [x] Configure Prometheus data source in Grafana ✅ **COMPLETED**
- [x] Configure PostgreSQL data source in Grafana ✅ **COMPLETED**
- [x] Both data sources show "working" status ✅ **COMPLETED**

---

### Step 1.4: Set Up Log Aggregation (SIEM)

**Objective**: Implement centralized, immutable log storage

#### Option A: Grafana Loki (Recommended for Grafana Integration)

Add to `deployment/docker-compose.prod.yml` before the `volumes:` section:

```yaml
loki:
  image: grafana/loki:latest
  container_name: etally-loki
  restart: unless-stopped
  ports:
    - '3100:3100'
  command: -config.file=/etc/loki/local-config.yaml
  volumes:
    - loki_data:/loki
  networks:
    - etally

promtail:
  image: grafana/promtail:latest
  container_name: etally-promtail
  restart: unless-stopped
  volumes:
    - /var/log:/var/log:ro
    - ./promtail/config.yml:/etc/promtail/config.yml
  command: -config.file=/etc/promtail/config.yml
  networks:
    - etally
```

**Update the `volumes:` section** to include `loki_data`:

```yaml
volumes:
  postgres_data:
  redis_data:
  minio_data:
  pgadmin_data:
  prometheus_data:
  grafana_data:
  loki_data: # Add this line
```

Create `deployment/promtail/config.yml`:

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: api
    static_configs:
      - targets:
          - localhost
        labels:
          job: api
          __path__: /var/log/api/*.log
```

**Add Loki to Grafana**:

- Go to: Configuration → Data Sources → Add data source
- Select: Loki
- URL: `http://loki:3100` (use service name)
- Click: Save & Test
- **Expected**: "Data source is working"

**Start Loki services**:

```bash
cd /opt/etally
docker compose --env-file .env -f deployment/docker-compose.prod.yml up -d loki promtail
```

**Actions**:

- [x] Loki and Promtail added to `deployment/docker-compose.prod.yml` ✅ **COMPLETED**
- [x] `loki_data` volume added to volumes section ✅ **COMPLETED**
- [x] Create `deployment/promtail/config.yml` ✅ **COMPLETED**
- [x] Promtail configured to collect logs ✅ **COMPLETED**
- [x] Deploy to production - Start Loki and Promtail services ✅ **COMPLETED**
- [x] Loki data source added to Grafana ✅ **COMPLETED**
- [x] Test log collection ✅ **COMPLETED**

**✅ Phase 1 Complete!** All foundation setup is done. Moving to Phase 2: Security Monitoring.

---

## 🔒 Phase 2: Security Monitoring Implementation (Week 3-4)

### Step 2.1: Implement Application Logging

**Objective**: Add structured logging for security events

#### 2.1.1: Install Logging Libraries

In `backend/package.json`:

```json
{
  "dependencies": {
    "winston": "^3.11.0",
    "winston-daily-rotate-file": "^4.7.1"
  }
}
```

#### 2.1.2: Create Security Logger

Create `backend/src/shared/utils/security-logger.ts`:

```typescript
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: '/var/log/api/security-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
});

export const logSecurityEvent = (
  eventType: string,
  details: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    action?: string;
    resource?: string;
    success?: boolean;
    metadata?: Record<string, any>;
  }
) => {
  securityLogger.info({
    eventType,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

// Specific loggers
export const logLoginAttempt = (
  email: string,
  ip: string,
  success: boolean
) => {
  logSecurityEvent('login_attempt', {
    action: 'login',
    userId: email,
    ipAddress: ip,
    success,
  });
};

export const logDataModification = (
  userId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  resource: string,
  resourceId: string,
  before?: any,
  after?: any
) => {
  logSecurityEvent('data_modification', {
    userId,
    action,
    resource,
    metadata: { resourceId, before, after },
  });
};
```

**Actions**:

- [x] Install logging libraries ✅ **COMPLETED** - Added `winston-daily-rotate-file` to package.json
- [x] Create security logger utility ✅ **COMPLETED** - Created `backend/src/shared/utils/security-logger.ts`
- [x] Added log directory volume mount to API container ✅ **COMPLETED**
- [x] Install dependencies and rebuild API ✅ **COMPLETED** - Deployed successfully
- [x] Test logging to files ✅ **COMPLETED** - Logs are being generated

---

### Step 2.2: Instrument Authentication Endpoints

**Objective**: Log all authentication events

Edit `backend/src/domains/auth/auth.controller.ts`:

```typescript
import { logLoginAttempt, logSecurityEvent } from '@/shared/utils/security-logger';

// In login method
async login(req: Request, res: Response) {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // ... existing login logic ...

    if (user) {
      logLoginAttempt(loginData.identifier, ipAddress, true);

      // Log successful login with geo-location (if available)
      logSecurityEvent('login_success', {
        userId: user.id,
        ipAddress,
        userAgent,
        metadata: { geoLocation: await getGeoLocation(ipAddress) },
      });
    } else {
      logLoginAttempt(loginData.identifier, ipAddress, false);
    }
  } catch (error) {
    // ... error handling ...
  }
}
```

**Actions**:

- [x] Add logging to login endpoint ✅ **COMPLETED** - Logs both success and failure
- [x] Add logging to logout endpoint ✅ **COMPLETED**
- [x] Add logging to user registration ✅ **COMPLETED** - Logs user creation
- [x] Add logging to user status changes ✅ **COMPLETED**
- [x] Deploy API with security logging ✅ **COMPLETED**
- [x] Test log output ✅ **COMPLETED** - Logs verified in production

---

### Step 2.3: Implement Database Audit Logging

**Objective**: Log all data modifications to critical tables

#### 2.3.1: Run Database Audit Migration

**Option A: Using Docker (Recommended)**

```bash
# On production server
cd /opt/etally

# Run the SQL migration
docker exec -i etally-postgres psql -U admin -d elections < backend/prisma/migrations/create_database_audit.sql
```

**Option B: Direct psql Connection**

```bash
# Connect to database
psql -h localhost -U admin -d elections

# Then run the SQL file
\i backend/prisma/migrations/create_database_audit.sql
```

**Option C: Copy and Paste SQL**

```bash
# Copy the SQL content and run it in pgAdmin or psql
cat backend/prisma/migrations/create_database_audit.sql | docker exec -i etally-postgres psql -U admin -d elections
```

#### 2.3.2: Verify Audit Triggers Are Active

```sql
-- Check if triggers exist
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE 'database_audit%';

-- Test by making a change and checking audit log
-- (This will be done after deployment)
SELECT COUNT(*) FROM database_audit_log;
```

**What This Creates**:

- `database_audit_log` table - Stores all changes to critical tables
- `database_audit_trigger_function()` - Function that logs changes
- Triggers on critical tables:
  - `election_results` (MOST CRITICAL - for tampering detection)
  - `elections`
  - `users`
  - `candidates`
  - `observer_registrations`
  - `observer_assignments`
  - `election_contests`

**Actions**:

- [x] Run database audit migration SQL ✅ **COMPLETED**
- [x] Verify triggers are created ✅ **COMPLETED**
- [x] Test audit logging ✅ **COMPLETED**
- [x] Verify entries appear in `database_audit_log` table ✅ **COMPLETED**

---

### Step 2.4: Build SOC Dashboard

**Objective**: Create the Security Operations Center dashboard

#### 2.4.1: Create Dashboard Structure

1. **In Grafana**: Dashboards → New Dashboard
2. **Name**: "SOC - Security Operations Center"
3. **Tags**: `security`, `soc`, `monitoring`
4. **Refresh**: 30s
5. **Time Range**: Last 1 hour (default)

#### 2.4.2: Add Panels

**Panel 1: Failed Login Attempts (Time Series)**

- **Title**: Failed Login Attempts (Last Hour)
- **Data Source**: Loki
- **Query**:
  ```logql
  sum(count_over_time({job="api"} | json | eventType="login_attempt" | success="false" [1m])) by (ipAddress)
  ```
- **Visualization**: Time series
- **Y-Axis**: Count
- **Legend**: `{{ipAddress}}`
- **Thresholds**:
  - Green: 0-5
  - Yellow: 5-10
  - Red: >10

**Panel 2: Failed Logins by IP (Table)**

- **Title**: Top IPs with Failed Logins
- **Data Source**: Loki
- **Query**:
  ```logql
  topk(10,
    sum(count_over_time({job="api"} | json | eventType="login_attempt" | success="false" [1h])) by (ipAddress)
  )
  ```
- **Visualization**: Table
- **Format**: Table
- **Columns**: IP Address, Failed Attempts

**Panel 3: Successful vs Failed Logins (Stat)**

- **Title**: Login Success Rate (Last Hour)
- **Data Source**: Loki
- **Query (Success)**:
  ```logql
  sum(count_over_time({job="api"} | json | eventType="login_success" [1h]))
  ```
- **Query (Failed)**:
  ```logql
  sum(count_over_time({job="api"} | json | eventType="login_attempt" | success="false" [1h]))
  ```
- **Visualization**: Stat
- **Value Mappings**:
  - Success: Green
  - Failed: Red

**Panel 4: Privilege Escalation Events (Table)**

- **Title**: Recent Privilege Changes
- **Data Source**: Loki
- **Query**:
  ```logql
  {job="api"} | json | eventType="privilege_change" | line_format "{{.timestamp}} | User: {{.userId}} | {{.metadata.oldRole}} → {{.metadata.newRole}} | IP: {{.ipAddress}}"
  ```
- **Visualization**: Logs
- **Time Range**: Last 24 hours
- **Format**: Logs

**Panel 5: Data Modifications (Time Series)**

- **Title**: Critical Data Modifications
- **Data Source**: Loki
- **Query**:
  ```logql
  sum(count_over_time({job="api"} | json | eventType="data_modification" | resource=~"election|result|user" [1m])) by (resource, action)
  ```
- **Visualization**: Time series
- **Legend**: `{{resource}} - {{action}}`

**Panel 6: Database Audit - Result Modifications (Table)**

- **Title**: Election Result Changes (Database Audit)
- **Data Source**: PostgreSQL
- **Query**:
  ```sql
  SELECT
    changed_at,
    operation,
    (new_data->>'id')::text as result_id,
    (new_data->>'resultStatus')::text as status,
    application_user_id as user_id
  FROM database_audit_log
  WHERE table_name = 'election_results'
    AND operation IN ('UPDATE', 'DELETE')
    AND changed_at > NOW() - INTERVAL '24 hours'
  ORDER BY changed_at DESC
  LIMIT 50
  ```
- **Visualization**: Table
- **Time Range**: Last 24 hours

**Panel 7: Chain of Custody - Same User Violations (Alert List)**

- **Title**: Chain of Custody Breaches
- **Data Source**: PostgreSQL
- **Query**:
  ```sql
  WITH result_changes AS (
    SELECT
      (new_data->>'id')::text as result_id,
      application_user_id as user_id,
      operation,
      changed_at,
      ROW_NUMBER() OVER (PARTITION BY (new_data->>'id')::text ORDER BY changed_at) as step_number
    FROM database_audit_log
    WHERE table_name = 'election_results'
      AND operation IN ('INSERT', 'UPDATE')
      AND changed_at > NOW() - INTERVAL '7 days'
  ),
  user_steps AS (
    SELECT
      result_id,
      user_id,
      COUNT(DISTINCT step_number) as steps_by_user
    FROM result_changes
    GROUP BY result_id, user_id
    HAVING COUNT(DISTINCT step_number) > 1
  )
  SELECT
    result_id,
    user_id,
    steps_by_user,
    'SEV-1: Same user in multiple chain steps' as alert
  FROM user_steps
  ORDER BY steps_by_user DESC
  ```
- **Visualization**: Table
- **Format**: Table
- **Thresholds**: Red if any rows returned

**Panel 8: Account Lockouts (Stat)**

- **Title**: Account Lockouts (Last Hour)
- **Data Source**: Loki
- **Query**:
  ```logql
  sum(count_over_time({job="api"} | json | eventType="account_lockout" [1h]))
  ```
- **Visualization**: Stat
- **Thresholds**:
  - Green: 0
  - Yellow: 1-3
  - Red: >3

**Panel 9: Suspicious Activity (Logs)**

- **Title**: Suspicious Activity Log
- **Data Source**: Loki
- **Query**:
  ```logql
  {job="api"} | json | eventType=~"suspicious_.*"
  ```
- **Visualization**: Logs
- **Time Range**: Last 24 hours
- **Format**: Logs

**Panel 10: Database Audit - Post-Verification Changes (Alert)**

- **Title**: ⚠️ CRITICAL: Result Changes After Verification
- **Data Source**: PostgreSQL
- **Query**:
  ```sql
  SELECT
    changed_at,
    (new_data->>'id')::text as result_id,
    (old_data->>'resultStatus')::text as old_status,
    (new_data->>'resultStatus')::text as new_status,
    application_user_id as user_id
  FROM database_audit_log
  WHERE table_name = 'election_results'
    AND operation = 'UPDATE'
    AND (old_data->>'resultStatus') IN ('verified', 'published')
    AND changed_at > NOW() - INTERVAL '7 days'
  ORDER BY changed_at DESC
  ```
- **Visualization**: Table
- **Format**: Table
- **Thresholds**: Red if any rows (SEV-1 alert)

**Actions**:

- [x] Create SOC dashboard in Grafana ✅ **COMPLETED**
- [x] Add Panel 1: Failed Login Attempts ✅ **COMPLETED**
- [x] Add Panel 2: Failed Logins by IP ✅ **COMPLETED**
- [x] Add Panel 3: Login Success Rate ✅ **COMPLETED**
- [x] Add Panel 4: Privilege Escalation Events ✅ **COMPLETED**
- [x] Add Panel 5: Data Modifications ✅ **COMPLETED**
- [x] Add Panel 6: Database Audit - Result Modifications ✅ **COMPLETED**
- [x] Add Panel 7: Chain of Custody Breaches ✅ **COMPLETED**
- [x] Add Panel 8: Account Lockouts ✅ **COMPLETED**
- [x] Add Panel 9: Suspicious Activity ✅ **COMPLETED**
- [x] Add Panel 10: Post-Verification Changes (CRITICAL) ✅ **COMPLETED**
- [x] Set dashboard refresh to 30s ✅ **COMPLETED**
- [x] Test all panels with real data ✅ **COMPLETED**

---

## 📊 Phase 3: Operational Dashboards (Week 5-6)

### Step 3.1: System Health Dashboard

**Objective**: Monitor infrastructure health

#### 3.1.1: Create Dashboard

1. **In Grafana**: Dashboards → New Dashboard
2. **Name**: "System Health"
3. **Tags**: `system`, `infrastructure`, `health`
4. **Refresh**: 30s

#### 3.1.2: Add Panels

**Panel 1: CPU Usage (Gauge)**

- **Title**: CPU Usage
- **Data Source**: Prometheus
- **Query**:
  ```promql
  100 - (avg(irate(node_cpu_seconds_total{mode="idle",job="node"}[5m])) * 100)
  ```
- **Visualization**: Gauge
- **Unit**: Percent (0-100)
- **Min**: 0, **Max**: 100
- **Thresholds**:
  - Green: 0-70
  - Yellow: 70-80
  - Red: 80-100

**Panel 2: Memory Usage (Gauge)**

- **Title**: Memory Usage
- **Data Source**: Prometheus
- **Query**:
  ```promql
  (1 - (node_memory_MemAvailable_bytes{job="node"} / node_memory_MemTotal_bytes{job="node"})) * 100
  ```
- **Visualization**: Gauge
- **Unit**: Percent (0-100)
- **Min**: 0, **Max**: 100
- **Thresholds**:
  - Green: 0-80
  - Yellow: 80-85
  - Red: 85-100

**Panel 3: Disk Usage (Gauge)**

- **Title**: Disk Usage (Root)
- **Data Source**: Prometheus
- **Query**:
  ```promql
  100 - ((node_filesystem_avail_bytes{job="node",mountpoint="/",fstype!="rootfs"} / node_filesystem_size_bytes{job="node",mountpoint="/",fstype!="rootfs"}) * 100)
  ```
- **Visualization**: Gauge
- **Unit**: Percent (0-100)
- **Min**: 0, **Max**: 100
- **Thresholds**:
  - Green: 0-80
  - Yellow: 80-90
  - Red: 90-100

**Panel 4: Database Connections (Time Series)**

- **Title**: PostgreSQL Active Connections
- **Data Source**: Prometheus
- **Query**:
  ```promql
  pg_stat_database_numbackends{job="postgres",datname="elections"}
  ```
- **Visualization**: Time series
- **Unit**: Short
- **Legend**: `Active Connections`

**Panel 5: Database Connection Pool Usage (Gauge)**

- **Title**: Database Connection Pool Usage
- **Data Source**: Prometheus
- **Query**:
  ```promql
  (pg_stat_database_numbackends{job="postgres",datname="elections"} / pg_settings_setting{job="postgres",name="max_connections"}) * 100
  ```
- **Visualization**: Gauge
- **Unit**: Percent (0-100)
- **Thresholds**:
  - Green: 0-70
  - Yellow: 70-85
  - Red: 85-100

**Panel 6: Database Size (Stat)**

- **Title**: Database Size
- **Data Source**: Prometheus
- **Query**:
  ```promql
  pg_database_size_bytes{job="postgres",datname="elections"}
  ```
- **Visualization**: Stat
- **Unit**: bytes(IEC)
- **Value Options**: Show "Last" value

**Panel 7: Network I/O (Time Series)**

- **Title**: Network I/O
- **Data Source**: Prometheus
- **Query A (Received)**:
  ```promql
  rate(node_network_receive_bytes_total{job="node",device!="lo"}[5m])
  ```
- **Query B (Transmitted)**:
  ```promql
  rate(node_network_transmit_bytes_total{job="node",device!="lo"}[5m])
  ```
- **Visualization**: Time series
- **Unit**: bytes/sec
- **Legend**: `{{device}} - {{direction}}`

**Panel 8: Load Average (Time Series)**

- **Title**: System Load Average
- **Data Source**: Prometheus
- **Query**:
  ```promql
  node_load1{job="node"}
  ```
- **Visualization**: Time series
- **Unit**: Short
- **Legend**: `1-minute load`

**Panel 9: Disk I/O (Time Series)**

- **Title**: Disk I/O Operations
- **Data Source**: Prometheus
- **Query A (Read)**:
  ```promql
  rate(node_disk_reads_completed_total{job="node"}[5m])
  ```
- **Query B (Write)**:
  ```promql
  rate(node_disk_writes_completed_total{job="node"}[5m])
  ```
- **Visualization**: Time series
- **Unit**: iops
- **Legend**: `{{device}} - {{operation}}`

**Panel 10: PostgreSQL Query Performance (Time Series)**

- **Title**: Slow Queries (>1s)
- **Data Source**: Prometheus
- **Query**:
  ```promql
  rate(pg_stat_statements_mean_exec_time{job="postgres"}[5m]) > 1
  ```
- **Visualization**: Time series
- **Unit**: seconds
- **Legend**: `{{datname}} - {{user}}`

**Actions**:

- [x] Create System Health dashboard ✅ **COMPLETED**
- [x] Add Panel 1: CPU Usage ✅ **COMPLETED**
- [x] Add Panel 2: Memory Usage ✅ **COMPLETED**
- [x] Add Panel 3: Disk Usage ✅ **COMPLETED**
- [x] Add Panel 4: Database Connections ✅ **COMPLETED**
- [x] Add Panel 5: Database Connection Pool Usage ✅ **COMPLETED**
- [x] Add Panel 6: Database Size ✅ **COMPLETED**
- [x] Add Panel 7: Network I/O ✅ **COMPLETED**
- [x] Add Panel 8: Load Average ✅ **COMPLETED**
- [x] Add Panel 9: Disk I/O ✅ **COMPLETED**
- [x] Add Panel 10: PostgreSQL Query Performance ✅ **COMPLETED**
- [x] Configure all thresholds ✅ **COMPLETED**
- [x] Set dashboard refresh to 30s ✅ **COMPLETED**
- [x] Test all panels ✅ **COMPLETED**

---

### Step 3.2: API Performance Dashboard

**Objective**: Monitor API health and performance

#### 3.2.1: Create Dashboard

1. **In Grafana**: Dashboards → New Dashboard
2. **Name**: "API Performance"
3. **Tags**: `api`, `performance`, `monitoring`
4. **Refresh**: 30s

#### 3.2.2: Add Panels

**Note**: Currently using Loki logs and PostgreSQL metrics. For enhanced metrics, consider adding Prometheus client library (see Step 3.2.3).

**Panel 1: Request Rate (Time Series)**

- **Title**: HTTP Requests per Second
- **Data Source**: Loki
- **Query**:
  ```logql
  sum(rate({job="api"} |~ "GET|POST|PUT|DELETE|PATCH" [1m])) by (method)
  ```
- **Visualization**: Time series
- **Unit**: reqps
- **Legend**: `{{method}} requests/sec`

**Alternative Query** (if above doesn't work):

```logql
sum(count_over_time({job="api"} [1m])) by (method)
```

**Panel 2: Response Status Codes (Time Series)**

- **Title**: HTTP Status Codes
- **Data Source**: Loki
- **Query**:
  ```logql
  sum(count_over_time({job="api"} | json | status_code=~"[0-9]+" [1m])) by (status_code)
  ```
- **Visualization**: Time series
- **Unit**: Short
- **Legend**: `Status {{status_code}}`

**Panel 3: Error Rate (Time Series)**

- **Title**: Error Rate (4xx + 5xx)
- **Data Source**: Loki
- **Query A (4xx)**:
  ```logql
  sum(count_over_time({job="api"} | json | status_code=~"4[0-9]{2}" [1m]))
  ```
- **Query B (5xx)**:
  ```logql
  sum(count_over_time({job="api"} | json | status_code=~"5[0-9]{2}" [1m]))
  ```
- **Visualization**: Time series
- **Unit**: Short
- **Legend**: `{{status_code}} errors`

**Panel 4: Top Endpoints by Request Count (Table)**

- **Title**: Most Requested Endpoints
- **Data Source**: Loki
- **Query**:
  ```logql
  topk(10, sum(count_over_time({job="api"} [1h])) by (path))
  ```
- **Visualization**: Table
- **Format**: Table
- **Columns**: Endpoint, Requests

**Panel 5: Database Query Performance (Time Series)**

- **Title**: Slow Database Queries (>1s)
- **Data Source**: PostgreSQL
- **Query**:
  ```sql
  SELECT
    query,
    mean_exec_time,
    calls,
    NOW() as timestamp
  FROM pg_stat_statements
  WHERE mean_exec_time > 1000
    AND calls > 0
  ORDER BY mean_exec_time DESC
  LIMIT 20
  ```
- **Visualization**: Time series
- **Unit**: milliseconds
- **Note**: Requires `pg_stat_statements` extension

**Panel 6: API Response Time Distribution (Histogram)**

- **Title**: Response Time Distribution
- **Data Source**: Loki
- **Query**:
  ```logql
  sum(count_over_time({job="api"} | json | response_time=~"[0-9]+" [1m])) by (response_time_bucket)
  ```
- **Visualization**: Histogram
- **Note**: Requires response_time in logs

**Panel 7: Active Database Connections (Time Series)**

- **Title**: PostgreSQL Active Connections
- **Data Source**: Prometheus
- **Query**:
  ```promql
  pg_stat_database_numbackends{job="postgres",datname="elections"}
  ```
- **Visualization**: Time series
- **Unit**: Short

**Panel 8: Database Query Rate (Time Series)**

- **Title**: Database Queries per Second
- **Data Source**: Prometheus
- **Query**:
  ```promql
  rate(pg_stat_statements_calls{job="postgres"}[5m])
  ```
- **Visualization**: Time series
- **Unit**: qps

**Panel 9: API Health Status (Stat)**

- **Title**: API Health
- **Data Source**: Prometheus (or custom)
- **Query**: Health check endpoint status
- **Visualization**: Stat
- **Note**: Can use uptime or health endpoint

**Panel 10: Request Duration by Endpoint (Time Series)**

- **Title**: Average Response Time by Endpoint
- **Data Source**: Loki
- **Query**:
  ```logql
  avg({job="api"} | json | response_time=~"[0-9]+" | unwrap response_time) by (path)
  ```
- **Visualization**: Time series
- **Unit**: milliseconds

#### 3.2.3: Optional - Add Prometheus Client (Future Enhancement)

For better API metrics, consider adding `prom-client`:

```bash
npm install prom-client
```

Then add metrics middleware to expose `/metrics` endpoint.

**Actions**:

- [ ] Create API Performance dashboard
- [ ] Add Panel 1: Request Rate
- [ ] Add Panel 2: Response Status Codes
- [ ] Add Panel 3: Error Rate
- [ ] Add Panel 4: Top Endpoints
- [ ] Add Panel 5: Database Query Performance
- [ ] Add Panel 6: Response Time Distribution (if available)
- [ ] Add Panel 7: Active Database Connections
- [ ] Add Panel 8: Database Query Rate
- [ ] Add Panel 9: API Health Status
- [ ] Add Panel 10: Request Duration by Endpoint
- [ ] Test all panels
- [ ] (Optional) Add Prometheus client for enhanced metrics

---

### Step 3.3: Election Progress Dashboard

**Objective**: Track election-specific metrics

**Panels**:

1. **Results Submitted** (Stat)

   - Query: Count of results by status

2. **Submission Rate** (Time Series)

   - Results submitted over time

3. **Polling Station Coverage** (Gauge)

   - Percentage of stations with results

4. **Results by Region** (Bar Chart)
   - Results by county/constituency

**Actions**:

- [ ] Create Election Progress dashboard
- [ ] Add database queries
- [ ] Configure visualizations
- [ ] Test with sample data

---

## 🚨 Phase 4: Alert Configuration (Week 7)

### Step 4.1: Configure Alert Rules

**Objective**: Set up automated alerts

#### 4.1.1: Create Alert Rules in Grafana

1. **Go to**: Alerting → Alert Rules → New Alert Rule

2. **SEV-1 Alert: Result Modification Post-Verification**

   - Name: "SEV-1: Result Tampering Detected"
   - Query:
     ```sql
     SELECT COUNT(*)
     FROM audit_log
     WHERE table_name = 'results'
       AND operation = 'UPDATE'
       AND new_data->>'status' IN ('verified', 'published')
       AND timestamp > NOW() - INTERVAL '5 minutes'
     ```
   - Condition: `WHEN count() > 0`
   - Notification: Email, Slack, PagerDuty
   - Severity: Critical

3. **SEV-2 Alert: Brute Force Attack**

   - Name: "SEV-2: Potential Brute Force Attack"
   - Query: Failed logins > 20 from same IP in 10 minutes
   - Condition: `WHEN count() > 20`
   - Severity: High

4. **SEV-3 Alert: High CPU**
   - Name: "SEV-3: High CPU Usage"
   - Query: CPU usage > 80%
   - Condition: `WHEN avg() > 80`
   - Severity: Warning

**Actions**:

- [ ] Create all SEV-1 alerts
- [ ] Create all SEV-2 alerts
- [ ] Create all SEV-3 alerts
- [ ] Configure notification channels
- [ ] Test alert triggers

---

### Step 4.2: Set Up Notification Channels

**Objective**: Configure alert delivery

1. **Email Notification**:

   - Go to: Alerting → Notification Channels → New Channel
   - Type: Email
   - Addresses: security-team@etally.ke, ciso@etally.ke

2. **Slack Notification** (Optional):

   - Type: Slack
   - Webhook URL: (from Slack)

3. **PagerDuty** (For SEV-1):
   - Type: PagerDuty
   - Integration Key: (from PagerDuty)

**Actions**:

- [ ] Configure email notifications
- [ ] Configure Slack (if used)
- [ ] Configure PagerDuty for SEV-1
- [ ] Test notifications

---

## ✅ Phase 5: Testing & Validation (Week 8)

### Step 5.1: Test Dashboard Functionality

**Test Checklist**:

- [ ] All dashboards load correctly
- [ ] Data sources are connected
- [ ] Queries return expected data
- [ ] Panels update in real-time
- [ ] Refresh intervals work correctly

### Step 5.2: Test Alert Triggers

**Test Scenarios**:

1. **SEV-1 Test**: Manually trigger a result modification

   - Expected: Alert fires within 5 minutes
   - Expected: Notification sent to all channels

2. **SEV-2 Test**: Simulate brute force attack

   - Expected: Alert fires when threshold exceeded

3. **SEV-3 Test**: Simulate high CPU
   - Expected: Warning alert fires

### Step 5.3: Conduct Tabletop Exercises

**Follow scenarios from grafana-dashboards.md**:

1. **Scenario A**: Tampering detection
2. **Scenario B**: DoS attack
3. **Scenario C**: Insider threat

**Actions**:

- [ ] Complete all test scenarios
- [ ] Document findings
- [ ] Refine dashboards based on results
- [ ] Update playbooks if needed

---

## 📝 Implementation Checklist Summary

### Week 1-2: Foundation

- [ ] Verify infrastructure
- [ ] Set up Prometheus
- [ ] Configure Grafana data sources
- [ ] Set up log aggregation (Loki)

### Week 3-4: Security Monitoring

- [ ] Implement application logging
- [ ] Instrument authentication endpoints
- [ ] Set up database audit logging
- [ ] Build SOC dashboard

### Week 5-6: Operational Dashboards

- [ ] System Health dashboard
- [ ] API Performance dashboard
- [ ] Election Progress dashboard

### Week 7: Alerts

- [ ] Configure all alert rules
- [ ] Set up notification channels
- [ ] Test alert delivery

### Week 8: Testing

- [ ] Test all dashboards
- [ ] Test alert triggers
- [ ] Conduct tabletop exercises
- [ ] Document and refine

---

## 🔧 Troubleshooting

### Common Issues

**Issue**: Prometheus not collecting metrics

- **Solution**: Check Prometheus targets at `http://prometheus:9090/targets`
- **Verify**: Node exporter is accessible

**Issue**: Grafana can't connect to data source

- **Solution**: Check network connectivity between containers
- **Verify**: Data source URL is correct (use service names in Docker)

**Issue**: Logs not appearing in Loki

- **Solution**: Check Promtail configuration
- **Verify**: Log file paths are correct

**Issue**: Alerts not firing

- **Solution**: Check alert rule conditions
- **Verify**: Notification channels are configured

---

## 📚 Next Steps After Implementation

1. **Train Team**: Conduct training on SOC dashboard usage
2. **Document Runbooks**: Create detailed runbooks for each alert type
3. **Regular Reviews**: Schedule weekly dashboard reviews
4. **Continuous Improvement**: Refine thresholds based on actual usage
5. **Expand Monitoring**: Add more metrics as needed

---

_Last Updated: 2025-11-14_
