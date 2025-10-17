# Field Observer PWA - Quick Start Guide

## 🚀 Phase 1 Complete - Observer Registration System

All code for Phase 1 (Observer Registration) has been implemented and is ready for testing!

---

## ⚡ Quick Start (5 minutes)

### 1. Run Database Migration

```bash
cd backend
npx prisma migrate dev --name add_observer_registration
npx prisma generate
```

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

Backend will start on: `http://localhost:3000`

### 3. Start Frontend (in new terminal)

```bash
cd frontend
npm run dev
```

Frontend will start on: `http://localhost:5173`

---

## 🧪 Test the Application

### Test Flow 1: Observer Registration (Public)

1. **Open registration page**: `http://localhost:5173/mobile/register`

2. **Fill out form** (4 steps):

   - Step 1: Personal Info (name, ID, DOB, phone, email)
   - Step 2: Preferred Location (optional)
   - Step 3: Upload Documents (ID front/back, photo)
   - Step 4: Accept Terms

3. **Submit** and get tracking number (e.g., `OBS-2024-123456`)

4. **Track application**: `http://localhost:5173/mobile/track/OBS-2024-123456`

### Test Flow 2: Admin Approval (Phase 2 - UI pending)

Use API directly for now:

```bash
# 1. Login as admin
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin_password"}' \
  | jq -r '.accessToken')

# 2. Get applications list
curl http://localhost:3000/api/admin/observers/applications \
  -H "Authorization: Bearer $TOKEN"

# 3. Approve application
curl -X POST http://localhost:3000/api/admin/observers/applications/{id}/review \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "notes": "Documents verified"
  }'
```

### Test Flow 3: Password Setup

1. **Check email logs** in backend console for password setup link
2. **Extract token** from URL
3. **Open**: `http://localhost:5173/mobile/setup-password?token={token}`
4. **Set password** (must meet requirements)
5. **Login**: `http://localhost:5173/mobile/login`

---

## 📁 File Structure Created

```
etally2/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma (UPDATED - new models added)
│   └── src/
│       ├── domains/
│       │   └── mobile/
│       │       ├── observer.types.ts
│       │       ├── observer.validator.ts
│       │       ├── observer.service.ts
│       │       ├── observer.controller.ts
│       │       ├── observer.routes.ts
│       │       ├── email.service.ts
│       │       ├── minio.service.ts
│       │       ├── index.ts
│       │       └── README.md
│       ├── infrastructure/
│       │   └── middleware/
│       │       └── rate-limit.middleware.ts
│       └── server.ts (UPDATED - mobile routes added)
│
├── frontend/
│   └── src/
│       ├── views/
│       │   └── mobile/
│       │       ├── ObserverRegisterView.vue
│       │       ├── ObserverRegistrationSuccessView.vue
│       │       ├── ObserverTrackingView.vue
│       │       ├── PasswordSetupView.vue
│       │       ├── ObserverLoginView.vue
│       │       └── ObserverDashboardView.vue
│       └── router/
│           └── index.ts (UPDATED - mobile routes added)
│
└── mobile/
    └── QUICKSTART.md (this file)
```

---

## 🔧 Configuration Checklist

- [ ] PostgreSQL running (`docker ps | grep postgres`)
- [ ] MinIO running (`docker ps | grep minio`)
- [ ] Database migrated (`npx prisma migrate dev`)
- [ ] Environment variables set (`.env` file)
- [ ] Backend server running (port 3000)
- [ ] Frontend dev server running (port 5173)

---

## 📝 What to Test

### Registration Form

- [ ] All form fields validate correctly
- [ ] National ID format validation (7-8 digits)
- [ ] Phone number format validation (Kenyan format)
- [ ] Age validation (must be 18+)
- [ ] Email format validation
- [ ] Document upload (JPG/PNG only)
- [ ] File size limits (5MB ID, 2MB photo)
- [ ] Terms & consent checkboxes required
- [ ] Tracking number generated

### Application Tracking

- [ ] Can track by tracking number
- [ ] Shows correct status
- [ ] Displays submission date
- [ ] Shows next steps

### Admin Review (API)

- [ ] Can list applications
- [ ] Can approve application
- [ ] User account created on approval
- [ ] Password setup token generated
- [ ] Email sent (check logs)

### Password Setup

- [ ] Token validation works
- [ ] Password requirements enforced
- [ ] Password confirmation works
- [ ] Token expires after use
- [ ] Account activated after setup
- [ ] Can login after setup

---

## 🎯 Success Criteria

Phase 1 is complete when:

- ✅ Public can register without authentication
- ✅ Documents upload successfully to MinIO
- ✅ Admin can approve applications via API
- ✅ User account created with field_observer role
- ✅ Password setup works correctly
- ✅ Observer can login after activation
- ✅ All validations working
- ✅ No critical bugs

---

## 🔜 Next: Phase 2 (Week 2)

After testing Phase 1, we'll implement:

- Admin UI for reviewing applications
- Polling station assignment interface
- Assignment management dashboard
- Geographic scope validation
- Observer management features

---

## 💡 Tips

1. **Email Testing**: Check backend console for email content (not actually sent yet)
2. **MinIO Access**: `http://localhost:9001` (MinIO console)
3. **Database**: Use Prisma Studio: `npx prisma studio`
4. **API Testing**: Use Postman or Thunder Client
5. **Frontend Debug**: Use Vue DevTools browser extension

---

## 🐛 Common Issues

**Issue**: Prisma migration fails

- **Solution**: Check DATABASE_URL in .env, ensure PostgreSQL is running

**Issue**: Cannot upload files

- **Solution**: Check MinIO is running and credentials are correct

**Issue**: Routes not found (404)

- **Solution**: Restart backend server after adding routes

**Issue**: CORS errors

- **Solution**: Check CORS_ORIGIN in .env includes `http://localhost:5173`

---

**Ready to test!** 🚀

Start with: `http://localhost:5173/mobile/register`
