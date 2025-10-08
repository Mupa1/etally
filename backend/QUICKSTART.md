# Backend Quick Start Guide

Quick guide to get the Kenya Election Management System backend running.

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

## Quick Start (Using Docker)

### 1. Set Up Environment Variables

```bash
# Copy environment template
cp ../env.template ../.env

# Edit .env and fill in your values (at minimum):
# - JWT_SECRET
# - JWT_REFRESH_SECRET
# - DB_PASSWORD
# - REDIS_PASSWORD
# - MINIO_PASSWORD
```

### 2. Create Docker Secrets

```bash
# Create secrets directory and files
mkdir -p ../secrets

# Create password files (replace with your actual passwords)
echo "your_secure_db_password" > ../secrets/db_password.txt
echo "your_secure_redis_password" > ../secrets/redis_password.txt
echo "your_secure_minio_password" > ../secrets/minio_password.txt
echo "your_secure_grafana_password" > ../secrets/grafana_password.txt
```

### 3. Start Services with Docker

```bash
# From project root
cd ..
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f api
```

### 4. Run Database Migrations

```bash
# Enter the API container
docker-compose exec api sh

# Run migrations
npx prisma migrate deploy

# Seed data (optional)
npm run prisma:seed

# Exit container
exit
```

### 5. Test the API

```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/api

# Register a user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nationalId": "12345678",
    "email": "admin@test.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "Admin123!@"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!@"
  }'
```

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Environment

```bash
# Copy template
cp ../env.template ../.env

# Edit .env - ensure DATABASE_URL points to your local PostgreSQL
DATABASE_URL="postgresql://admin:password@localhost:5432/elections"
REDIS_URL="redis://localhost:6379"
```

### 3. Set Up Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed data (optional)
npm run prisma:seed

# Open Prisma Studio (optional)
npx prisma studio
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on http://localhost:3000

### 5. Test Authentication

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nationalId": "12345678",
    "email": "test@example.com",
    "phoneNumber": "+254712345678",
    "firstName": "Test",
    "lastName": "User",
    "password": "Test123!@"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@"
  }' | jq .

# Save the accessToken from response

# Get profile (replace TOKEN)
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer TOKEN" | jq .
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm start                # Start production server

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Create new migration
npm run prisma:deploy    # Deploy migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Seed database
npm run db:reset         # Reset database (CAUTION!)

# Testing
npm test                 # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:integration # Run integration tests
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format with Prettier
npm run type-check       # TypeScript type checking
```

## Project Structure

```
backend/
├── src/
│   ├── domains/              # Business logic by domain
│   │   └── auth/            # ✓ Authentication (COMPLETE)
│   │       ├── auth.service.ts
│   │       ├── auth.controller.ts
│   │       ├── auth.middleware.ts
│   │       ├── auth.validator.ts
│   │       ├── auth.routes.ts
│   │       └── README.md
│   ├── infrastructure/       # Infrastructure concerns
│   │   ├── database/
│   │   │   ├── prisma.service.ts    # ✓ Complete
│   │   │   └── rls.wrapper.ts       # ✓ Complete
│   │   ├── cache/
│   │   │   └── redis.service.ts     # ✓ Complete
│   │   └── middleware/
│   │       └── error.middleware.ts  # ✓ Complete
│   ├── shared/               # Shared utilities
│   │   ├── interfaces/
│   │   │   └── auth.interface.ts    # ✓ Complete
│   │   └── types/
│   │       └── errors.ts            # ✓ Complete
│   └── server.ts             # ✓ Main server file
├── prisma/
│   ├── schema.prisma         # ✓ Database schema
│   └── migrations/           # Database migrations
├── tests/                    # Test files
├── package.json              # ✓ Dependencies
├── tsconfig.json             # ✓ TypeScript config
├── Dockerfile                # ✓ Docker image
└── QUICKSTART.md            # This file
```

## Next Steps

1. **Test the auth endpoints** using the examples above
2. **Create a test user** and verify login works
3. **Check Prisma Studio** to view database data
4. **Review the auth README** at `src/domains/auth/README.md`
5. **Start implementing** other domains (elections, results, etc.)

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps database

# View database logs
docker-compose logs database

# Restart database
docker-compose restart database
```

### Redis Connection Issues

```bash
# Check if Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

### TypeScript Errors

```bash
# Regenerate Prisma Client
npx prisma generate

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use

```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process (replace PID)
kill -9 PID

# Or change PORT in .env
PORT=3001
```

## Accessing Services

- **API**: http://localhost:3000
- **pgAdmin**: http://localhost:5050 (Database Management)
- **Prisma Studio**: http://localhost:5555 (run `npx prisma studio`)
- **Grafana**: http://localhost:3001 (Monitoring)
- **Prometheus**: http://localhost:9090 (Metrics)
- **MinIO Console**: http://localhost:9001 (File Storage)

## Environment Variables Reference

See `../env.template` for full list of environment variables.

Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for access tokens (min 32 chars)
- `JWT_REFRESH_SECRET` - Secret for refresh tokens (min 32 chars)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Support

- Check [Development Guard Rails](../change.txt) for coding standards
- Review [Technical Considerations](../technical%20considerations.txt) for architecture
- Read domain-specific READMEs in `src/domains/*/README.md`
