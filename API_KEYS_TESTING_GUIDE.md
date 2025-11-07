# API Keys Configuration - Testing Guide

## Summary

This PR fixes the issue where API keys configured in the UI settings were not being used by the server. The server was only reading from environment variables, making Docker Compose the only way to configure AI providers.

## Changes Overview

### Problem
- Users could configure API keys in Settings UI, but they were only saved to browser localStorage
- Server AI providers only checked `process.env.GROQ_API_KEY` and `process.env.GEMINI_API_KEY`
- Result: UI configuration had no effect on AI functionality

### Solution
- Client now sends API keys as HTTP headers (`X-Groq-Api-Key`, `X-Gemini-Api-Key`)
- Server extracts keys from headers and uses them with priority over env variables
- Both configuration methods work independently or together

## Testing Instructions

### Prerequisites
1. Have the application running (either locally or with Docker Compose)
2. Have at least one AI provider API key (Groq or Gemini)

### Test 1: Environment Variables Only (.env or docker-compose.yml)

**Setup:**
```bash
# In .env or docker-compose.yml
GROQ_API_KEY=your_groq_key_here
GEMINI_API_KEY=your_gemini_key_here
```

**Expected Behavior:**
- Start the application with `docker-compose up` or `npm run dev`
- AI features should work using keys from environment variables
- No keys in UI settings needed

**How to Verify:**
1. Open the application
2. Try any AI feature (e.g., create task with natural language)
3. Should work without configuring keys in UI

---

### Test 2: UI Settings Only

**Setup:**
1. Remove or comment out API keys from .env/docker-compose.yml:
   ```bash
   # GROQ_API_KEY=
   # GEMINI_API_KEY=
   ```
2. Restart the application
3. Open Settings in the UI
4. Enter your API keys:
   - Groq API Key: `gsk_xxxxx...`
   - Gemini API Key: `AIzaxxxx...`
5. Click Save

**Expected Behavior:**
- Keys are saved to browser localStorage
- Client automatically includes keys in headers for all requests
- AI features should work using keys from UI settings

**How to Verify:**
1. Configure keys in UI Settings
2. Try any AI feature (e.g., "add task: buy milk for tomorrow")
3. Should work with UI-configured keys

**Debug Verification:**
```javascript
// Open browser console and check localStorage
JSON.parse(localStorage.getItem('settings-storage'))

// Should show your keys:
{
  state: {
    groqApiKey: "gsk_xxxxx...",
    geminiApiKey: "AIzaxxxx...",
    // ... other settings
  }
}
```

---

### Test 3: UI Settings Override Environment

**Setup:**
1. Set DIFFERENT keys in environment:
   ```bash
   GROQ_API_KEY=env_key_1
   GEMINI_API_KEY=env_key_2
   ```
2. Configure DIFFERENT keys in UI Settings:
   - Groq API Key: `ui_key_1`
   - Gemini API Key: `ui_key_2`

**Expected Behavior:**
- UI-configured keys take priority
- Server should use keys from headers (UI) instead of environment

**How to Verify:**
1. Set up both sets of keys (environment with invalid, UI with valid)
2. Try AI features
3. Should work because UI keys override environment keys

---

### Test 4: Network Debugging

**Check Headers in Browser DevTools:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Trigger any AI feature
4. Find the request to `/api/ai/process` or similar
5. Check Request Headers:
   ```
   X-Groq-Api-Key: gsk_xxxxx...
   X-Gemini-Api-Key: AIzaxxxx...
   ```

**Server Logs:**
- Keys should NOT appear in logs (security)
- If configuration fails, you'll see: "No AI providers configured"

---

### Test 5: Docker Compose Scenario (Original Issue)

**Setup:**
```yaml
# docker-compose.yml
services:
  backend:
    environment:
      GROQ_API_KEY: ${GROQ_API_KEY:-}
      GEMINI_API_KEY: ${GEMINI_API_KEY:-}
```

**Test A - Environment Only:**
```bash
# .env file
GROQ_API_KEY=your_key_here
```
- Start: `docker-compose up`
- Should work with env key

**Test B - UI Override:**
- Start with empty or missing .env
- Configure keys in UI Settings
- Should work with UI keys

**Test C - Both:**
- Start with .env keys
- Configure different keys in UI
- Should use UI keys (priority)

---

## Common Issues

### Issue: AI features don't work after configuring in UI
**Solution:**
1. Check browser console for errors
2. Verify keys are saved: `localStorage.getItem('settings-storage')`
3. Check Network tab to see if headers are sent
4. Try refreshing the page

### Issue: "No AI providers configured" error
**Cause:** No valid keys in either environment or UI
**Solution:**
1. Check environment variables in server console
2. Verify UI keys are correctly saved and sent
3. Ensure keys are valid (not placeholder values)

### Issue: Keys in UI but headers not sent
**Cause:** localStorage parsing error
**Solution:**
1. Check browser console for warnings
2. Clear settings: `localStorage.removeItem('settings-storage')`
3. Reconfigure in UI

---

## Architecture Notes

### Priority Order (Implementation)
```
1. User-provided keys (from UI via headers)
   ↓ (if not found)
2. Environment variables (.env or docker-compose)
   ↓ (if not found)
3. Error: "No AI providers configured"
```

### Security
- Keys transmitted via HTTPS headers in production
- Keys filtered for placeholder values (`YOUR_*_API_KEY_HERE`)
- Keys never logged or exposed in error messages
- No changes to authentication/authorization

### Files Changed
- `client/src/lib/api.ts` - Axios interceptor adds headers
- `server/src/controllers/aiController.ts` - Extracts keys from headers
- `server/src/services/ai/types.ts` - Shared type definitions
- `server/src/services/ai/providers.ts` - Key extraction and priority
- `server/src/services/aiService.ts` - Uses keys from headers

---

## Success Criteria ✅

- [ ] Environment-only configuration works
- [ ] UI-only configuration works
- [ ] UI overrides environment correctly
- [ ] Headers visible in Network tab
- [ ] No keys leaked in logs or errors
- [ ] Both deployment methods (local & Docker) work
- [ ] Existing functionality unchanged

---

## Rollback Plan

If issues arise, revert the PR:
```bash
git revert <commit_hash>
```

The changes are isolated to:
- API key handling
- No database changes
- No authentication changes
- Backward compatible (env vars still work)
