# Quick Start Testing Guide

## Problem: Network Error & No Test Data

If you're seeing "Network request failed" errors and have no sessions to test with, follow these steps:

## Step 1: Start the API Server

The API server must be running for the mobile app to work.

```bash
# From project root
pnpm -C apps/api dev
```

You should see:
```
[api] listening on http://localhost:8787
```

**Keep this terminal open** - the API server needs to stay running.

## Step 2: Seed the Database

The database needs to be seeded with test sessions. Run:

```bash
# From project root
cd apps/api
bun prisma db seed
```

This will:
- Pre-generate silence chunks (required for audio generation)
- Create 3 catalog sessions:
  - "Morning Affirmations"
  - "Sleep & Relax"  
  - "Focus Boost"

You should see:
```
🌱 Starting seed process...
🔇 Pre-generating silence chunks...
✅ All silence chunks pre-generated
🌱 Seeding catalog sessions...
Creating: Morning Affirmations
Creating: Sleep & Relax
Creating: Focus Boost
✅ Seeding complete.
```

## Step 3: Verify API is Accessible

Test that the API is working:

```bash
# Test health endpoint
curl http://localhost:8787/health

# Should return: {"ok":true}

# Test sessions endpoint
curl http://localhost:8787/sessions

# Should return: {"sessions":[...]}
```

## Step 4: Start Mobile App

In a **new terminal** (keep API server running):

```bash
# From project root
pnpm -C apps/mobile start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Or scan QR code with Expo Go

## Step 5: Test Pre-roll

1. **Open app** on device/simulator
2. **Home screen** should show the 3 catalog sessions
3. **Tap a session** (e.g., "Morning Affirmations")
4. **Player screen** opens
5. **Tap "Load"** to load the playback bundle
6. **Tap "Play"** - Pre-roll should start within 300ms!

## Troubleshooting

### "Network request failed" Error

**Causes:**
1. API server not running
2. Wrong API URL in mobile app
3. Firewall blocking connection

**Solutions:**
1. ✅ Make sure API server is running: `pnpm -C apps/api dev`
2. ✅ Check API URL in `apps/mobile/src/lib/config.ts`:
   - Android emulator: `http://10.0.2.2:8787`
   - iOS simulator: `http://localhost:8787`
   - Physical device: Use your computer's IP (e.g., `http://192.168.1.x:8787`)
3. ✅ Verify API is accessible: `curl http://localhost:8787/health`

### No Sessions Showing

**Cause:** Database not seeded

**Solution:**
```bash
cd apps/api
bun prisma db seed
```

### Can't Create New Session

**Cause:** Daily limit reached (free tier: 2 sessions/day)

**Solution:**
- Use existing catalog sessions for testing
- Or reset the database (delete `apps/api/prisma/prisma/dev.db` and re-seed)

## Testing Pre-roll Without Creating Sessions

You can test pre-roll using the **catalog sessions** that are seeded:

1. **Morning Affirmations** - Good for quick test
2. **Sleep & Relax** - Longer session
3. **Focus Boost** - Different pace

These sessions already have:
- ✅ Affirmations defined
- ✅ Audio generation triggered (may take a few seconds)
- ✅ Ready to play

## Quick Test Checklist

- [ ] API server running on port 8787
- [ ] Database seeded with catalog sessions
- [ ] Mobile app connected to API
- [ ] Can see sessions in Home screen
- [ ] Can load a session in Player
- [ ] Pre-roll starts when tapping Play
- [ ] Crossfade to main mix works

## Creating Your Own Test Session

If you want to create a custom session:

1. **Home screen** → Tap "+ New Session"
2. **Editor screen**:
   - Enter title (e.g., "Test Session")
   - Add affirmations (one per line)
   - Tap "Create & Generate"
3. **Wait for audio generation** (may take 10-30 seconds)
4. **Player screen** opens automatically
5. **Tap "Load"** then **"Play"** to test pre-roll

**Note:** Free tier allows 2 sessions per day. Catalog sessions don't count toward this limit.

