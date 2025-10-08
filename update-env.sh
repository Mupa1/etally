#!/bin/bash
DB_PASS=$(cat secrets/db_password.txt)
REDIS_PASS=$(cat secrets/redis_password.txt)
MINIO_PASS=$(cat secrets/minio_password.txt)
GRAFANA_PASS=$(cat secrets/grafana_password.txt)
PGADMIN_PASS=$(cat secrets/pgadmin_password.txt)
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')

# Update .env file
sed -i.bak "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASS|g" .env
sed -i.bak "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=$REDIS_PASS|g" .env
sed -i.bak "s|MINIO_PASSWORD=.*|MINIO_PASSWORD=$MINIO_PASS|g" .env
sed -i.bak "s|GRAFANA_PASSWORD=.*|GRAFANA_PASSWORD=$GRAFANA_PASS|g" .env
sed -i.bak "s|PGADMIN_PASSWORD=.*|PGADMIN_PASSWORD=$PGADMIN_PASS|g" .env
sed -i.bak "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env
sed -i.bak "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|g" .env

echo "✓ Updated .env with generated passwords and JWT secrets"
