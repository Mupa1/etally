# pgAdmin4 Configuration

pgAdmin4 is included in the Docker Compose setup for easy database management and visualization.

## Quick Start

### 1. Create Password File

```bash
# From project root
echo "your_secure_password" > secrets/pgadmin_password.txt
```

### 2. Start Services

```bash
docker-compose up -d pgadmin
```

### 3. Access pgAdmin

Open your browser and navigate to:

```
http://localhost:5050
```

**Default Credentials:**

- Email: `admin@elections.ke` (configurable via `PGADMIN_EMAIL` in .env)
- Password: The password you set in `secrets/pgadmin_password.txt`

### 4. Connect to Database

The database connection is pre-configured! You should see:

**Server: "Elections Database"**

- Host: `database`
- Port: `5432`
- Database: `elections`
- Username: `admin`

When you expand the server, it will ask for the database password. Use the same password from `secrets/db_password.txt`.

## Features

### View Tables

1. Expand: `Servers` → `Elections Database` → `Databases` → `elections` → `Schemas` → `public` → `Tables`
2. Right-click any table → `View/Edit Data` → `All Rows`

### Run SQL Queries

1. Right-click on `elections` database → `Query Tool`
2. Write your SQL query
3. Press F5 or click Execute

Example queries:

```sql
-- View all users
SELECT id, email, first_name, last_name, role, is_active, created_at
FROM users;

-- View all elections
SELECT id, election_code, title, election_type, status, election_date
FROM elections
ORDER BY election_date DESC;

-- Check database size
SELECT pg_size_pretty(pg_database_size('elections')) as database_size;

-- View all tables and their sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Create Diagrams (ERD)

1. Right-click on `elections` database → `ERD For Database`
2. View the Entity Relationship Diagram
3. Useful for understanding table relationships

### Backup Database

1. Right-click on `elections` database → `Backup`
2. Choose format (Custom, Tar, Plain, Directory)
3. Select file location
4. Click `Backup`

### Restore Database

1. Right-click on `elections` database → `Restore`
2. Select backup file
3. Configure restore options
4. Click `Restore`

## Configuration

The configuration is managed in two places:

### 1. servers.json

Located at: `deployment/pgadmin/servers.json`

This file pre-configures the database connection so you don't have to manually add it.

```json
{
  "Servers": {
    "1": {
      "Name": "Elections Database",
      "Group": "eTally Servers",
      "Host": "database",
      "Port": 5432,
      "MaintenanceDB": "elections",
      "Username": "admin",
      "SSLMode": "prefer"
    }
  }
}
```

### 2. Environment Variables

In `.env` file:

```env
PGADMIN_EMAIL=admin@elections.ke
PGADMIN_PASSWORD=your_secure_password
```

## Useful Features

### 1. Visual Query Builder

- Drag and drop to build queries
- No SQL knowledge required for simple queries

### 2. Data Export

- Export table data to CSV, JSON, or Excel
- Right-click table → `Import/Export`

### 3. Server Statistics Dashboard

- View real-time server metrics
- Database activity monitoring
- Connection statistics

### 4. Multiple Database Support

You can add more database servers:

1. Right-click `Servers` → `Register` → `Server`
2. Fill in connection details
3. Save

## Troubleshooting

### Cannot Connect to pgAdmin

```bash
# Check if container is running
docker-compose ps pgadmin

# View logs
docker-compose logs pgadmin

# Restart pgAdmin
docker-compose restart pgadmin
```

### Forgot Password

```bash
# Stop pgAdmin
docker-compose stop pgadmin

# Remove pgAdmin data (this resets everything)
docker volume rm etally2_pgadmin_data

# Update password
echo "new_password" > secrets/pgadmin_password.txt

# Start pgAdmin
docker-compose up -d pgadmin
```

### Connection to Database Failed

Make sure:

1. Database container is running: `docker-compose ps database`
2. You're using the correct database password
3. The database name is `elections`
4. The hostname is `database` (not `localhost`)

### "The server is taking too long to respond"

This usually means pgAdmin is still starting up. Wait 30 seconds and refresh.

## Security Notes

**Production:**

- Change default email and password
- Enable HTTPS
- Restrict access via firewall
- Use strong passwords
- Enable audit logging
- Consider using SSO/LDAP

**Development:**

- pgAdmin is exposed on port 5050
- Accessible from localhost only by default
- Password stored in secrets file (not in .env)

## Alternative: Prisma Studio

If you prefer a lighter alternative, you can use Prisma Studio:

```bash
cd backend
npx prisma studio
```

Prisma Studio will open at `http://localhost:5555`

## Resources

- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/15/index.html)
- [PostGIS Documentation](https://postgis.net/documentation/)
