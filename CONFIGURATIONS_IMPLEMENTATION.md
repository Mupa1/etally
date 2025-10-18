# System Configurations Implementation

## Overview

Complete implementation of a system-wide configuration management system for the eTally Election Management System. This feature allows administrators to manage all system settings through a centralized interface, including email service (SMTP) configurations, security settings, rate limiting, storage, database, and general application settings.

## Implementation Date

October 17, 2025

---

## 1. Database Schema

### Configuration Model

Added to `backend/prisma/schema.prisma`:

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
  value       String? // Stored as string, parsed based on type
  type        ConfigurationType @default(string)
  category    String // general, security, email, notifications, rate-limiting, storage, database
  isRequired  Boolean           @default(false)
  isDefault   Boolean           @default(false)

  // Audit fields
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  lastModified DateTime  @default(now())
  modifiedBy   String? // User ID who last modified

  @@index([category])
  @@index([key])
  @@map("configurations")
}
```

**Run migration:**

```bash
cd backend
npx prisma migrate dev --name add_configuration_model
npx prisma generate
```

---

## 2. Backend Implementation

### File Structure

```
backend/src/domains/configurations/
├── configuration.service.ts      # Business logic & CRUD operations
├── configuration.controller.ts   # HTTP request handlers
├── configuration.routes.ts       # API route definitions
└── configuration.validator.ts    # Zod validation schemas
```

### Service Features (`configuration.service.ts`)

- **CRUD Operations:**
  - Create configuration
  - Get all configurations (with filters)
  - Get by ID
  - Get by key
  - Get by category
  - Update configuration
  - Update value by key
  - Delete configuration
- **Advanced Features:**
  - Type-safe value parsing (string, number, boolean, JSON)
  - Bulk create configurations
  - Reset to default values
  - Get categories with counts
  - Prevent deletion of required configurations

### API Endpoints

Base URL: `/api/v1/configurations`

| Method | Endpoint              | Description                       | Access      |
| ------ | --------------------- | --------------------------------- | ----------- |
| GET    | `/`                   | Get all configurations            | Super Admin |
| POST   | `/`                   | Create configuration              | Super Admin |
| POST   | `/bulk`               | Bulk create configurations        | Super Admin |
| GET    | `/categories/list`    | Get all categories with counts    | Super Admin |
| GET    | `/category/:category` | Get configurations by category    | Super Admin |
| GET    | `/key/:key`           | Get configuration by key          | Super Admin |
| PATCH  | `/key/:key`           | Update configuration value by key | Super Admin |
| GET    | `/:id`                | Get configuration by ID           | Super Admin |
| PUT    | `/:id`                | Update configuration              | Super Admin |
| DELETE | `/:id`                | Delete configuration              | Super Admin |
| POST   | `/:id/reset`          | Reset to default value            | Super Admin |

---

## 3. Frontend Implementation

### Updated Files

- `frontend/src/components/layout/Sidebar.vue` - Changed "Rate Limiting" to "Configurations"
- `frontend/src/router/index.ts` - Added `/settings/configurations` route
- `frontend/src/views/settings/ConfigurationsView.vue` - New configuration management page

### Features

- **Category-Based Organization:**

  - General
  - Security
  - Email Service (SMTP)
  - Notifications
  - Rate Limiting
  - Storage
  - Database

- **Visual Interface:**

  - Category cards with counts and status indicators
  - Settings list with detailed information
  - Value display with type indicators
  - Required/optional badges
  - Last modified timestamps
  - Custom/default value indicators

- **Operations:**

  - Add new configurations
  - Edit existing configurations
  - Delete non-required configurations
  - View configuration details
  - Refresh data
  - Search and filter

- **Form Support:**
  - Multiple value types (string, number, boolean, JSON)
  - Category selection
  - Required flag
  - Validation

---

## 4. Email Service Configurations

### Default SMTP Settings

The following email configurations are included:

| Key                  | Name              | Type    | Description                      |
| -------------------- | ----------------- | ------- | -------------------------------- |
| `smtp_host`          | SMTP Host         | string  | SMTP server hostname or IP       |
| `smtp_port`          | SMTP Port         | number  | Server port (587/465/25)         |
| `smtp_secure`        | Secure Connection | boolean | Use TLS/SSL                      |
| `smtp_username`      | Username          | string  | SMTP authentication username     |
| `smtp_password`      | Password          | string  | SMTP authentication password     |
| `email_from_address` | From Address      | string  | Default sender email             |
| `email_from_name`    | From Name         | string  | Display name for emails          |
| `email_reply_to`     | Reply-To          | string  | Reply email address              |
| `email_max_retry`    | Max Retries       | number  | Retry attempts for failed emails |
| `email_timeout`      | Timeout           | number  | Connection timeout (seconds)     |

---

## 5. Seed Data

### Configuration Seeder

File: `backend/prisma/seeds/configurations.seed.ts`

Seeds 24 default configurations across all categories:

- General (2 configs)
- Security (3 configs)
- Email (10 configs)
- Notifications (2 configs)
- Rate Limiting (2 configs)
- Storage (2 configs)
- Database (2 configs)

**Run seeder:**

```bash
cd backend
npx ts-node prisma/seeds/configurations.seed.ts
```

---

## 6. Usage Examples

### Creating a Configuration (API)

```bash
curl -X POST http://localhost:3000/api/v1/configurations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "smtp_host",
    "name": "SMTP Host",
    "description": "SMTP server hostname",
    "value": "smtp.gmail.com",
    "type": "string",
    "category": "email",
    "isRequired": true
  }'
