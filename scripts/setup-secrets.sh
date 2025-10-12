#!/bin/bash

# ==========================================
# Election Management System
# Secret Files Setup Script
# ==========================================

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   Election Management System - Secret Setup        ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Create secrets directory if it doesn't exist
mkdir -p secrets

echo "Creating secret files..."
echo ""

# Function to create a secret file
create_secret() {
    local filename=$1
    local description=$2
    
    if [ -f "secrets/$filename" ]; then
        echo "⚠️  secrets/$filename already exists. Skipping..."
    else
        # Generate a secure random password (32 characters)
        password=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
        echo "$password" > "secrets/$filename"
        echo "✓ Created secrets/$filename"
        echo "  Password: $password"
        echo ""
    fi
}

# Create all secret files
create_secret "db_password.txt" "PostgreSQL Database Password"
create_secret "redis_password.txt" "Redis Cache Password"
create_secret "minio_password.txt" "MinIO Storage Password"
create_secret "grafana_password.txt" "Grafana Dashboard Password"
create_secret "pgadmin_password.txt" "pgAdmin4 Password"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Secret files created successfully!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "⚠️  IMPORTANT: Store these passwords securely!"
echo ""
echo "Next steps:"
echo "1. Copy env.template to .env"
echo "2. Update .env with your configuration"
echo "3. Update JWT_SECRET and JWT_REFRESH_SECRET in .env"
echo "4. Run: docker-compose up -d"
echo ""
echo "To view passwords later:"
echo "  cat secrets/db_password.txt"
echo "  cat secrets/pgadmin_password.txt"
echo "  etc."
echo ""
