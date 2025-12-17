# RevenueCat API Keys Setup

## Current Status

✅ **Clerk**: Working (configured in `app.json`)  
⚠️ **RevenueCat**: Keys needed (showing "API key not found" warning)

## How to Get RevenueCat API Keys

1. Go to https://app.revenuecat.com
2. Log in to your account
3. Select your project (or create one)
4. Go to **Project Settings** → **API Keys**
5. You'll see separate keys for:
   - **iOS App**: `appl_...` format
   - **Android App**: `goog_...` format

## Add Keys to app.json

Update `apps/mobile/app.json`:

```json
{
  "expo": {
    "extra": {
      "REVENUECAT_IOS_API_KEY": "appl_YOUR_IOS_KEY_HERE",
      "REVENUECAT_ANDROID_API_KEY": "goog_YOUR_ANDROID_KEY_HERE"
    }
  }
}
```

## Note

- For development/testing, you can use the same key for both platforms temporarily
- For production, use the platform-specific keys from your RevenueCat dashboard
- The app will automatically use the correct key based on the platform (iOS vs Android)

## After Adding Keys

1. **Restart the Expo app** (reload in Expo Go or restart the dev server)
2. You should see: `[RevenueCat] Initialized successfully` instead of the warning

## Testing

Once configured, RevenueCat features will be available:
- Subscription status checking
- Purchase flows
- Restore purchases
- Entitlement management

---

**Current Warning**: `[RevenueCat] API key not found. RevenueCat features will be disabled.`

This is normal until you add the keys. The app will still work, but subscription features won't function until RevenueCat is configured.

