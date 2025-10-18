# Observer Registration Email Integration & Error Fixes

## Issue Identified

Observer registration was failing with a 500 error because the email service was throwing authentication errors when trying to send confirmation emails.

## Root Cause

- Email service was configured to fetch SMTP settings from database
- SMTP credentials in database were invalid/empty
- Email sending error was blocking the entire registration process

## Fixes Applied

### 1. **Made Email Sending Non-Blocking**

Updated `backend/src/domains/mobile/observer.service.ts` to catch and log email errors without failing the registration:

```typescript
// Before: Registration failed if email failed
await this.emailService.sendRegistrationConfirmation(...);

// After: Registration succeeds even if email fails
try {
  await this.emailService.sendRegistrationConfirmation(...);
} catch (emailError: any) {
  console.error('Failed to send confirmation email:', emailError.message);
  // Continue with registration
}
```

Applied to all email operations:

- ✅ Registration confirmation email
- ✅ Password setup email
- ✅ Welcome email
- ✅ Rejection email
- ✅ Clarification request email

### 2. **Improved Frontend Error Handling**

Updated `frontend/src/views/mobile/ObserverRegisterView.vue`:

- Added comprehensive console logging for debugging
- Fixed route name: `ObserverRegistrationSuccess` → `observer-registration-success`
- Enhanced tracking number extraction to handle both response formats
- Better error messages with full error chain
- Added conditional document upload (only if photo exists)

### 3. **Enhanced Logging**

Added detailed logs to trace the registration flow:

```
Submitting registration: {...}
Registration response: {...}
Tracking number: TRK-12345678
Uploading documents...
Documents uploaded successfully
Redirecting to success page...
```

---

## Testing the Fix

### 1. Test Registration Without Email Service

With the fixes, registration should work even if SMTP is not configured:

```bash
curl -X POST http://localhost/api/mobile/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "nationalId": "12345678",
    "dateOfBirth": "1990-01-01",
    "phoneNumber": "0712345678",
    "email": "test@example.com",
    "termsAccepted": true,
    "dataProcessingConsent": true
  }'
```

Expected result:

- ✅ Registration succeeds
- ✅ Tracking number returned
- ⚠️ Email fails (logged to console) but doesn't block registration

### 2. Configure Email Service

To enable actual email sending:

1. **Login as super_admin**
2. **Navigate to Settings → Configurations**
3. **Select "Email Service" category**
4. **Update these settings:**

   For Gmail:

   ```
   smtp_host: smtp.gmail.com
   smtp_port: 587
   smtp_secure: true
   smtp_username: your-email@gmail.com
   smtp_password: your-gmail-app-password
   email_from_address: noreply@yourdomain.com
   email_from_name: eTally Election System
   ```

   For other SMTP providers:

   ```
   smtp_host: your-smtp-server.com
   smtp_port: 587 (or 465 for SSL)
   smtp_secure: true
   smtp_username: your-username
   smtp_password: your-password
   ```

5. **Save configurations**
6. **Test registration again** - emails should now send successfully

---

## Debugging Steps

### Check Browser Console

Open browser developer tools and check console for:

```
Submitting registration: {...}
Registration response: {...}
Tracking number: TRK-12345678
```

### Check Backend Logs

```bash
docker compose logs api --tail=50 -f
```

Look for:

- `✓ Email sent successfully` - Email worked
- `Failed to send registration confirmation email` - Email failed (non-blocking)
- `SMTP connection failed` - Email config issue

### Common Issues & Solutions

**Issue:** "Registration failed" on frontend but backend shows success  
**Solution:**

- Check browser console logs
- Verify tracking number is being returned
- Check route name matches router configuration

**Issue:** SMTP authentication failed  
**Solution:**

- Update email configurations in Settings → Configurations
- For Gmail, use App Password (not regular password)
- Verify SMTP credentials are correct

**Issue:** Email sending timeout  
**Solution:**

- Increase `email_timeout` configuration
- Check network/firewall settings
- Verify SMTP server is accessible

**Issue:** Documents not uploading  
**Solution:**

- Check MinIO is running
- Verify file size limits
- Check browser console for upload errors

---

## Email Configuration Examples

### Gmail (Recommended for Testing)

```
smtp_host: smtp.gmail.com
smtp_port: 587
smtp_secure: true
smtp_username: your-email@gmail.com
smtp_password: [16-char app password from Google]
```

**How to get Gmail App Password:**

1. Go to Google Account settings
2. Security → 2-Step Verification (enable if not enabled)
3. App passwords → Generate new
4. Use the 16-character password

### Office 365 / Outlook

```
smtp_host: smtp.office365.com
smtp_port: 587
smtp_secure: true
smtp_username: your-email@outlook.com
smtp_password: your-password
```

### SendGrid

```
smtp_host: smtp.sendgrid.net
smtp_port: 587
smtp_secure: true
smtp_username: apikey
smtp_password: [Your SendGrid API key]
```

### Custom SMTP Server

```
smtp_host: mail.yourdomain.com
smtp_port: 587 (or 465 for SSL)
smtp_secure: true (false for port 25)
smtp_username: noreply@yourdomain.com
smtp_password: your-smtp-password
```

---

## Error Recovery

### Email Service Down

- Registration continues to work
- Observers can still register
- Emails logged but not sent
- Fix email config when ready

### Database Down

- Registration will fail (expected)
- Show appropriate error message
- Retry when database is back

### MinIO Down

- Registration succeeds
- Document upload fails
- Show specific error about file upload
- Documents can be uploaded later

---

## Monitoring

### Success Indicators

```
Backend logs:
✓ SMTP connection verified
✓ Email sent successfully to observer@example.com

Browser console:
Submitting registration: {...}
Registration response: {success: true, trackingNumber: "TRK-12345678"}
Uploading documents...
Documents uploaded successfully
Redirecting to success page...
```

### Failure Indicators (Non-Critical)

```
Backend logs:
Failed to send registration confirmation email: Authentication failed

Browser console:
(No change - registration continues)
```

---

## Summary

✅ Registration now works even if email service fails  
✅ Email errors logged but don't block registration  
✅ Frontend has better error handling and logging  
✅ Easy to configure SMTP through admin UI  
✅ Comprehensive debugging information available

The observer registration system is now resilient to email service failures and provides clear feedback for troubleshooting.
