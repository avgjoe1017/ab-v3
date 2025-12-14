# Fix API Connection - Quick Guide

## Your Computer's IP Address
**Detected IP**: `192.168.86.33`

## The Problem
If you're using a **physical device** (real phone/tablet), `localhost` or `127.0.0.1` won't work. You need to use your computer's actual IP address.

## Quick Fix

### Option 1: Edit Config File (Easiest)

1. Open `apps/mobile/src/lib/config.ts`
2. Find line 14 (around there)
3. Change this line:
   ```typescript
   : "http://127.0.0.1:8787")  // iOS simulator
   ```
   To:
   ```typescript
   : "http://192.168.86.33:8787")  // Physical device - your IP
   ```

4. Save the file
5. Reload the app (shake device → Reload, or press `r` in Expo terminal)

### Option 2: Use Environment Variable

Create `apps/mobile/.env`:
```
API_BASE_URL=http://192.168.86.33:8787
```

Then restart Expo: `pnpm -C apps/mobile start`

## Which Platform Are You Using?

Check the Test Helper in the app - it shows your platform.

### Android Emulator
✅ Should already work with `10.0.2.2:8787`
- If not working, check that you're using an **emulator** (not physical device)

### iOS Simulator  
✅ Should work with `127.0.0.1:8787`
- If not working, try `localhost:8787` instead

### Physical Device (Real Phone/Tablet)
❌ **Must use IP address**: `192.168.86.33:8787`
- Make sure phone and computer are on **same Wi-Fi network**
- Test in phone's browser: `http://192.168.86.33:8787/health` should work

## Verify It Works

1. **Test from phone's browser** (if physical device):
   - Open browser on phone
   - Go to: `http://192.168.86.33:8787/health`
   - Should show: `{"ok":true}`
   - If this doesn't work, check firewall settings

2. **Check Test Helper in app**:
   - Should show "✅ Connected"
   - Should show correct URL it's using

## Still Not Working?

1. **Check API is running**: `http://localhost:8787/health` works in computer's browser
2. **Check firewall**: Windows Firewall might be blocking port 8787
3. **Check network**: Phone and computer must be on same Wi-Fi
4. **Check the URL**: Test Helper shows exactly what URL it's trying

## Firewall Fix (Windows)

If phone can't reach API:

1. Open Windows Defender Firewall
2. Advanced Settings
3. Inbound Rules → New Rule
4. Port → TCP → 8787
5. Allow connection
6. Apply to all profiles

Then test again from phone's browser.

