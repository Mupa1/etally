# Email Service Integration with Configuration System

## Overview

Updated the Observer Registration email service to dynamically fetch SMTP configurations from the database instead of using hardcoded environment variables.

## Implementation Date

October 17, 2025

---

## Changes Made

### 1. **Email Service Update** (`backend/src/domains/mobile/email.service.ts`)

#### Before:

- Stub implementation that only logged emails to console
- No actual email sending
- No configuration management

#### After:

- Full Nodemailer integration
- Dynamic SMTP configuration from database
- Configuration caching (5-minute TTL)
- Retry logic with exponential backoff
- Connection verification
- Error handling

### 2. **Key Features**

#### Configuration Fetching

```typescript
private async getEmailConfig(): Promise<EmailConfig> {
  // Check cache first (5-minute TTL)
  if (this.configCache && Date.now() < this.configCacheExpiry) {
    return this.configCache;
  }

  // Fetch from database
  const configs = await this.prisma.configuration.findMany({
    where: { category: 'email' }
  });

  // Parse and cache
  // ...
}
```

#### SMTP Configuration

Fetches these configurations from database:

- `smtp_host` - SMTP server hostname
- `smtp_port` - Server port (587/465/25)
- `smtp_secure` - TLS/SSL enabled
- `smtp_username` - Authentication username
- `smtp_password` - Authentication password
- `email_from_address` - Sender email
- `email_from_name` - Display name
- `email_reply_to` - Reply-to address (optional)
- `email_max_retry` - Max retry attempts
- `email_timeout` - Connection timeout

#### Retry Logic

```typescript
// Retry with exponential backoff
for (let attempt = 1; attempt <= config.emailMaxRetry; attempt++) {
  try {
    await transporter.sendMail(mailOptions);
    return; // Success
  } catch (error) {
    // Wait before retry
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
```

#### Cache Invalidation

```typescript
// Call when email configurations are updated
emailService.invalidateCache();
```

---

## Email Templates

### 1. Registration Confirmation

**When:** Observer submits registration form  
**To:** Observer's email  
**Contains:**

- Welcome message
- Tracking number
- Link to track application status
- Expected review timeline

### 2. Password Setup Email

**When:** Admin approves observer application  
**To:** Observer's email  
**Contains:**

- Approval notification
- Password setup link (48-hour expiry)
- Instructions for portal access

### 3. Welcome Email

**When:** Observer completes password setup  
**To:** Observer's email  
**Contains:**

- Welcome message
- Login portal link
- Feature overview
- Offline capability info

### 4. Rejection Email

**When:** Admin rejects observer application  
**To:** Observer's email  
**Contains:**

- Rejection notification
- Reason for rejection
- Support contact info

### 5. Clarification Request

**When:** Admin requests additional information  
**To:** Observer's email  
**Contains:**

- Request for clarification
- Specific notes from reviewer
- Support contact info

---

## Configuration Management

### Setting Up Email Service

1. **Configure SMTP Settings**

   - Login as super_admin
   - Navigate to Settings → Configurations
   - Select "Email Service" category
   - Update SMTP settings

2. **Required Configurations**

   ```
   smtp_host: smtp.gmail.com
   smtp_port: 587
   smtp_secure: true
   smtp_username: your-email@gmail.com
   smtp_password: your-app-password
   email_from_address: noreply@etally.com
   email_from_name: eTally Election System
   ```

3. **Optional Configurations**
   ```
   email_reply_to: support@etally.com
   email_max_retry: 3
   email_timeout: 30
   ```

### Gmail Setup Example

For Gmail SMTP:

1. Enable 2-Factor Authentication
2. Generate App Password
3. Use these settings:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Secure: `true`
   - Username: Your Gmail address
   - Password: Generated App Password

### Testing Email Service

```typescript
// Test email sending
const emailService = new EmailService();

await emailService.sendRegistrationConfirmation(
  'test@example.com',
  'John',
  'TRK-12345678'
);
```

