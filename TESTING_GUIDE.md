# API Testing Guide

## Quick Reference for Testing Kenya Election Management System

---

## 📦 What's Available

### 1. **Postman Collection**

File: `postman_collection.json`

**Contains:**

- ✅ All authentication endpoints
- ✅ Auto-save tokens after login
- ✅ Pre-configured tests
- ✅ Error test cases
- ✅ Collection variables

### 2. **Postman Environment**

File: `postman_environment.json`

**Contains:**

- ✅ baseUrl (http://localhost:3000)
- ✅ Token variables (auto-populated)
- ✅ Test credentials

### 3. **Curl Examples**

File: `POSTMAN_EXAMPLES.md`

**Contains:**

- ✅ All curl commands
- ✅ Expected responses
- ✅ Error examples
- ✅ Testing scenarios

### 4. **Automated Test Script**

File: `scripts/test-api.sh`

**Contains:**

- ✅ 10 automated tests
- ✅ Validates all auth endpoints
- ✅ Tests error handling

---

## 🚀 Quick Start

### Option 1: Use Postman (Recommended)

**Step 1: Import Collection**

```bash
# In Postman:
1. Click "Import" button (top left)
2. Select "postman_collection.json"
3. Click "Import"
```

**Step 2: Import Environment**

```bash
# In Postman:
1. Click "Import" button
2. Select "postman_environment.json"
3. Select "eTally - Development" environment (top right dropdown)
```

**Step 3: Test!**

1. Open "Kenya Election Management System" collection
2. Click "Authentication" → "Login"
3. Click "Send"
4. ✅ Access token auto-saved!
5. Try "Get Profile" (uses saved token automatically)

### Option 2: Use Curl Commands

```bash
# Quick test all endpoints
./scripts/test-api.sh

# Or manual tests from POSTMAN_EXAMPLES.md
curl http://localhost:3000/health
```

### Option 3: Use Bruno/Insomnia

The curl examples in `POSTMAN_EXAMPLES.md` work in any API client!

---

## 📝 Available Endpoints

### Public Endpoints (No Auth Required)

| Method | Endpoint                | Description          |
| ------ | ----------------------- | -------------------- |
| GET    | `/health`               | Health check         |
| GET    | `/api`                  | API information      |
| POST   | `/api/v1/auth/register` | Register new user    |
| POST   | `/api/v1/auth/login`    | Login user           |
| POST   | `/api/v1/auth/refresh`  | Refresh access token |
| POST   | `/api/v1/auth/logout`   | Logout user          |

### Protected Endpoints (Auth Required)

| Method | Endpoint                       | Description              |
| ------ | ------------------------------ | ------------------------ |
| GET    | `/api/v1/auth/profile`         | Get current user profile |
| PUT    | `/api/v1/auth/change-password` | Change password          |

---

## 🧪 Testing Workflows

### Workflow 1: New User Registration & Login

```bash
# 1. Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "nationalId": "12345678",
    "email": "newuser@test.com",
    "phoneNumber": "+254712345678",
    "firstName": "New",
    "lastName": "User",
    "password": "NewUser123!@"
  }'

# 2. Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "newuser@test.com",
    "password": "NewUser123!@"
  }'

# Save the accessToken from response

# 3. Get Profile
curl http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Workflow 2: Password Change

```bash
# 1. Login first
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@elections.ke","password":"Admin123!@#"}' \
  | jq -r '.data.tokens.accessToken')

# 2. Change password
curl -X PUT http://localhost:3000/api/v1/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "currentPassword": "Admin123!@#",
    "newPassword": "NewAdmin123!@#"
  }'

# 3. Login with new password
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@elections.ke","password":"NewAdmin123!@#"}'
```

### Workflow 3: Token Refresh

```bash
# 1. Login and save both tokens
RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@elections.ke","password":"Admin123!@#"}')

ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.data.tokens.accessToken')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.data.tokens.refreshToken')

# 2. Use access token (valid for 15 min)
curl http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 3. After expiry or before, refresh it
NEW_ACCESS=$(curl -s -X POST http://localhost:3000/api/v1/auth/refresh \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" \
  | jq -r '.data.accessToken')

