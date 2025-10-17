# Registration Validation 400 Error Fix

## Issue

Registration form was failing with HTTP 400 Bad Request error without showing a clear error message.

## Root Cause

The backend Zod validator expects optional UUID fields to be either:

- A valid UUID string, OR
- `undefined`

But the frontend was sending **empty strings** `""` for unselected optional fields.

### Backend Validator

```typescript
// backend/src/domains/mobile/observer.validator.ts
preferredCountyId: z.string().uuid().optional(),
preferredConstituencyId: z.string().uuid().optional(),
preferredWardId: z.string().uuid().optional(),
preferredStationId: z.string().uuid().optional(),
```

### Frontend Before Fix

```typescript
// Sent this:
{
  preferredCountyId: "",  // ❌ Empty string is not a valid UUID
  preferredConstituencyId: "",
  preferredWardId: "",
  preferredStationId: ""
}
```

### Validation Error

When Zod received empty strings for UUID fields, it returned:

```
HTTP 400 Bad Request
"Invalid UUID format"
```

## Solution

Convert empty strings to `undefined` before sending to the backend:

### Frontend After Fix

```typescript
// frontend/src/views/mobile/ObserverRegisterView.vue
const registrationData = {
  ...form.value,
  dateOfBirth: new Date(form.value.dateOfBirth).toISOString(),
  // Convert empty strings to undefined for optional fields
  preferredCountyId: form.value.preferredCountyId || undefined,
  preferredConstituencyId: form.value.preferredConstituencyId || undefined,
  preferredWardId: form.value.preferredWardId || undefined,
  preferredStationId: form.value.preferredStationId || undefined,
};
```

Now it sends:

```typescript
{
  preferredCountyId: undefined,  // ✅ Optional field omitted
  preferredConstituencyId: undefined,
  preferredWardId: undefined,
  preferredStationId: undefined
}
```

## How It Works

The JavaScript `||` operator returns the right operand if the left is falsy:

```typescript
'' || undefined; // → undefined (empty string is falsy)
'some-uuid' || undefined; // → "some-uuid" (truthy value kept)
```

When sent via JSON, `undefined` values are **omitted** from the object, which is what the backend expects for optional fields.

## Testing

### Test Case 1: Registration Without Preferred Location

1. Fill in personal information
2. **Skip Step 2** (Preferred Location) - don't select anything
3. Upload profile photo
4. Accept terms
5. Submit
6. **Expected:** ✅ Registration succeeds

### Test Case 2: Registration With County Only

1. Fill in personal information
2. Select county but not constituency/ward/station
3. Upload profile photo
4. Accept terms
5. Submit
6. **Expected:** ✅ Registration succeeds with county saved

### Test Case 3: Registration With Full Location

1. Fill in personal information
2. Select county → constituency → ward → station
3. Upload profile photo
4. Accept terms
5. Submit
6. **Expected:** ✅ Registration succeeds with full location hierarchy saved

## Files Modified

**File:** `/frontend/src/views/mobile/ObserverRegisterView.vue`

**Lines:** 339-342 added

```typescript
// Convert empty strings to undefined for optional fields
preferredCountyId: form.value.preferredCountyId || undefined,
preferredConstituencyId: form.value.preferredConstituencyId || undefined,
preferredWardId: form.value.preferredWardId || undefined,
preferredStationId: form.value.preferredStationId || undefined,
```

## Alternative Solutions Considered

### 1. Change Validator to Accept Empty Strings ❌

```typescript
// NOT RECOMMENDED
preferredCountyId: z.string().uuid().or(z.literal('')).optional();
```

**Rejected:** Makes validation more complex and allows invalid data

### 2. Frontend Validation Before Submit ❌

```typescript
// NOT RECOMMENDED
if (!isValidUUID(form.value.preferredCountyId)) {
  delete registrationData.preferredCountyId;
}
```

**Rejected:** Duplicates validation logic, harder to maintain

### 3. Clean Data on Frontend (Chosen) ✅

```typescript
// BEST APPROACH
preferredCountyId: form.value.preferredCountyId || undefined;
```

**Benefits:**

- Simple and clean
- No validation duplication
- Works with existing backend
- Clear intent

## Related Validation Rules

All fields validated by `ObserverRegistrationSchema`:

### Required Fields

- ✅ `firstName`: 2-100 characters, letters only
- ✅ `lastName`: 2-100 characters, letters only
- ✅ `nationalId`: 7-8 digits
- ✅ `dateOfBirth`: ISO datetime, age 18-100
- ✅ `phoneNumber`: Kenyan format (+254XXXXXXXXX or 07XXXXXXXX)
- ✅ `email`: Valid email address
- ✅ `termsAccepted`: Must be true
- ✅ `dataProcessingConsent`: Must be true

### Optional Fields (Now Fixed)

- ✅ `preferredCountyId`: UUID or undefined
- ✅ `preferredConstituencyId`: UUID or undefined
- ✅ `preferredWardId`: UUID or undefined
- ✅ `preferredStationId`: UUID or undefined

## Summary

✅ **Fixed:** Empty strings converted to undefined for optional UUID fields  
✅ **Impact:** Registration now works with or without preferred location  
✅ **Validation:** Backend Zod validation passes correctly  
✅ **No breaking changes:** Existing functionality preserved

Users can now successfully register as observers whether they select a preferred location or skip that step entirely!