```

### Getting Configurations by Category

```bash
curl http://localhost:3000/api/v1/configurations/category/email \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Updating Configuration Value

```bash
curl -X PATCH http://localhost:3000/api/v1/configurations/key/smtp_host \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "smtp.office365.com"
  }'
```

---

## 7. Security Features

- **Authentication Required:** All endpoints require valid JWT token
- **Role-Based Access:** Only super_admin can access configuration endpoints
- **Required Configurations:** Cannot be deleted, only updated
- **Audit Trail:** Tracks who modified configurations and when
- **Type Safety:** Values are validated against their type before storage

---

## 8. Next Steps

### Recommended Enhancements

1. **Encryption:** Add encryption for sensitive values (passwords, API keys)
2. **Configuration History:** Track all changes to configurations over time
3. **Validation Rules:** Add custom validation rules per configuration
4. **Environment Override:** Allow environment variables to override database configs
5. **Configuration Groups:** Add grouping for related configurations
6. **Import/Export:** Add ability to export/import configuration sets
7. **Default Values:** Store and manage default values separately
8. **Configuration Cache:** Implement caching for frequently accessed configs

### Integration

To use configurations in your services:

```typescript
import ConfigurationService from '@/domains/configurations/configuration.service';

const configService = new ConfigurationService();

// Get a specific configuration
const smtpHost = await configService.getConfigurationByKey('smtp_host');
console.log(smtpHost.value); // 'smtp.gmail.com'

// Get all email configurations
const emailConfigs = await configService.getConfigurationsByCategory('email');
```

---

## 9. Testing

### Manual Testing

1. Login as super_admin
2. Navigate to **Settings → Configurations**
3. Select a category (e.g., Email Service)
4. View existing configurations
5. Click "Add Configuration" to create new
6. Edit existing configuration
7. Delete non-required configuration
8. Verify all operations work correctly

### API Testing

Use the provided Postman collection or test with curl:

```bash
# Get all configurations
curl http://localhost:3000/api/v1/configurations \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create configuration
curl -X POST http://localhost:3000/api/v1/configurations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"test_config","name":"Test","type":"string","category":"general","value":"test"}'
```

---

## 10. Troubleshooting

### Common Issues

**Issue:** Configuration not saving

- **Solution:** Check that all required fields are provided
- Verify the key is unique
- Ensure value matches the specified type

**Issue:** Cannot delete configuration

- **Solution:** Required configurations cannot be deleted
- Only update the value instead

**Issue:** Frontend not loading configurations

- **Solution:** Verify API endpoint is accessible
- Check authentication token is valid
- Ensure super_admin role

---

## Summary

This implementation provides a complete, production-ready configuration management system with:

- ✅ Database model with proper indexing
- ✅ Comprehensive backend CRUD API
- ✅ Type-safe value parsing and validation
- ✅ Beautiful, intuitive frontend interface
- ✅ Email service configurations
- ✅ Seed data for quick setup
- ✅ Security and audit features
- ✅ RESTful API design
- ✅ Role-based access control

The system is now ready for managing all application configurations centrally!
