# System Configuration Management

## Overview

Complete system-wide configuration management system for the eTally Election Management System. Administrators manage all system settings through a centralized interface, including SMS delivery (Africa's Talking), legacy email placeholders, security settings, rate limiting, storage, database, and general application preferences.

**Implementation Date:** October 17, 2025  
**Status:** ✅ Production Ready

---

## Features

### Configuration Categories

1. **General** - Application-wide settings
2. **Security** - Authentication and session settings
3. **SMS Service** - Africa's Talking credentials for SMS notifications
4. **Email Service (legacy)** - Historical SMTP configuration (currently disabled)
5. **Notifications** - Notification preferences
6. **Rate Limiting** - API rate limit settings
7. **Storage** - File upload and storage settings
8. **Database** - Database connection settings

### Admin Interface

**Location:** Settings → Configurations

**Features:**

- Category-based organization with visual cards
- View, create, update, delete configurations
- Type-safe values (string, number, boolean, JSON)
- Required vs optional configurations
- Default value tracking
- Last modified audit trail
- Cannot delete required configurations
- Real-time updates (no server restart)

---

## Database Schema

```prisma
enum ConfigurationType {
  string
  number
  boolean
  json
}

model Configuration {
  id          String            @id @default(uuid())
  key         String            @unique
  name        String
  description String?
  value       String?
  type        ConfigurationType @default(string)
  category    String
  isRequired  Boolean           @default(false)
  isDefault   Boolean           @default(false)

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  lastModified DateTime  @default(now())
  modifiedBy   String?

  @@index([category])
  @@index([key])
  @@map("configurations")
}
```

---

## SMS Service Configurations

### Provider Settings

| Key                          | Type   | Description                                 | Example                        |
| ---------------------------- | ------ | ------------------------------------------- | ------------------------------ |
| sms_provider                 | string | SMS delivery provider (`africastalking`)    | africastalking                 |
| africastalking_username      | string | Africa's Talking application username       | etallyApp                      |
| africastalking_api_key       | string | Africa's Talking API key (stored encrypted) | key-XXXXXXXXXXXXXXXXXXXXXXXX   |
| africastalking_sender_id     | string | Registered sender ID (optional)             | ETALLY                         |
| africastalking_masked_number | string | Short code or masked number (optional)      | 12345                          |
| africastalking_telco         | string | Preferred telco for SMS routing (optional)  | Safaricom                      |
| africastalking_base_url      | string | API base URL                                | https://api.africastalking.com |
| africastalking_bulk_endpoint | string | Bulk messaging endpoint                     | /version1/messaging/bulk       |
| sms_max_retry                | number | Maximum retry attempts for failed sends     | 3                              |
| sms_timeout                  | number | Request timeout in seconds                  | 30                             |

### Setup Guide

1. Create or log in to your Africa's Talking account.
2. Generate an application username and API key from the dashboard.
3. (Optional) Provision a sender ID, short code, or specify a preferred telco.
4. Add the username, API key, and optional overrides to the configuration table.
5. Save the configuration and send a test SMS from the admin interface to confirm delivery.
6. When using the sandbox environment, authorize recipient phone numbers via the Africa's Talking console before testing.

> **Legacy Email Settings:** Email configuration keys remain in the database for historical reference and potential future use, but all notifications are currently delivered via SMS.

### Testing Configuration

- **Frontend:** Open `Settings → System Configurations → SMS Service` and use the “Send Test SMS” card to confirm delivery via Africa's Talking.
- **API:** `POST /api/v1/configurations/sms/test` (body: `{ "phoneNumber": "+254711000000", "message": "Test message" }`). Requires `super_admin` role.

---

## API Reference

**Base URL:** `/api/v1/configurations`  
**Authentication:** Required (super_admin only)

### Endpoints

| Method | Endpoint              | Description                |
| ------ | --------------------- | -------------------------- |
| GET    | `/`                   | Get all configurations     |
| POST   | `/`                   | Create configuration       |
| POST   | `/bulk`               | Bulk create configurations |
| GET    | `/categories/list`    | Get categories with counts |
| GET    | `/category/:category` | Get by category            |
| GET    | `/key/:key`           | Get by key                 |
| PATCH  | `/key/:key`           | Update value by key        |
| GET    | `/:id`                | Get by ID                  |
| PUT    | `/:id`                | Update configuration       |
| DELETE | `/:id`                | Delete configuration       |
| POST   | `/:id/reset`          | Reset to default           |

### Usage Examples

**Get SMS Configurations:**

```bash
curl http://localhost:3000/api/v1/configurations/category/sms \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Update SMS Timeout:**

```bash
curl -X PATCH http://localhost:3000/api/v1/configurations/key/sms_timeout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
-d '{"value": "45"}'
```

---

## Integration with SMS Service

The SMS service (`backend/src/domains/mobile/sms.service.ts`) automatically fetches Africa's Talking configuration from the database and delivers notifications:

```typescript
// Fetch and cache configuration
const config = await this.getSmsConfig();

// Build payload according to Africa's Talking API
const payload = {
  username: config.username,
  message,
  phoneNumbers: recipients,
  senderId: config.senderId,
  maskedNumber: config.maskedNumber,
  telco: config.telco,
};

// POST to configured endpoint with API key header
await fetch(`${config.apiBaseUrl}${config.bulkEndpoint}`, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    apiKey: config.apiKey,
  },
  body: JSON.stringify(payload),
});
```

**Configuration Caching:**

- 5-minute TTL to reduce database queries
- Automatic cache invalidation when configurations are updated
- Transparent to all SMS sending code

---

## Deployment

### Step 1: Run Migration

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### Step 2: Seed Default Configurations

```bash
cd backend
npx ts-node prisma/seeds/configurations.seed.ts
```

Seeds 23 default configurations across all categories.

### Step 3: Configure SMS Service

Via Admin UI:

1. Login as super_admin
2. Settings → Configurations → SMS Service
3. Update Africa's Talking credentials
4. Save (no restart needed) and send a test SMS

---

## Security Features

- ✅ Authentication required (JWT)
- ✅ Role-based access (super_admin only)
- ✅ Required configurations cannot be deleted
- ✅ Audit trail (modifiedBy, lastModified)
- ✅ Type validation before storage
- ⚠️ TODO: Encrypt sensitive values (passwords)

---

## Summary

✅ **23** default configurations seeded  
✅ **8** configuration categories  
✅ **10** legacy email settings preserved for future use  
✅ **11** API endpoints  
✅ Beautiful admin UI  
✅ Dynamic SMS service integration  
✅ No server restart required for changes  
✅ Production ready

**Location:** `documentation/domains/configurations/system-configuration-management.md`
