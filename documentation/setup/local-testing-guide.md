# 🚀 Local Testing Guide - eTally2

Quick reference for running and restarting the backend and frontend locally.

---

## ⚡ Quick Start

### Using the Restart Script (Easiest)

```bash
# Restart both backend and frontend
./restart.sh

# Restart only backend
./restart.sh backend

# Restart only frontend
./restart.sh frontend
```

---

## 📋 Manual Commands

### Backend

**Start Backend:**

```bash
cd backend
npm run dev
```

- Runs on: `http://localhost:5000`
- Uses: `tsx watch` (auto-reloads on file changes)

**Stop Backend:**

```bash
pkill -f "tsx watch"
```

**Restart Backend:**

```bash
pkill -f "tsx watch" && sleep 1 && cd backend && npm run dev
```

### Frontend

**Start Frontend:**

```bash
cd frontend
npm run dev
```

- Runs on: `http://localhost:5173`
- Uses: `Vite` (hot module replacement)

**Stop Frontend:**

```bash
pkill -f "vite"
```

**Restart Frontend:**

```bash
pkill -f "vite" && sleep 1 && cd frontend && npm run dev
```

### Both at Once

**Stop All:**

```bash
pkill -f "tsx watch|vite"
```

**Start All (in separate terminals):**

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

---

## 🔍 Check Running Status

```bash
# Check what's running
ps aux | grep -E "(tsx watch|vite)" | grep -v grep

# Check backend port
lsof -i :5000

# Check frontend port
lsof -i :5173
```

---

## 🐛 Troubleshooting

### Port Already in Use

**Backend (Port 5000):**

```bash
lsof -ti:5000 | xargs kill -9
```

**Frontend (Port 5173):**

```bash
lsof -ti:5173 | xargs kill -9
```

### Process Won't Stop

```bash
# Force kill by PID
kill -9 <PID>

# Find and kill all Node processes (nuclear option)
pkill -9 node
```

### Clear Node Cache

```bash
# Backend
cd backend && rm -rf node_modules/.cache

# Frontend
cd frontend && rm -rf node_modules/.cache dist
```

### Rebuild Everything

```bash
# Backend
cd backend
npm install
npx prisma generate
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

---

## 📊 Current URLs

| Service     | URL                            | Port |
| ----------- | ------------------------------ | ---- |
| Backend API | http://localhost:5000          | 5000 |
| Frontend    | http://localhost:5173          | 5173 |
| API Docs    | http://localhost:5000/api-docs | 5000 |

---

## 🔧 Useful Scripts

### Backend

```bash
cd backend

# Development (auto-reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Database
npm run prisma:studio    # Open Prisma Studio
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed database

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:integration # Integration tests

# Code Quality
npm run lint             # Check linting
npm run lint:fix         # Fix linting
npm run format           # Format with Prettier
npm run type-check       # TypeScript check
```

### Frontend

```bash
cd frontend

# Development
npm run dev              # Start dev server

# Build
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Check linting
npm run format           # Format with Prettier
npm run type-check       # TypeScript check
```

---

## 🌐 Environment Files

Make sure you have these files:

**Backend - `.env`**

```env
DATABASE_URL="postgresql://..."
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
JWT_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
NODE_ENV="development"
PORT=5000
```

**Frontend - `.env`**

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME="eTally"
```

---

## 📝 Development Workflow

1. **Start Services:**

   ```bash
   ./restart.sh
   ```

2. **Make Changes:**

   - Backend: Files auto-reload with `tsx watch`
   - Frontend: Hot Module Replacement (HMR) with Vite

3. **Check Logs:**

   - Backend: Console output in terminal
   - Frontend: Browser console + terminal

4. **Test:**

   - Backend: `curl http://localhost:5000/api/v1/health`
   - Frontend: Open `http://localhost:5173`

5. **Commit Changes:**
   ```bash
   git add .
   git commit -m "Your message"
   ```

---

## 🚨 Common Issues

### 1. **Backend won't start - "Environment variable not found: DATABASE_URL"**

**Solution:** Create/check `backend/.env` file with `DATABASE_URL`

### 2. **Frontend shows blank page**

**Solutions:**

- Check browser console for errors
- Clear browser cache
- Restart frontend: `./restart.sh frontend`

### 3. **API calls fail with CORS error**

**Solution:** Check backend CORS settings in `server.ts`

### 4. **Changes not reflecting**

**Solutions:**

- Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Clear Vite cache: `rm -rf frontend/node_modules/.vite`
- Restart: `./restart.sh`

---

## 🔗 Useful Links

- **Backend API:** http://localhost:5000/api/v1
- **Frontend:** http://localhost:5173
- **Prisma Studio:** Run `npm run prisma:studio` in backend
- **API Health:** http://localhost:5000/api/v1/health

---

**Last Updated:** October 2025
