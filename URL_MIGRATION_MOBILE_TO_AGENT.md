# URL Migration: /mobile to /agent

## Overview

Migrated all observer/field agent registration URLs from `/mobile/*` to `/agent/*` for better semantic naming.

## Date

October 17, 2025

---

## Changes Summary

### Backend Routes

**Base URL Changed:** `/api/mobile` → `/api/agent`

| Old URL                                                     | New URL                                                    |
| ----------------------------------------------------------- | ---------------------------------------------------------- |
| `POST /api/mobile/register`                                 | `POST /api/agent/register`                                 |
| `GET /api/mobile/track/:trackingNumber`                     | `GET /api/agent/track/:trackingNumber`                     |
| `POST /api/mobile/setup-password`                           | `POST /api/agent/setup-password`                           |
| `POST /api/mobile/register/:trackingNumber/upload-document` | `POST /api/agent/register/:trackingNumber/upload-document` |
| `GET /api/mobile/geographic/counties`                       | `GET /api/agent/geographic/counties`                       |
| `GET /api/mobile/geographic/constituencies`                 | `GET /api/agent/geographic/constituencies`                 |
| `GET /api/mobile/geographic/wards`                          | `GET /api/agent/geographic/wards`                          |
| `GET /api/mobile/geographic/polling-stations`               | `GET /api/agent/geographic/polling-stations`               |

### Frontend Routes

**Base Path Changed:** `/mobile/*` → `/agent/*`

| Old Path                          | New Path                         |
| --------------------------------- | -------------------------------- |
| `/mobile/register`                | `/agent/register`                |
| `/mobile/success/:trackingNumber` | `/agent/success/:trackingNumber` |
| `/mobile/track/:trackingNumber?`  | `/agent/track/:trackingNumber?`  |
| `/mobile/setup-password`          | `/agent/setup-password`          |
| `/mobile/login`                   | `/agent/login`                   |
| `/mobile/dashboard`               | `/agent/dashboard`               |

---

## Files Modified

### Backend

1. ✅ `backend/src/server.ts` - Updated route registration
2. ✅ `backend/src/domains/mobile/email.service.ts` - Updated email links
3. ✅ `backend/src/domains/mobile/observer.controller.ts` - Updated route comments
4. ✅ `backend/src/domains/mobile/observer.routes.ts` - Updated route comments
5. ✅ `backend/src/domains/mobile/README.md` - Updated documentation

### Frontend

1. ✅ `frontend/src/router/index.ts` - Updated all route paths
2. ✅ `frontend/src/views/mobile/ObserverRegisterView.vue` - Updated API calls
3. ✅ `frontend/src/views/mobile/ObserverTrackingView.vue` - Updated API calls & links
4. ✅ `frontend/src/views/mobile/PasswordSetupView.vue` - Updated API calls & links
5. ✅ `frontend/src/views/mobile/ObserverLoginView.vue` - Updated links & redirect
6. ✅ `frontend/src/views/mobile/ObserverDashboardView.vue` - Updated logout redirect
7. ✅ `frontend/src/views/mobile/ObserverRegistrationSuccessView.vue` - Updated tracking link
8. ✅ `frontend/src/components/mobile/GeographicCascadeSelector.vue` - Updated geographic API calls

---

## Testing the Changes

### 1. Test Registration Flow

```bash
# New registration URL
curl -X POST http://localhost/api/agent/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "nationalId": "12345678",
    "dateOfBirth": "1990-01-01",
    "phoneNumber": "0712345678",
    "email": "john@example.com",
    "termsAccepted": true,
    "dataProcessingConsent": true
  }'
```

### 2. Test Tracking

```bash
# New tracking URL
curl http://localhost/api/agent/track/TRK-12345678
```

### 3. Test Frontend

Visit these URLs in your browser:

- Registration: `http://localhost/agent/register`
- Tracking: `http://localhost/agent/track`
- Login: `http://localhost/agent/login`
- Dashboard: `http://localhost/agent/dashboard`

---

## Email Links Updated

Email templates now use the new `/agent/*` URLs:

1. **Registration Confirmation Email**

   - Tracking link: `http://localhost/agent/track/{trackingNumber}`

2. **Password Setup Email**

   - Setup link: `http://localhost/agent/setup-password?token={token}`

3. **Welcome Email**
   - Login link: `http://localhost/agent/login`

---

## Backward Compatibility

⚠️ **Breaking Change:** Old `/mobile/*` URLs are no longer valid

If you have:

- Existing email links in sent emails
- Bookmarks or saved links
- External integrations

They will need to be updated to use `/agent/*` instead.

### Migration Strategy

If you need to support old URLs temporarily, add redirects in the router:

```typescript
// Redirect old /mobile routes to /agent
{
  path: '/mobile/register',
  redirect: '/agent/register',
},
{
  path: '/mobile/login',
  redirect: '/agent/login',
},
// etc...
```

---

## Deployment Checklist

Before deploying these changes:

- [ ] Update any external documentation
- [ ] Notify users about URL changes
- [ ] Update any bookmarks/shortcuts
- [ ] Test all registration flows
- [ ] Test email links
- [ ] Rebuild backend: `docker compose build api`
- [ ] Rebuild frontend: `docker compose build frontend`
- [ ] Restart services: `docker compose up -d`

---

## Summary

✅ All URLs migrated from `/mobile/*` to `/agent/*`  
✅ Backend routes updated  
✅ Frontend routes updated  
✅ API calls updated  
✅ Email templates updated  
✅ Documentation updated  
✅ No linting errors

The new agent registration system is now accessible at:
**http://localhost/agent/register**
