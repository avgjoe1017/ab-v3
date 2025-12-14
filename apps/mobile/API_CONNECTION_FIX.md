# API Connection Fix Guide

## The Problem
Mobile app shows "API STATUS NOT CONNECTED" even though API server is running.

## Root Cause
The API URL depends on **where the app is running**:
- **Android Emulator**: Can't use `localhost` - must use `10.0.2.2`
- **iOS Simulator**: Can use `localhost` or `127.0.0.1`
- **Physical Device**: Must use your computer's IP address (e.g., `192.168.1.100`)

## Solution

### For Android Emulator
✅ **Already configured** - Uses `http://10.0.2.2:8787`

If it still doesn't work:
1. Make sure you're using Android **emulator** (not physical device)
2. Try restarting the emulator
3. Check that API is running: `http://localhost:8787/health` in browser

### For iOS Simulator
✅ **Already configured** - Uses `http://127.0.0.1:8787`

If it still doesn't work:
1. Make sure you're using iOS **simulator** (not physical device)
2. Try `localhost` instead: Edit `apps/mobile/src/lib/config.ts` line 14 to use `"http://localhost:8787"`

### For Physical Device (Phone/Tablet)
❌ **Needs manual configuration** - Must use your computer's IP address

#### Step 1: Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter (Wi-Fi or Ethernet).
Example: `192.168.1.105`

**Mac/Linux:**
```bash
ifconfig | grep "inet "
```
Look for IP starting with `192.168.` or `10.`

#### Step 2: Set the IP in Mobile App

**Option A: Environment Variable (Recommended)**

Create `apps/mobile/.env`:
```
API_BASE_URL=http://192.168.1.105:8787
```
(Replace `192.168.1.105` with your actual IP)

**Option B: Edit Config File**

Edit `apps/mobile/src/lib/config.ts`:
```typescript
export const API_BASE_URL =
  (process.env.API_BASE_URL as string | undefined) ??
  (Constants.expoConfig?.extra as any)?.API_BASE_URL ??
  "http://192.168.1.105:8787";  // Your computer's IP
```

#### Step 3: Restart Mobile App

After changing the config:
1. Stop the Expo dev server (Ctrl+C)
2. Restart: `pnpm -C apps/mobile start`
3. Reload the app on your device

#### Step 4: Verify Connection

1. Make sure API is running: `http://localhost:8787/health` works in browser
2. Make sure phone and computer are on **same Wi-Fi network**
3. Test from phone's browser: `http://YOUR_IP:8787/health` should work
4. Check Test Helper in app - should show "✅ Connected"

## Quick Diagnostic

The Test Helper component shows the exact URL it's trying to connect to. Check:
- What URL is shown?
- Does that URL work from a browser on the same device?
- Are API server and device on the same network?

## Common Issues

### "Network request failed"
- **Cause**: Wrong IP address or API not running
- **Fix**: Verify IP, restart API server

### "Connection refused"
- **Cause**: Firewall blocking port 8787
- **Fix**: Allow port 8787 in Windows Firewall

### Works in browser but not app
- **Cause**: CORS or network configuration
- **Fix**: Check API server logs for errors

## Testing Checklist

- [ ] API server running: `http://localhost:8787/health` works in browser
- [ ] Correct API URL for your platform (emulator vs physical device)
- [ ] Phone and computer on same Wi-Fi (if using physical device)
- [ ] Test Helper shows correct URL
- [ ] Can access API from device's browser (if physical device)
- [ ] Test Helper shows "✅ Connected" after refresh

