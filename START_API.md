# How to Start the API Server

## The Problem
The mobile app shows "API STATUS NOT CONNECTED" because the API server isn't running.

## Solution: Start the API Server

### Option 1: Using pnpm (Recommended)

Open a **new terminal** and run:

```bash
# From project root
pnpm -C apps/api dev
```

You should see:
```
[api] listening on http://localhost:8787
```

**Keep this terminal open** - the API must stay running while you test.

### Option 2: Using bun directly

```bash
# From project root
cd apps/api
bun --watch src/index.ts
```

### Verify It's Working

Once started, test the health endpoint:

**PowerShell:**
```powershell
Invoke-WebRequest -Uri http://localhost:8787/health -UseBasicParsing
```

**Or open in browser:**
```
http://localhost:8787/health
```

Should return: `{"ok":true}`

## After Starting API Server

1. **Refresh the mobile app** - The Test Helper should now show "✅ Connected"
2. **Home screen** should show the 3 catalog sessions
3. **You can now test pre-roll** by tapping a session and playing it

## Troubleshooting

### Still shows "Not Connected"?

1. **Check the API URL** in the Test Helper - it shows what URL it's trying
2. **For Android emulator**: Should be `http://10.0.2.2:8787`
3. **For iOS simulator**: Should be `http://localhost:8787`
4. **For physical device**: Use your computer's IP (e.g., `http://192.168.1.x:8787`)

### Port Already in Use?

If you see "port already in use":
```bash
# Find what's using port 8787
netstat -ano | findstr :8787

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### API Starts But Mobile Can't Connect?

1. **Check firewall** - Windows Firewall might be blocking
2. **Check API URL** - Make sure it matches your platform (Android vs iOS)
3. **Try restarting** both API server and mobile app

## Quick Test Flow

1. ✅ Start API: `pnpm -C apps/api dev`
2. ✅ Verify: Open `http://localhost:8787/health` in browser
3. ✅ Start Mobile: `pnpm -C apps/mobile start` (in another terminal)
4. ✅ Check Test Helper - should show "✅ Connected"
5. ✅ Tap a session and test pre-roll!

