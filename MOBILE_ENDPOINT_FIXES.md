# Mobile Endpoint Fixes - Complete Summary

## Problem Overview

All mobile endpoints were returning **network errors** or **404 Not Found** due to incorrect URL construction caused by the API client's default `baseURL` configuration.

## Root Cause

### API Client Configuration

```typescript
// frontend/src/utils/api.ts
const api = axios.create({
  baseURL: '/api/v1', // Default for admin endpoints
});
```

### Backend Route Structure

```typescript
// backend/src/server.ts
app.use('/api/v1/auth', authRouter); // Admin: /api/v1/*
app.use('/api/v1/elections', electionRouter); // Admin: /api/v1/*
app.use('/api/mobile', observerRoutes); // Mobile: /api/mobile/*
```

### The Problem

When calling mobile endpoints:

```typescript
api.get('/api/mobile/track/123');
```

The baseURL is prepended:

```
/api/v1 + /api/mobile/track/123
= /api/v1/api/mobile/track/123  ❌ 404 Not Found
```

Should be:

```
/api/mobile/track/123  ✅ Correct
```

## Solution

Override the `baseURL` for all mobile endpoint calls by passing it in the axios config:

```typescript
api.get('/mobile/track/123', {
  baseURL: '/api', // Override default /api/v1
});
```

This constructs:

```
/api + /mobile/track/123
= /api/mobile/track/123  ✅ Correct
```

## All Fixed Endpoints

### 1. Geographic Endpoints (Public - No Auth Required)

**File:** `/frontend/src/components/mobile/GeographicCascadeSelector.vue`

#### GET Counties

```typescript
// Before
api.get('/api/mobile/geographic/counties');

// After
api.get('/mobile/geographic/counties', {
  baseURL: '/api',
});
```

#### GET Constituencies

```typescript
// Before
api.get(`/api/mobile/geographic/constituencies?countyId=${value}`);

// After
api.get(`/mobile/geographic/constituencies?countyId=${value}`, {
  baseURL: '/api',
});
```

#### GET Wards

```typescript
// Before
api.get(`/api/mobile/geographic/wards?constituencyId=${value}`);

// After
api.get(`/mobile/geographic/wards?constituencyId=${value}`, {
  baseURL: '/api',
});
```

#### GET Polling Stations

```typescript
// Before
api.get(`/api/mobile/geographic/polling-stations?wardId=${value}`);

// After
api.get(`/mobile/geographic/polling-stations?wardId=${value}`, {
  baseURL: '/api',
});
```

### 2. Registration Endpoints

**File:** `/frontend/src/views/mobile/ObserverRegisterView.vue`

#### POST Register Observer

```typescript
// Before
api.post('/api/mobile/register', registrationData);

// After
api.post('/mobile/register', registrationData, {
  baseURL: '/api',
});
```

#### POST Upload Document

```typescript
// Before
api.post(`/api/mobile/register/${trackingNumber}/upload-document`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// After
api.post(`/mobile/register/${trackingNumber}/upload-document`, formData, {
  baseURL: '/api',
  headers: { 'Content-Type': 'multipart/form-data' },
});
```

### 3. Tracking Endpoints

**File:** `/frontend/src/views/mobile/ObserverTrackingView.vue`

#### GET Track Application

```typescript
// Before
api.get(`/api/mobile/track/${number}`);

// After
api.get(`/mobile/track/${number}`, {
  baseURL: '/api',
});
```

### 4. Password Setup Endpoints

**File:** `/frontend/src/views/mobile/PasswordSetupView.vue`

#### POST Setup Password

```typescript
// Before
api.post('/api/mobile/setup-password', {
  token: token.value,
  password: form.value.password,
  confirmPassword: form.value.confirmPassword,
});

// After
api.post(
  '/mobile/setup-password',
  {
    token: token.value,
    password: form.value.password,
    confirmPassword: form.value.confirmPassword,
  },
  {
    baseURL: '/api',
  }
);
```

## Files Modified

| File                            | Endpoints Fixed | Lines Changed |
| ------------------------------- | --------------- | ------------- |
| `GeographicCascadeSelector.vue` | 4 GET requests  | ~20 lines     |
| `ObserverRegisterView.vue`      | 2 POST requests | ~10 lines     |
| `ObserverTrackingView.vue`      | 1 GET request   | ~5 lines      |
| `PasswordSetupView.vue`         | 1 POST request  | ~10 lines     |
| **Total**                       | **8 endpoints** | **~45 lines** |

