# Geographic Endpoint Path Fix

## Issue

The county dropdown in the registration form had no options because of an incorrect API path configuration.

## Root Cause

### Backend Route Structure

The server defines routes as:

```typescript
app.use('/api/v1/auth', authRouter); // Admin/auth endpoints
app.use('/api/v1/geographic', geographicRouter); // Admin geographic endpoints
app.use('/api/mobile', observerRoutes); // Mobile observer endpoints (public)
```

Mobile endpoints are at: `/api/mobile/*`  
Admin endpoints are at: `/api/v1/*`

### Frontend API Client Configuration

```typescript
// frontend/src/utils/api.ts
const api = axios.create({
  baseURL: '/api/v1', // Default base URL for admin endpoints
});
```

### The Problem

The `GeographicCascadeSelector` component was calling:

```typescript
api.get('/api/mobile/geographic/counties');
```

With `baseURL: '/api/v1'`, this became:

```
/api/v1 + /api/mobile/geographic/counties
= /api/v1/api/mobile/geographic/counties  ❌ WRONG!
```

The correct path should be:

```
/api/mobile/geographic/counties  ✅ CORRECT!
```

## Solution

Override the `baseURL` for mobile geographic endpoints by passing it as an axios config option:

```typescript
// Before
const response = await api.get('/api/mobile/geographic/counties');

// After
const response = await api.get('/mobile/geographic/counties', {
  baseURL: '/api', // Override to use /api instead of /api/v1
});
```

This constructs the correct path:

```
/api + /mobile/geographic/counties
= /api/mobile/geographic/counties  ✅ CORRECT!
```

## Files Modified

### `/frontend/src/components/mobile/GeographicCascadeSelector.vue`

Updated all 4 geographic API calls:

1. **Load counties** (on component mount):

```typescript
const response = await api.get('/mobile/geographic/counties', {
  baseURL: '/api',
});
```

2. **Load constituencies** (when county selected):

```typescript
const response = await api.get(
  `/mobile/geographic/constituencies?countyId=${value}`,
  {
    baseURL: '/api',
  }
);
```

3. **Load wards** (when constituency selected):

```typescript
const response = await api.get(
  `/mobile/geographic/wards?constituencyId=${value}`,
  {
    baseURL: '/api',
  }
);
```

4. **Load polling stations** (when ward selected):

```typescript
const response = await api.get(
  `/mobile/geographic/polling-stations?wardId=${value}`,
  {
    baseURL: '/api',
  }
);
```

## Why This Approach?

### Alternative Solutions Considered

1. **Change baseURL globally** ❌

   - Would break all admin endpoints that use `/api/v1`
   - Requires changes across entire app

2. **Use absolute URLs** ❌

   ```typescript
   axios.get('http://localhost:3000/api/mobile/...');
   ```

   - Hard-codes domain
   - Doesn't work across environments

3. **Create separate axios instance** ❌

   ```typescript
   const mobileApi = axios.create({ baseURL: '/api/mobile' });
   ```

   - Loses auth interceptors
   - Duplicates configuration

4. **Override baseURL per request** ✅ **CHOSEN**
   - Minimal changes required
   - Works with existing auth system
   - Maintains interceptors
   - Clean and maintainable

## Testing

### Manual Test

1. Navigate to registration: `http://localhost:5173/mobile/register`
2. Go to Step 2: "Preferred Location"
3. Click "Preferred County" dropdown
4. **Verify**: Counties appear in dropdown

### Network Tab Verification

Open browser DevTools → Network tab:

**Before Fix:**

```
GET /api/v1/api/mobile/geographic/counties → 404 Not Found
```

**After Fix:**

```
GET /api/mobile/geographic/counties → 200 OK
Response: { "success": true, "data": [...counties...] }
```

### Console Verification

Check browser console for:

```
✅ No "Failed to load counties" errors
✅ Counties loaded successfully
```

## Benefits

✅ **Registration works**: Users can now select geographic locations  
✅ **Minimal changes**: Only modified one component  
✅ **Maintains security**: Auth interceptors still work  
✅ **No breaking changes**: Admin endpoints unaffected  
✅ **Clean solution**: Explicit baseURL override is clear and maintainable

## Related Documentation

- See `PUBLIC_GEOGRAPHIC_ENDPOINTS.md` for endpoint details
- See `MOBILE_VIEWS_REFACTOR_SUMMARY.md` for component structure

## Future Improvements

Consider standardizing API paths:

### Option 1: Unified Base Path

Move all endpoints under `/api/v1`:

```typescript
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/geographic', geographicRouter);
app.use('/api/v1/mobile', observerRoutes); // Changed from /api/mobile
```

### Option 2: Separate Mobile API

Use subdomain or path prefix:

```typescript
// Mobile app uses different base
mobileBaseURL: '/api/mobile';
adminBaseURL: '/api/v1';
```

### Option 3: API Gateway Pattern

Single entry point with routing:

```typescript
app.use('/api', apiRouter); // Routes to appropriate service
```

For now, the per-request baseURL override is the pragmatic solution.
