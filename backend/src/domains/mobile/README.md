# Mobile Domain - Field Observer Registration & PWA

This domain handles field observer registration, approval, and mobile result submission.

## Phase 1: Observer Registration (Current)

### Features Implemented

- ✅ Public observer registration (no auth required)
- ✅ Document upload (National ID front/back, profile photo)
- ✅ Admin review and approval workflow
- ✅ Password setup for approved observers
- ✅ Application tracking
- ✅ Email notifications

### Database Models

- `ObserverRegistration` - Observer applications
- `ObserverAssignment` - Station assignments (Phase 2)
- `PasswordSetupToken` - Secure password setup
- Enhanced `User` model with observer relations
- Enhanced `PollingStation` with observer relations
- Enhanced `ElectionResult` with Form 34A tracking

### API Endpoints

#### Public Endpoints (No Auth)

```
POST   /api/mobile/register                      - Register new observer
GET    /api/mobile/track/:trackingNumber         - Track application
POST   /api/mobile/setup-password                - Set password
POST   /api/mobile/register/:id/upload-document  - Upload documents
```

#### Admin Endpoints (Requires super_admin or election_manager)

```
GET    /api/admin/observers/applications         - List applications
GET    /api/admin/observers/applications/:id     - Get application detail
POST   /api/admin/observers/applications/:id/review - Review application
POST   /api/admin/observers/bulk-approve         - Bulk approve
GET    /api/admin/observers/statistics           - Get statistics
```

## Installation

### 1. Run Migration

```bash
cd backend
npx prisma migrate dev --name add_observer_registration
npx prisma generate
```

### 2. Configure Environment Variables

Add to `.env`:

```bash
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=your_minio_password

# Email Configuration (TODO: Configure with actual provider)
EMAIL_FROM=noreply@etally.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# App URLs
APP_URL=http://localhost:5173
```

### 3. Create MinIO Buckets

The buckets will be created automatically on first run:

- `observer-documents` - For registration documents
- `form-34a-photos` - For Form 34A photos (Phase 3)

### 4. Integrate Routes in Server

In `server.ts`:

```typescript
import { observerRoutes } from '@/domains/mobile';

// Add mobile routes
app.use('/api/mobile', observerRoutes);
```

## Usage Examples

### Register Observer (Public)

```bash
curl -X POST http://localhost:3000/api/mobile/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "nationalId": "12345678",
    "dateOfBirth": "1990-01-15T00:00:00Z",
    "phoneNumber": "+254712345678",
    "email": "john.doe@example.com",
    "preferredCountyId": "uuid-of-county",
    "termsAccepted": true,
    "dataProcessingConsent": true
  }'
```

### Upload Document

```bash
curl -X POST http://localhost:3000/api/mobile/register/{registrationId}/upload-document \
  -F "file=@national_id.jpg" \
  -F "documentType=national_id_front"
```

### Track Application

```bash
curl http://localhost:3000/api/mobile/track/OBS-2024-001234
```

### Review Application (Admin)

```bash
curl -X POST http://localhost:3000/api/admin/observers/applications/{id}/review \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "notes": "Application approved - all documents verified"
  }'
```

## Testing

Run tests:

```bash
npm test -- observer.service.test.ts
```

## Next Phases

### Phase 2: Station Assignment (Week 2)

- Polling station assignment
- Geographic validation
- Assignment coverage tracking

### Phase 3: Result Reporting PWA (Week 3)

- Offline-first mobile app
- Result submission
- Form 34A photo upload
- Background sync

## Troubleshooting

### Issue: MinIO connection fails

- Check MINIO_ENDPOINT and MINIO_PORT
- Verify MinIO is running: `docker ps | grep minio`
- Check credentials

### Issue: Emails not sending

- Check SMTP configuration
- Verify email logs in console
- Implement actual email provider (currently logs only)

### Issue: File upload fails

- Check file size (max 5MB for ID, 2MB for photo)
- Verify file type (only JPG/PNG allowed)
- Check MinIO bucket permissions
