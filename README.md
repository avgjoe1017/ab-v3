# Affirmation Beats V3 (Repo Skeleton)

Monorepo layout:

- `apps/mobile` — Expo React Native app (uses `expo-audio`)
- `apps/api` — Bun + Hono API server + Prisma
- `packages/contracts` — Zod schemas, migrations, typed errors (single source of truth)
- `packages/audio-engine` — `expo-audio`-based singleton playback engine (3-track model)
- `packages/utils` — Pure utilities (no network/storage side-effects)

## Quick start

### Prereqs
- Node 20+ (or 22+)
- pnpm 9+
- Bun 1.1+

### Install
```bash
pnpm install
```

### First Time Setup

1. **Seed the database** (creates test sessions):
```bash
cd apps/api
bun prisma db seed
```

This creates 3 catalog sessions you can test with:
- Morning Affirmations
- Sleep & Relax
- Focus Boost

### Run API (dev)
```bash
pnpm -C apps/api dev
```

The API will run on `http://localhost:8787`

**Keep this terminal open** - the API must stay running.

### Run Mobile (dev)
```bash
# In a NEW terminal (API server should still be running)
pnpm -C apps/mobile start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator  
- Scan QR code with Expo Go app

### Testing Pre-roll

1. Open app → Home screen shows catalog sessions
2. Tap a session → Player screen
3. Tap "Load" → Loads playback bundle
4. Tap "Play" → Pre-roll should start within 300ms!

See `QUICK_START_TESTING.md` for detailed testing instructions.

## Environment
Copy `.env.example` files as needed:
- `apps/api/.env.example` -> `apps/api/.env`
- `apps/mobile/.env.example` -> `apps/mobile/.env` (optional)

## V3 Architecture Spec
See `docs/V3_ARCHITECTURE.md`.
