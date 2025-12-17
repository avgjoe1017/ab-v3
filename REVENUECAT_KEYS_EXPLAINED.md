# RevenueCat API Keys Explained

## Two Different Types of Keys

RevenueCat uses **two different types** of API keys:

### 1. Backend API Key (Server-side)
- **Format**: `sk_...` (starts with `sk_`)
- **Used in**: `apps/api/.env`
- **Purpose**: Server-side subscription verification via REST API
- **✅ You've added**: `sk_hFVYYszAsSGKGODzhTmwndYAuCdvg`

### 2. Client SDK Keys (Mobile App)
- **iOS Format**: `appl_...` (starts with `appl_`)
- **Android Format**: `goog_...` (starts with `goog_`)
- **Used in**: `apps/mobile/app.json` → `extra` section
- **Purpose**: Client-side SDK initialization (in-app purchases)
- **❌ Still needed**: Get these from RevenueCat dashboard

---

## Where to Find Client SDK Keys

1. Go to https://app.revenuecat.com
2. Select your project
3. Go to **Project Settings** → **API Keys**
4. You'll see:
   - **iOS App Public Key**: `appl_xxxxxxxxxxxxx` ← Copy this
   - **Android App Public Key**: `goog_xxxxxxxxxxxxx` ← Copy this

These are **different** from the backend API key you just added!

---

## Current Status

✅ **Backend API Key**: Added to `apps/api/.env`
   - Server can now verify subscriptions via API
   - Restart API server to activate

❌ **Mobile SDK Keys**: Still need iOS and Android keys
   - Add to `apps/mobile/app.json`
   - Allows mobile app to initialize RevenueCat SDK
   - Enables in-app purchase flows

---

## After Adding Backend Key

**Restart your API server** and you should see:
```
[api] RevenueCat configured: true
```

---

## After Adding Mobile Keys

**Reload your mobile app** and you should see:
```
[RevenueCat] Initialized successfully
```

Instead of:
```
WARN [RevenueCat] API key not found. RevenueCat features will be disabled.
```

