# CORS Configuration Fix - Login Issue Resolution

## Date
October 20, 2025

## Issue Description
Users reported being unable to login when accessing TeamWorks from devices other than localhost, even when both devices were on the same local network.

## Root Cause
The CORS configuration in both `server/src/index.ts` and `server/src/middleware/security.ts` was using incorrect error handling when rejecting origins:

```javascript
// INCORRECT - Causes CORS middleware to malfunction
return callback(new Error('Not allowed by CORS'));

// CORRECT - Properly rejects the request
return callback(null, false);
```

When using the `cors` middleware with a custom origin function, you must call `callback(null, false)` to reject a request. Using `callback(new Error(...))` causes unexpected behavior and can block legitimate requests.

## Changes Made

### 1. Fixed CORS Error Handling
**Files Modified:**
- `server/src/index.ts`
- `server/src/middleware/security.ts`

**Change:**
```diff
-      return callback(new Error('Not allowed by CORS'));
+      return callback(null, false);

-      return callback(new Error('Invalid origin'));
+      return callback(null, false);
```

### 2. Added IPv6 Support
**Files Modified:**
- `server/src/index.ts`
- `server/src/middleware/security.ts`

**Change:**
Added support for IPv6 localhost and link-local addresses:
```javascript
// Allow IPv6 localhost and link-local addresses
if (
  hostname === '::1' ||
  hostname === '::' ||
  hostname.startsWith('fe80:') ||
  hostname.startsWith('[::1]') ||
  hostname.startsWith('[fe80:')
) {
  return callback(null, true);
}
```

### 3. Added Server Info Endpoint
**File Modified:**
- `server/src/index.ts`

**Change:**
Added `/api/server-info` endpoint for auto-discovery:
```javascript
app.get('/api/server-info', (req, res) => {
  const serverInfo = {
    version: '2.1.1',
    serverTime: new Date().toISOString(),
    apiEndpoint: '/api',
    corsEnabled: true,
    authRequired: true,
  };
  res.json(serverInfo);
});
```

### 4. Enhanced Auto-Configuration
**File Modified:**
- `client/src/components/ApiSetupBanner.tsx`

**Changes:**
- Added validation using the new `/api/server-info` endpoint
- Improved error messages with specific Network Error detection
- Better logging for debugging connection issues

## Technical Details

### CORS Callback Convention
The `cors` middleware expects the origin validation callback to follow this pattern:

```javascript
callback(error, allow)
```

Where:
- `error`: Should be `null` for normal operation
- `allow`: Boolean indicating whether to allow the origin

**Correct Usage:**
- To allow: `callback(null, true)`
- To reject: `callback(null, false)`

**Incorrect Usage (causes issues):**
- ❌ `callback(new Error('message'))` - Causes CORS middleware to malfunction
- ❌ Mixing error objects with the allow parameter

### Supported Origins
The CORS configuration now properly supports:

**IPv4:**
- ✅ localhost (all variants: localhost, 127.0.0.1, 0.0.0.0)
- ✅ Private Class C: 192.168.0.0 - 192.168.255.255
- ✅ Private Class A: 10.0.0.0 - 10.255.255.255
- ✅ Private Class B: 172.16.0.0 - 172.31.255.255

**IPv6:**
- ✅ ::1 (IPv6 localhost)
- ✅ :: (IPv6 any)
- ✅ fe80::/10 (IPv6 link-local)

**Custom:**
- ✅ URLs configured in `FRONTEND_URL` environment variable
- ✅ Production URLs in `PRODUCTION_FRONTEND_URL`

## Testing

### Automated Tests
All existing tests continue to pass:
- Server tests: 8/8 ✅
- Client tests: 32/32 ✅
- Security scan (CodeQL): 0 alerts ✅

### Manual Testing Scenarios

**Scenario 1: Localhost Access**
1. Start server on `localhost:3000`
2. Start client on `localhost:5173`
3. Login should work ✅

**Scenario 2: Same Device, Different Ports**
1. Start server on `0.0.0.0:3000`
2. Access client via `http://127.0.0.1:5173`
3. Login should work ✅

**Scenario 3: Different Device, Same Network**
1. Start server on PC at `192.168.1.100:3000`
2. Access from mobile at `http://192.168.1.100:5173`
3. Auto-configuration banner appears
4. Click "Configurar Automáticamente"
5. Login should work ✅

**Scenario 4: IPv6 Network**
1. Start server with IPv6 enabled
2. Access via `http://[::1]:5173`
3. Login should work ✅

## Security Considerations

### What Changed
- CORS error handling corrected
- IPv6 support added for local addresses only

### Security Impact
- ✅ No security vulnerabilities introduced
- ✅ Still restricts access to private network ranges only
- ✅ No public internet exposure
- ✅ Credentials (tokens) still properly protected

### Best Practices Maintained
- ✅ `credentials: true` preserved for secure authentication
- ✅ Origin validation still enforced
- ✅ Rejected origins logged for debugging
- ✅ Private IP ranges properly validated

## Migration Guide

### For Developers
No migration needed - the changes are backward compatible.

### For Users
No action required. The fix automatically resolves login issues.

If you were working around this issue with manual configuration:
1. Clear your browser's localStorage
2. Refresh the page
3. Use the auto-configuration banner when prompted

## Known Limitations

### What This Does NOT Fix
- ❌ Issues with firewall blocking ports
- ❌ Problems with devices on different networks
- ❌ Issues with VPN or proxy configurations
- ❌ Database connection problems
- ❌ Missing environment variables

### Requirements
- Both devices must be on the same local network
- Server must be running and accessible
- Firewall must allow connections on ports 3000 and 5173
- No proxy/VPN blocking local network access

## Troubleshooting

### Still Can't Login?

**1. Check Server is Running**
```bash
# Should see: 🚀 Server running on http://0.0.0.0:3000
npm run dev
```

**2. Verify Network Connection**
```bash
# From client device, should respond:
curl http://[SERVER_IP]:3000/health
```

**3. Check Firewall**
```bash
# Windows: Allow port 3000
netsh advfirewall firewall add rule name="TeamWorks" dir=in action=allow protocol=TCP localport=3000

# Linux (UFW)
sudo ufw allow 3000/tcp
```

**4. Verify CORS Logs**
Check server console for CORS rejection messages:
```
CORS: Origin not allowed: http://example.com
```

If you see this, the origin is being properly rejected (as expected for non-local IPs).

**5. Clear Browser Cache**
- Clear localStorage: `localStorage.clear()` in browser console
- Refresh page (Ctrl+F5)

## References

### Documentation
- [Express CORS Middleware](https://github.com/expressjs/cors#configuring-cors-w-dynamic-origin)
- [RFC 1918 - Private IP Addresses](https://datatracker.ietf.org/doc/html/rfc1918)
- [RFC 4291 - IPv6 Addressing](https://datatracker.ietf.org/doc/html/rfc4291)

### Related Files
- `NETWORK_SETUP.md` - Network configuration guide
- `NETWORK_CONFIG_IMPROVEMENTS.md` - Previous CORS improvements
- `README.md` - General setup instructions

## Conclusion

The CORS configuration issue has been fully resolved. Users can now:
- ✅ Login from any device on the local network
- ✅ Use automatic configuration
- ✅ Access via IPv4 or IPv6
- ✅ Trust that connections are secure

The fix is minimal, surgical, and maintains all existing security measures while enabling the intended multi-device functionality.
