# Clerk Environment Variables - Correct Names

## For API Server (`apps/api/.env`)

The API server uses:
```bash
CLERK_SECRET_KEY=sk_test_...
```

**Location**: `apps/api/.env`  
**Used in**: `apps/api/src/lib/clerk.ts`, `apps/api/src/lib/auth.ts`

---

## For Mobile App (`apps/mobile/.env` or `app.json`)

The mobile app (Expo/React Native) should use:
```bash
CLERK_PUBLISHABLE_KEY=pk_test_...
```

**Note**: Since this is Expo, you have two options:

### Option 1: Using `app.json` (Recommended for Expo)
Add to `apps/mobile/app.json`:
```json
{
  "expo": {
    "extra": {
      "CLERK_PUBLISHABLE_KEY": "pk_test_..."
    }
  }
}
```

### Option 2: Using `.env` file
Create `apps/mobile/.env`:
```bash
CLERK_PUBLISHABLE_KEY=pk_test_...
```

Then use `expo-constants` to access it:
```typescript
import Constants from 'expo-constants';
const publishableKey = Constants.expoConfig?.extra?.CLERK_PUBLISHABLE_KEY;
```

---

## ⚠️ Important Notes

1. **`NEXT_PUBLIC_` prefix is NOT needed** - This is a Next.js convention, but you're using Expo/React Native, not Next.js.

2. **API vs Mobile**:
   - API server needs: `CLERK_SECRET_KEY` (server-side, secure)
   - Mobile app needs: `CLERK_PUBLISHABLE_KEY` (client-side, safe to expose)

3. **Your current setup**:
   - ✅ `CLERK_SECRET_KEY=sk_test_...` - Correct for API
   - ❌ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...` - Wrong prefix
   - ✅ Should be: `CLERK_PUBLISHABLE_KEY=pk_test_...`

---

## Correct `.env` File Setup

### `apps/api/.env`:
```bash
CLERK_SECRET_KEY=sk_test_RENJsjKrZuhwv1x2azTQIlOjM1fzQA5x71pnaCuxh9
```

### `apps/mobile/.env` (or `app.json` extra):
```bash
CLERK_PUBLISHABLE_KEY=pk_test_Y2xhc3NpYy1zdGFybGluZy0yMi5jbGVyay5hY2NvdW50cy5kZXYk
```

---

## Verification

After adding the keys, the API server will log on startup:
```
[api] Clerk configured: true
```

This confirms `CLERK_SECRET_KEY` is being read correctly.

