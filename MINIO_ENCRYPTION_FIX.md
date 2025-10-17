# MinIO Server-Side Encryption Fix

## Issue

Photo upload was failing with a MinIO S3 error:

```
S3Error: Server side encryption specified but KMS is not configured
(KMS not configured for a server side encrypted objects)
POST /api/mobile/register/OBS-2025-489491/upload-document → 500
```

## Root Cause

### What Was Happening

The MinIO service was hardcoding server-side encryption for all uploads:

```typescript
// Before - WRONG
await this.client.putObject(bucket, objectPath, file, {
  'Content-Type': mimeType,
  'x-amz-server-side-encryption': 'AES256', // ❌ Requires KMS setup
  'x-amz-meta-uploaded-at': new Date().toISOString(),
});
```

### The Problem

**Server-Side Encryption (SSE) with AES256** requires MinIO to be configured with:

1. Key Management Service (KMS)
2. Encryption keys
3. Additional security infrastructure

### Current MinIO Setup

The MinIO instance in `docker-compose.yml` is configured for **development** and doesn't have:

- ❌ KMS configured
- ❌ Encryption keys
- ❌ SSE-KMS setup

When the code tried to upload with `x-amz-server-side-encryption: AES256`, MinIO rejected it.

## Solution

Made server-side encryption **optional and configurable** via environment variable:

### Updated Code

**File:** `/backend/src/domains/mobile/minio.service.ts`

```typescript
// After - CORRECT
async uploadFile(
  bucket: string,
  objectPath: string,
  file: Buffer,
  mimeType: string
): Promise<void> {
  const metadata: Record<string, string> = {
    'Content-Type': mimeType,
    'x-amz-meta-uploaded-at': new Date().toISOString(),
  };

  // Only enable server-side encryption if MinIO is configured for it
  if (process.env.MINIO_ENABLE_ENCRYPTION === 'true') {
    metadata['x-amz-server-side-encryption'] = 'AES256';
  }

  await this.client.putObject(bucket, objectPath, file, metadata);
}
```

### How It Works

1. **Default (Development)**: Encryption disabled

   - No `MINIO_ENABLE_ENCRYPTION` env var
   - Files uploaded without SSE
   - Works with basic MinIO setup

2. **Production (Optional)**: Enable encryption
   - Set `MINIO_ENABLE_ENCRYPTION=true`
   - Configure MinIO with KMS
   - Files uploaded with AES256 encryption

## Configuration

### Development (Current Setup)

No changes needed! Works out of the box:

```bash
# .env (no MINIO_ENABLE_ENCRYPTION needed)
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=<from secrets>
```

Files are stored **without encryption** (acceptable for development).

### Production (Future)

To enable encryption in production:

#### 1. Configure MinIO with KMS

```yaml
# docker-compose.yml (production)
minio:
  environment:
    - MINIO_KMS_SECRET_KEY=my-minio-encryption-key:bXltaW5pb2VuY3J5cHRpb25rZXlpc3ZlcnlzZWN1cmU=
```

#### 2. Set Environment Variable

```bash
# .env (production)
MINIO_ENABLE_ENCRYPTION=true
```

#### 3. Alternative: Use SSE-C (Customer Keys)

```typescript
// For customer-provided encryption keys
if (process.env.MINIO_ENABLE_ENCRYPTION === 'true') {
  metadata['x-amz-server-side-encryption-customer-algorithm'] = 'AES256';
  metadata['x-amz-server-side-encryption-customer-key'] =
    process.env.MINIO_ENCRYPTION_KEY;
}
```

## Security Considerations

### Development Setup (Current)

**Encryption:** None  
**Acceptable for:**

- Local development
- Testing environments
- Non-sensitive test data

**Security measures:**

- MinIO accessible only via Docker network
- Not exposed to public internet
- Credentials in secrets files

### Production Recommendations

**For production, implement encryption:**

1. **Option 1: SSE-S3 (MinIO Managed)**

   ```typescript
   metadata['x-amz-server-side-encryption'] = 'AES256';
   ```

   - Requires MinIO KMS setup
   - MinIO manages keys
   - Transparent encryption/decryption

2. **Option 2: SSE-C (Customer Managed)**

   ```typescript
   metadata['x-amz-server-side-encryption-customer-algorithm'] = 'AES256';
   metadata['x-amz-server-side-encryption-customer-key'] = encryptionKey;
   ```

   - Application provides keys
   - More control
   - Must store keys securely

