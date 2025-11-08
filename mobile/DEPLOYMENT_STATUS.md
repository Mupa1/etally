# Phase 1 Deployment Status - Observer Registration

## ✅ Database Migration Complete!

**Status**: Successfully pushed schema to Docker PostgreSQL database  
**Command Used**: `npx prisma db push`  
**Result**: ✅ Database is now in sync with Prisma schema  
**Date**: October 16, 2024  

---

## 📊 What Was Created in Database

### New Tables
1. **`observer_registrations`** - Stores observer applications
   - Personal information (name, ID, DOB, contact)
   - Preferred assignment (county, constituency, ward, station)
   - Documents (MinIO paths)
   - Application status and tracking
   - Review information

2. **`observer_assignments`** - Stores station assignments
   - Links observers to polling stations
   - Assignment date and assigner
   - Active/inactive status
   - Deactivation tracking

3. **`password_setup_tokens`** - Secure password setup
   - One-time tokens
   - 48-hour expiry
   - Usage tracking

### New Enum
- **`ObserverStatus`**: `pending_review`, `approved`, `active`, `rejected`, `suspended`, `inactive`

### Enhanced Tables
- **`users`** - Added observer relations
- **`polling_stations`** - Added observer relations
- **`election_results`** - Added Form 34A tracking fields
- **`counties`, `constituencies`, `electoral_wards`** - Added preferred location relations

---

## 🚀 Next Steps to Start Testing

### 1. Verify Backend is Running
```bash
curl http://localhost:3000/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 12345,
  "environment": "production"
}
```

### 2. Test Registration API
```bash
curl -X POST http://localhost:3000/api/mobile/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Observer",
    "nationalId": "12345678",
    "dateOfBirth": "1990-01-15T00:00:00Z",
    "phoneNumber": "+254712345678",
    "email": "test.observer@example.com",
    "termsAccepted": true,
    "dataProcessingConsent": true
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "trackingNumber": "OBS-2024-XXXXXX",
  "message": "Application submitted successfully",
  "nextSteps": "..."
}
```

### 3. Access Frontend (Development)

Since you're running in Docker production mode, you have two options:

**Option A: Use Docker Frontend**
```bash
# Access the frontend through Docker
open http://localhost:80/mobile/register
```

**Option B: Run Frontend in Development Mode** (Recommended for testing)
```bash
# In a new terminal
cd /Users/mupa/Documents/work/etally2/frontend
npm run dev

# Then access:
open http://localhost:5173/mobile/register
```

---

## 📋 Verification Checklist

Run these commands to verify everything:

### Check Database Tables
```bash
docker exec etally-database psql -U admin -d elections -c "\dt observer*"
```

### Check MinIO Buckets
```bash
# Access MinIO console
open http://localhost:9001

# Login with:
# Username: admin
# Password: <see secrets/minio_password.txt>

# Verify buckets will be created on first upload:
# - observer-documents
# - form-34a-photos
```

### Check Backend Logs
```bash
docker logs etally-api --tail 50
```

### Test API Health
```bash
curl http://localhost:3000/api

# Expected:
# {
#   "name": "Election Management System API",
#   "version": "1.0.0",
#   "documentation": "/api-docs"
# }
```

---

## 🧪 Full Test Flow

### 1. Register Observer (Frontend)
```
1. Open: http://localhost:5173/mobile/register (dev mode)
   OR: http://localhost:80/mobile/register (Docker mode)

2. Fill form (4 steps):
   - Personal Info
   - Preferred Location (optional)
   - Upload Documents (3 files)
   - Accept Terms

3. Submit and note tracking number
```

### 2. Track Application
```
Open: http://localhost:5173/mobile/track/OBS-2024-XXXXXX
Expected: Shows "Under Review" status
```

### 3. Approve Application (API)
```bash
# Login as admin first
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<admin-email>","password":"<admin-password>"}' \
  | jq -r '.accessToken')

# List applications
curl http://localhost:3000/api/admin/observers/applications \
  -H "Authorization: Bearer $TOKEN"

# Approve (replace {id} with actual application ID)
curl -X POST http://localhost:3000/api/admin/observers/applications/{id}/review \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"approve","notes":"Approved for testing"}'
```

### 4. Check Logs for Password Setup Email
```bash
docker logs etally-api | grep "EMAIL"
# Look for password setup link with token
```

### 5. Setup Password
```
Open: http://localhost:5173/mobile/setup-password?token={token-from-logs}
Set password and activate account
```

### 6. Login
```
Open: http://localhost:5173/mobile/login
Login with email and password
```

---

## 🎯 Success Criteria

Phase 1 is successfully deployed if:

- [x] ✅ Database schema pushed successfully
- [x] ✅ Backend API running (Docker container healthy)
- [ ] 🧪 Registration form accessible
- [ ] 🧪 Can submit registration
- [ ] 🧪 Documents upload to MinIO
- [ ] 🧪 Admin can approve via API
- [ ] 🧪 Password setup works
- [ ] 🧪 Observer can login

---

## 🔧 Troubleshooting

### Frontend Shows 404 for /mobile Routes
**Solution**: 
```bash
# Rebuild frontend container to include new routes
docker-compose build frontend
docker-compose up -d frontend
```

### Cannot Connect to Backend API
**Check**:
```bash
curl http://localhost:3000/health
docker logs etally-api
```

### Database Connection Issues
**Check**:
```bash
docker ps | grep etally-database
docker logs etally-database
```

---

## 📝 Notes

1. **Email Service**: Currently logs to console. Check Docker logs: `docker logs etally-api | grep EMAIL`
2. **MinIO**: Buckets will be auto-created on first upload
3. **Admin User**: You need an existing admin user to approve applications
4. **Development Mode**: For easier testing, run frontend with `npm run dev`

---

**Status**: ✅ Database migration complete, ready for testing!
**Next**: Test the registration flow end-to-end

