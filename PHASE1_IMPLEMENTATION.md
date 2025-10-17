# Phase 1: Observer Registration - Implementation Guide

## ✅ What's Been Created

### Backend (Complete)

1. **Database Models** (`/backend/prisma/schema.prisma`):

   - `ObserverRegistration` - Observer applications
   - `ObserverAssignment` - Station assignments
   - `PasswordSetupToken` - Secure password setup tokens
   - `ObserverStatus` enum
   - Enhanced `User`, `PollingStation`, `ElectionResult`, `County`, `Constituency`, `ElectoralWard` models

2. **Mobile Domain** (`/backend/src/domains/mobile/`):

   - `observer.types.ts` - TypeScript interfaces
   - `observer.validator.ts` - Zod validation schemas
   - `observer.service.ts` - Business logic (registration, approval, password setup)
   - `observer.controller.ts` - HTTP request handlers
   - `observer.routes.ts` - Route definitions
   - `email.service.ts` - Email notifications (stub - needs implementation)
   - `minio.service.ts` - Document storage service
   - `index.ts` - Module exports

3. **Infrastructure** (`/backend/src/infrastructure/middleware/`):

   - `rate-limit.middleware.ts` - Rate limiting for public endpoints

4. **Server Integration** (`/backend/src/server.ts`):
   - Mobile routes registered at `/api/mobile/*`
   - Admin routes registered at `/api/admin/observers/*`

### Frontend (Complete)

1. **Mobile Views** (`/frontend/src/views/mobile/`):

   - `ObserverRegisterView.vue` - Multi-step registration form
   - `ObserverRegistrationSuccessView.vue` - Success page with tracking number
   - `ObserverTrackingView.vue` - Application status tracking
   - `PasswordSetupView.vue` - Password setup after approval
   - `ObserverLoginView.vue` - Observer login page
   - `ObserverDashboardView.vue` - Observer dashboard (Phase 1 placeholder)

2. **Router** (`/frontend/src/router/index.ts`):
   - All mobile routes registered under `/mobile/*`

---

## 🚀 Getting Started

### Step 1: Run Database Migration

```bash
cd backend
npx prisma migrate dev --name add_observer_registration
npx prisma generate
```

### Step 2: Install Dependencies

```bash
# Backend
cd backend
npm install zod multer @types/multer minio @types/minio

# Frontend (if needed)
cd ../frontend
npm install
```

### Step 3: Configure Environment Variables

Add to `/backend/.env`:

```bash
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=<your_minio_password>

# Email Configuration (TODO: Configure later)
EMAIL_FROM=noreply@etally.com
APP_URL=http://localhost:5173

# Optional: SMTP for emails
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your_user
# SMTP_PASS=your_password
```

### Step 4: Start Services

```bash
# Start backend
cd backend
npm run dev

# Start frontend (in another terminal)
cd frontend
npm run dev
```

---

## 📋 API Endpoints Available

### Public Endpoints (No Auth)

✅ `POST /api/mobile/register` - Register new observer
✅ `GET /api/mobile/track/:trackingNumber` - Track application status
✅ `POST /api/mobile/setup-password` - Set password after approval
✅ `POST /api/mobile/register/:id/upload-document` - Upload documents

### Admin Endpoints (Auth Required)

✅ `GET /api/admin/observers/applications` - List applications
✅ `GET /api/admin/observers/applications/:id` - Get application detail
✅ `POST /api/admin/observers/applications/:id/review` - Review application
✅ `POST /api/admin/observers/bulk-approve` - Bulk approve
✅ `GET /api/admin/observers/statistics` - Get statistics

---

## 🧪 Testing the Implementation

### Test 1: Public Registration

```bash
curl -X POST http://localhost:3000/api/mobile/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "nationalId": "12345678",
    "dateOfBirth": "1990-01-15T00:00:00Z",
    "phoneNumber": "+254712345678",
    "email": "john.doe@example.com",
    "termsAccepted": true,
    "dataProcessingConsent": true
  }'
```

