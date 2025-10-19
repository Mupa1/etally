# System Configuration Management

## Overview

Complete system-wide configuration management system for the eTally Election Management System. Allows administrators to manage all system settings through a centralized interface, including email service (SMTP) configurations, security settings, rate limiting, storage, database, and general application settings.

**Implementation Date:** October 17, 2025  
**Status:** ✅ Production Ready

---

## Features

### Configuration Categories

1. **General** - Application-wide settings
2. **Security** - Authentication and session settings
3. **Email Service** - SMTP configuration for email notifications
4. **Notifications** - Notification preferences
5. **Rate Limiting** - API rate limit settings
6. **Storage** - File upload and storage settings
7. **Database** - Database connection settings

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

## Email Service Configurations

### SMTP Settings

| Key                | Type    | Description          | Example            |
| ------------------ | ------- | -------------------- | ------------------ |
| smtp_host          | string  | SMTP server hostname | smtp.gmail.com     |
| smtp_port          | number  | Server port          | 587                |
| smtp_secure        | boolean | Use TLS/SSL          | true               |
| smtp_username      | string  | SMTP username        | noreply@etally.com |
| smtp_password      | string  | SMTP password        | [app-password]     |
| email_from_address | string  | Sender email         | noreply@etally.com |
| email_from_name    | string  | Display name         | eTally System      |
| email_reply_to     | string  | Reply-to address     | support@etally.com |
| email_max_retry    | number  | Max retry attempts   | 3                  |
| email_timeout      | number  | Timeout (seconds)    | 30                 |

### Setup Guide

**For Gmail:**

1. Enable 2-Factor Authentication
2. Generate App Password (16 characters)
3. Configure:
   ```
   smtp_host: smtp.gmail.com
   smtp_port: 587
   smtp_secure: true
   smtp_username: your-email@gmail.com
   smtp_password: [16-char app password]
   ```

**For Office 365:**

```
smtp_host: smtp.office365.com
smtp_port: 587
smtp_secure: true
smtp_username: your-email@outlook.com
smtp_password: your-password
```

**For Custom SMTP:**

```
smtp_host: mail.yourdomain.com
smtp_port: 587
smtp_secure: true
smtp_username: noreply@yourdomain.com
smtp_password: your-smtp-password
```

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

**Get Email Configurations:**

```bash
curl http://localhost:3000/api/v1/configurations/category/email \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Update SMTP Host:**

```bash
curl -X PATCH http://localhost:3000/api/v1/configurations/key/smtp_host \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "smtp.office365.com"}'
```

---

## Integration with Email Service

The email service (`backend/src/domains/mobile/email.service.ts`) automatically fetches SMTP configuration from the database:

```typescript
// Fetches configurations from database
const config = await getEmailConfig();

// Creates SMTP transporter
const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: config.smtpSecure,
  auth: {
    user: config.smtpUsername,
    pass: config.smtpPassword,
  },
});

// Sends email with retry logic
await transporter.sendMail({
  from: `"${config.emailFromName}" <${config.emailFromAddress}>`,
  to: recipientEmail,
  subject: emailSubject,
  html: emailHtml,
});
```

**Configuration Caching:**

- 5-minute TTL to reduce database queries
- Automatic cache invalidation
- Transparent to email sending code

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

### Step 3: Configure Email Service

Via Admin UI:

1. Login as super_admin
2. Settings → Configurations → Email Service
3. Update SMTP settings
4. Save (no restart needed)

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
✅ **7** configuration categories  
✅ **10** email service settings  
✅ **11** API endpoints  
✅ Beautiful admin UI  
✅ Dynamic email service integration  
✅ No server restart required for changes  
✅ Production ready

**Location:** `documentation/domains/configurations/system-configuration-management.md`
