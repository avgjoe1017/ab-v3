# Verifying Clerk & RevenueCat Configuration

## ✅ What You've Done

You've added Clerk and RevenueCat keys to `apps/api/.env`. The API server will automatically detect and use them.

## 🔍 How to Verify

### 1. Start the API Server

```bash
cd apps/api
pnpm dev
```

### 2. Check Startup Logs

When the API starts, you should see:

```
[api] listening on http://localhost:8787
[api] Environment: development
[api] Clerk configured: true          ← Should be true
[api] RevenueCat configured: true     ← Should be true
[api] S3 configured: false            ← Expected if S3 not set up yet
```

If you see `true` for both Clerk and RevenueCat, they're configured correctly! ✅

---

## 📋 Expected Behavior

### Current State (Without SDKs Installed)

Even though the keys are configured:
- ✅ The API detects the keys (`clerkConfigured: true`, `revenueCatConfigured: true`)
- ⏳ **But** the actual integration code is still commented out (waiting for SDK installation)
- ✅ Authentication still works with default user ID (development mode)
- ✅ Entitlements still work (checks RevenueCat, but returns free tier until SDK is installed)

### After Installing SDKs

Once you install the SDKs and uncomment the code:

**Clerk**:
```bash
pnpm -C apps/api add @clerk/backend
```
Then uncomment code in `apps/api/src/lib/clerk.ts`

**RevenueCat**:
Already works via REST API, but for mobile:
```bash
pnpm -C apps/mobile add react-native-purchases
```

---

## 🧪 Testing

### Test 1: Check Configuration Status

```bash
curl http://localhost:8787/health
```

The startup logs will show the configuration status.

### Test 2: Check Entitlements

The `/me/entitlement` endpoint will:
- Currently return free tier (development mode)
- Once RevenueCat SDK is configured, will check actual subscriptions

---

## 📝 Next Steps

1. **Verify keys are detected** - Check startup logs show `true` for both
2. **Install Clerk SDK** (when ready for production auth):
   ```bash
   pnpm -C apps/api add @clerk/backend
   ```
3. **Uncomment Clerk code** in `apps/api/src/lib/clerk.ts`
4. **Test RevenueCat** (works via REST API, no SDK needed for backend)

---

## 🔒 Security Notes

- ✅ `CLERK_SECRET_KEY` - Keep secure, never commit to git
- ✅ `REVENUECAT_API_KEY` - Keep secure, never commit to git
- ✅ `.env` should be in `.gitignore`

---

## ❓ Troubleshooting

### Keys not detected?

1. Check `.env` file is in `apps/api/` directory
2. Check variable names are exactly:
   - `CLERK_SECRET_KEY=sk_test_...`
   - `REVENUECAT_API_KEY=...`
3. Restart API server after adding keys
4. Check for typos or extra spaces

### Still showing `false`?

- Verify keys start with correct prefixes:
  - Clerk: `sk_test_` or `sk_live_`
  - RevenueCat: Usually starts with specific format from RevenueCat dashboard
- Check `.env` file encoding (should be UTF-8)
- Try restarting the server

