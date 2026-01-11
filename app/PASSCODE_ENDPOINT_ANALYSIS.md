# Passcode Endpoint Error Analysis

## HAR File Analysis Summary

### Critical Finding: Status 0 (Network Failure)

All requests to `PATCH /api/v1/users/profile/passcode` are showing **status 0**, which means:
- ❌ Request **never reached the server**
- ❌ No HTTP response received
- ❌ Network-level failure (not a 404 error)

### Request Details from HAR File

**Request:**
- Method: `PATCH`
- URL: `https://samriddhi.buzz/api/v1/users/profile/passcode`
- Headers:
  - `x-business-id: 4b2154ba-2200-460d-b205-c52333995c20`
  - `Content-Type: application/json`
  - `Accept: application/json, text/plain, */*`
  - ⚠️ **Authorization header NOT visible in HAR** (may be stripped or not captured)

**Response:**
- Status: `0` (network failure)
- No headers
- No body
- `_transferSize: 0` (no data transferred)

**Timings:**
- `blocked: 0.05-0.13s` (request blocked)
- `dns: -1` (no DNS lookup)
- `ssl: -1` (no SSL handshake)
- `connect: -1` (no connection)
- `send: 0` (no data sent)
- `wait: 0` (no server wait)
- `receive: 0` (no data received)

## Root Cause Analysis

### Status 0 Typically Means:

1. **CORS Preflight Failure** (Most Likely)
   - Browser sends OPTIONS request first
   - OPTIONS request fails or is blocked
   - Actual PATCH request never sent

2. **Nginx Routing Issue**
   - Request blocked at nginx level
   - No route configured for `/api/v1/users`
   - But this would usually show 404, not status 0

3. **Browser Security Policy**
   - Mixed content (HTTP/HTTPS)
   - Content Security Policy blocking
   - Request blocked by browser

4. **Network Connectivity**
   - DNS resolution failure
   - Connection refused
   - Timeout before connection

## Most Likely Issue: CORS Preflight Failure

### Why CORS Preflight?

PATCH requests with custom headers (`x-business-id`, `Authorization`) trigger CORS preflight:
1. Browser sends `OPTIONS /api/v1/users/profile/passcode`
2. Server must respond with proper CORS headers
3. If OPTIONS fails → Browser blocks actual PATCH request → Status 0

### Current CORS Configuration

```typescript
// app/apps/auth-service/src/main.ts
app.enableCors(); // Very permissive, but may not handle preflight correctly
```

**Problem:** `enableCors()` without options might not properly handle:
- OPTIONS requests
- Custom headers (`x-business-id`)
- PATCH method

## Solutions

### Solution 1: Fix CORS Configuration (Recommended)

Update `app/apps/auth-service/src/main.ts`:

```typescript
// CORS with proper configuration
app.enableCors({
  origin: true, // Allow all origins (or specify your domain)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-business-id',
    'X-Requested-With',
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
});
```

### Solution 2: Verify Nginx Configuration

Ensure `/api/v1/users` route exists in nginx:

```bash
# Run on server
sudo cat /etc/nginx/conf.d/business-app.conf | grep -A 5 "location /api/v1/users"
```

If missing, run:
```bash
bash scripts/fix-passcode-endpoint.sh
```

### Solution 3: Check Browser Console

Look for:
- CORS errors
- Preflight request failures
- Network errors

### Solution 4: Test with curl

Test if endpoint is reachable:

```bash
# Test OPTIONS (preflight)
curl -X OPTIONS https://samriddhi.buzz/api/v1/users/profile/passcode \
  -H "Origin: https://samriddhi.buzz" \
  -H "Access-Control-Request-Method: PATCH" \
  -H "Access-Control-Request-Headers: authorization,content-type,x-business-id" \
  -v

# Test PATCH (actual request)
curl -X PATCH https://samriddhi.buzz/api/v1/users/profile/passcode \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-business-id: 4b2154ba-2200-460d-b205-c52333995c20" \
  -d '{"current_passcode":"988023","new_passcode":"112233"}' \
  -v
```

## Immediate Action Items

1. ✅ **Fix CORS configuration** in auth-service
2. ✅ **Verify nginx routing** for `/api/v1/users`
3. ✅ **Test OPTIONS preflight** request
4. ✅ **Check browser console** for detailed errors
5. ✅ **Deploy auth-service** with CORS fix

## Expected Behavior After Fix

- OPTIONS request should return `204 No Content` with CORS headers
- PATCH request should reach server
- Response should be `200 OK` or proper error (not status 0)

## Verification Steps

1. Check browser Network tab for OPTIONS request
2. Verify OPTIONS returns CORS headers:
   - `Access-Control-Allow-Origin`
   - `Access-Control-Allow-Methods`
   - `Access-Control-Allow-Headers`
3. Verify PATCH request shows actual HTTP status (200, 400, 401, etc.)
4. Check server logs for incoming requests