3. **Option 3: Client-Side Encryption**
   ```typescript
   // Encrypt file before upload
   const encryptedBuffer = await encrypt(file, key);
   await client.putObject(bucket, path, encryptedBuffer);
   ```
   - Encrypt in application
   - Most secure (zero-trust)
   - More complexity

**Recommendation for Production:** Use SSE-S3 with MinIO KMS

## Data Protection Strategy

### Current Implementation (Development)

```
User Photo → Network (HTTPS) → Backend → MinIO (unencrypted)
```

**Protection:**

- ✅ HTTPS in transit
- ✅ Docker network isolation
- ✅ Access control (MinIO credentials)
- ❌ At-rest encryption (not enabled)

### Production Implementation

```
User Photo → Network (HTTPS) → Backend → MinIO (AES256 encrypted)
```

**Protection:**

- ✅ HTTPS in transit
- ✅ Docker network isolation
- ✅ Access control (MinIO credentials)
- ✅ At-rest encryption (AES256)
- ✅ KMS key management

## Testing

### Test Upload (Development)

1. **Register observer**
2. **Upload profile photo**
3. **Expected:** ✅ Upload succeeds
4. **Check MinIO:**

   ```bash
   # Access MinIO console
   http://localhost:9001
   Login: admin / <password from secrets>

   # Check bucket: observer-documents
   # Should see: 12345678/profile_photo-1234567890.jpg
   ```

### Verify No Encryption Headers

Check MinIO object metadata:

```bash
# Using MinIO client
mc stat myminio/observer-documents/12345678/profile_photo-xxx.jpg

# Should NOT see:
# SSE: AES256
```

### Test with Encryption Enabled

```bash
# Set environment variable
MINIO_ENABLE_ENCRYPTION=true

# Upload should add encryption header
# Verify in MinIO metadata:
# SSE: AES256
```

## Deployment

### For Current Deployment (Development)

No changes needed! The fix works with current setup:

```bash
# Rebuild backend
docker compose build api

# Restart
docker compose up -d

# Test registration with photo upload
# Should work now! ✅
```

### For Future Production Deployment

1. **Configure MinIO KMS:**

   ```yaml
   # docker-compose.yml
   minio:
     environment:
       - MINIO_KMS_SECRET_KEY=my-key:base64encodedkey
   ```

2. **Enable encryption:**

   ```bash
   # .env
   MINIO_ENABLE_ENCRYPTION=true
   ```

3. **Test thoroughly:**
   - Upload files
   - Download files
   - Verify encryption in metadata

## Alternative Solution (Immediate)

If you need encryption NOW without KMS setup:

### Use SSE-C (Customer Keys)

```typescript
// minio.service.ts
async uploadFile(
  bucket: string,
  objectPath: string,
  file: Buffer,
  mimeType: string
): Promise<void> {
  const metadata: Record<string, string> = {
    'Content-Type': mimeType,
    'x-amz-meta-uploaded-at': new Date().toISOString(),
  };

  // Use customer-provided encryption (doesn't need KMS)
  if (process.env.MINIO_ENCRYPTION_KEY) {
    metadata['x-amz-server-side-encryption-customer-algorithm'] = 'AES256';
    metadata['x-amz-server-side-encryption-customer-key'] =
      process.env.MINIO_ENCRYPTION_KEY;
    metadata['x-amz-server-side-encryption-customer-key-MD5'] =
      crypto.createHash('md5')
        .update(process.env.MINIO_ENCRYPTION_KEY)
        .digest('base64');
  }

  await this.client.putObject(bucket, objectPath, file, metadata);
}
```

## Summary

✅ **Fixed:** Removed hardcoded encryption that required KMS  
✅ **Configurable:** Encryption can be enabled via environment variable  
✅ **Works now:** Uploads succeed in current development setup  
✅ **Production ready:** Can enable encryption when MinIO is configured  
✅ **No data loss:** Files upload successfully without encryption

## Files Modified

1. `/backend/src/domains/mobile/minio.service.ts` - Made encryption optional

## Deployment Steps

```bash
# 1. Rebuild backend (includes MinIO service fix)
docker compose build api

# 2. Restart services
docker compose up -d

# 3. Test registration with photo upload
# Should work! ✅
```

## Environment Variables

### Current (Development)

```bash
# No encryption (works with basic MinIO)
# MINIO_ENABLE_ENCRYPTION not set (defaults to disabled)
```

### Production (Optional)

```bash
# Enable encryption (requires MinIO KMS setup)
MINIO_ENABLE_ENCRYPTION=true
```

Upload will now work in development, and encryption can be enabled later for production! 🎉