# 4. Use new access token
curl http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer $NEW_ACCESS"
```

---

## ✅ Test Checklist

Use this checklist to verify all functionality:

### Registration Tests

- [ ] Valid registration succeeds (201)
- [ ] Duplicate email rejected (409)
- [ ] Duplicate national ID rejected (409)
- [ ] Weak password rejected (400)
- [ ] Invalid email format rejected (400)
- [ ] Invalid phone format rejected (400)
- [ ] Invalid national ID format rejected (400)
- [ ] Missing required fields rejected (400)

### Login Tests

- [ ] Valid login succeeds (200)
- [ ] Invalid email rejected (401)
- [ ] Invalid password rejected (401)
- [ ] Inactive account rejected (401)
- [ ] Failed attempts increment correctly
- [ ] Account locks after 5 failed attempts (401)
- [ ] Tokens returned on successful login

### Protected Route Tests

- [ ] Request without token rejected (401)
- [ ] Request with invalid token rejected (401)
- [ ] Request with expired token rejected (401)
- [ ] Request with valid token succeeds (200)
- [ ] Get profile returns correct user data

### Token Management Tests

- [ ] Access token expires after 15 minutes
- [ ] Refresh token generates new access token (200)
- [ ] Invalid refresh token rejected (401)
- [ ] Expired refresh token rejected (401)

### Password Management Tests

- [ ] Change password with correct old password (200)
- [ ] Change password with wrong old password (401)
- [ ] Change to same password rejected (400)
- [ ] Weak new password rejected (400)
- [ ] All sessions invalidated after password change

### Logout Tests

- [ ] Logout with valid refresh token (200)
- [ ] Session removed from database
- [ ] User cache invalidated
- [ ] Logout with invalid token handled gracefully

---

## 🎯 Performance Benchmarks

Expected response times (development):

| Endpoint               | Expected | Acceptable | Slow     |
| ---------------------- | -------- | ---------- | -------- |
| Health Check           | < 5ms    | < 50ms     | > 100ms  |
| Register               | < 300ms  | < 500ms    | > 1000ms |
| Login                  | < 250ms  | < 500ms    | > 1000ms |
| Get Profile (cached)   | < 5ms    | < 50ms     | > 100ms  |
| Get Profile (uncached) | < 50ms   | < 200ms    | > 500ms  |
| Refresh Token          | < 100ms  | < 300ms    | > 500ms  |
| Change Password        | < 300ms  | < 500ms    | > 1000ms |
| Logout                 | < 100ms  | < 300ms    | > 500ms  |

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to server"

**Solution:**

```bash
# Check if server is running
curl http://localhost:3000/health

# If not, start it:
cd backend && npm run dev
```

### Issue: "Database connection failed"

**Solution:**

```bash
# Check Docker services
docker-compose ps

# Start database if not running
docker-compose up -d database redis
```

### Issue: "Token expired"

**Solution:**
Use the refresh token endpoint or login again

### Issue: "Email already registered"

**Solution:**
Use a different email or delete the user from database

---

## 📊 Monitoring During Tests

### View Real-time Logs

```bash
# Backend logs
# Check terminal where backend is running

# Database queries
docker exec etally-database tail -f /var/lib/postgresql/data/log/postgresql-*.log

# Redis operations
docker exec etally-redis redis-cli monitor
```

### Check Database After Tests

```bash
# View all users
docker exec etally-database psql -U admin -d elections \
  -c "SELECT email, role, is_active, created_at FROM users;"

# View all sessions
docker exec etally-database psql -U admin -d elections \
  -c "SELECT user_id, expires_at, created_at FROM sessions ORDER BY created_at DESC LIMIT 10;"
```

---

## 🎓 Resources

- **[POSTMAN_EXAMPLES.md](./POSTMAN_EXAMPLES.md)** - Detailed curl examples
- **[postman_collection.json](./postman_collection.json)** - Import into Postman
- **[postman_environment.json](./postman_environment.json)** - Import into Postman
- **[scripts/test-api.sh](./scripts/test-api.sh)** - Automated test script
- **[backend/src/domains/auth/README.md](./backend/src/domains/auth/README.md)** - API documentation

---

## 🎉 Quick Test Now!

```bash
# Run automated tests
./scripts/test-api.sh

# Or quick manual test
curl http://localhost:3000/health | jq .
```

---

**Happy Testing! 🚀**
