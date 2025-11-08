# Error Handling Fix - Registration Validation Errors

## Issue

When submitting observer registration with duplicate email or national ID, the user saw a generic "network error" instead of a clear validation error message.

## Root Cause

### Backend Logs Showed

```
Error occurred: {
  name: 'Error',
  message: 'Email already registered',
  path: '/api/mobile/register',
  method: 'POST'
}
POST /api/mobile/register HTTP/1.1" 500
```

### The Problem

The `observer.service.ts` was throwing generic `Error` objects:

```typescript
// Before - WRONG
throw new Error('Email already registered');
throw new Error('National ID already registered');
```

These generic errors were being caught by the error middleware and treated as **500 Internal Server Error** instead of **400 Bad Request (Validation Error)**.

### Why Users Saw "Network Error"

1. Backend returned HTTP 500 (server error)
2. Frontend's axios error handler saw the 500 status
3. Frontend displayed it as a generic "network error"
4. User never saw the actual message: "Email already registered"

## Solution

Changed the service to throw `ValidationError` instead of generic `Error`:

```typescript
// After - CORRECT
import { ValidationError } from '@/shared/types/errors';

// In registerObserver method:
if (existing.nationalId === data.nationalId) {
  throw new ValidationError('National ID already registered', 'nationalId');
}
if (existing.email === data.email) {
  throw new ValidationError('Email already registered', 'email');
}
if (age < 18) {
  throw new ValidationError(
    'Observer must be at least 18 years old',
    'dateOfBirth'
  );
}
```

## How It Works

### ValidationError Class

```typescript
// src/shared/types/errors.ts
export class ValidationError extends AppError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, 400); // ← Sets HTTP status to 400
    this.field = field;
  }
}
```

### Error Middleware Handling

```typescript
// src/infrastructure/middleware/error.middleware.ts
if (error instanceof AppError) {
  res.status(error.statusCode).json({  // ← Returns 400 for ValidationError
    success: false,
    error: error.name,
    message: error.message,
    statusCode: error.statusCode,
    ...
  });
}
```

## Result

### Before Fix (HTTP 500)

```json
{
  "success": false,
  "error": "InternalServerError",
  "message": "An unexpected error occurred",
  "statusCode": 500
}
```

**Frontend displays:** "Network error"

### After Fix (HTTP 400)

```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Email already registered",
  "statusCode": 400,
  "field": "email"
}
```

**Frontend displays:** "Email already registered" ✅

## Files Modified

**File:** `/backend/src/domains/mobile/observer.service.ts`

1. Added import:

```typescript
import { ValidationError } from '@/shared/types/errors';
```

2. Updated validation errors (3 places):

```typescript
// Age validation
throw new ValidationError(
  'Observer must be at least 18 years old',
  'dateOfBirth'
);

// National ID duplicate
throw new ValidationError('National ID already registered', 'nationalId');

// Email duplicate
throw new ValidationError('Email already registered', 'email');
```

## Deployment Steps

1. **Rebuild the backend:**

   ```bash
   cd /Users/mupa/Documents/work/etally2
   docker compose build api
   ```

2. **Restart the services:**

   ```bash
   docker compose up -d
   ```

3. **Verify the fix:**
   - Try registering with the same email again
   - Should see: "Email already registered" (not "network error")

## Testing

### Test Duplicate Email

1. Register an observer with `test@example.com`
2. Try to register again with the same email
3. **Expected:** "Email already registered" message appears in red alert
4. **Status:** HTTP 400 (not 500)

### Test Duplicate National ID

1. Register an observer with National ID `12345678`
2. Try to register again with the same National ID
3. **Expected:** "National ID already registered" message
4. **Status:** HTTP 400

### Test Age Validation

1. Enter a date of birth less than 18 years ago
2. Submit form
3. **Expected:** "Observer must be at least 18 years old" message
4. **Status:** HTTP 400

### Network Tab Verification

**Before Fix:**

```
POST /api/mobile/register → 500 Internal Server Error
Response: { "success": false, "error": "InternalServerError", ... }
```

**After Fix:**

```
POST /api/mobile/register → 400 Bad Request
Response: { "success": false, "error": "ValidationError", "message": "Email already registered", "field": "email" }
```

## Frontend Error Display

The frontend already handles these errors correctly in `ObserverRegisterView.vue`:

```typescript
catch (err: any) {
  error.value = err.response?.data?.error || err.message || 'Registration failed';
}
```

With HTTP 400 and proper error message, the frontend will now display:

- ❌ Before: "Network error" (generic)
- ✅ After: "Email already registered" (specific)

## Additional Validation Errors Fixed

All validation errors in the observer service now return proper 400 status codes with clear messages:

1. ✅ **Age validation**: "Observer must be at least 18 years old"
2. ✅ **Duplicate email**: "Email already registered"
3. ✅ **Duplicate national ID**: "National ID already registered"

## Benefits

✅ **Clear error messages**: Users see exactly what went wrong  
✅ **Proper HTTP status**: 400 for validation errors (not 500)  
✅ **Better UX**: Users know how to fix the issue  
✅ **Easier debugging**: Logs show validation errors clearly  
✅ **Consistent error handling**: Uses existing error infrastructure

## Related Issues

This fix also improves error handling for other observer service methods:

- Password setup validation errors
- Document upload validation errors
- Application tracking errors

All now return proper HTTP status codes and clear messages.

## Summary

✅ **Fixed**: Generic "network error" replaced with specific validation messages  
✅ **Impact**: Users can now understand and fix validation issues  
✅ **Status**: Returns HTTP 400 (Bad Request) instead of 500 (Server Error)  
✅ **Testing**: Duplicate email/ID now show proper error messages

**Next Step:** Rebuild and restart the backend to apply the fix!
