# Verify API Connection from Physical Device

## ✅ Config is Correct!

The logs show the app is using the correct URL: `http://192.168.86.33:8787`

## Test Connection from Your Phone

### Step 1: Test in Phone's Browser

1. **Open Safari (iOS) or Chrome (Android)** on your phone
2. **Go to**: `http://192.168.86.33:8787/health`
3. **Should show**: `{"ok":true}`

**If this doesn't work:**
- Phone and computer are not on the same Wi-Fi network
- Firewall is blocking port 8787
- IP address has changed

### Step 2: Check Test Helper in App

After reloading the app, the Test Helper should show:
- **Current URL**: `http://192.168.86.33:8787`
- **API Status**: Should be "✅ Connected" if working

### Step 3: Check Console Logs

Look for any network errors in the Expo terminal or Metro bundler.

## Common Issues

### "Network request failed"
- **Cause**: Can't reach the IP address
- **Fix**: 
  1. Verify phone and computer on same Wi-Fi
  2. Test in phone's browser first
  3. Check Windows Firewall

### "Connection refused"
- **Cause**: Firewall blocking port 8787
- **Fix**: Allow port 8787 in Windows Firewall

### Browser test works but app doesn't
- **Cause**: CORS or app-specific issue
- **Fix**: Check API server logs for errors

## Firewall Fix (Windows)

If phone's browser can't reach the API:

1. Open **Windows Defender Firewall**
2. **Advanced Settings**
3. **Inbound Rules** → **New Rule**
4. **Port** → **TCP** → **8787**
5. **Allow the connection**
6. Apply to all profiles

Then test again from phone's browser.

## Verify Same Network

Make sure:
- Phone is connected to Wi-Fi (not cellular)
- Computer is connected to same Wi-Fi network
- Both show same network name in settings

## Next Steps

1. ✅ Test `http://192.168.86.33:8787/health` in phone's browser
2. ✅ Check Test Helper shows "✅ Connected"
3. ✅ If connected, test pre-roll functionality!

