# Public Geographic Endpoints for Registration

## Problem

During observer registration, users need to select their preferred geographic location (County → Constituency → Ward → Polling Station). However, the geographic endpoints required authentication tokens, and registration happens BEFORE users have accounts.

## Solution

Created public geographic endpoints specifically for the registration flow with rate limiting to prevent abuse.

## Changes Made

### Backend Changes

#### 1. Added Rate Limiting to Geographic Endpoints

File: `/backend/src/domains/mobile/observer.routes.ts`

**Rate Limit Configuration:**

- Window: 15 minutes
- Max Requests: 30 per window per IP
- Message: "Too many requests to geographic endpoints. Please try again later."

**Rate Limit Headers Returned:**

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: When the rate limit resets
- `Retry-After`: Seconds to wait if limit exceeded (429 status)

#### 2. Updated Route Handlers

All geographic endpoints now:

- ✅ Return values in all code paths (fixed TypeScript TS7030 errors)
- ✅ Include rate limiting middleware
- ✅ Are publicly accessible (no authentication required)
- ✅ Have clear documentation marking them as public

### Public Endpoints

#### GET `/api/mobile/geographic/counties`

Get all counties for dropdown selection

**Authentication:** None required  
**Rate Limit:** 30 requests / 15 minutes  
**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Nairobi",
      "code": "047"
    }
  ]
}
```

#### GET `/api/mobile/geographic/constituencies?countyId=xxx`

Get constituencies for a selected county

**Authentication:** None required  
**Rate Limit:** 30 requests / 15 minutes  
**Query Parameters:**

- `countyId` (required): UUID of the county

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Westlands",
      "code": "047-01"
    }
  ]
}
```

#### GET `/api/mobile/geographic/wards?constituencyId=xxx`

Get wards for a selected constituency

**Authentication:** None required  
**Rate Limit:** 30 requests / 15 minutes  
**Query Parameters:**

- `constituencyId` (required): UUID of the constituency

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Kitisuru",
      "code": "047-01-01"
    }
  ]
}
```

#### GET `/api/mobile/geographic/polling-stations?wardId=xxx`

Get polling stations for a selected ward

**Authentication:** None required  
**Rate Limit:** 30 requests / 15 minutes  
**Query Parameters:**

- `wardId` (required): UUID of the ward

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Kitisuru Primary School",
      "code": "047-01-01-001",
      "registeredVoters": 1500
    }
  ]
}
```

## Security Considerations

### Rate Limiting

The rate limiter prevents abuse by:

1. **IP-based tracking**: Each IP address is tracked separately
2. **Path-specific limits**: Each endpoint has its own limit
3. **Time windows**: Limits reset every 15 minutes
4. **Automatic cleanup**: Old entries are cleaned up every 10 minutes

### Current Implementation

- Uses in-memory storage (simple Map)
- Suitable for development and small-scale deployments
- **For Production**: Migrate to Redis-based rate limiting

### Production Recommendations

```typescript
// TODO: For production, use express-rate-limit with Redis store
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const geoRateLimit = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'geo:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many requests. Please try again later.',
});
```

## Frontend Changes

### No Changes Required

The frontend component `GeographicCascadeSelector` already uses the correct endpoints:

- `/api/mobile/geographic/counties`
- `/api/mobile/geographic/constituencies?countyId=xxx`
- `/api/mobile/geographic/wards?constituencyId=xxx`
- `/api/mobile/geographic/polling-stations?wardId=xxx`

These endpoints are now publicly accessible during registration.

## Testing

### Manual Testing

1. **Test Registration Flow:**

   ```bash
   # Navigate to registration page
   http://localhost:5173/mobile/register

   # Verify Step 2 (Preferred Location) loads counties
   # Verify cascading dropdowns work without authentication
   ```

2. **Test Rate Limiting:**

   ```bash
   # Make 30 requests quickly
   for i in {1..30}; do
     curl http://localhost:3000/api/mobile/geographic/counties
   done

   # 31st request should return 429 Too Many Requests
   curl -v http://localhost:3000/api/mobile/geographic/counties
   ```

3. **Test Rate Limit Headers:**

   ```bash
   curl -v http://localhost:3000/api/mobile/geographic/counties

   # Should see headers:
   # X-RateLimit-Limit: 30
   # X-RateLimit-Remaining: 29
   # X-RateLimit-Reset: 2024-10-17T12:15:00.000Z
   ```

### Expected Behavior

✅ **Registration works without authentication**
✅ **County dropdown loads immediately**
✅ **Cascading works smoothly**
✅ **Rate limit prevents abuse**
✅ **429 error after 30 requests**
✅ **Retry-After header tells when to retry**

### Error Scenarios

**Too Many Requests (429):**

```json
{
  "success": false,
  "error": "Too many requests to geographic endpoints. Please try again later.",
  "retryAfter": 900
}
```

**Missing Query Parameter (400):**

```json
{
  "success": false,
  "error": "countyId is required"
}
```

## Migration Notes

### Breaking Changes

None - these endpoints were previously protected and couldn't be used during registration anyway.

### Deployment Checklist

- [x] Rate limiting middleware implemented
- [x] TypeScript errors fixed
- [x] Public endpoints documented
- [ ] Test rate limiting in staging
- [ ] Monitor rate limit metrics
- [ ] Consider Redis for production
- [ ] Set up alerts for rate limit abuse

## Monitoring Recommendations

### Metrics to Track

1. **Request Volume**: Requests per minute to geographic endpoints
2. **Rate Limit Hits**: How often users hit the rate limit
3. **IP Distribution**: Detect if single IP is making too many requests
4. **Geographic Data Access Patterns**: Which counties/areas are most popular

### Alerts to Configure

1. Alert if rate limit hit rate > 10% of requests
2. Alert if single IP makes > 100 requests in 1 hour
3. Alert if endpoint response time > 1 second

## Future Enhancements

### Caching

Consider adding caching to reduce database load:

```typescript
// Cache counties list (rarely changes)
const countiesCache = {
  data: null,
  timestamp: 0,
  ttl: 3600000, // 1 hour
};

router.get('/geographic/counties', geoRateLimit, async (_req, res, next) => {
  try {
    const now = Date.now();
    if (
      countiesCache.data &&
      now - countiesCache.timestamp < countiesCache.ttl
    ) {
      return res.status(200).json({ success: true, data: countiesCache.data });
    }

    const counties = await geoService.getCounties();
    countiesCache.data = counties;
    countiesCache.timestamp = now;

    return res.status(200).json({ success: true, data: counties });
  } catch (error) {
    return next(error);
  }
});
```

### CORS Configuration

Ensure CORS is properly configured to allow these public endpoints from the frontend domain.

### Additional Security

1. Add CAPTCHA for repeated failures
2. Implement token bucket algorithm for burst protection
3. Add IP whitelist for known good actors
4. Implement geographic-based rate limiting (more strict for certain regions)

## Summary

✅ **Problem Solved**: Registration now works without authentication  
✅ **Security Maintained**: Rate limiting prevents abuse  
✅ **Performance**: Endpoints remain fast  
✅ **Production Ready**: With Redis migration path
