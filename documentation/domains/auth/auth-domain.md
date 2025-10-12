# Authentication Module

Complete authentication implementation for the Election Management System.

## Overview

This module provides secure authentication and authorization using JWT tokens, with support for:

- User registration and login
- Session management with refresh tokens
- Role-based access control (RBAC)
- Password management
- Redis caching for performance
- PostgreSQL Row-Level Security (RLS)

## Architecture

```
auth/
├── auth.service.ts      # Business logic (authentication, tokens, sessions)
├── auth.controller.ts   # HTTP request handling
├── auth.middleware.ts   # JWT verification & role-based access
├── auth.validator.ts    # Input validation with Zod schemas
├── auth.routes.ts       # Route definitions
└── README.md           # This file
```

## API Endpoints

### Public Endpoints

#### Register User

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "nationalId": "12345678",
  "email": "user@example.com",
  "phoneNumber": "+254712345678",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "field_observer",
      "isActive": true
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "a1b2c3..."
    }
  }
}
```

#### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "deviceInfo": {
    "deviceName": "John's iPhone",
    "deviceModel": "iPhone 14 Pro",
    "osVersion": "iOS 17.1",
    "appVersion": "1.0.0"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "a1b2c3..."
    }
  }
}
```

#### Refresh Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "a1b2c3..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGc..."
  }
}
```

#### Logout

```http
POST /api/v1/auth/logout
Content-Type: application/json

{
  "refreshToken": "a1b2c3..."
}
```

### Protected Endpoints

#### Get Profile

```http
GET /api/v1/auth/profile
Authorization: Bearer eyJhbGc...
```

**Response:**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "nationalId": "12345678",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "field_observer",
    "isActive": true,
    "lastLogin": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Change Password

```http
PUT /api/v1/auth/change-password
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

## Middleware Usage

### Protect Routes

```typescript
import { authenticate } from '@/domains/auth/auth.middleware';

router.get('/protected', authenticate, handler);
```

### Role-Based Access

```typescript
import { authenticate, requireRoles } from '@/domains/auth/auth.middleware';

// Require specific roles
router.get(
  '/admin-only',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  handler
);

// Shorthand for admin access
import { requireAdmin } from '@/domains/auth/auth.middleware';
router.get('/admin', authenticate, requireAdmin, handler);
```

### Resource Ownership

```typescript
import {
  authenticate,
  requireOwnershipOrAdmin,
} from '@/domains/auth/auth.middleware';

// User can only access their own data, unless they're admin
router.put('/users/:userId', authenticate, requireOwnershipOrAdmin(), handler);
```

## Security Features

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&\*(),.?":{}|<>)

### Account Lockout

- Account locked after 5 failed login attempts
- User must contact support to unlock

### Token Management

- Access tokens expire in 15 minutes (configurable)
- Refresh tokens expire in 7 days (configurable)
- Tokens stored in database sessions
- Can be revoked by logging out

### Password Security

- Passwords hashed using bcrypt with 12 rounds
- Never stored in plain text
- Old password required to change

## User Roles

- `super_admin` - Full system access
- `election_manager` - Manage elections and users
- `field_observer` - Submit results and reports (default)
- `public_viewer` - Read-only access to public data

## Validation Rules

### National ID

- Must be 7 or 8 digits
- Unique per user

### Email

- Must be valid email format
- Unique per user

### Phone Number

- Must be valid Kenyan number format: +254XXXXXXXXX
- Optional field

### Names

- Minimum 2 characters
- Maximum 100 characters
- Only letters, spaces, hyphens, and apostrophes allowed

## Error Handling

### Authentication Errors (401)

- Invalid credentials
- Token expired
- Token invalid
- Account deactivated
- Account locked

### Validation Errors (400)

- Invalid input format
- Missing required fields
- Password doesn't meet requirements

### Conflict Errors (409)

- Email already registered
- National ID already registered

## Caching Strategy

- User profiles cached in Redis for 1 hour
- Automatically invalidated on:
  - Password change
  - User logout
  - User data update

## Testing

Run tests:

```bash
npm test src/domains/auth/
```

Run integration tests:

```bash
npm run test:integration
```

## Environment Variables

Required:

```env
JWT_SECRET=your_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
```

Optional:

```env
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
MIN_PASSWORD_LENGTH=8
```

## Best Practices

1. **Always use HTTPS in production**
2. **Set strong JWT secrets** (at least 32 characters)
3. **Enable Redis caching** for better performance
4. **Monitor failed login attempts** for security threats
5. **Regularly rotate secrets** in production
6. **Use refresh token rotation** for enhanced security (TODO)
7. **Implement MFA** for admin accounts (TODO)

## Future Enhancements

- [ ] Two-factor authentication (2FA/MFA)
- [ ] Email verification on registration
- [ ] Password reset via email
- [ ] OAuth2 integration (Google, Facebook)
- [ ] Refresh token rotation
- [ ] Device management (list and revoke)
- [ ] Login history and audit trail
- [ ] IP-based rate limiting
- [ ] Suspicious activity detection

## Dependencies

- `@prisma/client` - Database ORM
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT token generation/verification
- `ioredis` - Redis caching
- `zod` - Input validation

## Related Documentation

- [Technical Considerations](../../../../technical%20considerations.txt)
- [Development Guard Rails](../../../../change.txt)
- [Database Schema](../../../prisma/schema.prisma)
