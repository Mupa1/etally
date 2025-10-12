# Election Management System (eTally)

> A comprehensive, secure, and scalable election monitoring system for elections with real-time results tracking, mobile field observer support, and comprehensive audit trails.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/etally)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/postgresql-15%2B-blue.svg)](https://www.postgresql.org)

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Security](#security)

## ✨ Features

### Core Functionality

- 🗳️ **Election Management** - Create and manage elections, contests, and candidates
- 📊 **Real-time Results** - Live results dashboard with WebSocket updates
- 📱 **Mobile Field App** - Offline-first React Native app for field observers
- 🔐 **Comprehensive Security** - Row-Level Security, JWT auth, audit logging
- 🌍 **Geographic Hierarchy** - County → Constituency → Ward → Polling Station
- 📸 **Media Management** - Photo uploads with GPS coordinates
- 🚨 **Incident Reporting** - Report and track polling station incidents
- 📈 **Analytics Dashboard** - Election insights and reporting

### Technical Features

- ⚡ **High Performance** - Connection pooling, Redis caching, database partitioning
- 🔄 **Offline-First** - Mobile app works without internet, syncs when online
- 📝 **Comprehensive Audit** - Every action logged with user, time, location
- 🔒 **Enterprise Security** - RLS, rate limiting, input validation
- 📊 **Monitoring** - Prometheus metrics, Grafana dashboards
- 🐳 **Docker Deployment** - Complete containerized setup
- 🔧 **Type Safety** - Full TypeScript implementation

## 🏗️ Architecture

### System Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Admin Web  │────▶│   API       │────▶│ PostgreSQL  │
│  (Vue.js)   │     │  (Node.js)  │     │  + PostGIS  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ├────▶ Redis (Cache)
                           │
                           ├────▶ MinIO (Storage)
                           │
┌─────────────┐            │
│  Mobile App │────────────┘
│(React Native│     (Offline-First)
└─────────────┘
```

### Tech Stack

**Backend:**

- Node.js 18+ with TypeScript 5+
- Express.js 4.x
- Prisma 5.x ORM
- PostgreSQL 15+ with PostGIS
- Redis 7 for caching
- MinIO for object storage

**Frontend:**

- Vue.js 3 with Composition API
- Vite 4+
- Tailwind CSS 3+
- Pinia for state management
- Chart.js & Leaflet

**Mobile:**

- React Native 0.72+
- Redux Toolkit + RTK Query
- SQLite for offline storage
- React Navigation 6+

**Infrastructure:**

- Docker & Docker Compose
- Nginx reverse proxy
- Prometheus + Grafana monitoring
- PgBouncer connection pooling

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm/yarn
- **Docker** 20+ and Docker Compose
- **Git** for version control
- **PostgreSQL** 15+ (or use Docker)
- **Redis** 7+ (or use Docker)

For mobile development:

- **React Native CLI**
- **Android Studio** (for Android)
- **Xcode** (for iOS, macOS only)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/etally2.git
cd etally2
```

### 2. Set Up Environment Variables

```bash
# Copy the environment template
cp env.template .env

# Edit .env and fill in your values
nano .env

# Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For DB_PASSWORD
```

### 3. Create Secret Files

```bash
# Create password files for Docker secrets
echo "your_db_password" > secrets/db_password.txt
echo "your_minio_password" > secrets/minio_password.txt
echo "your_grafana_password" > secrets/grafana_password.txt
echo "your_pgadmin_password" > secrets/pgadmin_password.txt
```

### 4. Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f api
```

### 5. Initialize Database

```bash
# Run migrations
cd backend
npm install
npx prisma migrate deploy

# Seed geographic data
npm run seed

# Open Prisma Studio (optional)
npx prisma studio
```

### 6. Access the Application

- **Admin Portal:** http://localhost
- **API:** http://localhost:3000
- **API Docs:** http://localhost:3000/api-docs
- **pgAdmin:** http://localhost:5050 (Database Management)
- **Grafana:** http://localhost:3001 (Monitoring)
- **Prometheus:** http://localhost:9090 (Metrics)
- **MinIO Console:** http://localhost:9001 (File Storage)

Default credentials:

- Admin: `admin@elections.ke` / `Admin123!` (Change immediately!)

## 📁 Project Structure

```
etally2/
├── backend/                 # Node.js API backend
│   ├── src/
│   │   ├── domains/        # Business logic by domain
│   │   │   ├── auth/       # Authentication
│   │   │   ├── elections/  # Election management
│   │   │   ├── results/    # Results processing
│   │   │   ├── candidates/ # Candidate management
│   │   │   ├── mobile/     # Mobile sync
│   │   │   └── audit/      # Audit logging
│   │   ├── shared/         # Shared utilities
│   │   └── infrastructure/ # Infrastructure concerns
│   ├── prisma/             # Database schema & migrations
│   └── tests/              # Test files
│
├── frontend/               # Vue.js admin portal
│   ├── src/
│   │   ├── views/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── stores/         # Pinia stores
│   │   └── composables/    # Vue composables
│   └── public/             # Static assets
│
├── mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── screens/        # Screen components
│   │   ├── components/     # Reusable components
│   │   ├── services/       # API & sync services
│   │   ├── store/          # Redux store
│   │   └── navigation/     # Navigation setup
│   ├── android/            # Android native code
│   └── ios/                # iOS native code
│
├── deployment/             # Deployment configurations
│   ├── nginx/              # Nginx configs
│   ├── prometheus/         # Prometheus configs
│   └── grafana/            # Grafana dashboards
│
├── docs/                   # Documentation
│   ├── api/                # API documentation
│   └── architecture/       # Architecture docs
│
├── scripts/                # Utility scripts
├── impact-maps/            # Change impact assessments
├── docker-compose.yml      # Docker services
└── change.txt              # Development guard rails

```

## 💻 Development

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Set up database
npx prisma migrate dev
npx prisma generate

# Run in development mode
npm run dev

# Run tests
npm test
npm run test:watch

# Lint and format
npm run lint
npm run format

# Type checking
npm run type-check
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test:unit

# Lint
npm run lint
```

### Mobile Development

```bash
cd mobile

# Install dependencies
npm install
npx pod-install  # iOS only

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run tests
npm test

# Generate APK
cd android && ./gradlew assembleRelease
```

### Database Management

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# View data in Prisma Studio
npx prisma studio

# Generate Prisma Client
npx prisma generate
```

## 🧪 Testing

### Unit Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm run test:unit

# Mobile
cd mobile && npm test
```

### Integration Tests

```bash
cd backend && npm run test:integration
```

### E2E Tests

```bash
cd frontend && npm run test:e2e
```

### Test Coverage

```bash
npm run test:coverage
```

## 📚 Documentation

- **[Technical Considerations](./technical%20considerations.txt)** - Complete technical architecture
- **[Development Guard Rails](./change.txt)** - Coding standards and rules
- **[Database Design](./database%20design.txt)** - Database schema documentation
- **[API Documentation](http://localhost:3000/api-docs)** - Interactive API docs (when running)
- **[Architecture Diagrams](./docs/architecture/)** - System architecture diagrams

## 🔐 Security

### Security Features

- ✅ Row-Level Security (RLS) at database level
- ✅ JWT authentication with refresh tokens
- ✅ Rate limiting per endpoint
- ✅ Input validation with Zod
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Comprehensive audit logging
- ✅ Field-level encryption for sensitive data

### Reporting Security Issues

Please report security vulnerabilities to security@elections.ke. Do NOT create public GitHub issues for security vulnerabilities.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Read** [change.txt](./change.txt) - Development guard rails
2. **Fork** the repository
3. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
4. **Follow** the guard rails (check for existing code, write tests)
5. **Commit** with descriptive messages
6. **Push** to your branch
7. **Open** a Pull Request

### Before Submitting PR

- [ ] All tests pass
- [ ] Test coverage meets requirements (>70%)
- [ ] Linting passes
- [ ] TypeScript has no errors
- [ ] Documentation updated
- [ ] Impact assessment created (for major changes)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## 🙏 Acknowledgments

- Independent Electoral and Boundaries Commission (IEBC)
- All contributors and testers
- Open source community

## 📞 Support

- **Email:** support@elections.ke
- **Slack:** #etally-support
- **Documentation:** https://docs.elections.ke
- **Issue Tracker:** https://github.com/yourusername/etally/issues

---

**Built with ❤️ for transparent and secure elections**