---

## Error Handling

### Connection Errors

- Automatically resets transporter on connection failures
- Retries with exponential backoff
- Maximum retry attempts from configuration

### Configuration Errors

- Throws clear error if configurations missing
- Validates configuration values
- Falls back to sensible defaults where appropriate

### Logging

```
✓ SMTP connection verified
✓ Email sent successfully to observer@example.com
  Message ID: <abc123@smtp.gmail.com>

✗ Email send attempt 1 failed: Connection timeout
✗ Email send attempt 2 failed: Authentication failed
```

---

## Performance Optimizations

### 1. Configuration Caching

- Caches email config for 5 minutes
- Reduces database queries
- Automatically expires and refreshes

### 2. Connection Pooling

- Reuses SMTP transporter
- Verifies connection on first use
- Recreates on configuration change

### 3. Async Processing

- Non-blocking email sending
- Doesn't delay observer registration
- Handles failures gracefully

---

## Security Considerations

### 1. Credential Storage

- SMTP password stored in database
- TODO: Encrypt sensitive configurations
- Access restricted to super_admin

### 2. Email Validation

- Validates email addresses
- Prevents email injection
- Sanitizes content

### 3. Rate Limiting

- Respects SMTP provider limits
- Implements retry delays
- Prevents abuse

---

## Dependencies Added

```json
{
  "dependencies": {
    "nodemailer": "^7.0.9"
  },
  "devDependencies": {
    "@types/nodemailer": "^7.0.2"
  }
}
```

---

## Migration from Environment Variables

### Before (`.env`):

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
EMAIL_FROM=noreply@etally.com
```

### After (Database):

All email configurations now managed through:

- Settings → Configurations → Email Service
- Centralized management
- No server restart required for changes
- Audit trail of configuration changes

---

## Integration Points

### 1. Observer Registration Flow

```
1. Observer submits form
   ↓
2. Create registration record
   ↓
3. Send confirmation email (async)
   ↓
4. Return success response
```

### 2. Admin Approval Flow

```
1. Admin approves application
   ↓
2. Create user account
   ↓
3. Generate password setup token
   ↓
4. Send password setup email
```

### 3. Password Setup Flow

```
1. Observer sets password
   ↓
2. Activate account
   ↓
3. Send welcome email
```

---

## Monitoring & Debugging

### Log Messages

- `✓ SMTP connection verified` - Connection successful
- `✓ Email sent successfully to {email}` - Email delivered
- `✗ Email send attempt {n} failed` - Retry in progress
- `Failed to send email after {n} attempts` - All retries exhausted

### Common Issues

**Issue:** SMTP connection failed  
**Solution:**

- Verify SMTP host and port
- Check firewall/network settings
- Validate credentials

**Issue:** Authentication failed  
**Solution:**

- Check username/password
- For Gmail, use App Password
- Enable less secure app access (if applicable)

**Issue:** Timeout errors  
**Solution:**

- Increase email_timeout configuration
- Check network connectivity
- Verify SMTP server status

---

## Future Enhancements

1. **Email Queue System**

   - Implement job queue (Bull/BullMQ)
   - Batch email sending
   - Better failure handling

2. **Email Templates**

   - HTML template engine
   - Customizable templates
   - Multi-language support

3. **Email Analytics**

   - Track delivery rates
   - Monitor failures
   - Performance metrics

4. **Alternative Providers**

   - SendGrid integration
   - AWS SES support
   - Mailgun option

5. **Advanced Features**
   - Email scheduling
   - Attachment support
   - CC/BCC functionality
   - Rich text editor

---

## Summary

✅ Email service now dynamically fetches SMTP configurations from database  
✅ Full Nodemailer integration with retry logic  
✅ Configuration caching for performance  
✅ Comprehensive error handling  
✅ All email templates implemented  
✅ Ready for production use

The email service is now fully integrated with the configuration management system and ready to send real emails to observers during the registration and approval process!