## Testing Checklist

### ✅ Registration Flow

1. Navigate to: `http://localhost:5173/mobile/register`
2. Fill in Step 1: Personal Information
3. Fill in Step 2: Preferred Location (dropdowns should load)
4. Upload Step 3: Profile Photo
5. Accept Step 4: Terms & Consent
6. Click "Submit Application"
7. **Expected:** Success redirect to tracking page

### ✅ Geographic Cascade

1. On Step 2 of registration
2. Click "Preferred County" dropdown
3. **Expected:** Counties appear
4. Select a county
5. **Expected:** Constituencies appear
6. Select constituency
7. **Expected:** Wards appear
8. Select ward
9. **Expected:** Polling stations appear

### ✅ Application Tracking

1. Navigate to: `http://localhost:5173/mobile/track`
2. Enter tracking number (e.g., `OBS-2024-001234`)
3. Click "Track"
4. **Expected:** Application status displays

### ✅ Password Setup

1. Receive password setup email (from approved application)
2. Click setup link with token
3. Enter new password
4. Click "Set Password & Activate Account"
5. **Expected:** Success message, redirect to login

## Network Verification

Open browser DevTools → Network tab and verify:

### Before Fixes

```
GET /api/v1/api/mobile/geographic/counties → 404 Not Found
POST /api/v1/api/mobile/register → 404 Not Found
GET /api/v1/api/mobile/track/123 → 404 Not Found
```

### After Fixes

```
GET /api/mobile/geographic/counties → 200 OK
POST /api/mobile/register → 200 OK (returns trackingNumber)
GET /api/mobile/track/123 → 200 OK (returns application data)
POST /api/mobile/register/OBS-2024-001234/upload-document → 200 OK
POST /api/mobile/setup-password → 200 OK
```

## Why This Approach?

### Advantages ✅

- **Minimal changes**: Only affected mobile views
- **Maintains auth**: Existing auth interceptors still work
- **Explicit**: baseURL override is clear in code
- **No breaking changes**: Admin endpoints unaffected
- **Easy to maintain**: Clear pattern for future mobile endpoints

### Alternatives Considered ❌

1. **Change global baseURL**
   - Would break all admin endpoints
2. **Create separate axios instance**
   - Loses auth interceptors
   - Duplicates configuration
3. **Use absolute URLs**
   - Hard-codes domain
   - Doesn't work across environments

## Future Improvements

### Option 1: Standardize All Paths

Move all endpoints under `/api/v1`:

```typescript
app.use('/api/v1/mobile', observerRoutes); // Instead of /api/mobile
```

**Pros:** One baseURL works everywhere  
**Cons:** Backend breaking change, needs coordination

### Option 2: Environment-based BaseURL

Use different baseURLs per context:

```typescript
const baseURL = import.meta.env.VITE_MOBILE_API_URL || '/api/mobile';
const mobileApi = axios.create({ baseURL });
```

**Pros:** Flexible, can use different servers  
**Cons:** Requires separate axios instance

### Option 3: Smart API Client

Detect mobile routes and auto-adjust:

```typescript
api.interceptors.request.use((config) => {
  if (config.url?.startsWith('/mobile/')) {
    config.baseURL = '/api';
  }
  return config;
});
```

**Pros:** Automatic, DRY principle  
**Cons:** Magic behavior, harder to debug

## Related Issues Fixed

1. ✅ **County dropdown empty** - Geographic endpoints now work
2. ✅ **Network error on submit** - Registration endpoint now works
3. ✅ **Tracking not working** - Tracking endpoint now works
4. ✅ **Password setup fails** - Setup endpoint now works

## Documentation

- See `GEOGRAPHIC_ENDPOINT_FIX.md` for geographic endpoints details
- See `UUID_GENERATOR_FIX.md` for crypto.randomUUID fix
- See `PUBLIC_GEOGRAPHIC_ENDPOINTS.md` for rate limiting details

## Summary

✅ **Fixed 8 mobile endpoints** across 4 components  
✅ **Registration flow works end-to-end**  
✅ **Geographic cascade works** (county → constituency → ward → station)  
✅ **Application tracking works**  
✅ **Password setup works**  
✅ **No breaking changes** to admin functionality  
✅ **No linter errors**

All mobile functionality is now fully operational! 🎉