**Expected Response**:

```json
{
  "success": true,
  "trackingNumber": "OBS-2024-123456",
  "message": "Application submitted successfully",
  "nextSteps": "You will receive an email when your application is reviewed..."
}
```

### Test 2: Track Application

```bash
curl http://localhost:3000/api/mobile/track/OBS-2024-123456
```

### Test 3: Upload Document

```bash
curl -X POST http://localhost:3000/api/mobile/register/{registrationId}/upload-document \
  -F "file=@national_id.jpg" \
  -F "documentType=national_id_front"
```

### Test 4: Admin Review (requires auth token)

```bash
# First login as admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'

# Then review application
curl -X POST http://localhost:3000/api/admin/observers/applications/{id}/review \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "notes": "All documents verified"
  }'
```

---

## 🌐 Testing the Frontend

### Access the Mobile App

1. Open browser: `http://localhost:5173/mobile/register`
2. Fill out registration form (4 steps)
3. Submit and get tracking number
4. Track application: `http://localhost:5173/mobile/track/OBS-YYYY-XXXXXX`

### Admin Testing

1. Login as admin: `http://localhost:5173/login`
2. Navigate to: `/admin/observers/applications` (TODO: Create this view in Phase 2)
3. Review and approve applications

---

## ⚠️ Important Notes

### What's NOT Implemented Yet (Coming in Phase 2-3)

**Phase 2 (Week 2) - Pending**:

- [ ] Admin interface for viewing/reviewing applications
- [ ] Polling station assignment functionality
- [ ] Assignment coverage dashboard
- [ ] Geographic scope validation UI

**Phase 3 (Week 3) - Pending**:

- [ ] Mobile result submission PWA
- [ ] Offline data storage (IndexedDB)
- [ ] Service Worker for offline mode
- [ ] Form 34A photo upload
- [ ] Background sync
- [ ] GPS validation

### Current Limitations

1. **Email Service**:

   - Currently just logs to console
   - TODO: Implement with actual provider (Nodemailer, SendGrid, AWS SES)

2. **MinIO Buckets**:

   - Auto-created on first upload
   - Ensure MinIO is running: `docker ps | grep minio`

3. **Rate Limiting**:

   - In-memory store (resets on restart)
   - TODO: Implement with Redis for production

4. **Document Validation**:
   - Basic file type and size validation
   - TODO: Add virus scanning in production

---

## 🐛 Troubleshooting

### Issue: Migration Fails

```bash
# Check database connection
cd backend
npx prisma db push --skip-generate

# If fails, check DATABASE_URL in .env
# Ensure PostgreSQL is running
docker ps | grep postgres
```

### Issue: MinIO Connection Fails

```bash
# Check MinIO is running
docker ps | grep minio

# Verify credentials in .env
# Try manual connection test
```

### Issue: Frontend Can't Connect to Backend

```bash
# Check backend is running on port 3000
# Check CORS configuration in server.ts
# Verify API URL in frontend/src/utils/api.ts
```

### Issue: TypeScript Errors

```bash
# Regenerate Prisma client
cd backend
npx prisma generate

# Check imports in frontend
cd ../frontend
npm run type-check
```

---

## ✅ Next Steps

### Immediate (After Phase 1 is working):

1. Test complete registration flow
2. Test document uploads
3. Test password setup
4. Verify emails are logging correctly

### Phase 2 (Week 2):

1. Create admin review interface
2. Implement polling station assignment
3. Add observer management dashboard
4. Test approval workflow end-to-end

### Phase 3 (Week 3):

1. Implement PWA features (Service Worker, IndexedDB)
2. Create result submission forms
3. Add offline sync
4. Implement Form 34A photo upload

---

## 📞 Questions or Issues?

If you encounter any issues:

1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure all services are running (PostgreSQL, MinIO, Redis)
4. Check network requests in browser dev tools

---

**Status**: ✅ Phase 1 Backend & Frontend Complete - Ready for Testing
**Next**: Test and debug, then proceed to Phase 2
